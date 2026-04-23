import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
    Receipt, 
    Plus, 
    CreditCard, 
    BarChart3, 
    Clock, 
    AlertCircle, 
    RefreshCcw,
    FileText,
    Wallet,
    CheckCircle2
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';
import InvoiceList from './InvoiceList';
import InvoiceDetails from './InvoiceDetails';
import CreateInvoice from './CreateInvoice';
import PaymentPage from './PaymentPage';
import ReportsDashboard from './ReportsDashboard';

// ─── Tab definitions ────────────────────────────────────────────────────────
const TABS_FINANCE = [
    { id: 'invoices', label: 'All Invoices', icon: Receipt },
    { id: 'pending', label: 'Pending Billing', icon: Clock },
    { id: 'outstanding', label: 'Outstanding', icon: AlertCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
];
const TABS_CUSTOMER = [
    { id: 'invoices', label: 'My Invoices', icon: Receipt },
];

// ─── Outstanding Summary Strip ───────────────────────────────────────────────
const OutstandingStrip = ({ data }) => {
    if (!data) return null;
    return (
        <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '16px', 
            padding: '24px', 
            marginBottom: '32px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)'
        }}>
            <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Outstanding Balance</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>LKR {(data.totalOutstanding || 0).toLocaleString()}</div>
            </div>
            <div style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', backdropFilter: 'blur(4px)' }}>
                {data.count} Pending / Partial Invoices
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
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentInvoice, setPaymentInvoice] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    // Data
    const [pendingOrders, setPendingOrders] = useState([]);
    const [outstandingData, setOutstandingData] = useState(null);
    const [outstandingList, setOutstandingList] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [loadingOutstanding, setLoadingOutstanding] = useState(false);

    const token = localStorage.getItem('token');
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const fetchPending = useCallback(async () => {
        setLoadingPending(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/invoices/pending-billing`, { headers });
            setPendingOrders(res.data.data || []);
        } catch { /* silently fail */ }
        finally { setLoadingPending(false); }
    }, [headers]);

    const fetchOutstanding = useCallback(async () => {
        setLoadingOutstanding(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/invoices/outstanding`, { headers });
            setOutstandingData({ totalOutstanding: res.data.totalOutstanding, count: res.data.count });
            setOutstandingList(res.data.data || []);
        } catch { /* silently fail */ }
        finally { setLoadingOutstanding(false); }
    }, [headers]);

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

    const statusColor = { paid: '#64748b', partial: '#111827', unpaid: '#ef4444' };
    const statusBg = { paid: '#f8fafc', partial: '#f1f5f9', unpaid: '#fef2f2' };

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            {/* Page Header */}
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Wallet size={28} color="#ef4444" /> Billing Management
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
                      {isFinance
                        ? 'Production financial control and revenue tracking center'
                        : 'Review and settle your account balances'}
                  </p>
                </div>
                {isFinance && (
                    <button
                        onClick={() => { fetchPending(); setShowCreate(true); }}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Plus size={20} /> Generate Invoice
                    </button>
                )}
            </div>

            {/* Outstanding Summary (Finance Only) */}
            {isFinance && outstandingData?.totalOutstanding > 0 && (
                <OutstandingStrip data={outstandingData} />
            )}

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#e2e8f080', padding: '6px', borderRadius: '16px', marginBottom: '32px', width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 24px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: activeTab === tab.id ? '#fff' : 'transparent',
                            color: activeTab === tab.id ? '#0f172a' : '#64748b',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <tab.icon size={16} color={activeTab === tab.id ? '#ef4444' : '#64748b'} />
                        {tab.label}
                        {tab.id === 'pending' && pendingOrders.length > 0 && (
                            <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' }}>
                                {pendingOrders.length}
                            </span>
                        )}
                        {tab.id === 'outstanding' && outstandingData?.count > 0 && (
                            <span style={{ background: '#111827', color: '#fff', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' }}>
                                {outstandingData.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Viewport Content */}
            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', padding: '32px', animation: 'fadeIn 0.3s ease-out' }}>

                {activeTab === 'invoices' && (
                    <InvoiceList onSelectInvoice={setSelectedInvoice} refreshKey={refreshKey} />
                )}

                {activeTab === 'pending' && isFinance && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Orders Awaiting Billing</h3>
                            <button
                                onClick={fetchPending}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <RefreshCcw size={14} /> Refresh
                            </button>
                        </div>

                        {loadingPending ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: '600' }}>Analyzing pending production jobs...</div>
                        ) : pendingOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 40px', color: '#64748b' }}>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={48} color="#64748b" /></div>
                                <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>All Clear!</div>
                                <div style={{ fontWeight: '500', marginTop: '4px' }}>Every completed production job has been successfully invoiced.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {['Order #', 'Customer', 'Type', 'Delivery', 'Total', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pendingOrders.map(order => (
                                        <tr key={order._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fcfdfe'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '16px', fontWeight: '900', color: '#0f172a' }}>#{order.orderNumber}</td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '700', color: '#334155', fontSize: '14px' }}>{order.customerId?.name || 'Guest'}</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{order.customerId?.email}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{order.jobType}</span>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: order.deliveryMethod === 'pickup' ? '#111827' : '#ef4444', textTransform: 'uppercase' }}>{order.deliveryMethod}</span>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: '900', color: '#0f172a' }}>LKR {(order.totalPrice || 0).toLocaleString()}</td>
                                            <td style={{ padding: '16px' }}>
                                                <button
                                                    onClick={() => { setPendingOrders(prev => prev); setShowCreate(true); }}
                                                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <FileText size={14} /> Create Invoice
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

                {activeTab === 'outstanding' && isFinance && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Overdue & Outstanding Records</h3>
                            <button
                                onClick={fetchOutstanding}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <RefreshCcw size={14} /> Refresh
                            </button>
                        </div>

                        {loadingOutstanding ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: '600' }}>Retrieving outstanding account data...</div>
                        ) : outstandingList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 40px', color: '#64748b' }}>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={48} color="#64748b" /></div>
                                <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>Perfect Reconciliation</div>
                                <div style={{ fontWeight: '500', marginTop: '4px' }}>No outstanding accounts found. All payments are fully settled.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {['Invoice', 'Customer', 'Total', 'Balance Due', 'Status', 'Due Date', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {outstandingList.map(inv => {
                                        const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                                        return (
                                            <tr key={inv._id} style={{ borderBottom: '1px solid #f8fafc', background: isOverdue ? '#fff1f280' : 'transparent', transition: 'background 0.2s' }} onMouseOver={e => !isOverdue && (e.currentTarget.style.background = '#fcfdfe')} onMouseOut={e => !isOverdue && (e.currentTarget.style.background = 'transparent')}>
                                                <td style={{ padding: '16px', fontWeight: '900', color: '#0f172a' }}>
                                                    #{inv.invoiceNumber}
                                                    {isOverdue && <span style={{ marginLeft: '8px', fontSize: '9px', color: '#ef4444', fontWeight: '900', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>OVERDUE</span>}
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: '700', color: '#334155', fontSize: '14px' }}>{inv.customerId?.name || 'Guest'}</td>
                                                <td style={{ padding: '16px', fontWeight: '700', color: '#64748b' }}>LKR {(inv.totalAmount || 0).toLocaleString()}</td>
                                                <td style={{ padding: '16px', fontWeight: '900', color: '#ef4444' }}>LKR {(inv.balanceDue || 0).toLocaleString()}</td>
                                                <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                                                            color: statusColor[inv.paymentStatus], background: statusBg[inv.paymentStatus]
                                                        }}>
                                                            {inv.paymentStatus}
                                                        </span>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '12px', color: isOverdue ? '#ef4444' : '#64748b', fontWeight: isOverdue ? '800' : '500' }}>
                                                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => setPaymentInvoice(inv)}
                                                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <CreditCard size={14} /> Pay
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

                {activeTab === 'reports' && isFinance && (
                    <ReportsDashboard key={refreshKey} />
                )}
            </div>

            {/* Modals */}
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
