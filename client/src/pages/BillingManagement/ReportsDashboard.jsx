import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import { DollarSign, CheckCircle, Clock, FileText, AlertTriangle, BarChart3 } from 'lucide-react';

const StatCard = ({ label, value, sub, color, icon }) => (
    <div style={{
        background: '#fff', borderRadius: '18px', padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0',
        display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            <div style={{ fontSize: '24px', color: color || '#64748b' }}>{icon}</div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: '900', color: color || '#111827' }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{sub}</div>}
    </div>
);

const ReportsDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            const res = await axios.get(`${API_BASE_URL}/api/billing/summary?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data.data);
        } catch (err) {
            setError('Failed to load reports. You may not have permission.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>
            <BarChart3 size={40} color="#64748b" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontWeight: '600' }}>Loading reports...</div>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444' }}>
            <AlertTriangle size={40} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontWeight: '600' }}>{error}</div>
        </div>
    );

    const { totalRevenue, totalCollected, totalOutstanding, invoiceCount, statusBreakdown, monthly, recentInvoices } = summary || {};
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    // Simple bar chart dimensions
    const maxMonthlyRevenue = Math.max(...(monthly || []).map(m => m.revenue), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Date Filter */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>From</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                           style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>To</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                           style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px' }} />
                </div>
                <button onClick={fetchSummary}
                        style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '12px', height: '38px' }}>
                    Apply Filter
                </button>
                {(from || to) && (
                    <button onClick={() => { setFrom(''); setTo(''); setTimeout(fetchSummary, 100); }}
                            style={{ padding: '9px 16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: '700', cursor: 'pointer', fontSize: '12px', height: '38px' }}>
                        Clear
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <StatCard label="Total Revenue" value={`LKR ${(totalRevenue || 0).toLocaleString()}`} icon="💰" color="#111827" sub={`${invoiceCount} invoice(s)`} />
                <StatCard label="Collected" value={`LKR ${(totalCollected || 0).toLocaleString()}`} icon="✅" color="#ff3333" sub={`${collectionRate}% collection rate`} />
                <StatCard label="Outstanding" value={`LKR ${(totalOutstanding || 0).toLocaleString()}`} icon="⏳" color="#ef4444" sub="Unpaid + Partial + Pending" />
                <StatCard label="Status Breakdown" icon="📋"
                          value={
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  {[{ label: 'Paid', val: statusBreakdown?.paid, color: '#64748b' },
                                      { label: 'Partial', val: statusBreakdown?.partial, color: '#111827' },
                                      { label: 'Pending', val: statusBreakdown?.pendingApproval, color: '#7c3aed' },
                                      { label: 'Unpaid', val: statusBreakdown?.unpaid, color: '#ef4444' }].map(s => (
                                      <div key={s.label} style={{ textAlign: 'center' }}>
                                          <div style={{ fontSize: '22px', fontWeight: '900', color: s.color }}>{s.val || 0}</div>
                                          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>{s.label}</div>
                                      </div>
                                  ))}
                              </div>
                          }
                />
            </div>

            {/* Monthly Revenue Chart */}
            {monthly && monthly.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#111827', marginBottom: '20px' }}>Monthly Revenue & Collections</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {monthly.map(m => (
                            <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '60px', flex: '0 0 auto' }}>
                                {/* Bars */}
                                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '130px' }}>
                                        <div title={`Revenue: LKR ${m.revenue.toLocaleString()}`}
                                             style={{ width: '20px', background: '#111827', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (m.revenue / maxMonthlyRevenue) * 120)}px`, transition: 'height 0.6s ease' }} />
                                        <div title={`Collected: LKR ${m.collected.toLocaleString()}`}
                                             style={{ width: '20px', background: '#e2e8f0', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (m.collected / maxMonthlyRevenue) * 120)}px`, transition: 'height 0.6s ease' }} />
                                    </div>
                                <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    {m.month.slice(5)}
                                    <br />
                                    <span style={{ fontSize: '9px', color: '#c4b5fd' }}>{m.month.slice(0, 4)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                        {[{ color: '#111827', label: 'Revenue' }, { color: '#e2e8f0', label: 'Collected' }].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>
                                <div style={{ width: '12px', height: '12px', background: l.color, borderRadius: '3px' }} />
                                {l.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Invoices */}
            {recentInvoices && recentInvoices.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#111827', marginBottom: '16px' }}>Recent Invoices</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                {['Invoice', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {recentInvoices.map(inv => {
                                const sColor = { paid: '#ff3333', partial: '#f59e0b', pending_approval: '#7c3aed', unpaid: '#ef4444' };
                                return (
                                    <tr key={inv._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                        <td style={{ padding: '12px', fontWeight: '800', color: '#111827', fontSize: '13px' }}>#{inv.invoiceNumber}</td>
                                        <td style={{ padding: '12px', fontSize: '13px', color: '#4b5563', fontWeight: '600' }}>{inv.customerId?.name || '—'}</td>
                                        <td style={{ padding: '12px', fontWeight: '800', color: '#111827', fontSize: '13px' }}>LKR {(inv.totalAmount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: sColor[inv.paymentStatus], background: `${sColor[inv.paymentStatus]}18` }}>
                                                    {String(inv.paymentStatus || '').replace(/_/g, ' ')}
                                                </span>
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '12px', color: '#9ca3af' }}>{new Date(inv.createdAt).toLocaleDateString('en-GB')}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {(!monthly || monthly.length === 0) && (!recentInvoices || recentInvoices.length === 0) && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', background: '#fff', borderRadius: '18px', border: '1px solid #f0f0f0' }}>
                    <BarChart3 size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: '600' }}>No data available for the selected period.</div>
                </div>
            )}
        </div>
    );
};

export default ReportsDashboard;
