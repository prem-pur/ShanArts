/**
 * AI-generated professional messages when staff share a design with the customer.
 * Uses Ollama (OLLAMA_TEXT_MODEL) with a safe fallback if the model is unavailable.
 */
const axios = require('axios');
const config = require('../config/env');
const { getOllamaRequestHeaders } = require('./aiService');

const OLLAMA_OPTIONS = { temperature: 0.45, num_predict: 900, top_p: 0.9 };
const CHAT_TIMEOUT_MS = 120000;

const SCENARIOS = new Set(['draft_for_approval', 'revision', 'final_confirmation']);

const SCENARIO_HINT = {
    draft_for_approval:
        'This is the first time we are sharing the design preview for review and approval.',
    revision:
        'We are sending an updated design after the customer requested changes or we revised the work.',
    final_confirmation:
        'We are asking the customer to confirm the design as final before we proceed to production.',
};

/**
 * @param {object} ctx
 * @param {string} [ctx.scenario] - draft_for_approval | revision | final_confirmation
 * @param {string} [ctx.companyName]
 * @param {string} [ctx.customerName]
 * @param {string} [ctx.productName]
 * @param {string|number} [ctx.quantity]
 * @param {string} [ctx.finishOrType] - e.g. finish, coating, material
 * @param {string|Date} [ctx.deadline]
 * @param {string} [ctx.designStatus]
 * @param {string} [ctx.orderNumber]
 * @param {string} [ctx.size] - human-readable size
 */
function buildFallbackMessage(ctx) {
    const company = ctx.companyName || 'Shan Art Advertising';
    const name = (ctx.customerName && String(ctx.customerName).trim()) || 'Valued Customer';
    const product = (ctx.productName && String(ctx.productName).trim()) || 'your order';
    const qty = ctx.quantity != null && ctx.quantity !== '' ? `Quantity: ${ctx.quantity}. ` : '';
    const finish = (ctx.finishOrType && String(ctx.finishOrType).trim()) ? `${ctx.finishOrType.trim()}. ` : '';
    const due = formatDeadline(ctx.deadline);
    const dueLine = due ? `Target timeline: ${due}. ` : '';
    const orderRef = (ctx.orderNumber && String(ctx.orderNumber).trim())
        ? `Order reference: ${String(ctx.orderNumber).trim()}.`
        : '';

    const scen = ctx.scenario || 'draft_for_approval';
    let intro = '';
    if (scen === 'revision') {
        intro = `We have updated the design based on your feedback. `;
    } else if (scen === 'final_confirmation') {
        intro = `The design is ready for your final confirmation. `;
    } else {
        intro = `We have prepared the design for your review. `;
    }

    return (
        `Dear ${name},\n\n` +
        intro +
        `Please find the design for ${product} ready for you to review in your customer portal. ` +
        `${qty}${finish}` +
        `${dueLine}` +
        `${orderRef}\n\n` +
        `Kindly review the design and let us know if you would like any changes. ` +
        `If everything looks good, please confirm your approval so we can move forward. ` +
        `If you need adjustments, reply with your comments and we will be happy to help.\n\n` +
        `Thank you for choosing ${company}.\n\n` +
        `Kind regards,\n` +
        `${company}`
    );
}

function formatDeadline(d) {
    if (d == null || d === '') return '';
    try {
        const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
        if (Number.isNaN(t)) return String(d);
        return new Date(t).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return String(d);
    }
}

function normalizeScenario(raw) {
    const s = (raw == null ? '' : String(raw)).trim();
    if (SCENARIOS.has(s)) return s;
    return 'draft_for_approval';
}

/**
 * Strips code fences and leading "Subject:" lines from model output.
 */
function cleanMessage(text) {
    if (!text) return '';
    let s = String(text).trim();
    s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '');
    s = s.replace(/^\*?Subject:.*\n+/i, '');
    s = s.replace(/^["']|["']$/g, '');
    return s.trim();
}

function buildUserPrompt(ctx) {
    const scen = normalizeScenario(ctx.scenario);
    const block = {
        companyName: ctx.companyName || 'Shan Art Advertising',
        scenario: scen,
        scenarioNote: SCENARIO_HINT[scen] || SCENARIO_HINT.draft_for_approval,
        customerName: ctx.customerName || 'Valued Customer',
        productOrItem: ctx.productName || 'order item',
        quantity: ctx.quantity,
        finishOrType: ctx.finishOrType,
        size: ctx.size,
        deadline: ctx.deadline ? formatDeadline(ctx.deadline) : '',
        designStatus: ctx.designStatus || '',
        orderNumber: ctx.orderNumber || '',
    };
    return `Write a short, professional **customer message** (email-style body) on behalf of the print studio.

**Context (JSON):**
${JSON.stringify(block, null, 2)}

**Requirements:**
- Greet the customer by name if provided (use "Valued Customer" only if no name).
- State that the design is ready / shared for review (match the scenario).
- Briefly mention the order or product (and quantity, size, finish, deadline) where relevant — do not invent facts not in the JSON.
- Ask them to review the design, confirm approval, or request changes.
- End politely with the company name.
- **Output only the message body** — no subject line, no markdown headings, no JSON, no "Here is the message:" preamble. Plain text, suitable for a notification.`;
}

const SYSTEM = `You are a communications assistant for a professional printing and advertising studio. You write concise, warm, business-appropriate messages to customers in English. You never add placeholders like [date] or fabricate order details.`;

async function ollamaChatForDesign(model, userText) {
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

async function ollamaGenerateSingle(model, prompt) {
    const base = config.OLLAMA_BASE_URL;
    const res = await axios.post(
        `${base}/api/generate`,
        { model, prompt: `${SYSTEM}\n\n${prompt}`, stream: false, options: OLLAMA_OPTIONS },
        { timeout: CHAT_TIMEOUT_MS, headers: { ...getOllamaRequestHeaders() } }
    );
    return (res.data && res.data.response) || '';
}

/**
 * @returns {Promise<{ message: string, usedFallback: boolean, model: string }>}
 */
async function generateDesignCustomerMessage(ctx) {
    const model = (config.OLLAMA_TEXT_MODEL || 'llama3').trim();
    if (!model) {
        return { message: buildFallbackMessage(ctx), usedFallback: true, model: 'fallback' };
    }

    const userBlock = buildUserPrompt(ctx);
    let out = '';
    try {
        out = await ollamaChatForDesign(model, userBlock);
    } catch {
        // connection / model errors → fallback
        return { message: buildFallbackMessage(ctx), usedFallback: true, model };
    }

    out = cleanMessage(out);
    if (!out) {
        try {
            out = cleanMessage(await ollamaGenerateSingle(model, userBlock));
        } catch {
            return { message: buildFallbackMessage(ctx), usedFallback: true, model };
        }
    }

    if (!out) {
        return { message: buildFallbackMessage(ctx), usedFallback: true, model };
    }

    return { message: out, usedFallback: false, model };
}

module.exports = {
    generateDesignCustomerMessage,
    buildFallbackMessage,
    normalizeScenario,
    SCENARIOS: Array.from(SCENARIOS),
};
