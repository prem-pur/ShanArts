import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const SystemManagerDashboard = () => {
    const [feedback, setFeedback] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingTasks: 0 });
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchSystemData();
    }, []);

    const fetchSystemData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch feedback independently to ensure it shows even if others fail
            try {
                const feedbackRes = await axios.get(`${API_BASE_URL}/api/feedback`, { headers });
                setFeedback(feedbackRes.data.data || []);
            } catch (fErr) {
                console.error('Failed to fetch feedback:', fErr);
                setFeedback([]);
            }

            // Fetch notifications
            try {
                const notifyRes = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
                setNotifications(notifyRes.data || []);
            } catch (nErr) {
                console.error('Failed to fetch notifications:', nErr);
                setNotifications([]);
            }

            // Fetch stats
            try {
                const [ordersRes, revenueRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/shop-orders`, { headers }),
                    axios.get(`${API_BASE_URL}/api/invoices`, { headers })
                ]);

                const allOrders = ordersRes.data.orders || [];
                const allInvoices = revenueRes.data.data || [];

                const completedRevenue = allInvoices
                    .filter(inv => inv.paymentStatus === 'paid')
                    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

                setStats({
                    totalOrders: allOrders.length,
                    totalRevenue: completedRevenue,
                    pendingTasks: allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length
                });
            } catch (sErr) {
                console.error('Failed to fetch system stats:', sErr);
            }

        } catch (err) {
            console.error('General system data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading System Overview...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px' }}>SYSTEM MONITOR</h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Quality control, customer feedback, and operation oversight.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <StatCard title="Total Orders" value={stats.totalOrders} icon="📦" color="#111827" />
                <StatCard title="Total Revenue" value={`LKR ${stats.totalRevenue.toLocaleString()}`} icon="💰" color="#10b981" />
                <StatCard title="Active Jobs" value={stats.pendingTasks} icon="⚡" color="var(--accent-color)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f0f0f0', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>🔔</span> Recent Notifications
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n._id} style={{ padding: '16px', borderRadius: '12px', background: n.isRead ? '#f9fafb' : '#fff5f5', border: `1px solid ${n.isRead ? '#f3f4f6' : '#fee2e2'}` }}>
                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{n.title}</div>
                                <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>{n.message}</div>
                                <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>No recent system notifications.</div>
                        )}
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f0f0f0', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>💬</span> Customer Feedback
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {feedback && feedback.map(f => (
                            <div key={f._id} style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{f.customerId?.name || 'Anonymous Customer'}</div>
                                    <div style={{ color: '#fbbf24', fontSize: '14px' }}>
                                        {'★'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}
                                    </div>
                                </div>
                                <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5', fontSize: '13px', fontStyle: 'italic' }}>
                                    "{f.comment || 'No comment provided.'}"
                                </p>
                            </div>
                        ))}
                        {(!feedback || feedback.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
                                No feedback submitted yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>{value}</div>
        </div>
    </div>
);

export default SystemManagerDashboard;
