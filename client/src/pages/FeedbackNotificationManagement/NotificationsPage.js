import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
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
            setError('Failed to load notifications. Please try again.');
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
            alert(err.response?.data?.message || 'Failed to submit verification. Please try again.');
        } finally {
            setSubmittingVerification(false);
        }
    };

    const getRiskLevel = (title) => {
        if (title.includes('HIGH') || title.includes('Out of Order') || title.includes('Delay')) return 'HIGH';
        if (title.includes('MEDIUM') || title.includes('Maintenance')) return 'MEDIUM';
        if (title.includes('LOW') || title.includes('Low Stock')) return 'LOW';
        return 'INFO';
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'HIGH':
                return '#fca5a5';
            case 'MEDIUM':
                return '#fcd34d';
            case 'LOW':
                return '#86efac';
            default:
                return '#d1d5db';
        }
    };

    const getRiskBgColor = (level) => {
        switch (level) {
            case 'HIGH':
                return '#fff5f5';
            case 'MEDIUM':
                return '#fffbeb';
            case 'LOW':
                return '#f0fdf4';
            default:
                return '#f9fafb';
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px' }}>Notifications</h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>AI-powered risk alerts and delay predictions</p>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '12px', marginBottom: '24px', border: '1px solid #fee2e2' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', borderRadius: '99px', fontSize: '14px', fontWeight: '700' }}>
                        {notifications.length} Total
                    </div>
                    {unreadCount > 0 && (
                        <div style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '99px', fontSize: '14px', fontWeight: '700', border: '1px solid #fee2e2' }}>
                            {unreadCount} Unread
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={fetchNotifications} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                        Refresh
                    </button>
                    <button onClick={markAllAsRead} disabled={unreadCount === 0 || loading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#111827', color: '#ffffff', fontWeight: '600', cursor: unreadCount === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: unreadCount === 0 ? 0.5 : 1 }}>
                        Mark All as Read
                    </button>
                    <button onClick={clearAllNotifications} disabled={notifications.length === 0 || loading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: '600', cursor: notifications.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: notifications.length === 0 ? 0.5 : 1 }}>
                        Clear All
                    </button>
                </div>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '16px' }}>Loading notifications...</div>}
            {!loading && notifications.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '16px' }}>No notifications yet. All clear!</div>}

            {!loading && notifications.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.map((notification) => {
                        const riskLevel = getRiskLevel(notification.title);
                        const riskColor = getRiskColor(riskLevel);
                        const riskBgColor = getRiskBgColor(riskLevel);

                        return (
                            <div key={notification._id} onClick={() => !notification.isRead && markOneAsRead(notification._id)} style={{ width: '100%', textAlign: 'left', border: `1.5px solid ${riskColor}`, borderRadius: '16px', background: riskBgColor, padding: '24px', cursor: 'pointer', transition: 'all 0.2s', opacity: notification.isRead ? 0.7 : 1, display: 'block' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: riskColor, color: '#ffffff', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {riskLevel} {riskLevel === 'INFO' ? 'INFO' : 'RISK'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>⏱ {new Date(notification.createdAt).toLocaleString()}</span>
                                            {!notification.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d32f2f', marginLeft: 'auto' }} />}
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#111827' }}>{notification.title}</h3>
                                        <p style={{ margin: '0', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>{notification.message}</p>
                                        {notification.predictionVerification?.status === 'verified' && (
                                            <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                                                Verified: {notification.predictionVerification.isAccurate ? 'Accurate' : 'Inaccurate'}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {canVerify(notification) && (
                                            <button onClick={(e) => { e.stopPropagation(); openVerifyModal(notification); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#ffffff', fontWeight: '700', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                Verify
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); if (!notification.isRead) markOneAsRead(notification._id); }} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${riskColor}`, background: '#ffffff', color: riskColor, fontWeight: '600', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                            {notification.isRead ? '✓ Read' : 'Mark Read'}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: '700', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedForVerification && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                    <div style={{ width: '100%', maxWidth: '560px', background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', color: '#ef4444', lineHeight: 1 }}>⚠</h2>
                                <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '800', color: '#111827' }}>Staff Feedback - Ground Truth</h3>
                            </div>
                            <button onClick={closeVerifyModal} disabled={submittingVerification} style={{ border: 'none', background: 'transparent', fontSize: '26px', color: '#6b7280', cursor: 'pointer' }}>×</button>
                        </div>

                        <p style={{ margin: '10px 0 20px 0', fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                            Was the AI risk prediction accurate for <strong>{selectedForVerification.metadata?.orderNumber ? `Order #${selectedForVerification.metadata.orderNumber}` : selectedForVerification.title}</strong>?
                        </p>

                        <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '16px', marginBottom: '22px' }}>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>AI Prediction</div>
                            <div style={{ fontSize: '15px', color: '#111827', fontWeight: '600', lineHeight: 1.5 }}>
                                {selectedForVerification.metadata?.modelMessage || selectedForVerification.message}
                                {selectedForVerification.metadata?.riskProbabilityPercent !== null && selectedForVerification.metadata?.riskProbabilityPercent !== undefined && (
                                    <span> ({selectedForVerification.metadata.riskProbabilityPercent}% delay probability)</span>
                                )}
                            </div>
                        </div>

                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>Was this prediction accurate?</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <button onClick={() => setVerificationChoice(true)} style={{ padding: '12px', borderRadius: '10px', border: verificationChoice === true ? '2px solid #10b981' : '1px solid #d1d5db', background: verificationChoice === true ? '#ecfdf5' : '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                                ✓ Yes, Accurate
                            </button>
                            <button onClick={() => setVerificationChoice(false)} style={{ padding: '12px', borderRadius: '10px', border: verificationChoice === false ? '2px solid #ef4444' : '1px solid #d1d5db', background: verificationChoice === false ? '#fef2f2' : '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                                ✕ No, Inaccurate
                            </button>
                        </div>

                        <label style={{ display: 'block', fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Additional Notes (optional)</label>
                        <textarea value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} placeholder="E.g., Machine was fixed earlier than expected..." rows={4} style={{ width: '100%', borderRadius: '10px', border: '1px solid #d1d5db', padding: '12px', fontSize: '14px', resize: 'vertical', marginBottom: '18px' }} />

                        <button onClick={submitVerification} disabled={verificationChoice === null || submittingVerification} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: verificationChoice === null ? '#fecaca' : '#ef4444', color: '#fff', fontWeight: '800', fontSize: '17px', cursor: verificationChoice === null ? 'not-allowed' : 'pointer', opacity: submittingVerification ? 0.7 : 1 }}>
                            {submittingVerification ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;

