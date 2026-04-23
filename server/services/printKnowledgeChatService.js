const axios = require('axios');
const config = require('../config/env');
const { getOllamaRequestHeaders } = require('./aiService');

const OLLAMA_OPTIONS = { temperature: 0.5, num_predict: 1024, top_p: 0.9 };
const CHAT_TIMEOUT_MS = 120000;

/**
 * Instructs the model to stay on print/prepress/finishing topics and deflect other domains briefly.
 */
const PRINT_KNOWLEDGE_SYSTEM = `You are the "Print Knowledge Assistant" for SHAN ART ADVERTISING, a professional print and signage studio.

Your role: answer questions about:
- print production, prepress, and file setup (bleed, trim, safe area, color modes CMYK vs RGB, resolution / DPI, vector vs raster, PDF/X, fonts, outlines);
- paper and media (weights gsm, types, sizes e.g. A4, SRA3, large-format rolls);
- finishing (lamination gloss vs matte, spot UV, foiling, binding, die-cutting, mounting);
- large-format, signage, indoor/outdoor, viewing distance vs resolution;
- design-for-print and common workflow tips.

Style:
- Be clear, practical, and accurate. Use short to medium length (roughly 2–8 sentences unless the user asks for detail).
- Use bullet points only when it improves clarity.
- When giving numbers (bleed, DPI, weights), use common industry values and mention that specs can vary by machine or client — suggest confirming with the print shop for critical jobs.
- If the user asks about something not related to printing, graphic production, or design-for-print, politely say you can only help with print and design-production topics, and invite them to ask a print-related question (do not answer the off-topic request).

Never claim to be a lawyer, doctor, or financial advisor. Do not provide harmful instructions. If unsure, say so briefly.`;

/**
 * @param {object} p
 * @param {string} p.userMessage
 * @param {Array<{ role: 'user'|'assistant', content: string }>} [p.history] — prior turns, newest last; server trims length
 * @returns {Promise<string>}
 */
async function printKnowledgeReply(p) {
    const model = config.OLLAMA_TEXT_MODEL;
    if (!model) {
        const err = new Error('OLLAMA_TEXT_MODEL is not set in environment.');
        err.status = 503;
        throw err;
    }

    const history = Array.isArray(p.history) ? p.history : [];
    const trimmed = history
        .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .slice(-8)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 4000) }));

    const messages = [
        { role: 'system', content: PRINT_KNOWLEDGE_SYSTEM },
        ...trimmed,
        { role: 'user', content: p.userMessage },
    ];

    const base = config.OLLAMA_BASE_URL;
    let out = '';
    try {
        const res = await axios.post(
            `${base}/api/chat`,
            { model, messages, stream: false, options: OLLAMA_OPTIONS },
            { timeout: CHAT_TIMEOUT_MS, headers: { ...getOllamaRequestHeaders() } }
        );
        out = (res.data && res.data.message && res.data.message.content) || '';
    } catch (e) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
            const err = new Error(
                `Cannot reach Ollama at ${config.OLLAMA_BASE_URL}. Check OLLAMA_BASE_URL and that Ollama is running.`
            );
            err.status = 503;
            throw err;
        }
        const status = e.response && e.response.status;
        const body = (e.response && e.response.data && (e.response.data.error || e.response.data.message)) || '';
        if (status === 404 || /not found/i.test(String(body))) {
            const err = new Error(
                `Ollama model "${model}" was not found. Set OLLAMA_TEXT_MODEL in server/.env to a model id on this host.`
            );
            err.status = 502;
            throw err;
        }
        const err = new Error(body || e.message || 'Ollama request failed');
        err.status = 502;
        throw err;
    }

    if (!out || !String(out).trim()) {
        const single = `${PRINT_KNOWLEDGE_SYSTEM}\n\nUser: ${p.userMessage}`;
        try {
            const res2 = await axios.post(
                `${base}/api/generate`,
                { model, prompt: single, stream: false, options: OLLAMA_OPTIONS },
                { timeout: CHAT_TIMEOUT_MS, headers: { ...getOllamaRequestHeaders() } }
            );
            out = (res2.data && res2.data.response) || '';
        } catch (e) {
            const err = new Error(e.response?.data?.error || e.message || 'Ollama returned no text');
            err.status = 502;
            throw err;
        }
    }

    if (!out || !String(out).trim()) {
        const err = new Error('The model returned empty text. Check OLLAMA_TEXT_MODEL and your Ollama host.');
        err.status = 502;
        throw err;
    }

    return String(out).trim();
}

module.exports = { printKnowledgeReply, PRINT_KNOWLEDGE_SYSTEM };
