import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import AddOrder from '../OrderManagement/AddOrder';

const CustomerHome = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [orders, setOrders] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedProductionOrder, setSelectedProductionOrder] = useState(null);
    const [actionFeedback, setActionFeedback] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [recentFeedback, setRecentFeedback] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'card',
        reference: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [ordersRes, invoicesRes, feedbackRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/shop-orders/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/invoices/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/feedback/my`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setOrders(ordersRes.data);
            setInvoices(invoicesRes.data.data);
            setRecentFeedback(feedbackRes.data.data);

            // Fetch notifications
            const notifyRes = await axios.get(`${API_BASE_URL}/api/notifications/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(notifyRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (action) => {
        if (action === 'reject' && !actionFeedback.trim()) {
            alert("Please provide feedback for requested changes.");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch corresponding ProductionOrder to get design data
            const productionOrderRes = await axios.get(`${API_BASE_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const productionOrder = productionOrderRes.data.find(po => po.shopOrderId === selectedOrder._id);

            const response = await axios.post(`${API_BASE_URL}/api/shop-orders/${selectedOrder._id}/feedback`, {
                action,
                feedback: actionFeedback
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.message) {
                alert(`Design ${action}d successfully!`);
                // Update local orders data
                await fetchData();
                setShowApprovalModal(false);
                setSelectedOrder(null);
                setSelectedProductionOrder(null);
                setActionFeedback('');
            }
        } catch (err) {
            console.error('Approval action failed:', err);
            alert("Failed to process approval. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/feedback`, {
                orderId: selectedOrder._id,
                rating,
                comment
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Thank you for your feedback!');
            setShowFeedbackModal(false);
            setComment('');
            setRating(5);
            fetchData(); // Refresh both orders and feedback
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit feedback');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/invoices/${selectedInvoice._id}/payments`, paymentData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Payment recorded successfully!');
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            setPaymentData({ amount: 0, method: 'card', reference: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record payment');
        }
    };

    const isPickup = (invoice) => {
        return invoice?.orderId?.deliveryMethod === 'pickup';
    };

    const stats = {
        total: orders.length,
        active: orders.filter(o => ['pending', 'confirmed', 'in_progress', 'printing', 'pending_design', 'waiting_approval', 'revision_requested', 'scheduled'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'completed').length,
        pendingApprovals: orders.filter(o => o.status === 'waiting_approval').length,
        unreadNotifications: notifications.filter(n => !n.isRead).length
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'new_order', label: 'Place New Order', icon: '➕' },
        { id: 'my_orders', label: 'My Orders', icon: '📦' },
        { id: 'invoices', label: 'Invoices', icon: '🧾' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                            <SummaryCard title="Total Projects" value={stats.total} icon="💼" color="var(--accent-color)" />
                            <SummaryCard title="Active Projects" value={stats.active} icon="◉" color="var(--accent-color)" />
                            <SummaryCard title="Completed" value={stats.completed} icon="✓" color="var(--accent-color)" />
                            <SummaryCard
                                title="Notifications"
                                value={stats.unreadNotifications > 0 ? `${stats.unreadNotifications} New` : '0 New'}
                                icon="🔔"
                                color={stats.unreadNotifications > 0 ? "var(--accent-color)" : "#666666"}
                                onClick={() => setShowNotificationsModal(true)}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>

                        {stats.pendingApprovals > 0 && (
                            <div style={{ background: '#fff5f5', border: '1.5px solid var(--accent-color)', padding: '24px', borderRadius: '16px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--accent-color)', fontWeight: '900', fontSize: '18px' }}>Action Required: Design Approval</h4>
                                    <p style={{ margin: '4px 0 0 0', color: '#666666', fontSize: '14px', fontWeight: '600' }}>Please review your designs to proceed with printing.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const pending = orders.find(o => o.status === 'waiting_approval');
                                        setSelectedOrder(pending);
                                        // Fetch corresponding ProductionOrder to get design data
                                        const fetchProductionOrder = async () => {
                                            try {
                                                const token = localStorage.getItem('token');
                                                const productionOrderRes = await axios.get(`${API_BASE_URL}/api/orders`, {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                const productionOrder = productionOrderRes.data.find(po => po.shopOrderId === pending._id);
                                                setSelectedProductionOrder(productionOrder);
                                                setShowApprovalModal(true);
                                            } catch (err) {
                                                console.error('Failed to fetch production order:', err);
                                                setSelectedProductionOrder(null);
                                                setShowApprovalModal(true);
                                            }
                                        };
                                        fetchProductionOrder();
                                    }}
                                    style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                                >
                                    REVIEW DESIGN
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Recent Projects</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {orders.slice(0, 5).map(order => (
                                        <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
                                            <div>
                                                <div style={{ fontWeight: '700' }}>{order.jobType.toUpperCase()}</div>
                                                <div style={{ fontSize: '12px', color: '#666666' }}>{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}</div>
                                                {order.deadline && <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '700' }}>📅 Needed: {new Date(order.deadline).toLocaleDateString()}</div>}
                                            </div>
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '800', background: '#f5f5f5', color: '#666666' }}>{order.status.replace(/_/g, ' ')}</span>
                                        </div>
                                    ))}
                                    {orders.length === 0 && <p style={{ color: '#666666' }}>No orders yet.</p>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Feedback Needed</h3>
                                    {orders.filter(o => o.status === 'completed' && !recentFeedback.some(f => f.orderId?._id === o._id)).length === 0 ? (
                                        <p style={{ color: '#666666', fontSize: '14px' }}>Your completed orders will appear here for feedback.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {orders.filter(o => o.status === 'completed' && !recentFeedback.some(f => f.orderId?._id === o._id)).slice(0, 3).map(order => (
                                                <div key={order._id} style={{ background: '#f5f5f5', padding: '16px', borderRadius: '12px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{order.orderNumber}</div>
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setShowFeedbackModal(true); }}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', background: '#fff', fontWeight: '700', cursor: 'pointer' }}
                                                    >
                                                        LEAVE FEEDBACK
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {recentFeedback.length > 0 && (
                                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Your Recent Feedback</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {recentFeedback.slice(0, 3).map(f => (
                                                <div key={f._id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#666' }}>{f.orderId?.orderNumber}</span>
                                                        <span style={{ color: '#fbbf24', fontSize: '14px' }}>{'★'.repeat(f.rating)}</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>"{f.comment || 'No comment'}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'new_order':
                return <AddOrder onOrderCreated={() => { fetchData(); setActiveTab('dashboard'); }} onCancel={() => setActiveTab('dashboard')} />;
            case 'my_orders':
                return (
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '24px' }}>Project History</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f9fafb' }}>
                                    <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Order Details</th>
                                    <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Type</th>
                                    <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Needed By</th>
                                    <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                        <td style={{ padding: '16px', fontWeight: '700' }}>{order.orderNumber}</td>
                                        <td style={{ padding: '16px' }}>{order.jobType.toUpperCase()}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '800', background: order.status === 'completed' ? '#ecfdf5' : '#f3f4f6', color: order.status === 'completed' ? '#059669' : '#4b5563' }}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#d32f2f', fontWeight: '700' }}>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}</td>
                                        <td style={{ padding: '16px', color: '#6b7280' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'invoices':
                return (
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '24px' }}>Invoices & Payments</h3>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {invoices.map(invoice => (
                                <div key={invoice._id} style={{ border: '1px solid #f0f0f0', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: '900' }}>#{invoice.invoiceNumber}</div>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Order: {invoice.orderId?.orderNumber} • Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-color)' }}>LKR {invoice.totalAmount?.toLocaleString()}</div>
                                        <div style={{ fontSize: '12px', color: invoice.paymentStatus === 'paid' ? '#10b981' : '#f59e0b', fontWeight: '700', marginTop: '4px', marginBottom: '12px' }}>{invoice.paymentStatus?.toUpperCase()}</div>
                                        {invoice.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice);
                                                    setPaymentData({ ...paymentData, amount: invoice.balanceDue || invoice.totalAmount });
                                                    setShowPaymentModal(true);
                                                }}
                                                style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                PAY NOW
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {invoices.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No invoices found.</p>}
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', maxWidth: '800px', margin: '0 auto' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px', color: 'var(--text-primary)' }}>Profile Settings</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>Personal Information</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Name</label>
                                            <input
                                                type="text"
                                                value={user.name || ''}
                                                disabled
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    fontSize: '16px',
                                                    background: '#f9fafb',
                                                    color: '#6b7280'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Email</label>
                                            <input
                                                type="email"
                                                value={user.email || ''}
                                                disabled
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    fontSize: '16px',
                                                    background: '#f9fafb',
                                                    color: '#6b7280'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>Security</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <button
                                            onClick={() => setShowPasswordReset(true)}
                                            style={{
                                                background: '#f3f4f6',
                                                border: '1px solid #e5e7eb',
                                                padding: '12px 20px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '14px'
                                            }}
                                        >
                                            🔐 Reset Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Coming Soon</div>;
        }
    };

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>Loading Workspace...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            <aside style={{ width: '260px', backgroundColor: '#1a1a1b', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '20px' }}>SH</div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px', lineHeight: 1 }}>SHAN</div>
                            <div style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase' }}>Art Advertising</div>
                        </div>
                    </div>
                </div>

                <nav style={{ flex: 1, paddingTop: '24px' }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px 32px',
                                border: 'none',
                                background: activeTab === item.id ? 'var(--accent-color)' : 'transparent',
                                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                textAlign: 'left',
                                borderLeft: activeTab === item.id ? '4px solid #fff' : '4px solid transparent'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main style={{ flex: 1, padding: '48px', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900' }}>Hello, {user.name}!</h2>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '16px' }}>
                                {user.name ? user.name[0].toUpperCase() : 'N'}
                            </div>
                            <span style={{ color: '#6b7280', fontSize: '20px' }}>▼</span>
                        </button>

                        {showProfileDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '200px',
                                padding: '8px 0'
                            }}>
                                <button
                                    onClick={() => { setActiveTab('profile'); setShowProfileDropdown(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span>👤</span>
                                    Profile Settings
                                </button>
                                <button
                                    onClick={() => { localStorage.clear(); navigate('/'); }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        fontSize: '14px',
                                        color: '#dc2626'
                                    }}
                                >
                                    <span>🚪</span>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>
                {renderContent()}

                {/* Approval Modal */}
                {showApprovalModal && selectedOrder && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '24px', padding: '40px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Review Design: {selectedOrder.orderNumber}</h3>
                            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Please review the design files and approve to start production.</p>

                            <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', border: '2px dashed #e5e7eb', color: '#9ca3af' }}>
                                {selectedProductionOrder?.currentVersionId ? (
                                    <img
                                        src={`${API_BASE_URL}${selectedProductionOrder.currentVersionId.pngFilePath}`}
                                        alt="Design Preview"
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                ) : selectedOrder?.designFiles && selectedOrder.designFiles.length > 0 ? (
                                    <div style={{ textAlign: 'center', color: '#666666' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>📎 Design Files Available</div>
                                        {selectedOrder.designFiles.map((file, index) => (
                                            <div key={index} style={{
                                                background: '#fff',
                                                padding: '8px 12px',
                                                margin: '4px',
                                                borderRadius: '6px',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '12px',
                                                color: '#374151'
                                            }}>
                                                📄 {file.split('/').pop()}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        Design Preview (Mockup)
                                    </div>
                                )}
                            </div>

                            <textarea
                                placeholder="Instructions for revision (if needed)..."
                                value={actionFeedback}
                                onChange={(e) => setActionFeedback(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e5e7eb', height: '100px', marginBottom: '24px', resize: 'none' }}
                            />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button onClick={() => setShowApprovalModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Close</button>
                                <button onClick={() => handleApproval('reject')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', fontWeight: '700', cursor: 'pointer' }}>REVISION</button>
                                <button onClick={() => handleApproval('approve')} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>APPROVE & PRINT</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {showFeedbackModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleSubmitFeedback} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Share Your Experience</h3>
                            <p style={{ color: '#6b7280', marginBottom: '32px' }}>How was the service for order {selectedOrder?.orderNumber}?</p>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '32px', marginBottom: '32px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{ cursor: 'pointer', color: star <= rating ? '#fbbf24' : '#e5e7eb' }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>

                            <textarea
                                placeholder="Your comments (optional)..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e5e7eb', height: '120px', marginBottom: '24px', resize: 'none' }}
                            />

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button type="button" onClick={() => setShowFeedbackModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>SUBMIT FEEDBACK</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Password Reset Modal */}
                {showPasswordReset && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Reset Password</h3>
                            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Enter your new password below.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            background: '#fff',
                                            color: '#374151'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            background: '#fff',
                                            color: '#374151'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordReset(false)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        alert('Password has been reset successfully!');
                                        setShowPasswordReset(false);
                                    }}
                                    style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                                >
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedInvoice && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Complete Payment</h3>
                            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Invoice #{selectedInvoice.invoiceNumber} for {selectedInvoice.orderId?.orderNumber}</p>

                            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Balance Due</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-color)' }}>LKR {selectedInvoice.balanceDue?.toLocaleString()}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                    {isPickup(selectedInvoice) ? '🏠 Pickup Order - Cash Accepted' : '🚚 Delivery Order - Electronic Payment Only'}
                                </div>
                            </div>

                            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Amount to Pay (LKR)</label>
                                    <input
                                        type="number"
                                        max={selectedInvoice.balanceDue}
                                        required
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '16px', fontWeight: '700' }}
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Payment Method</label>
                                    <select
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}
                                        value={paymentData.method}
                                        onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                                        required
                                    >
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="pickme_pay">PickMe Pay</option>
                                        {isPickup(selectedInvoice) && <option value="cash">Cash on Pickup</option>}
                                    </select>
                                </div>
                                {paymentData.method !== 'cash' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Reference / Transaction ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter transaction reference"
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px' }}
                                            value={paymentData.reference}
                                            onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                            required={paymentData.method !== 'cash'}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedInvoice(null);
                                        }}
                                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 2, padding: '16px', borderRadius: '14px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)' }}
                                    >
                                        PAY NOW
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showNotificationsModal && (
                    <NotificationModal
                        notifications={notifications}
                        onClose={() => setShowNotificationsModal(false)}
                        onMarkRead={async (id) => {
                            try {
                                const token = localStorage.getItem('token');
                                await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`, {}, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                fetchData();
                            } catch (err) {
                                console.error('Failed to mark notification as read:', err);
                            }
                        }}
                    />
                )}
            </main>
        </div>
    );
};

const SummaryCard = ({ title, value, icon, color }) => (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: '900' }}>{value}</div>
        </div>
    </div>
);

const NotificationModal = ({ notifications, onClose, onMarkRead }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Notifications</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
                {notifications.length > 0 ? notifications.map(n => (
                    <div
                        key={n._id}
                        style={{ padding: '16px', borderRadius: '12px', background: n.isRead ? '#f9fafb' : '#fff5f5', border: `1px solid ${n.isRead ? '#f3f4f6' : '#fee2e2'}` }}
                        onClick={() => !n.isRead && onMarkRead(n._id)}
                    >
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{n.title}</div>
                        <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>{n.message}</div>
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No notifications yet.</div>
                )}
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>CLOSE</button>
        </div>
    </div>
);

export default CustomerHome;
