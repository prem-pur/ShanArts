import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Wallet, CreditCard, Landmark, Smartphone, Globe, X } from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';

const InvoiceDetails = ({ invoice, onClose, onPaymentRecorded }) => {
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isFinance = ['admin', 'staff_finance', 'staff_system'].includes(user.role);

    useEffect(() => {
        if (invoice?._id) {
            fetchPayments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoice]);

    const fetchPayments = async () => {
        setLoadingPayments(true);
        try {
            const token = localStorage.getItem('token');
            if (!isFinance) { setLoadingPayments(false); return; }
            const res = await axios.get(`${API_BASE_URL}/api/invoices/${invoice._id}/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch payments:', err);
        } finally {
            setLoadingPayments(false);
        }
    };

    const statusColor = { paid: '#64748b', partial: '#111827', unpaid: '#ef4444' };
    const statusBg = { paid: '#f8fafc', partial: '#f1f5f9', unpaid: '#fef2f2' };

    const methodLabel = { 
        cash: <><DollarSign size={14} style={{ marginRight: '6px' }} /> Cash</>, 
        bank_transfer: <><Landmark size={14} style={{ marginRight: '6px' }} /> Bank Transfer</>, 
        card: <><CreditCard size={14} style={{ marginRight: '6px' }} /> Card</>, 
        online: <><Globe size={14} style={{ marginRight: '6px' }} /> Online</>, 
        pickme_pay: <><Smartphone size={14} style={{ marginRight: '6px' }} /> PickMe Pay</> 
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '700px',
                maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '1px', marginBottom: '6px' }}>Invoice Details</div>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0 }}>#{invoice.invoiceNumber}</h2>
                        <div style={{ marginTop: '8px' }}>
                            <span style={{
                                padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                textTransform: 'uppercase',
                                color: statusColor[invoice.paymentStatus], background: statusBg[invoice.paymentStatus]
                            }}>
                                {invoice.paymentStatus}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: '#f3f4f6', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                </div>

                <div style={{ padding: '24px 32px' }}>
                    {/* Customer & Order Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '14px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Customer</div>
                            <div style={{ fontWeight: '800', color: '#111827' }}>{invoice.customerId?.name || '—'}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{invoice.customerId?.email}</div>
                            {invoice.customerId?.phone && <div style={{ fontSize: '12px', color: '#6b7280' }}>{invoice.customerId?.phone}</div>}
                        </div>
                        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '14px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Order</div>
                            <div style={{ fontWeight: '800', color: '#111827' }}>{invoice.orderId?.orderNumber || '—'}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{invoice.orderId?.jobType}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{invoice.orderId?.deliveryMethod}</div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px' }}>Line Items</div>
                        <div style={{ border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Description</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Qty</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Unit Price</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {(invoice.lineItems || []).map((item, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '10px 14px', fontSize: '13px', color: '#374151' }}>{item.description}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', color: '#374151' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', color: '#374151' }}>LKR {(item.unitPrice || 0).toLocaleString()}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#111827' }}>LKR {(item.total || item.quantity * item.unitPrice || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
                        {[
                            { label: 'Subtotal', value: invoice.subtotal },
                            { label: 'Tax', value: invoice.tax },
                            { label: 'Discount', value: -invoice.discount },
                        ].map(({ label, value }) => value !== undefined && (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#6b7280' }}>
                                <span>{label}</span>
                                <span style={{ fontWeight: '700', color: value < 0 ? '#111827' : '#374151' }}>
                                    {value < 0 ? `- LKR ${Math.abs(value).toLocaleString()}` : `LKR ${(value || 0).toLocaleString()}`}
                                </span>
                            </div>
                        ))}
                        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '900', fontSize: '16px', color: '#111827' }}>Total</span>
                            <span style={{ fontWeight: '900', fontSize: '20px', color: '#111827' }}>LKR {(invoice.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
                            <span style={{ color: '#111827', fontWeight: '700' }}>Amount Paid</span>
                            <span style={{ color: '#111827', fontWeight: '800' }}>LKR {(invoice.amountPaid || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '15px' }}>
                            <span style={{ color: invoice.balanceDue > 0 ? '#ef4444' : '#64748b', fontWeight: '800' }}>
                                {invoice.balanceDue > 0 ? 'Balance Due' : '✓ Fully Paid'}
                            </span>
                            <span style={{ color: invoice.balanceDue > 0 ? '#ef4444' : '#64748b', fontWeight: '900' }}>
                                LKR {(invoice.balanceDue || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Payment History */}
                    {isFinance && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px' }}>Payment History</div>
                            {loadingPayments ? (
                                <div style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</div>
                            ) : payments.length === 0 ? (
                                <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px', background: '#f9fafb', borderRadius: '10px', textAlign: 'center' }}>No payments recorded yet.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {payments.map(p => (
                                        <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{methodLabel[p.method] || p.method}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {new Date(p.createdAt).toLocaleDateString('en-GB')} {p.reference && `• Ref: ${p.reference}`}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: '900', color: '#111827', fontSize: '15px' }}>
                                                LKR {(p.amount || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        {isFinance && invoice.paymentStatus !== 'paid' && (
                            <button
                                onClick={() => onPaymentRecorded(invoice)}
                                style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <DollarSign size={16} /> Record Payment
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
