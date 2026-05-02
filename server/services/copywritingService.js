const axios = require('axios');
const config = require('../config/env');
const { getOllamaRequestHeaders } = require('./aiService');
const { ollamaErrorText, isOllamaSubscriptionError } = require('../utils/ollamaApiErrors');

const OLLAMA_OPTIONS = { temperature: 0.75, num_predict: 1200, top_p: 0.9 };
const CHAT_TIMEOUT_MS = 120000;

const CONTENT_TYPE_HINTS = {
    Flyer: 'short, punchy lines; scannable; room for a visual on a printed sheet',
    'Business Card': 'very short: name/role line, tagline, optional contact placeholder — fits small card',
    Poster: 'bold headline, supporting line, optional event details — works at a distance',
    'Social Media Caption': '1–2 short paragraphs, hashtags only if it fits the tone',
    Banner: 'very few words, large-type friendly; one main message and a CTA',
};

/**
 * Ollama /api/chat: primary path for text models (llama3, etc.).
 * Falls back to /api/generate if the chat response is empty.
 */
async function ollamaChat(model, systemText, userText) {
    const base = config.OLLAMA_BASE_URL;
    const messages = [
        { role: 'system', content: systemText },
        { role: 'user', content: userText },
    ];
    const res = await axios.post(
        `${base}/api/chat`,
        {
            model,
            messages,
            stream: false,
            options: OLLAMA_OPTIONS,
        },
        { timeout: CHAT_TIMEOUT_MS, headers: { ...getOllamaRequestHeaders() } }
    );
    return (res.data && res.data.message && res.data.message.content) || '';
}

async function ollamaGenerate(model, prompt) {
    const base = config.OLLAMA_BASE_URL;
    const res = await axios.post(
        `${base}/api/generate`,
        { model, prompt, stream: false, options: OLLAMA_OPTIONS },
        { timeout: CHAT_TIMEOUT_MS, headers: { ...getOllamaRequestHeaders() } }
    );
    return (res.data && res.data.response) || '';
}

function buildUserInstruction(contentType, tone, userPrompt) {
    const typeHint = CONTENT_TYPE_HINTS[contentType] || 'clear marketing copy for print or screen';
    return `Write marketing copy for a **${contentType}**.

**Tone:** ${tone} (${typeHint}).

**What the business wants to communicate:**
${userPrompt.trim()}

**Format your answer exactly like this (use plain text, not JSON):**
HEADLINE: (one line)
SUBTEXT: (1–3 short lines)
CALL TO ACTION: (one line, optional if not relevant)

Keep total length short to medium. Make it ready for a designer to set type for print. No filler like "As an AI...".`;
}

const SYSTEM_PREAMBLE = `You are a senior copywriter for SHAN ART ADVERTISING, a premium print and signage studio. You write crisp, on-brand copy for flyers, cards, posters, and banners. You always follow the user's requested format.`;

function mapOllamaRequestError(e, model) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        const err = new Error(
            `Cannot reach Ollama at ${config.OLLAMA_BASE_URL}. Set OLLAMA_BASE_URL in server/.env, run Ollama, and pull a text model (e.g. ollama pull llama3).`
        );
        err.status = 503;
        return err;
    }
    const status = e.response && e.response.status;
    const body = ollamaErrorText(e);
    if (isOllamaSubscriptionError(body)) {
        const err = new Error(
            'SUBSCRIPTION_REQUIRED' // sentinel; caller may retry another model
        );
        err.status = 402;
        err._ollamaBody = body;
        return err;
    }
    if (status === 404 || /not found/i.test(String(body))) {
        const err = new Error(
            `Ollama model "${model}" was not found on ${config.OLLAMA_BASE_URL}. ` +
                'Set OLLAMA_TEXT_MODEL in server/.env to an id from GET /api/tags on that host. ' +
                'Local: `ollama pull llama3` then OLLAMA_TEXT_MODEL=llama3.'
        );
        err.status = 502;
        return err;
    }
    const err = new Error(body || e.message || `Ollama request failed. Check OLLAMA_TEXT_MODEL and try: ollama pull ${model}`);
    err.status = 502;
    return err;
}

/**
 * One model attempt: /api/chat then /api/generate if empty.
 * @returns {Promise<string>}
 */
async function generateMarketingCopyWithModel(model, userBlock) {
    let out = '';
    try {
        out = await ollamaChat(model, SYSTEM_PREAMBLE, userBlock);
    } catch (e) {
        throw mapOllamaRequestError(e, model);
    }

    if (!out || !String(out).trim()) {
        try {
            const singlePrompt = `${SYSTEM_PREAMBLE}\n\n${userBlock}`;
            out = await ollamaGenerate(model, singlePrompt);
        } catch (e) {
            const mapped = mapOllamaRequestError(e, model);
            throw mapped;
        }
    }

    if (!out || !String(out).trim()) {
        const err = new Error('The model returned empty text. Check OLLAMA_TEXT_MODEL on your host.');
        err.status = 502;
        throw err;
    }

    return String(out).trim();
}

/**
 * @param {object} p
 * @param {string} p.prompt
 * @param {string} p.contentType
 * @param {string} p.tone
 * @returns {Promise<string>}
 */
async function generateMarketingCopy(p) {
    const userBlock = buildUserInstruction(p.contentType, p.tone, p.prompt);
    const tryList =
        typeof config.getOllamaTextModelTryList === 'function'
            ? config.getOllamaTextModelTryList()
            : [config.OLLAMA_TEXT_MODEL].filter(Boolean);
    if (!tryList.length) {
        const err = new Error('OLLAMA_TEXT_MODEL is not set in environment.');
        err.status = 503;
        throw err;
    }

    for (let i = 0; i < tryList.length; i++) {
        const model = tryList[i];
        try {
            return await generateMarketingCopyWithModel(model, userBlock);
        } catch (err) {
            if (err.message === 'SUBSCRIPTION_REQUIRED' && i < tryList.length - 1) {
                continue;
            }
            if (err.message === 'SUBSCRIPTION_REQUIRED') {
                const e2 = new Error(
                    'No Ollama Cloud model in the try list worked on your plan. Set OLLAMA_TEXT_MODEL and/or ' +
                        'OLLAMA_TEXT_MODEL_CLOUD_FALLBACK in server/.env to ids from https://ollama.com/api/tags (with your API key), ' +
                        'or use local Ollama: OLLAMA_BASE_URL=http://127.0.0.1:11434 and OLLAMA_TEXT_MODEL=llama3 after `ollama pull llama3`.'
                );
                e2.status = 502;
                throw e2;
            }
            throw err;
        }
    }
}

module.exports = { generateMarketingCopy, buildUserInstruction, CONTENT_TYPE_HINTS };
