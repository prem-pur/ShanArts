const path = require('path');
const dotenv = require('dotenv');

// Load server/.env regardless of the process current working directory (e.g. npm run from repo root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

/** Map legacy 1.5 model ids (404 on v1beta) to a current model so old server/.env lines still work */
function isOllamaCloudHost(baseUrl) {
    return /ollama\.com/i.test(String(baseUrl || ''));
}

/**
 * Text model for Ollama chat/copy. If unset: local default `llama3`; Ollama Cloud default `gpt-oss:20b-cloud`
 * (smaller cloud model — override with OLLAMA_TEXT_MODEL / OLLAMA_DEFAULT_CLOUD_TEXT_MODEL if your plan differs).
 */
function resolveOllamaTextModel() {
    const explicit = (process.env.OLLAMA_TEXT_MODEL || '').trim();
    if (explicit) return explicit;
    const base = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/$/, '');
    if (isOllamaCloudHost(base)) {
        return (process.env.OLLAMA_DEFAULT_CLOUD_TEXT_MODEL || 'gpt-oss:20b-cloud').trim() || 'gpt-oss:20b-cloud';
    }
    return 'llama3';
}

/**
 * For Ollama Cloud text features (copywriting, print knowledge): try models in order until one works.
 * On “subscription required”, the next id is attempted. Optional third: OLLAMA_TEXT_MODEL_CLOUD_FALLBACK_2.
 */
function getOllamaTextModelTryList() {
    const primary = resolveOllamaTextModel();
    const base = (process.env.OLLAMA_BASE_URL || '').trim().replace(/\/$/, '');
    if (!isOllamaCloudHost(base)) return [primary];
    const fb = (process.env.OLLAMA_TEXT_MODEL_CLOUD_FALLBACK || 'gpt-oss:20b-cloud').trim();
    const fb2 = (process.env.OLLAMA_TEXT_MODEL_CLOUD_FALLBACK_2 || '').trim();
    const list = [];
    for (const m of [primary, fb, fb2]) {
        if (m && !list.includes(m)) list.push(m);
    }
    return list.length ? list : [primary];
}

/**
 * Vision / multimodal model for Ollama (image → text). If unset: local `llava`; cloud default from OLLAMA_DEFAULT_CLOUD_VISION_MODEL or qwen2.5-vl:7b.
 */
function resolveOllamaVisionModel() {
    const explicit = (process.env.OLLAMA_VISION_MODEL || '').trim();
    if (explicit) return explicit;
    const base = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/$/, '');
    if (isOllamaCloudHost(base)) {
        return (process.env.OLLAMA_DEFAULT_CLOUD_VISION_MODEL || 'qwen2.5-vl:7b').trim() || 'qwen2.5-vl:7b';
    }
    return 'llava';
}

/**
 * Image features (Process with AI / extraction): try vision models on subscription errors (Ollama Cloud).
 */
function getOllamaVisionModelTryList() {
    const primary = resolveOllamaVisionModel();
    const base = (process.env.OLLAMA_BASE_URL || '').trim().replace(/\/$/, '');
    if (!isOllamaCloudHost(base)) return [primary];
    const fb = (process.env.OLLAMA_VISION_MODEL_CLOUD_FALLBACK || 'gemma3:4b').trim();
    const fb2 = (process.env.OLLAMA_VISION_MODEL_CLOUD_FALLBACK_2 || '').trim();
    const list = [];
    for (const m of [primary, fb, fb2]) {
        if (m && !list.includes(m)) list.push(m);
    }
    return list.length ? list : [primary];
}

function resolveGeminiModel() {
    const raw = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
    const m = raw || DEFAULT_GEMINI_MODEL;
    if (/^gemini-1\.5/i.test(m)) {
        // eslint-disable-next-line no-console
        console.warn(
            `[config] GEMINI_MODEL "%s" is not available for generateContent. Using "%s" instead. Update or remove GEMINI_MODEL in server/.env.`,
            m,
            DEFAULT_GEMINI_MODEL
        );
        return DEFAULT_GEMINI_MODEL;
    }
    return m;
}

module.exports = {
    PORT: process.env.PORT || 5001,
    MONGODB_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/orderDB',
    JWT_SECRET: process.env.JWT_SECRET || 'printing_management_secret_key_2024',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    /** Google AI — required when AI_VISION_PROVIDER is gemini (not needed for ollama) */
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
    /** Default works with current Generative Language API; legacy 1.5 names are remapped in resolveGeminiModel() */
    GEMINI_MODEL: resolveGeminiModel(),
    /** Optional: if primary model hits 429/quota, try this model (set in .env if Google gives a separate quota) */
    GEMINI_FALLBACK_MODEL: (process.env.GEMINI_FALLBACK_MODEL || '').trim(),
    /**
     * Vision provider for "Process with AI": `gemini` (cloud, needs GEMINI_API_KEY) or `ollama` (local, open weights, no Google quota).
     */
    /** Default `ollama` so "Process with AI" works locally without GEMINI_API_KEY. Set to `gemini` for Google AI. */
    AI_VISION_PROVIDER: (process.env.AI_VISION_PROVIDER || 'ollama').trim().toLowerCase(),
    /**
     * Ollama API base, no trailing slash. Examples:
     * - Local: http://127.0.0.1:11434
     * - Ollama Cloud (hosted API): https://ollama.com
     */
    OLLAMA_BASE_URL: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/$/, ''),
    /** For https://ollama.com and many hosts: create a key in Ollama account settings, then set this. Sent as Authorization: Bearer … */
    OLLAMA_API_KEY: (process.env.OLLAMA_API_KEY || '').trim(),
    /**
     * How to send OLLAMA_API_KEY: `bearer` (default, Ollama Cloud) or `x-api-key` (some self-hosted / reverse proxies).
     */
    OLLAMA_API_AUTH: (process.env.OLLAMA_API_AUTH || 'bearer').trim().toLowerCase(),
    /** Vision model for Ollama image APIs — resolved (local llava vs cloud default unless OLLAMA_VISION_MODEL is set). */
    OLLAMA_VISION_MODEL: resolveOllamaVisionModel(),
    getOllamaVisionModelTryList,
    /**
     * Text model for Ollama (copywriting, staff messages, etc.). Resolved by resolveOllamaTextModel():
     * explicit OLLAMA_TEXT_MODEL, else cloud → OLLAMA_DEFAULT_CLOUD_TEXT_MODEL or gpt-oss:20b-cloud, else local llama3.
     */
    OLLAMA_TEXT_MODEL: resolveOllamaTextModel(),
    getOllamaTextModelTryList,
    FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || './public/uploads',
    NODE_ENV: process.env.NODE_ENV || 'development',
};
