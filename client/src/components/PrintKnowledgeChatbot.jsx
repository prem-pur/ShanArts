import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { MessageCircle, X, Send, Loader2, Trash2, BookOpen, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../apiBase';

/**
 * Suggested first questions (printing / production).
 * Public widget — no auth. POST /api/ai/print-chat
 */
const SAMPLE_QUESTIONS = [
    'What is a typical bleed for an A4 poster?',
    'What paper weight works well for luxury wedding invitations?',
    'Should I design in CMYK or RGB for print?',
    'What is the difference between matte and gloss lamination?',
    'What resolution should I use for a large outdoor banner?',
];

const PrintKnowledgeChatbot = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    /** { id, role: 'user' | 'assistant', text } */
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        if (open && endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open, loading]);

    const buildHistory = useCallback((msgs) => {
        return msgs
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.text }));
    }, []);

    const send = async (text) => {
        const t = (text != null ? String(text) : input).trim();
        if (!t || loading) {
            if (!t) setError('Type a question first.');
            return;
        }
        setError('');
        setInput('');
        const userId = `u-${Date.now()}`;
        const historyForApi = buildHistory(messages);
        setMessages((prev) => [...prev, { id: userId, role: 'user', text: t }]);
        setLoading(true);

        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/api/ai/print-chat`,
                { message: t, history: historyForApi },
                { headers: { 'Content-Type': 'application/json' }, timeout: 150000 }
            );
            const reply = data && data.reply ? String(data.reply) : '';
            if (!reply) {
                setError('No answer returned. Please try again.');
            } else {
                setMessages((prev) => [
                    ...prev,
                    { id: `a-${Date.now()}`, role: 'assistant', text: reply },
                ]);
            }
        } catch (e) {
            const msg =
                e.response?.data?.message ||
                e.message ||
                'Could not reach the assistant. Check that the server and Ollama are running.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError('');
        setInput('');
    };

    useEffect(() => {
        const onOpen = () => {
            setOpen(true);
            setError('');
        };
        window.addEventListener('open-print-chat', onOpen);
        return () => window.removeEventListener('open-print-chat', onOpen);
    }, []);

    /** Portal to <body> so `position:fixed` is not broken by parent transforms; FAB stays bottom-right on scroll. */
    const shell = (
        <div className="pk-chat-root" aria-live="polite">
            {open && (
                <div className="pk-chat-panel" role="dialog" aria-label="Print Knowledge Assistant">
                    <div className="pk-chat-head">
                        <div className="pk-chat-head-text">
                            <h3 className="pk-chat-title">Print Knowledge Assistant</h3>
                            <p className="pk-chat-sub">Ask anything about printing standards &amp; design for print</p>
                        </div>
                        <div className="pk-chat-head-actions">
                            <button
                                type="button"
                                className="pk-chat-icon-btn"
                                onClick={clearChat}
                                title="Clear chat"
                                aria-label="Clear chat"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                type="button"
                                className="pk-chat-icon-btn"
                                onClick={() => setOpen(false)}
                                title="Close"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="pk-chat-messages" ref={scrollRef}>
                        {messages.length === 0 && !loading && (
                            <div className="pk-chat-empty">
                                <BookOpen size={40} className="pk-chat-empty-icon" aria-hidden />
                                <p>Try one of these, or type your own:</p>
                                <ul className="pk-chat-samples">
                                    {SAMPLE_QUESTIONS.map((q) => (
                                        <li key={q}>
                                            <button
                                                type="button"
                                                className="pk-chat-sample"
                                                onClick={() => {
                                                    setError('');
                                                    send(q);
                                                }}
                                            >
                                                {q}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={m.role === 'user' ? 'pk-bubble pk-bubble-user' : 'pk-bubble pk-bubble-assistant'}
                            >
                                {m.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="pk-bubble pk-bubble-assistant pk-typing" aria-busy>
                                <Loader2 size={16} className="pk-chat-spin" />
                                Thinking…
                            </div>
                        )}
                        {error && (
                            <div className="pk-chat-err" role="alert">
                                {error}
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <form
                        className="pk-chat-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                    >
                        <input
                            type="text"
                            className="pk-chat-input"
                            placeholder="e.g. What DPI for indoor posters?"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError('');
                            }}
                            disabled={loading}
                            maxLength={2000}
                            autoComplete="off"
                            aria-label="Your question"
                        />
                        <button type="submit" className="pk-chat-send" disabled={loading} aria-label="Send">
                            {loading ? <Loader2 size={18} className="pk-chat-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            )}

            <button
                type="button"
                className="pk-chat-fab"
                onClick={() => {
                    setOpen((o) => !o);
                    setError('');
                }}
                aria-expanded={open}
                aria-label={open ? 'Close Print Knowledge Assistant' : 'Open Print Knowledge Assistant'}
            >
                {open ? <ChevronUp size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );

    if (typeof document === 'undefined') {
        return null;
    }
    return createPortal(shell, document.body);
};

export default PrintKnowledgeChatbot;
