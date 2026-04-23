const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const base = (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
const key = (process.env.OLLAMA_API_KEY || '').trim();
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };

axios
    .get(`${base}/api/tags`, { headers, timeout: 30000 })
    .then((r) => {
        const names = (r.data.models || []).map((m) => m.name);
        const visionish = names.filter((n) => /vl|vision|llava|moondream|minicpm|gemini|clip/i.test(n));
        console.log('All models', names.length + ':', names.join(', '));
        console.log('---\nVision-ish names:', visionish.length ? visionish.join(', ') : '(no heuristic match)');
    })
    .catch((e) => {
        console.error(e.message, e.response && e.response.status, e.response && e.response.data);
        process.exit(1);
    });
