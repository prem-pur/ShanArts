import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const CreateInvoice = ({ orders, onClose, onCreated }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!selectedOrder) { setError('Please select an order.'); return; }
        setError('');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/invoices`,
                { orderId: selectedOrder._id, tax: Number(tax), discount: Number(discount), dueDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onCreated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create invoice.');
        } finally {
            setLoading(false);
        }
    };

    const subtotal = selectedOrder?.totalPrice || 0;
    const total = subtotal + Number(tax) - Number(discount);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
            <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Billing Management</div>
                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111827', margin: 0 }}>Generate New Invoice</h2>
                    </div>
                    <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Order Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase' }}>
                            Select Order to Invoice
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                            {orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px', fontSize: '13px' }}>
                                    ✅ All completed orders have been invoiced.
                                </div>
                            ) : orders.map(order => (
                                <div
                                    key={order._id}
                                    onClick={() => setSelectedOrder(order)}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: selectedOrder?._id === order._id ? '2px solid #111827' : '1.5px solid #e5e7eb',
                                        background: selectedOrder?._id === order._id ? '#f9fafb' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#111827', fontSize: '14px' }}>
                                            {order.orderNumber}
                                            {selectedOrder?._id === order._id && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>✓ Selected</span>}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                            {order.customerId?.name} • {order.jobType?.toUpperCase()} • {order.deliveryMethod?.toUpperCase()}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '900', color: '#111827', fontSize: '15px' }}>
                                        LKR {(order.totalPrice || 0).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Adjustments */}
                    {selectedOrder && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Tax (LKR)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={tax}
                                        onChange={e => setTax(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Discount (LKR)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Summary Preview */}
                            <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px' }}>Invoice Preview</div>
                                {[
                                    { label: 'Subtotal', val: subtotal },
                                    { label: 'Tax', val: Number(tax) },
                                    { label: 'Discount', val: -Number(discount) },
                                ].map(({ label, val }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                                        <span>{label}</span>
                                        <span style={{ fontWeight: '700', color: val < 0 ? '#10b981' : '#374151' }}>
                                            {val < 0 ? `- LKR ${Math.abs(val).toLocaleString()}` : `LKR ${val.toLocaleString()}`}
                                        </span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1.5px solid #e5e7eb', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '900', fontSize: '15px' }}>TOTAL</span>
                                    <span style={{ fontWeight: '900', fontSize: '20px', color: '#111827' }}>LKR {total.toLocaleString()}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                        <button
                            onClick={handleCreate}
                            disabled={!selectedOrder || loading}
                            style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: !selectedOrder || loading ? '#9ca3af' : '#111827', color: '#fff', fontWeight: '900', cursor: !selectedOrder || loading ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                        >
                            {loading ? '⏳ Generating...' : '🧾 GENERATE INVOICE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;
