const axios = require('axios');
const config = require('../config/env');
const { getOllamaRequestHeaders } = require('./aiService');

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

/**
 * @param {object} p
 * @param {string} p.prompt
 * @param {string} p.contentType
 * @param {string} p.tone
 * @returns {Promise<string>}
 */
async function generateMarketingCopy(p) {
    const model = config.OLLAMA_TEXT_MODEL;
    if (!model) {
        const err = new Error('OLLAMA_TEXT_MODEL is not set in environment.');
        err.status = 503;
        throw err;
    }
    const userBlock = buildUserInstruction(p.contentType, p.tone, p.prompt);

    let out = '';
    try {
        out = await ollamaChat(model, SYSTEM_PREAMBLE, userBlock);
    } catch (e) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
            const err = new Error(
                `Cannot reach Ollama at ${config.OLLAMA_BASE_URL}. Set OLLAMA_BASE_URL in server/.env, run Ollama, and pull a text model (e.g. ollama pull llama3).`
            );
            err.status = 503;
            throw err;
        }
        const status = e.response && e.response.status;
        const body = (e.response && e.response.data && (e.response.data.error || e.response.data.message)) || '';
        if (status === 404 || /not found/i.test(String(body))) {
            const err = new Error(
                `Ollama model "${model}" was not found on ${config.OLLAMA_BASE_URL}. ` +
                    'Set OLLAMA_TEXT_MODEL in server/.env to a model id from your host (e.g. run GET /api/tags, or on ollama.com try gemini-3-flash-preview or gpt-oss:20b). ' +
                    'For local Ollama: ollama pull llama3 && OLLAMA_TEXT_MODEL=llama3.'
            );
            err.status = 502;
            throw err;
        }
        const err = new Error(
            body || e.message || `Ollama request failed. Check OLLAMA_TEXT_MODEL and try: ollama pull ${model}`
        );
        err.status = 502;
        throw err;
    }

    if (!out || !String(out).trim()) {
        try {
            const singlePrompt = `${SYSTEM_PREAMBLE}\n\n${userBlock}`;
            out = await ollamaGenerate(model, singlePrompt);
        } catch (e) {
            const b = e.response && e.response.data && e.response.data.error;
            if (e.response && e.response.status === 404) {
                const err2 = new Error(
                    `Ollama model "${model}" not found. Set OLLAMA_TEXT_MODEL to a valid text model for ${config.OLLAMA_BASE_URL}.`
                );
                err2.status = 502;
                throw err2;
            }
            const err = new Error(b || e.message || 'Ollama returned no text');
            err.status = 502;
            throw err;
        }
    }

    if (!out || !String(out).trim()) {
        const err = new Error('The model returned empty text. Check OLLAMA_TEXT_MODEL on your host.');
        err.status = 502;
        throw err;
    }

    return String(out).trim();
}

module.exports = { generateMarketingCopy, buildUserInstruction, CONTENT_TYPE_HINTS };
