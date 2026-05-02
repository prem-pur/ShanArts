/**
 * AI-generated message to customer about delay-risk status (Medium/High heads-up).
 * Uses Ollama (OLLAMA_TEXT_MODEL) with safe fallback.
 */
const axios = require('axios');
const config = require('../config/env');
const { getOllamaRequestHeaders } = require('./aiService');

const OLLAMA_OPTIONS = { temperature: 0.35, num_predict: 650, top_p: 0.9 };
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
    const risk = ctx.riskLevel || 'Medium';
    const deadline = ctx.deadline ? formatDate(ctx.deadline) : '';

    return (
        `Dear ${name},\n\n` +
        `Quick update regarding ${orderRef}. Our system currently shows a **${risk} delay risk** based on the current schedule and workload.\n\n` +
        (deadline ? `Current deadline: ${deadline}.\n\n` : '') +
        `We are actively monitoring the job to keep it on track. If you have any urgent requirements, please contact us through the customer portal.\n\n` +
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
        deadline: ctx.deadline ? formatDate(ctx.deadline) : '',
        riskLevel: ctx.riskLevel || 'Medium',
        confidence: ctx.confidence != null ? ctx.confidence : '',
    };

    return `Write a short, professional customer notification message about the current delay risk.

Context (JSON):
${JSON.stringify(block, null, 2)}

Requirements:
- Greet the customer by name.
- Mention the order number.
- Mention the risk level (Medium/High).
- If a deadline is provided, mention it (do not change it).
- Reassure we are monitoring and ask them to contact us if the order is urgent.
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

async function generateRiskAlertCustomerMessage(ctx) {
    const model = (config.OLLAMA_TEXT_MODEL || 'llama3').trim();
    if (!model) {
        return { message: buildFallbackMessage(ctx), usedFallback: true, model: 'fallback' };
    }

    const prompt = buildUserPrompt(ctx);
    try {
        const out = clean(await ollamaChat(model, prompt));
        if (out) return { message: out, usedFallback: false, model };
    } catch {
        // ignore
    }

    try {
        const out = clean(await ollamaGenerate(model, prompt));
        if (out) return { message: out, usedFallback: false, model };
    } catch {
        // ignore
    }

    return { message: buildFallbackMessage(ctx), usedFallback: true, model };
}

module.exports = { generateRiskAlertCustomerMessage, buildFallbackMessage };

