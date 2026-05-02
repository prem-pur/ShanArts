/**
 * AI-generated message when admin sets/updates a deadline due to high delay risk.
 * Uses Ollama (OLLAMA_TEXT_MODEL) with a safe fallback.
 */
const axios = require('axios');
const config = require('../config/env');
const { getOllamaRequestHeaders } = require('./aiService');

const OLLAMA_OPTIONS = { temperature: 0.35, num_predict: 700, top_p: 0.9 };
const CHAT_TIMEOUT_MS = 120000;

function formatDate(d) {
    if (!d) return '';
    try {
        const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
        if (Number.isNaN(t)) return String(d);
        return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return String(d);
    }
}

function buildFallbackMessage(ctx) {
    const company = ctx.companyName || 'Shan Art Advertising';
    const name = (ctx.customerName && String(ctx.customerName).trim()) || 'Valued Customer';
    const orderRef = ctx.orderNumber ? `Order #${ctx.orderNumber}` : 'your order';
    const newDeadline = ctx.newDeadline ? formatDate(ctx.newDeadline) : '';
    const risk = ctx.riskLevel || 'High';

    return (
        `Dear ${name},\n\n` +
        `We wanted to update you regarding ${orderRef}. Our system has flagged a **${risk} delay risk** based on the current workload and schedule.\n\n` +
        (newDeadline ? `To ensure quality and smooth delivery, we have updated the expected deadline to: ${newDeadline}.\n\n` : '') +
        `If you need this order earlier, please reply in your customer portal or contact us — we will try our best to help.\n\n` +
        `Thank you for your understanding.\n\n` +
        `Kind regards,\n${company}`
    );
}

const SYSTEM = `You are a communications assistant for a professional printing and advertising studio. Write concise, warm, business-appropriate customer messages in English. Do not invent facts. Output only the message body (plain text).`;

function buildUserPrompt(ctx) {
    const block = {
        companyName: ctx.companyName || 'Shan Art Advertising',
        customerName: ctx.customerName || 'Valued Customer',
        orderNumber: ctx.orderNumber || '',
        jobType: ctx.jobType || '',
        quantity: ctx.quantity ?? '',
        previousDeadline: ctx.previousDeadline ? formatDate(ctx.previousDeadline) : '',
        newDeadline: ctx.newDeadline ? formatDate(ctx.newDeadline) : '',
        riskLevel: ctx.riskLevel || 'High',
    };

    return `Write a short, professional customer message informing them that the deadline has been updated due to high delay risk.

Context (JSON):
${JSON.stringify(block, null, 2)}

Requirements:
- Greet the customer by name.
- Mention the order number.
- Clearly state the NEW deadline date (if provided).
- Explain briefly that this is due to high workload/delay risk (no technical jargon).
- Offer the customer to contact us if they need the order earlier.
- End politely with the company name.
- Output only the message body (plain text).`;
}

async function ollamaChat(model, userText) {
    const base = config.OLLAMA_BASE_URL;
    const res = await axios.post(
        `${base}/api/chat`,
        {
            model,
            messages: [
                { role: 'system', content: SYSTEM },
                { role: 'user', content: userText },
            ],
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
        { model, prompt: `${SYSTEM}\n\n${prompt}`, stream: false, options: OLLAMA_OPTIONS },
        { timeout: CHAT_TIMEOUT_MS, headers: { ...getOllamaRequestHeaders() } }
    );
    return (res.data && res.data.response) || '';
}

function clean(text) {
    if (!text) return '';
    let s = String(text).trim();
    s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '');
    s = s.replace(/^\*?Subject:.*\n+/i, '');
    return s.trim();
}

async function generateDeadlineUpdateMessage(ctx) {
    const model = (config.OLLAMA_TEXT_MODEL || 'llama3').trim();
    if (!model) {
        return { message: buildFallbackMessage(ctx), usedFallback: true, model: 'fallback' };
    }

    const prompt = buildUserPrompt(ctx);
    try {
        const out = clean(await ollamaChat(model, prompt));
        if (out) return { message: out, usedFallback: false, model };
    } catch {
        // ignore and fallback to generate/fallback
    }

    try {
        const out = clean(await ollamaGenerate(model, prompt));
        if (out) return { message: out, usedFallback: false, model };
    } catch {
        // ignore
    }

    return { message: buildFallbackMessage(ctx), usedFallback: true, model };
}

module.exports = { generateDeadlineUpdateMessage, buildFallbackMessage };

