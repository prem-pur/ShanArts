import React, { useState, useCallback, useEffect } from 'react';

// ─── Toast types ──────────────────────────────────────────────────
const TOAST_STYLES = {
    success: { bg: '#ff3333', icon: '✓', label: 'Success' },
    error:   { bg: '#ef4444', icon: '✕', label: 'Error'   },
    warning: { bg: '#f59e0b', icon: '!', label: 'Warning'  },
    info:    { bg: '#666666', icon: 'i', label: 'Info'     },
};

// ─── Single Toast item ────────────────────────────────────────────
const ToastItem = ({ id, message, type = 'info', onRemove }) => {
    const [visible, setVisible] = useState(false);
    const style = TOAST_STYLES[type] || TOAST_STYLES.info;

    useEffect(() => {
        // Slide in
        const show = setTimeout(() => setVisible(true), 10);
        // Auto-dismiss after 3.5 s
        const hide = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(id), 300);
        }, 3500);
        return () => { clearTimeout(show); clearTimeout(hide); };
    }, [id, onRemove]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fff',
                borderRadius: '14px',
                padding: '14px 18px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: `1.5px solid ${style.bg}22`,
                minWidth: '280px',
                maxWidth: '420px',
                transform: visible ? 'translateX(0)' : 'translateX(110%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
                fontFamily: "'Inter', sans-serif",
                pointerEvents: 'all',
            }}
        >
            {/* Icon badge */}
            <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: style.bg, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '16px', flexShrink: 0,
            }}>
                {style.icon}
            </div>

            {/* Message */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: style.bg, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    {style.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', lineHeight: 1.4 }}>
                    {message}
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', fontSize: '18px', lineHeight: 1,
                    padding: '2px 4px', flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    );
};

// ─── Toast container (renders in top-right) ───────────────────────
export const ToastContainer = ({ toasts, onRemove }) => (
    <div style={{
        position: 'fixed', top: '24px', right: '24px',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none',
    }}>
        {toasts.map(t => (
            <ToastItem key={t.id} {...t} onRemove={onRemove} />
        ))}
    </div>
);

// ─── Hook: useToast ───────────────────────────────────────────────
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, removeToast };
};
