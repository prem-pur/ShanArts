const axios = require('axios');

const DEFAULT_URL = 'http://127.0.0.1:8000';
const DEFAULT_TIMEOUT_MS = 5000;

function getConfig() {
    const url = (process.env.ML_SERVER_URL || DEFAULT_URL).trim().replace(/\/$/, '');
    const timeoutMs = Number(process.env.ML_TIMEOUT_MS || DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    return { url, timeoutMs };
}

function safeJson(x) {
    try {
        return JSON.stringify(x);
    } catch {
        return '"<unserializable>"';
    }
}

async function predict(orderData) {
    const { url, timeoutMs } = getConfig();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // log request (minimal PII — order dates and numeric stats only)
        // eslint-disable-next-line no-console
        console.log('[mlService] predict request:', safeJson(orderData));

        const res = await axios.post(`${url}/predict`, orderData, {
            signal: controller.signal,
            timeout: timeoutMs,
            headers: { 'Content-Type': 'application/json' },
        });

        // eslint-disable-next-line no-console
        console.log('[mlService] predict response:', safeJson(res.data));
        return res.data;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[mlService] predict error:', err && err.stack ? err.stack : err);
        throw err;
    } finally {
        clearTimeout(t);
    }
}

async function checkModelHealth() {
    const { url, timeoutMs } = getConfig();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), Math.min(timeoutMs, 2000));
    try {
        const res = await axios.get(`${url}/health`, {
            signal: controller.signal,
            timeout: Math.min(timeoutMs, 2000),
        });
        return !!res.data && res.data.ok === true;
    } catch {
        return false;
    } finally {
        clearTimeout(t);
    }
}

module.exports = { predict, checkModelHealth };

