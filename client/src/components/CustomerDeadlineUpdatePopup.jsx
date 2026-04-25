import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function CustomerDeadlineUpdatePopup({
    isOpen,
    orderNumber,
    jobType,
    message,
    onAcknowledge,
}) {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-deadline-msg-title"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                background: 'rgba(6, 8, 16, 0.85)',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 520,
                    borderRadius: 20,
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 40px rgba(239, 68, 68, 0.10)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '18px 20px 0',
                        gap: 12,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: 'rgba(239, 68, 68, 0.14)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444',
                            }}
                        >
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2
                                id="customer-deadline-msg-title"
                                style={{
                                    margin: 0,
                                    fontSize: 17,
                                    fontWeight: 900,
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-sans)',
                                }}
                            >
                                Deadline update
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                                {orderNumber}
                                {jobType ? ` · ${String(jobType).replace(/_/g, ' ')}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onAcknowledge()}
                        style={{
                            background: 'var(--surface-muted)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 10,
                            padding: 8,
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            flexShrink: 0,
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '16px 20px 20px' }}>
                    <div
                        style={{
                            fontSize: 14,
                            lineHeight: 1.65,
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap',
                            background: 'var(--input-bg, rgba(0,0,0,0.2))',
                            border: '1px solid var(--border-color)',
                            borderRadius: 12,
                            padding: '14px 16px',
                            maxHeight: 320,
                            overflow: 'auto',
                        }}
                    >
                        {message}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                        <button
                            type="button"
                            onClick={() => onAcknowledge()}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--accent-color)',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 18px',
                                borderRadius: 10,
                                fontWeight: 900,
                                fontSize: 13,
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px var(--accent-glow)',
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

