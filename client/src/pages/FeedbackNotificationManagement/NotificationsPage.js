import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

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

    const unreadCount = notifications.filter((item) => !item.isRead).length;

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
                <div style={{
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: '1px solid #fee2e2'
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '99px',
                        fontSize: '14px',
                        fontWeight: '700'
                    }}>
                        {notifications.length} Total
                    </div>
                    {unreadCount > 0 && (
                        <div style={{
                            padding: '8px 16px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: '99px',
                            fontSize: '14px',
                            fontWeight: '700',
                            border: '1px solid #fee2e2'
                        }}>
                            {unreadCount} Unread
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={fetchNotifications}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Refresh
                    </button>
                    <button
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0 || loading}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#111827',
                            color: '#ffffff',
                            fontWeight: '600',
                            cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: unreadCount === 0 ? 0.5 : 1
                        }}
                    >
                        Mark All as Read
                    </button>
                </div>
            </div>

            {loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#9ca3af',
                    fontSize: '16px'
                }}>
                    Loading notifications...
                </div>
            )}

            {!loading && notifications.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#9ca3af',
                    fontSize: '16px'
                }}>
                    No notifications yet. All clear!
                </div>
            )}

            {!loading && notifications.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.map((notification) => {
                        const riskLevel = getRiskLevel(notification.title);
                        const riskColor = getRiskColor(riskLevel);
                        const riskBgColor = getRiskBgColor(riskLevel);

                        return (
                            <button
                                key={notification._id}
                                onClick={() => !notification.isRead && markOneAsRead(notification._id)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: `1.5px solid ${riskColor}`,
                                    borderRadius: '16px',
                                    background: riskBgColor,
                                    padding: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: notification.isRead ? 0.7 : 1,
                                    display: 'block'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    backgroundColor: riskColor,
                                                    color: '#ffffff',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                {riskLevel} {riskLevel === 'INFO' ? 'INFO' : 'RISK'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                ⏱ {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                            {!notification.isRead && (
                                                <span
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#d32f2f',
                                                        marginLeft: 'auto'
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#111827' }}>
                                            {notification.title}
                                        </h3>
                                        <p style={{ margin: '0', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
                                            {notification.message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!notification.isRead) markOneAsRead(notification._id);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid ' + riskColor,
                                            background: '#ffffff',
                                            color: riskColor,
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {notification.isRead ? '✓ Read' : 'Mark Read'}
                                    </button>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;

