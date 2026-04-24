import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const PaymentPage = ({ invoice, onClose, onSuccess }) => {
    const [paymentData, setPaymentData] = useState({
        amount: invoice.balanceDue || 0,
        method: 'cash',
        reference: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isPickup = invoice?.orderId?.deliveryMethod === 'pickup';

    const methodLabel = {
        cash: '💵 Cash',
        bank_transfer: '🏦 Bank Transfer',
        card: '💳 Card',
        online: '🌐 Online'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!paymentData.amount || paymentData.amount <= 0) {
            setError('Amount must be greater than zero.');
            return;
        }
        if (paymentData.amount > invoice.balanceDue) {
            setError(`Amount cannot exceed the balance due of LKR ${invoice.balanceDue.toLocaleString()}.`);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/invoices/${invoice._id}/payments`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const paidPercent = Math.min(
        100,
        Math.round(((invoice.amountPaid || 0) / (invoice.totalAmount || 1)) * 100)
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
            <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
                {/* Header */}
                <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Record Payment</div>
                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111827', margin: 0 }}>#{invoice.invoiceNumber}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                <div style={{ padding: '24px 28px' }}>
                    {/* Balance Card */}
                    <div style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', borderRadius: '16px', padding: '20px', marginBottom: '24px', color: '#fff' }}>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px', fontWeight: '700' }}>Balance Due</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px' }}>
                            LKR {(invoice.balanceDue || 0).toLocaleString()}
                        </div>
                        {/* Progress Bar */}
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.7, marginBottom: '6px' }}>
                                <span>Paid: LKR {(invoice.amountPaid || 0).toLocaleString()}</span>
                                <span>{paidPercent}% complete</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${paidPercent}%`, background: '#ff3333', height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' }} />
                            </div>
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>
                            Total Invoice: LKR {(invoice.totalAmount || 0).toLocaleString()}
                            {' • '}{isPickup ? '🏠 Pickup' : '🚚 Delivery'}
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Amount */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Payment Amount (LKR)
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={invoice.balanceDue}
                                step="0.01"
                                value={paymentData.amount}
                                onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '20px', fontWeight: '800', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Method */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Payment Method
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {Object.entries(methodLabel).map(([val, label]) => {
                                    const disabled = val === 'cash' && !isPickup;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => !disabled && setPaymentData({ ...paymentData, method: val })}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: paymentData.method === val ? '2px solid #111827' : '1.5px solid #e5e7eb',
                                                background: paymentData.method === val ? '#111827' : disabled ? '#f9fafb' : '#fff',
                                                color: paymentData.method === val ? '#fff' : disabled ? '#d1d5db' : '#374151',
                                                fontWeight: '700',
                                                fontSize: '12px',
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {!isPickup && (
                                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>* Cash only available for pickup orders.</div>
                            )}
                        </div>

                        {/* Reference */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Reference / Receipt # <span style={{ fontWeight: '400', color: '#9ca3af' }}>(required for card and online)</span>
                            </label>
                            <input
                                type="text"
                                value={paymentData.reference}
                                onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                placeholder="e.g. TXN-001234"
                                required={['card', 'online'].includes(paymentData.method)}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: loading ? '#6b7280' : '#111827', color: '#fff', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'background 0.2s' }}
                            >
                                {loading ? '⏳ Processing...' : '✓ CONFIRM PAYMENT'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
