import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const BarcodeScanner = ({ onScanComplete, onMaterialFound }) => {
    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(0);
    const [scanResult, setScanResult] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [operation, setOperation] = useState('add');
    const [notes, setNotes] = useState('');
    const inputRef = useRef(null);

    // Detect barcode scanner input (usually fast typing)
    useEffect(() => {
        let typingTimer;
        let inputString = '';

        const handleKeyDown = (e) => {
            if (!isScanning) return;

            clearTimeout(typingTimer);
            
            if (e.key === 'Enter') {
                // Complete scan
                if (inputString.length > 0) {
                    processBarcode(inputString);
                    inputString = '';
                }
            } else if (e.key.length === 1) {
                // Building the barcode string
                inputString += e.key;
            }

            // Reset timer to detect end of rapid typing
            typingTimer = setTimeout(() => {
                if (inputString.length > 3) { // Minimum barcode length
                    processBarcode(inputString);
                    inputString = '';
                }
            }, 100);
        };

        if (isScanning) {
            window.addEventListener('keydown', handleKeyDown);
            inputRef.current?.focus();
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(typingTimer);
        };
    }, [isScanning]);

    const processBarcode = async (code) => {
        try {
            setBarcode(code);
            setLastScanTime(Date.now());

            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/inventory/barcode/${code}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const material = response.data.data;
            setScanResult(material);
            onMaterialFound?.(material);

            // Auto-update stock if quantity is set
            if (quantity > 0) {
                await updateStock(code);
            }

        } catch (error) {
            setScanResult({ error: 'Material not found' });
            setTimeout(() => setScanResult(null), 3000);
        }
    };

    const updateStock = async (code) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_BASE_URL}/api/inventory/barcode/${code}`, {
                quantity,
                operation,
                notes: notes || `Stock ${operation} via barcode scan`
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setScanResult({
                ...response.data.data.material,
                success: true,
                message: response.data.message,
                previousStock: response.data.data.previousStock,
                newStock: response.data.data.newStock
            });

            onScanComplete?.(response.data.data);

            // Reset form
            setBarcode('');
            setNotes('');
            setTimeout(() => setScanResult(null), 3000);

        } catch (error) {
            setScanResult({ 
                error: error.response?.data?.error || 'Failed to update stock',
                material: scanResult 
            });
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (barcode.trim()) {
            await processBarcode(barcode.trim());
        }
    };

    const startScanning = () => {
        setIsScanning(true);
        setScanResult(null);
        setBarcode('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const stopScanning = () => {
        setIsScanning(false);
        setBarcode('');
    };

    return (
        <div style={{
            padding: '20px',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#f9fafb',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <h3 style={{ 
                margin: '0 0 20px 0', 
                color: '#374151',
                fontSize: '18px',
                fontWeight: '600'
            }}>
                📱 USB Barcode Scanner
            </h3>

            {/* Scanner Status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
            }}>
                <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: isScanning ? '#10b981' : '#6b7280'
                }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {isScanning ? '🟢 Scanner Active - Scan barcode now' : '⚫ Scanner Inactive'}
                </span>
            </div>

            {/* Scanner Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={isScanning ? stopScanning : startScanning}
                    style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: isScanning ? '#ef4444' : '#10b981',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    {isScanning ? '🛑 Stop Scanning' : '▶️ Start Scanning'}
                </button>
            </div>

            {/* Hidden input for barcode scanner */}
            {isScanning && (
                <input
                    ref={inputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="📷 Scan barcode here..."
                    style={{
                        width: '100%',
                        padding: '15px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        fontSize: '16px',
                        textAlign: 'center',
                        backgroundColor: '#eff6ff',
                        marginBottom: '20px'
                    }}
                    autoFocus
                />
            )}

            {/* Manual Entry */}
            {!isScanning && (
                <form onSubmit={handleManualSubmit} style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="🔤 Enter barcode manually..."
                        style={{
                            width: '100%',
                            padding: '15px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            marginBottom: '10px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!barcode.trim()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: barcode.trim() ? '#3b82f6' : '#9ca3af',
                            color: 'white',
                            fontWeight: '600',
                            cursor: barcode.trim() ? 'pointer' : 'not-allowed'
                        }}
                    >
                        🔍 Find Material
                    </button>
                </form>
            )}

            {/* Stock Update Options */}
            {scanResult && !scanResult.error && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>
                        📦 {scanResult.name}
                    </h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6b7280' }}>
                        Current Stock: {scanResult.currentStock} {scanResult.unit}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#6b7280' }}>
                                Operation
                            </label>
                            <select
                                value={operation}
                                onChange={(e) => setOperation(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="add">➕ Add Stock</option>
                                <option value="subtract">➖ Remove Stock</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#6b7280' }}>
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#6b7280' }}>
                            Notes (optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <button
                        onClick={() => updateStock(scanResult.barcode || scanResult.qrCode)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        ✅ Update Stock
                    </button>
                </div>
            )}

            {/* Scan Result */}
            {scanResult && (
                <div style={{
                    padding: '15px',
                    backgroundColor: scanResult.error ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${scanResult.error ? '#fca5a5' : '#86efac'}`,
                    borderRadius: '8px'
                }}>
                    {scanResult.error ? (
                        <div style={{ color: '#dc2626' }}>
                            <strong>❌ Error:</strong> {scanResult.error}
                        </div>
                    ) : scanResult.success ? (
                        <div style={{ color: '#166534' }}>
                            <strong>✅ Success:</strong> {scanResult.message}
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>
                                Stock changed from {scanResult.previousStock} to {scanResult.newStock} {scanResult.unit}
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#166534' }}>
                            <strong>📦 Found:</strong> {scanResult.name}
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>
                                Current Stock: {scanResult.currentStock} {scanResult.unit}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#6b7280'
            }}>
                <strong>📋 Instructions:</strong>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                    <li>Click "Start Scanning" to activate the barcode scanner</li>
                    <li>Scan a barcode with your USB scanner</li>
                    <li>The system will automatically find the material</li>
                    <li>Set quantity and operation (add/remove)</li>
                    <li>Click "Update Stock" to complete</li>
                </ul>
            </div>
        </div>
    );
};

export default BarcodeScanner;
