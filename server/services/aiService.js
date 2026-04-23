const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const config = require('../config/env');

const UPLOADS_BASE = path.join(__dirname, '../../public/uploads');
const AI_EXPORTS_DIR = path.join(UPLOADS_BASE, 'ai-exports');

function ensureAiExportsDir() {
    if (!fs.existsSync(AI_EXPORTS_DIR)) {
        fs.mkdirSync(AI_EXPORTS_DIR, { recursive: true });
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse "Please retry in 19.8s" from Google error body */
function parseRetryDelayMs(message) {
    const m = String(message).match(/retry in ([\d.]+)s/i);
    if (m) {
        return Math.min(120000, Math.ceil(parseFloat(m[1], 10) * 1000) + 2000);
    }
    return 25000;
}

function isGeminiRateOrQuotaError(err) {
    const s = err?.message || err?.toString() || '';
    return /429|Too Many Requests|RESOURCE_EXHAUSTED|quota|rate limit/i.test(s);
}

function makeGeminiQuotaUserError() {
    const e = new Error(
        'Google blocked this request (quota or rate limit). Wait a few minutes, then try again. ' +
        'If the error often mentions "limit: 0" or "free_tier", enable billing on your Google Cloud project for this API, or use another API key in server/.env. ' +
        'See: https://ai.google.dev/gemini-api/docs/rate-limits | Keys: https://aistudio.google.com/apikey'
    );
    e.status = 429;
    return e;
}

async function callGeminiWithRetries(apiKey, modelName, parts) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // eslint-disable-next-line no-await-in-loop
            return await model.generateContent(parts);
        } catch (apiErr) {
            const msg = apiErr?.message || String(apiErr);
            if (isGeminiRateOrQuotaError(apiErr) && attempt < maxAttempts) {
                // eslint-disable-next-line no-await-in-loop, no-console
                console.warn(
                    `[aiService] ${modelName} rate/quota (attempt ${attempt}/${maxAttempts}), waiting before retry...`
                );
                // eslint-disable-next-line no-await-in-loop
                await sleep(parseRetryDelayMs(msg));
                continue;
            }
            if (isGeminiRateOrQuotaError(apiErr)) {
                const q = new Error('QUOTA');
                q.isQuota = true;
                throw q;
            }
            if (/not found|not supported|404/i.test(msg) && /model/i.test(msg)) {
                const hint =
                    ' In server/.env set GEMINI_MODEL to an id from Google AI Studio (e.g. gemini-2.0-flash or gemini-2.5-flash-preview-05-20).';
                const wrap = new Error(`Gemini request failed: ${msg}.${hint}`);
                wrap.status = 502;
                throw wrap;
            }
            const wrap = new Error(`Gemini request failed: ${msg}`);
            wrap.status = 502;
            throw wrap;
        }
    }
    const err = new Error('Gemini did not return a result.');
    err.status = 502;
    throw err;
}

function parseJsonFromModelText(text) {
    if (!text) return null;
    let s = String(text).trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
        s = fence[1].trim();
    }
    try {
        return JSON.parse(s);
    } catch {
        return {
            title: 'Printing item — AI extraction',
            extractedText: s,
            layoutDescription: '',
            colors: [],
            fontStyles: '',
            notes: 'Model returned non-JSON; raw text is in extractedText.',
        };
    }
}

function buildPrintingItemPrompt() {
    return `You are helping a print shop digitize a reference image of a printing item (poster, flyer, business card, banner, etc.).

Task:
1) Extract all readable text from the image (as accurately as possible).
2) Describe the overall layout (columns, blocks, logo placement, alignment).
3) Summarize main colors and any obvious font style cues (e.g. bold heading, script logo) — be descriptive, not a guess of exact font names unless obvious.
4) Note if complex graphics or logos are present; describe them briefly or mark as "graphic placeholder" if not extractable as text.

Respond with ONLY valid JSON, no other text, using this exact shape:
{
  "title": "short document title for the .docx",
  "extractedText": "all text content, paragraphs separated by blank lines as appropriate",
  "layoutDescription": "string",
  "colors": ["color names or hex if visible"],
  "fontStyles": "string",
  "sections": [ { "heading": "optional section title or empty string", "body": "section body text" } ],
  "visualNotes": "string for anything else useful"
}`;
}

function finalizeAnalysisResult(parsed, outText) {
    const p = parsed || {};
    if (!p.extractedText && typeof outText === 'string') {
        p.extractedText = outText;
    }
    if (!p.title) {
        p.title = 'Printing item — analysis';
    }
    if (!Array.isArray(p.sections)) {
        p.sections = [];
    }
    if (!Array.isArray(p.colors)) {
        p.colors = [];
    }
    return p;
}

const OLLAMA_REQUEST_OPTS = { num_predict: 4096, temperature: 0.2 };

/** Headers for Ollama HTTP API: optional API key (Ollama Cloud uses Bearer; some gateways use X-API-Key). */
function getOllamaRequestHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const key = (config.OLLAMA_API_KEY || '').trim();
    if (!key) {
        return headers;
    }
    const mode = (config.OLLAMA_API_AUTH || 'bearer').toLowerCase();
    if (mode === 'x-api-key' || mode === 'xapikey' || mode === 'x_api_key') {
        headers['X-API-Key'] = key;
    } else {
        headers.Authorization = `Bearer ${key}`;
    }
    return headers;
}

async function postOllamaChat(base, model, prompt, base64) {
    const res = await axios.post(
        `${base}/api/chat`,
        {
            model,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                    images: [base64],
                },
            ],
            stream: false,
            options: OLLAMA_REQUEST_OPTS,
        },
        {
            timeout: 300000,
            headers: getOllamaRequestHeaders(),
        }
    );
    return res.data?.message?.content || '';
}

/** `/api/generate` is the classic path for vision models (e.g. llava) and works when /api/chat returns empty on some setups. */
async function postOllamaGenerate(base, model, prompt, base64) {
    const res = await axios.post(
        `${base}/api/generate`,
        {
            model,
            prompt,
            images: [base64],
            stream: false,
            options: OLLAMA_REQUEST_OPTS,
        },
        {
            timeout: 300000,
            headers: getOllamaRequestHeaders(),
        }
    );
    return res.data?.response || '';
}

function ollamaConnectionError(base, model, e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        const err = new Error(
            `Cannot reach Ollama at ${base}. Install from https://ollama.com, run: ollama pull ${model}, start the Ollama app, or set OLLAMA_BASE_URL in server/.env.`
        );
        err.status = 503;
        throw err;
    }
    const status = e.response?.status;
    const bodyMsg = typeof e.response?.data === 'string'
        ? e.response.data
        : (e.response?.data?.error || e.response?.data?.message || '');
    if (status === 401 || status === 403) {
        const err = new Error(
            `Ollama API access denied (${status}). Set OLLAMA_API_KEY in server/.env (Bearer for https://ollama.com). ` +
                'If the host is not ollama.com, try OLLAMA_API_AUTH=x-api-key. ' +
                (bodyMsg || '')
        );
        err.status = 502;
        throw err;
    }
    const err = new Error(
        bodyMsg || e.message || 'Ollama request failed. Check that the model is installed: ollama pull ' + model
    );
    err.status = 502;
    throw err;
}

async function analyzeWithOllama(imagePath) {
    const base = config.OLLAMA_BASE_URL;
    const model = config.OLLAMA_VISION_MODEL;
    const buffer = await fs.promises.readFile(imagePath);
    const base64 = buffer.toString('base64');
    const prompt = buildPrintingItemPrompt();

    let outText = '';
    try {
        outText = await postOllamaChat(base, model, prompt, base64);
    } catch (e) {
        try {
            outText = await postOllamaGenerate(base, model, prompt, base64);
        } catch (e2) {
            ollamaConnectionError(base, model, e2);
        }
    }
    if (!outText || !String(outText).trim()) {
        try {
            outText = await postOllamaGenerate(base, model, prompt, base64);
        } catch (e) {
            ollamaConnectionError(base, model, e);
        }
    }

    const parsed = parseJsonFromModelText(outText) || {};
    return finalizeAnalysisResult(parsed, outText);
}
const aiService = {
    async predictDelay(features) {
        try {
            const response = await axios.post(`${config.AI_SERVICE_URL}/predict/delay`, features, {
                timeout: 5000,
            });
            return response.data;
        } catch (error) {
            console.error('Error calling AI service:', error.message);
            // Fallback rule-based detection
            return this.fallbackRiskDetection(features);
        }
    },

    fallbackRiskDetection(features) {
        // Rule-based fallback: if time to deadline < estimated duration * 1.2, flag as at_risk
        if (features.hours_to_deadline < (features.estimated_duration_min / 60) * 1.2) {
            return {
                risk_score: 0.7,
                risk_label: 'at_risk',
                confidence: 0.5,
                fallback: true,
            };
        }
        return {
            risk_score: 0.2,
            risk_label: 'on_time',
            confidence: 0.5,
            fallback: true,
        };
    },

    async checkModelStatus() {
        try {
            const response = await axios.get(`${config.AI_SERVICE_URL}/model/status`, {
                timeout: 3000,
            });
            return response.data;
        } catch (error) {
            console.error('AI service status check failed:', error.message);
            return { status: 'offline', message: 'AI service is not available' };
        }
    },

    async analyzePrintingItem(imagePath, mimeType) {
        const provider = (config.AI_VISION_PROVIDER || 'ollama').toLowerCase();
        if (provider === 'ollama') {
            return analyzeWithOllama(imagePath);
        }

        if (!config.GEMINI_API_KEY) {
            const err = new Error(
                'Gemini is not configured (GEMINI_API_KEY). Set AI_VISION_PROVIDER=ollama in server/.env to use a local Ollama model without a Google API key.'
            );
            err.status = 503;
            throw err;
        }

        const buffer = await fs.promises.readFile(imagePath);
        const base64 = buffer.toString('base64');
        const prompt = buildPrintingItemPrompt();

        const parts = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: base64,
                },
            },
        ];

        const primary = config.GEMINI_MODEL || 'gemini-2.0-flash';
        const modelsToTry = [primary];
        if (config.GEMINI_FALLBACK_MODEL && config.GEMINI_FALLBACK_MODEL !== primary) {
            modelsToTry.push(config.GEMINI_FALLBACK_MODEL);
        }

        let result;
        for (let i = 0; i < modelsToTry.length; i++) {
            const modelName = modelsToTry[i];
            try {
                // eslint-disable-next-line no-await-in-loop
                result = await callGeminiWithRetries(config.GEMINI_API_KEY, modelName, parts);
                break;
            } catch (e) {
                if (e.isQuota && i < modelsToTry.length - 1) {
                    // eslint-disable-next-line no-console
                    console.warn(`[aiService] Model "${modelName}" is over quota; trying fallback "${modelsToTry[i + 1]}"...`);
                    continue;
                }
                if (e.isQuota) {
                    throw makeGeminiQuotaUserError();
                }
                throw e;
            }
        }
        if (!result) {
            throw makeGeminiQuotaUserError();
        }

        const response = result.response;
        const outText = response.text();
        const parsed = parseJsonFromModelText(outText) || {};
        return finalizeAnalysisResult(parsed, outText);
    },

    async generateWordDocument(aiResult, outputPath) {
        ensureAiExportsDir();
        const outDir = path.dirname(outputPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const children = [];

        const title = aiResult.title || 'Document';
        children.push(
            new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
            })
        );

        if (aiResult.extractedText) {
            for (const line of String(aiResult.extractedText).split(/\n{2,}/)) {
                const t = line.trim();
                if (t) {
                    children.push(
                        new Paragraph({
                            children: [new TextRun(t)],
                        })
                    );
                }
            }
        }

        if (aiResult.sections && aiResult.sections.length) {
            for (const sec of aiResult.sections) {
                if (sec.heading) {
                    children.push(
                        new Paragraph({
                            text: String(sec.heading),
                            heading: HeadingLevel.HEADING_2,
                        })
                    );
                }
                if (sec.body) {
                    children.push(
                        new Paragraph({
                            children: [new TextRun(String(sec.body))],
                        })
                    );
                }
            }
        }

        children.push(
            new Paragraph({ text: 'Layout and style notes', heading: HeadingLevel.HEADING_2 })
        );
        const layout = aiResult.layoutDescription || '—';
        const fontStyles = aiResult.fontStyles || '—';
        const colorLine = (aiResult.colors && aiResult.colors.length)
            ? aiResult.colors.join(', ')
            : '—';
        const visual = aiResult.visualNotes || '—';

        children.push(
            new Paragraph({ children: [new TextRun(`Layout: ${layout}`)] }),
            new Paragraph({ children: [new TextRun(`Font / style: ${fontStyles}`)] }),
            new Paragraph({ children: [new TextRun(`Colors: ${colorLine}`)] }),
            new Paragraph({ children: [new TextRun(`Visual / graphics: ${visual}`)] })
        );

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children,
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        await fs.promises.writeFile(outputPath, buffer);
        return outputPath;
    },
};

module.exports = aiService;
