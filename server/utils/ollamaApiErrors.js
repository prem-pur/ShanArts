/**
 * Parse Ollama HTTP error bodies (axios).
 * @param {import('axios').AxiosError} e
 * @returns {string}
 */
function ollamaErrorText(e) {
    const d = e.response && e.response.data;
    if (!d) return '';
    if (typeof d === 'string') return d;
    return String(d.error || d.message || '');
}

/** Ollama Cloud returns this when the model needs a paid plan. */
function isOllamaSubscriptionError(text) {
    const t = String(text || '').toLowerCase();
    return t.includes('subscription') && (t.includes('upgrade') || t.includes('ollama.com'));
}

module.exports = { ollamaErrorText, isOllamaSubscriptionError };
