import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import { Search, Clock, FileText } from 'lucide-react';

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

    const statusColor = { paid: '#ff3333', partial: '#f59e0b', pending_approval: '#7c3aed', unpaid: '#ef4444' };
    const statusBg = { paid: '#d1fae5', partial: '#fef3c7', pending_approval: '#ede9fe', unpaid: '#fee2e2' };

    const filtered = invoices.filter(inv => {
        const term = search.toLowerCase();
        return (
            inv.invoiceNumber?.toLowerCase().includes(term) ||
            inv.customerId?.name?.toLowerCase().includes(term) ||
            inv.orderId?.orderNumber?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="shan-fade-in">
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search invoice, customer, order..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="shan-input"
                        style={{
                            width: '100%',
                            padding: '10px 16px 10px 42px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                        }}
                    />
                        </div>
                {user.role !== 'customer' && (
                    <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: '10px', padding: '4px', gap: '2px' }}>
                        {['all', 'unpaid', 'partial', 'pending_approval', 'paid'].map(f => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '7px 14px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    background: filter === f ? 'var(--card-bg)' : 'transparent',
                                    color: filter === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    boxShadow: filter === f ? 'var(--shadow-sm)' : 'none',
                                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
                                }}
                            >
                                {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><Clock size={32} color="#7A83A0" /></div>
                    Loading invoices...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><FileText size={40} color="#7A83A0" /></div>
                    <div style={{ fontWeight: '600' }}>No invoices found.</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            {['Invoice #', 'Customer', 'Order', 'Total', 'Paid', 'Balance', 'Status', 'Due Date', ''].map(h => (
                                <th key={h} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map(inv => (
                            <tr
                                key={inv._id}
                                style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-muted)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <td style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    #{inv.invoiceNumber}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>{inv.customerId?.name || '—'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{inv.customerId?.email}</div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{inv.orderId?.orderNumber || '—'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{inv.orderId?.jobType}</div>
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    LKR {(inv.totalAmount || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    LKR {(inv.amountPaid || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: '700', color: inv.balanceDue > 0 ? '#f87171' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
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
                                            {String(inv.paymentStatus || '').replace(/_/g, ' ')}
                                        </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '—'}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <button
                                        onClick={() => onSelectInvoice(inv)}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'var(--accent-color)',
                                            color: '#fff',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 12px var(--accent-glow)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
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
