import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const QRScanner = ({ onClose, onStockUpdated }) => {
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);
    const [scannerStarted, setScannerStarted] = useState(false);
    const [scannedMaterial, setScannedMaterial] = useState(null);
    const [manualCode, setManualCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [operation, setOperation] = useState('add');
    const [notes, setNotes] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: null, message: '' });
    const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        return () => stopScanner();
    }, []);

    const startScanner = async () => {
        if (html5QrcodeRef.current) return;
        try {
            const scanner = new Html5Qrcode('qr-reader');
            html5QrcodeRef.current = scanner;
            setScannerStarted(true);
            setStatus({ type: null, message: '' });

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                async (decodedText) => {
                    await handleQRDecoded(decodedText);
                },
                () => { } // ignore frame errors
            );
        } catch (err) {
            setStatus({ type: 'error', message: `Camera error: ${err.message || 'Could not access camera.'}` });
            setScannerStarted(false);
            html5QrcodeRef.current = null;
        }
    };

    const stopScanner = async () => {
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop();
                html5QrcodeRef.current.clear();
            } catch (_) { /* ignore */ }
            html5QrcodeRef.current = null;
        }
        setScannerStarted(false);
    };

    const handleQRDecoded = async (decodedText) => {
        // Stop scanner after first decode
        await stopScanner();

        try {
            // QR payload is JSON: { id, name, category, unit }
            let materialId = decodedText;
            try {
                const parsed = JSON.parse(decodedText);
                materialId = parsed.id || decodedText;
            } catch (_) { /* plain string code */ }

            await fetchMaterialByCode(materialId);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to process QR code' });
        }
    };

    const fetchMaterialByCode = async (code) => {
        try {
            setStatus({ type: 'loading', message: 'Looking up material…' });
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/inventory/barcode/${code}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setScannedMaterial(response.data.data);
            setStatus({ type: null, message: '' });
        } catch (err) {
            setStatus({ type: 'error', message: 'Material not found. Try scanning again.' });
            setScannedMaterial(null);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        await stopScanner();
        await fetchMaterialByCode(manualCode.trim());
    };

    const handleUpdateStock = async () => {
        if (!scannedMaterial || !quantity || quantity <= 0) return;
        try {
            setUpdating(true);
            const code = scannedMaterial._id;
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${API_BASE_URL}/api/inventory/barcode/${code}`,
                { quantity: Number(quantity), operation, notes: notes || `Stock ${operation} via QR scan`, password },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { previousStock, newStock } = response.data.data;
            setStatus({
                type: 'success',
                message: `✅ Stock updated! ${previousStock} → ${newStock} ${scannedMaterial.unit}`,
            });
            setScannedMaterial(null);
            setQuantity(1);
            setNotes('');
            setPassword('');
            onStockUpdated?.();
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.error || 'Failed to update stock',
            });
        } finally {
            setUpdating(false);
        }
    };

    const resetScan = async () => {
        setScannedMaterial(null);
        setStatus({ type: null, message: '' });
        setManualCode('');
        setPassword('');
        if (activeTab === 'camera') await startScanner();
    };

    const tabStyle = (active) => ({
        flex: 1,
        padding: '10px',
        border: 'none',
        borderBottom: active ? '2px solid #111827' : '2px solid transparent',
        background: 'none',
        fontWeight: active ? '800' : '600',
        color: active ? '#111827' : '#9ca3af',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s',
    });

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>
                            📷 QR Code Scanner
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                            Scan a material QR code to update stock
                        </p>
                    </div>
                    <button
                        onClick={() => { stopScanner(); onClose(); }}
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
                    >×</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                    <button style={tabStyle(activeTab === 'camera')} onClick={() => { setActiveTab('camera'); setScannedMaterial(null); }}>
                        📷 Camera Scan
                    </button>
                    <button style={tabStyle(activeTab === 'manual')} onClick={() => { setActiveTab('manual'); stopScanner(); setScannedMaterial(null); }}>
                        ⌨️ Manual Entry
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Status messages */}
                    {status.message && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '16px',
                            background: status.type === 'error' ? '#fef2f2' : status.type === 'success' ? '#f0fdf4' : '#eff6ff',
                            color: status.type === 'error' ? '#dc2626' : status.type === 'success' ? '#166534' : '#1d4ed8',
                            fontSize: '14px',
                            fontWeight: '600',
                        }}>
                            {status.message}
                        </div>
                    )}

                    {/* Camera Tab */}
                    {activeTab === 'camera' && !scannedMaterial && (
                        <>
                            {/* Camera viewfinder */}
                            <div style={{
                                background: '#f9fafb',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                marginBottom: '16px',
                                border: '1.5px solid #e5e7eb',
                            }}>
                                <div id="qr-reader" ref={scannerRef} style={{ width: '100%' }} />
                                {!scannerStarted && (
                                    <div style={{
                                        height: '220px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        color: '#9ca3af',
                                    }}>
                                        <span style={{ fontSize: '48px' }}>📷</span>
                                        <span style={{ fontSize: '14px' }}>Camera not started</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={scannerStarted ? stopScanner : startScanner}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: scannerStarted ? '#ef4444' : '#111827',
                                    color: '#fff',
                                    fontWeight: '800',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                }}
                            >
                                {scannerStarted ? '🛑 Stop Camera' : '▶️ Start Camera'}
                            </button>
                        </>
                    )}

                    {/* Manual Entry Tab */}
                    {activeTab === 'manual' && !scannedMaterial && (
                        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                                    Material ID or Code
                                </label>
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Paste material ID or scan code…"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #e5e7eb',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                    }}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!manualCode.trim()}
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: manualCode.trim() ? '#111827' : '#e5e7eb',
                                    color: manualCode.trim() ? '#fff' : '#9ca3af',
                                    fontWeight: '800',
                                    cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                                }}
                            >
                                🔍 Find Material
                            </button>
                        </form>
                    )}

                    {/* Material found → stock update form */}
                    {scannedMaterial && (
                        <div>
                            {/* Material info */}
                            <div style={{
                                background: '#f0fdf4',
                                border: '1.5px solid #86efac',
                                borderRadius: '14px',
                                padding: '16px 20px',
                                marginBottom: '20px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                                            📦 {scannedMaterial.name}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                                            {scannedMaterial.category} · Current Stock:{' '}
                                            <strong style={{ color: '#111827' }}>{scannedMaterial.currentStock} {scannedMaterial.unit}</strong>
                                        </p>
                                    </div>
                                    <button
                                        onClick={resetScan}
                                        style={{
                                            background: 'none', border: '1px solid #d1d5db',
                                            borderRadius: '8px', padding: '4px 10px',
                                            cursor: 'pointer', fontSize: '12px', color: '#6b7280',
                                        }}
                                    >
                                        Rescan
                                    </button>
                                </div>
                            </div>

                            {/* Stock update controls */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                                        Operation
                                    </label>
                                    <select
                                        value={operation}
                                        onChange={(e) => setOperation(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontWeight: '600' }}
                                    >
                                        <option value="add">➕ Add Stock</option>
                                        <option value="subtract">➖ Remove Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            {/* Emergency warning if removing stock */}
                            {operation === 'subtract' && (
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    marginBottom: '16px',
                                    background: '#fef2f2',
                                    border: '1.5px solid #fca5a5',
                                    color: '#dc2626',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '16px', marginTop: '-2px' }}>⚠️</span>
                                    <span><strong>Emergency Only:</strong> Removing stock will notify the admin and requires a compulsory note and your password.</span>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                                    Notes {operation === 'subtract' ? '(Compulsory)' : '(optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={operation === 'subtract' ? 'Add reason for removal...' : 'Add notes...'}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }}
                                />
                            </div>

                            {operation === 'subtract' && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                                        Inventory Manager Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password..."
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleUpdateStock}
                                disabled={updating || (operation === 'subtract' && (!password || !notes.trim()))}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: updating ? '#d1d5db' : 'var(--accent-color, #10b981)',
                                    color: '#fff',
                                    fontWeight: '800',
                                    fontSize: '15px',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {updating ? '⏳ Updating…' : `✅ ${operation === 'add' ? 'Add' : 'Remove'} ${quantity} ${scannedMaterial.unit}`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
