/* One-off: verify Ollama API from .env (run: node scripts/test-ollama-env.js) */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const base = (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
const key = (process.env.OLLAMA_API_KEY || '').trim();
const mode = (process.env.OLLAMA_API_AUTH || 'bearer').toLowerCase();
const visionModel = (process.env.OLLAMA_VISION_MODEL || 'llava').trim();

const headers = { 'Content-Type': 'application/json' };
if (key) {
    if (mode === 'x-api-key' || mode === 'xapikey' || mode === 'x_api_key') {
        headers['X-API-Key'] = key;
    } else {
        headers.Authorization = `Bearer ${key}`;
    }
}

function log(...a) {
    // eslint-disable-next-line no-console
    console.log(...a);
}

async function main() {
    log('AI_VISION_PROVIDER:', process.env.AI_VISION_PROVIDER);
    log('OLLAMA_BASE_URL:', base);
    log('OLLAMA_API_KEY set:', Boolean(key), key ? `(length ${key.length})` : '');
    log('OLLAMA_VISION_MODEL:', visionModel);
    log('---');

    try {
        const tags = await axios.get(`${base}/api/tags`, { headers, timeout: 25000 });
        const names = (tags.data.models || []).map((m) => m.name);
        log('GET /api/tags: OK —', names.length, 'model(s) visible');
        const hasVision = names.some(
            (n) =>
                /llava|vision|qwen2-vl|minicpm|moondream|gemma3|llama3\.2-vision|bakllava/i.test(
                    n
                )
        );
        if (names.length && !hasVision) {
            log('Note: no obvious vision model name in list; /api/tags may be minimal on cloud. Try a model id from the provider’s docs.');
        }
        const match = names.find(
            (n) => n === visionModel || n.startsWith(visionModel + ':')
        );
        if (match) {
            log('OLLAMA_VISION_MODEL matches a listed model:', match);
        } else         if (names.length) {
            log('OLLAMA_VISION_MODEL "' + visionModel + '" not in /api/tags sample — cloud may use different names; 404 on chat means pick another id.');
            log('First models:', names.slice(0, 8).join(', '));
            const visionish = names.filter((n) =>
                /vl|vision|llava|moondream|minicpm|gemini|clip/i.test(n)
            );
            if (visionish.length) {
                log('Models with likely vision in the name:', visionish.join(', '));
            }
        }
    } catch (e) {
        log('GET /api/tags: FAIL');
        log('  HTTP', e.response && e.response.status);
        const d = e.response && e.response.data;
        log('  body:', typeof d === 'string' ? d.slice(0, 400) : JSON.stringify(d || {}).slice(0, 400));
        log('  message:', e.message);
        process.exit(1);
    }

    // Same path as "Process with AI": tiny 1x1 PNG + /api/chat (vision)
    const tinyPngB64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    try {
        const chat = await axios.post(
            `${base}/api/chat`,
            {
                model: visionModel,
                messages: [
                    {
                        role: 'user',
                        content: 'Reply with a single word: ok',
                        images: [tinyPngB64],
                    },
                ],
                stream: false,
            },
            { headers, timeout: 120000 }
        );
        const t = (chat.data && chat.data.message && chat.data.message.content) || '';
        log('POST /api/chat (1x1 image probe): OK — response length', String(t).length);
        if (t) log('  preview:', String(t).trim().slice(0, 160).replace(/\n/g, ' '));
    } catch (e) {
        log('POST /api/chat (vision probe): FAIL');
        log('  HTTP', e.response && e.response.status);
        const d = e.response && e.response.data;
        log('  body:', typeof d === 'string' ? d.slice(0, 600) : JSON.stringify(d || {}).slice(0, 600));
        log('  message:', e.message);
        log('  Tip: set OLLAMA_VISION_MODEL to a vision model id that exists on this host (see ollama.com / your provider).');
        process.exit(1);
    }

    log('---');
    log('Ollama API checks passed for this .env (tags + /api/chat with image).');
}

main().catch((e) => {
    log(e);
    process.exit(1);
});
