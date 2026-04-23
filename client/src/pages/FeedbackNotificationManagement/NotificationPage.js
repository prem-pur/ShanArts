import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Bell, 
    RefreshCcw, 
    CheckCircle2, 
    Trash2, 
    Clock, 
    AlertTriangle, 
    Info, 
    AlertCircle,
    X,
    ShieldCheck,
    Cpu
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedForVerification, setSelectedForVerification] = useState(null);
    const [verificationChoice, setVerificationChoice] = useState(null);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/notifications/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list = Array.isArray(response.data) ? response.data : [];
            setNotifications(list);
            setError('');
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setError('Neural link failed. Unable to synchronize alerts.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markOneAsRead = async (id) => {
        try {
            await axios.patch(
                `${API_BASE_URL}/api/notifications/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch(
                `${API_BASE_URL}/api/notifications/read-all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.filter((item) => item._id !== id));
            if (selectedForVerification?._id === id) {
                closeVerifyModal();
            }
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm('Wipe all notifications? This action is permanent.')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/notifications/clear-all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications([]);
            closeVerifyModal();
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    const canVerify = (notification) => {
        if (!isAdmin || notification.type !== 'delay_risk') return false;
        return notification.predictionVerification?.status !== 'verified';
    };

    const openVerifyModal = (notification) => {
        setSelectedForVerification(notification);
        setVerificationChoice(null);
        setVerificationNotes('');
        if (!notification.isRead) {
            markOneAsRead(notification._id);
        }
    };

    const closeVerifyModal = () => {
        setSelectedForVerification(null);
        setVerificationChoice(null);
        setVerificationNotes('');
    };

    const submitVerification = async () => {
        if (!selectedForVerification || verificationChoice === null) return;
        try {
            setSubmittingVerification(true);
            const response = await axios.post(
                `${API_BASE_URL}/api/notifications/${selectedForVerification._id}/verify`,
                {
                    isAccurate: verificationChoice,
                    notes: verificationNotes,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updated = response.data;
            setNotifications((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
            closeVerifyModal();
        } catch (err) {
            console.error('Failed to submit prediction verification:', err);
            alert(err.response?.data?.message || 'Verification relay failed.');
        } finally {
            setSubmittingVerification(false);
        }
    };

    const getRiskLevel = (title) => {
        const t = title.toUpperCase();
        if (t.includes('HIGH') || t.includes('OUT OF ORDER') || t.includes('DELAY')) return 'CRITICAL';
        if (t.includes('MEDIUM') || t.includes('MAINTENANCE')) return 'MEDIUM';
        if (t.includes('LOW') || t.includes('STOCKED')) return 'LOW';
        return 'INFO';
    };

    const getColors = (level) => {
        switch (level) {
            case 'CRITICAL': return { border: '#ef4444', bg: '#fef2f2', text: '#ef4444', icon: AlertTriangle };
            case 'MEDIUM': return { border: '#111827', bg: '#f1f5f9', text: '#111827', icon: AlertCircle };
            case 'LOW': return { border: '#64748b', bg: '#f8fafc', text: '#64748b', icon: ShieldCheck };
            default: return { border: '#e2e8f0', bg: '#fff', text: '#64748b', icon: Info };
        }
    };

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <style>{`
                @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .notification-card:hover { transform: translateX(4px); box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Bell size={28} color="#ef4444" /> Notifications
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
                      AI Powered Risk Alerts and Delay Predictions
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={fetchNotifications} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    <button onClick={markAllAsRead} disabled={unreadCount === 0} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: '700', cursor: unreadCount === 0 ? 'default' : 'pointer', fontSize: '13px', opacity: unreadCount === 0 ? 0.5 : 1 }}>
                        Mark All Read
                    </button>
                    {isAdmin && (
                        <button onClick={clearAllNotifications} disabled={notifications.length === 0} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                            Clear Matrix
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: '#fff', padding: '12px 24px', borderRadius: '99px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '800', color: '#0f172a', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    {notifications.length} Total Alerts
                </div>
                {unreadCount > 0 && (
                    <div style={{ background: '#ef4444', padding: '12px 24px', borderRadius: '99px', fontSize: '13px', fontWeight: '800', color: '#fff', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={14} /> {unreadCount} Priority Unread
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#64748b', fontWeight: '600' }}>Synchronizing notifications...</div>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '120px 40px', background: '#fff', borderRadius: '32px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}><CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} /></div>
                    <div style={{ fontWeight: '900', fontSize: '20px', color: '#0f172a' }}>All Systems Optimized</div>
                    <div style={{ color: '#64748b', marginTop: '8px', fontWeight: '500' }}>No active risks or delays detected in the system.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.map((notif, idx) => {
                        const level = getRiskLevel(notif.title);
                        const colors = getColors(level);
                        const StatusIcon = colors.icon;

                        return (
                            <div 
                                key={notif._id} 
                                className="notification-card"
                                onClick={() => !notif.isRead && markOneAsRead(notif._id)} 
                                style={{ 
                                    background: colors.bg, 
                                    borderRadius: '24px', 
                                    padding: '24px 32px', 
                                    border: `1.5px solid ${colors.border}`, 
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)', 
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                                    cursor: notif.isRead ? 'default' : 'pointer', 
                                    animation: `slideIn 0.4s ease-out ${idx * 0.05}s forwards`,
                                    opacity: 0,
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '6px', background: colors.text, color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <StatusIcon size={12} /> {level}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!notif.isRead && (
                                                <div style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '900', animation: 'pulse-slow 2s infinite' }}>PENDING ACTION</div>
                                            )}
                                        </div>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{notif.title}</h3>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#334155', fontWeight: '500', lineHeight: 1.6 }}>{notif.message}</p>
                                        
                                        {notif.predictionVerification?.status === 'verified' && (
                                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: notif.predictionVerification.isAccurate ? '#10b981' : '#f59e0b' }}>
                                                <ShieldCheck size={14} /> 
                                                Prediction Validated: {notif.predictionVerification.isAccurate ? 'Model Accurate' : 'Heuristic Adjustment Required'}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {canVerify(notif) && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openVerifyModal(notif); }} 
                                                style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                Verify Logic
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }} 
                                            style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.03)', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Verification Modal */}
            {selectedForVerification && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Cpu size={24} color="#ef4444" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Ground Truth Feedback</h3>
                            </div>
                            <button onClick={closeVerifyModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                        </div>

                        <p style={{ fontSize: '15px', color: '#475569', fontWeight: '500', lineHeight: 1.6, marginBottom: '24px' }}>
                            Help us train the AI by verifying the accuracy of the prediction for {selectedForVerification.metadata?.orderNumber ? <strong>Order #{selectedForVerification.metadata.orderNumber}</strong> : 'this event'}.
                        </p>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>AI Model Output</div>
                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', lineHeight: 1.5 }}>
                                {selectedForVerification.metadata?.modelMessage || selectedForVerification.message}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <button 
                                onClick={() => setVerificationChoice(true)} 
                                style={{ padding: '16px', borderRadius: '16px', border: verificationChoice === true ? '2.5px solid #10b981' : '1.5px solid #e2e8f0', background: verificationChoice === true ? '#f0fdf4' : '#fff', color: '#0f172a', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                            >
                                <CheckCircle2 size={24} color={verificationChoice === true ? '#10b981' : '#cbd5e1'} />
                                Precise Prediction
                            </button>
                            <button 
                                onClick={() => setVerificationChoice(false)} 
                                style={{ padding: '16px', borderRadius: '16px', border: verificationChoice === false ? '2.5px solid #ef4444' : '1.5px solid #e2e8f0', background: verificationChoice === false ? '#fef2f2' : '#fff', color: '#0f172a', fontWeight: '800', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                            >
                                <X size={24} color={verificationChoice === false ? '#ef4444' : '#cbd5e1'} />
                                Model Deviation
                            </button>
                        </div>

                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>Heuristic Observation (Optional)</label>
                        <textarea value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} placeholder="Explain the real-world discrepancy..." style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px', minHeight: '100px', resize: 'none', marginBottom: '32px' }} />

                        <button 
                            onClick={submitVerification} 
                            disabled={verificationChoice === null || submittingVerification} 
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: (verificationChoice === null || submittingVerification) ? 'not-allowed' : 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)', opacity: submittingVerification ? 0.7 : 1 }}
                        >
                            {submittingVerification ? 'Syncing...' : 'Seal Verification'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
