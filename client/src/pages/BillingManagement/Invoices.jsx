import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import InvoiceList from './InvoiceList';
import InvoiceDetails from './InvoiceDetails';
import CreateInvoice from './CreateInvoice';
import PaymentPage from './PaymentPage';
import ReportsDashboard from './ReportsDashboard';

// ─── Tab definitions ────────────────────────────────────────────────────────
const TABS_FINANCE = [
    { id: 'invoices', label: 'All Invoices', icon: '🧾' },
    { id: 'pending', label: 'Pending Billing', icon: '🕐' },
    { id: 'outstanding', label: 'Outstanding', icon: '⚠️' },
    { id: 'reports', label: 'Reports', icon: '📊' },
];
const TABS_CUSTOMER = [
    { id: 'invoices', label: 'My Invoices', icon: '🧾' },
];

// ─── Outstanding Summary Strip ───────────────────────────────────────────────
const OutstandingStrip = ({ data }) => {
    if (!data) return null;
    return (
        <div style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: '14px', padding: '16px 24px', marginBottom: '28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
        }}>
            <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Outstanding Balance</div>
                <div style={{ fontSize: '26px', fontWeight: '900' }}>LKR {(data.totalOutstanding || 0).toLocaleString()}</div>
            </div>
            <div style={{ color: '#fff', opacity: 0.9, fontSize: '14px', fontWeight: '700' }}>
                {data.count} invoice{data.count !== 1 ? 's' : ''} unpaid / partial
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const BillingManagement = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isFinance = ['admin', 'staff_finance', 'staff_system'].includes(user.role);

    const tabs = isFinance ? TABS_FINANCE : TABS_CUSTOMER;
    const [activeTab, setActiveTab] = useState('invoices');
    const [refreshKey, setRefreshKey] = useState(0);

    // Modals
    const [selectedInvoice, setSelectedInvoice] = useState(null);   // InvoiceDetails
    const [paymentInvoice, setPaymentInvoice] = useState(null);     // PaymentPage
    const [showCreate, setShowCreate] = useState(false);            // CreateInvoice

    // Data
    const [pendingOrders, setPendingOrders] = useState([]);
    const [outstandingData, setOutstandingData] = useState(null);
    const [outstandingList, setOutstandingList] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [loadingOutstanding, setLoadingOutstanding] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch pending orders when tab is active or after invoice created
    const fetchPending = useCallback(async () => {
        setLoadingPending(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/invoices/pending-billing`, { headers });
            setPendingOrders(res.data.data || []);
        } catch { /* silently fail */ }
        finally { setLoadingPending(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch outstanding invoices
    const fetchOutstanding = useCallback(async () => {
        setLoadingOutstanding(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/invoices/outstanding`, { headers });
            setOutstandingData({ totalOutstanding: res.data.totalOutstanding, count: res.data.count });
            setOutstandingList(res.data.data || []);
        } catch { /* silently fail */ }
        finally { setLoadingOutstanding(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isFinance) {
            fetchPending();
            fetchOutstanding();
        }
    }, [fetchPending, fetchOutstanding, isFinance, refreshKey]);

    const refresh = () => setRefreshKey(k => k + 1);

    const handlePaymentSuccess = () => {
        setPaymentInvoice(null);
        setSelectedInvoice(null);
        refresh();
    };

    const handleInvoiceCreated = () => {
        setShowCreate(false);
        setActiveTab('invoices');
        refresh();
    };

    const handlePaymentFromDetails = (invoice) => {
        setSelectedInvoice(null);
        setPaymentInvoice(invoice);
    };

    // ─── Status colors ────────────────────────────────────────────────────────
    const statusColor = { paid: '#10b981', partial: '#f59e0b', unpaid: '#ef4444' };
    const statusBg = { paid: '#d1fae5', partial: '#fef3c7', unpaid: '#fee2e2' };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* ── Page Header ── */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#111827', letterSpacing: '-1px', margin: 0 }}>
                        💳 Billing Management
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
                        {isFinance
                            ? 'Manage invoices, record payments, and track financial performance.'
                            : 'View your invoices and settle outstanding balances.'}
                    </p>
                </div>
                {isFinance && (
                    <button
                        onClick={() => { fetchPending(); setShowCreate(true); }}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        ＋ Generate Invoice
                    </button>
                )}
            </div>

            {/* ── Outstanding Strip (Finance) ── */}
            {isFinance && outstandingData?.totalOutstanding > 0 && (
                <OutstandingStrip data={outstandingData} />
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '14px', marginBottom: '28px', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flexShrink: 0,
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '11px',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            background: activeTab === tab.id ? '#fff' : 'transparent',
                            color: activeTab === tab.id ? '#111827' : '#6b7280',
                            boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tab.id === 'pending' && pendingOrders.length > 0 && (
                            <span style={{ background: '#dc2626', color: '#fff', padding: '1px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '900' }}>
                                {pendingOrders.length}
                            </span>
                        )}
                        {tab.id === 'outstanding' && outstandingData?.count > 0 && (
                            <span style={{ background: '#f59e0b', color: '#fff', padding: '1px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '900' }}>
                                {outstandingData.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', padding: '28px' }}>

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                    <InvoiceList onSelectInvoice={setSelectedInvoice} refreshKey={refreshKey} />
                )}

                {/* Pending Billing Tab */}
                {activeTab === 'pending' && isFinance && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#111827' }}>
                                Orders Awaiting Invoice
                            </div>
                            <button
                                onClick={fetchPending}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                            >
                                ↻ Refresh
                            </button>
                        </div>

                        {loadingPending ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading...</div>
                        ) : pendingOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                                <div style={{ fontWeight: '600' }}>All completed orders have been invoiced.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                        {['Order #', 'Customer', 'Job Type', 'Delivery', 'Total', 'Status', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pendingOrders.map(order => (
                                        <tr key={order._id} style={{ borderBottom: '1px solid #f9fafb' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 16px', fontWeight: '800', color: '#111827' }}>{order.orderNumber}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '13px' }}>{order.customerId?.name || '—'}</div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.customerId?.email}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase' }}>{order.jobType}</td>
                                            <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: order.deliveryMethod === 'pickup' ? '#2563eb' : '#9333ea', textTransform: 'uppercase' }}>{order.deliveryMethod}</td>
                                            <td style={{ padding: '14px 16px', fontWeight: '900', color: '#111827' }}>LKR {(order.totalPrice || 0).toLocaleString()}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', background: '#dbeafe', color: '#1d4ed8' }}>
                                                        {order.status?.toUpperCase()}
                                                    </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <button
                                                    onClick={() => { setPendingOrders(prev => prev); setShowCreate(true); }}
                                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                                                >
                                                    🧾 CREATE
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Outstanding Tab */}
                {activeTab === 'outstanding' && isFinance && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#111827' }}>
                                Outstanding Invoices
                            </div>
                            <button
                                onClick={fetchOutstanding}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                            >
                                ↻ Refresh
                            </button>
                        </div>

                        {loadingOutstanding ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading...</div>
                        ) : outstandingList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
                                <div style={{ fontWeight: '600' }}>No outstanding invoices. All balances are settled!</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                        {['Invoice #', 'Customer', 'Order', 'Total', 'Balance Due', 'Status', 'Due Date', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {outstandingList.map(inv => {
                                        const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                                        return (
                                            <tr key={inv._id} style={{ borderBottom: '1px solid #f9fafb', background: isOverdue ? '#fff7f7' : 'transparent' }}
                                                onMouseEnter={e => e.currentTarget.style.background = isOverdue ? '#fee2e2' : '#fafafa'}
                                                onMouseLeave={e => e.currentTarget.style.background = isOverdue ? '#fff7f7' : 'transparent'}
                                            >
                                                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#111827' }}>
                                                    #{inv.invoiceNumber}
                                                    {isOverdue && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#dc2626', fontWeight: '900' }}>OVERDUE</span>}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontWeight: '700', color: '#1f2937', fontSize: '13px' }}>{inv.customerId?.name || '—'}</td>
                                                <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6b7280' }}>{inv.orderId?.orderNumber || '—'}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#111827' }}>LKR {(inv.totalAmount || 0).toLocaleString()}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: '900', color: '#dc2626' }}>LKR {(inv.balanceDue || 0).toLocaleString()}</td>
                                                <td style={{ padding: '14px 16px' }}>
                                                        <span style={{
                                                            padding: '4px 10px', borderRadius: '16px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                                            color: statusColor[inv.paymentStatus], background: statusBg[inv.paymentStatus]
                                                        }}>
                                                            {inv.paymentStatus}
                                                        </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '12px', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? '800' : '400' }}>
                                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '—'}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                                        >
                                                            VIEW
                                                        </button>
                                                        <button
                                                            onClick={() => setPaymentInvoice(inv)}
                                                            style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                                                        >
                                                            💰 PAY
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && isFinance && (
                    <ReportsDashboard key={refreshKey} />
                )}
            </div>

            {/* ── Modals ── */}
            {selectedInvoice && (
                <InvoiceDetails
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onPaymentRecorded={handlePaymentFromDetails}
                />
            )}

            {paymentInvoice && (
                <PaymentPage
                    invoice={paymentInvoice}
                    onClose={() => setPaymentInvoice(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {showCreate && (
                <CreateInvoice
                    orders={pendingOrders}
                    onClose={() => setShowCreate(false)}
                    onCreated={handleInvoiceCreated}
                />
            )}
        </div>
    );
};

export default BillingManagement;
