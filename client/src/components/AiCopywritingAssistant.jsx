import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../apiBase';

const CONTENT_TYPES = [
    { value: 'Flyer', label: 'Flyer' },
    { value: 'Business Card', label: 'Business Card' },
    { value: 'Poster', label: 'Poster' },
    { value: 'Social Media Caption', label: 'Social Media Caption' },
    { value: 'Banner', label: 'Banner' },
];

const TONES = [
    { value: 'Professional', label: 'Professional' },
    { value: 'Friendly', label: 'Friendly' },
    { value: 'Luxury', label: 'Luxury' },
    { value: 'Modern', label: 'Modern' },
    { value: 'Promotional', label: 'Promotional' },
];

const SAMPLE =
    "Weekend bakery sale in Anuradhapura — 20% off all cakes, Saturday 9am–5pm. Family-owned since 2012.";

/**
 * Public marketing copy generator — calls POST /api/ai/generate-copy (no sign-in).
 */
const AiCopywritingAssistant = () => {
    const [prompt, setPrompt] = useState('');
    const [contentType, setContentType] = useState('Flyer');
    const [tone, setTone] = useState('Professional');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const useSample = useCallback(() => {
        setPrompt(SAMPLE);
        setError('');
    }, []);

    const onGenerate = async () => {
        const p = prompt.trim();
        if (!p) {
            setError('Please describe your promotion or product — the prompt cannot be empty.');
            return;
        }
        setError('');
        setOutput('');
        setCopied(false);
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/api/ai/generate-copy`,
                { prompt: p, contentType, tone },
                { headers: { 'Content-Type': 'application/json' }, timeout: 150000 }
            );
            if (data && data.copy) {
                setOutput(String(data.copy));
            } else {
                setError('The server did not return copy. Please try again.');
            }
        } catch (e) {
            const msg =
                e.response?.data?.message ||
                e.message ||
                'Could not reach the AI service. Is the server running and Ollama configured?';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const onCopy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Copy failed. Select the text manually.');
        }
    };

    return (
        <section className="ai-copy-section" id="ai-copywriting" aria-labelledby="ai-copy-title">
            <div className="ai-copy-card">
                <div className="ai-copy-header">
                    <div className="ai-copy-icon-wrap" aria-hidden>
                        <Sparkles size={24} className="ai-copy-icon" />
                    </div>
                    <div>
                        <h2 id="ai-copy-title" className="ai-copy-title">
                            AI Copywriting Assistant
                        </h2>
                        <p className="ai-copy-sub">
                            Free tool — describe your event or offer; get headline, subtext, and a call to action
                            for print or design. No account required.
                        </p>
                    </div>
                </div>

                <div className="ai-copy-form-row">
                    <label className="ai-copy-label" htmlFor="ai-prompt">
                        What do you need?
                    </label>
                    <textarea
                        id="ai-prompt"
                        className="ai-copy-textarea"
                        rows={4}
                        placeholder='Example: "Weekend bakery sale, 20% off cakes, Saturday only, Anuradhapura."'
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            setError('');
                        }}
                        disabled={loading}
                    />
                </div>

                <div className="ai-copy-form-grid">
                    <div>
                        <label className="ai-copy-label" htmlFor="ai-content-type">
                            Content type
                        </label>
                        <select
                            id="ai-content-type"
                            className="ai-copy-select"
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                            disabled={loading}
                        >
                            {CONTENT_TYPES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="ai-copy-label" htmlFor="ai-tone">
                            Tone
                        </label>
                        <select
                            id="ai-tone"
                            className="ai-copy-select"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            disabled={loading}
                        >
                            {TONES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="ai-copy-error" role="alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="ai-copy-actions">
                    <button
                        type="button"
                        className="ai-copy-btn secondary"
                        onClick={useSample}
                        disabled={loading}
                    >
                        Use sample prompt
                    </button>
                    <button
                        type="button"
                        className="ai-copy-btn primary"
                        onClick={onGenerate}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="ai-copy-spin" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate copy with AI
                            </>
                        )}
                    </button>
                </div>

                {output && (
                    <div className="ai-copy-output-block">
                        <div className="ai-copy-output-head">
                            <span className="ai-copy-out-label">Generated copy</span>
                            <button type="button" className="ai-copy-btn ghost" onClick={onCopy} disabled={!output}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy text'}
                            </button>
                        </div>
                        <pre className="ai-copy-output">{output}</pre>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AiCopywritingAssistant;
