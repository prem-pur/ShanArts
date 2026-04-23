import React, { useState } from 'react';
import axios from 'axios';
import { Wrench, Sparkles, Download, FileText } from 'lucide-react';
import { API_BASE_URL } from '../apiBase';

const DesignWorkspaceTools = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [documentUrl, setDocumentUrl] = useState(null);
    const [extractedText, setExtractedText] = useState('');

    const handleFile = (e) => {
        setFile(e.target.files[0] || null);
        setDocumentUrl(null);
        setError('');
    };

    const runExtraction = async () => {
        if (!file) {
            setError('Choose an image first.');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('Use an image file (PNG, JPG, etc.).');
            return;
        }
        setError('');
        setLoading(true);
        setDocumentUrl(null);
        const data = new FormData();
        data.append('image', file);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/shop-orders/convert-ai`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            const text = (res.data?.extractedText || '').trim();
            setExtractedText(text);
            setDocumentUrl(res.data?.documentUrl || null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Extraction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px 24px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <Wrench size={22} color="#0f172a" strokeWidth={2.25} />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Tools</h2>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}
                >
                    Design prep
                </span>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5, maxWidth: '720px' }}>
                From a client reference image, run AI to pull text and build a draft Word file for studio use. Images
                only (PNG, JPG).
            </p>

            {error && (
                <div
                    style={{
                        marginBottom: '12px',
                        padding: '10px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        color: '#b91c1c',
                        fontSize: '13px',
                        fontWeight: '600',
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                        style={{ fontSize: '13px', flex: 1, minWidth: '200px' }}
                    />
                    <button
                        type="button"
                        onClick={runExtraction}
                        disabled={loading || !file}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '1px solid #c7d2fe',
                            background: loading || !file ? '#e2e8f0' : '#eef2ff',
                            color: loading || !file ? '#94a3b8' : '#4338ca',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: loading || !file ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Sparkles size={16} />
                        {loading ? 'Processing…' : 'Run AI extraction'}
                    </button>
                </div>
                {documentUrl && (
                    <a
                        href={`${API_BASE_URL}${documentUrl}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#dc2626',
                        }}
                    >
                        <Download size={16} />
                        Download Word document
                    </a>
                )}
            </div>

            {extractedText ? (
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FileText size={16} color="#64748b" />
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                            Extracted text
                        </span>
                    </div>
                    <textarea
                        readOnly
                        value={extractedText}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            color: '#0f172a',
                            background: '#fff',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default DesignWorkspaceTools;
