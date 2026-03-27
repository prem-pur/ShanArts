import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const QRCodeDisplay = ({ material, onClose }) => {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                // Use existing qrCode on material if available
                if (material.qrCode) {
                    setQrData({ qrCode: material.qrCode, name: material.name });
                    setLoading(false);
                    return;
                }
                // Otherwise fetch/regenerate from server
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/inventory/qr/${material._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQrData(response.data.data);
            } catch (err) {
                setError('Failed to load QR code');
            } finally {
                setLoading(false);
            }
        };
        fetchQR();
    }, [material]);

    const downloadQR = () => {
        if (!qrData?.qrCode) return;
        const link = document.createElement('a');
        link.href = qrData.qrCode;
        link.download = `qr-${material.name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                textAlign: 'center',
                position: 'relative',
            }}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'none', border: 'none',
                        fontSize: '22px', cursor: 'pointer', color: '#9ca3af',
                    }}
                >×</button>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                    QR Code
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    {material.name} · {material.category} · {material.unit}
                </p>

                {loading && (
                    <div style={{ padding: '40px', color: '#9ca3af' }}>Generating QR code…</div>
                )}

                {error && (
                    <div style={{ color: '#dc2626', padding: '20px' }}>{error}</div>
                )}

                {qrData?.qrCode && !loading && (
                    <>
                        <div style={{
                            display: 'inline-block',
                            padding: '16px',
                            background: '#f9fafb',
                            borderRadius: '16px',
                            border: '1.5px solid #e5e7eb',
                            marginBottom: '20px',
                        }}>
                            <img
                                src={qrData.qrCode}
                                alt={`QR for ${material.name}`}
                                style={{ width: '200px', height: '200px', display: 'block' }}
                            />
                        </div>

                        <div style={{
                            background: '#f3f4f6',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            fontSize: '11px',
                            color: '#6b7280',
                            marginBottom: '20px',
                            wordBreak: 'break-all',
                            textAlign: 'left',
                        }}>
                            <strong>Material ID:</strong> {material._id}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={downloadQR}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#111827',
                                    color: '#fff',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                ⬇️ Download QR
                            </button>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e5e7eb',
                                    background: '#fff',
                                    color: '#374151',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                🖨️ Print
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QRCodeDisplay;
