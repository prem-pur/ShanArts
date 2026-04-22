import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const InvoiceList = ({ onSelectInvoice, refreshKey }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, refreshKey]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const url = user.role === 'customer'
                ? `${API_BASE_URL}/api/invoices/my`
                : `${API_BASE_URL}/api/invoices${filter !== 'all' ? `?status=${filter}` : ''}`;
            const res = await axios.get(url, { headers });
            setInvoices(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = { paid: '#10b981', partial: '#f59e0b', unpaid: '#ef4444' };
    const statusBg = { paid: '#d1fae5', partial: '#fef3c7', unpaid: '#fee2e2' };

    const filtered = invoices.filter(inv => {
        const term = search.toLowerCase();
        return (
            inv.invoiceNumber?.toLowerCase().includes(term) ||
            inv.customerId?.name?.toLowerCase().includes(term) ||
            inv.orderId?.orderNumber?.toLowerCase().includes(term)
        );
    });

    return (
        <div>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="🔍  Search invoice, customer, order..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '1.5px solid #e5e7eb',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                />
                {user.role !== 'customer' && (
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', gap: '2px' }}>
                        {['all', 'unpaid', 'partial', 'paid'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '7px 14px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    background: filter === f ? '#fff' : 'transparent',
                                    color: filter === f ? '#111827' : '#6b7280',
                                    boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                    Loading invoices...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
                    <div style={{ fontWeight: '600' }}>No invoices found.</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                            {['Invoice #', 'Customer', 'Order', 'Total', 'Paid', 'Balance', 'Status', 'Due Date', ''].map(h => (
                                <th key={h} style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map(inv => (
                            <tr
                                key={inv._id}
                                style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#111827', whiteSpace: 'nowrap' }}>
                                    #{inv.invoiceNumber}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '13px' }}>{inv.customerId?.name || '—'}</div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{inv.customerId?.email}</div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563' }}>{inv.orderId?.orderNumber || '—'}</div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{inv.orderId?.jobType}</div>
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#111827', whiteSpace: 'nowrap' }}>
                                    LKR {(inv.totalAmount || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10b981', whiteSpace: 'nowrap' }}>
                                    LKR {(inv.amountPaid || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: '700', color: inv.balanceDue > 0 ? '#dc2626' : '#10b981', whiteSpace: 'nowrap' }}>
                                    LKR {(inv.balanceDue || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            color: statusColor[inv.paymentStatus],
                                            background: statusBg[inv.paymentStatus],
                                            border: `1px solid ${statusColor[inv.paymentStatus]}30`
                                        }}>
                                            {inv.paymentStatus}
                                        </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '—'}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <button
                                        onClick={() => onSelectInvoice(inv)}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#111827',
                                            color: '#fff',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        VIEW →
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
