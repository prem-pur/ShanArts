import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiBase';

const GlobalNotifications = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const token = localStorage.getItem('token');

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.isRead).length,
        [notifications]
    );

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/notifications/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list = Array.isArray(response.data) ? response.data : [];
            setNotifications(list);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
        if (!token) return undefined;

        const timer = setInterval(fetchNotifications, 30000);
        return () => clearInterval(timer);
        // token controls auth context and reload timer.
    }, [fetchNotifications, token]);

    const markOneAsRead = async (id) => {
        try {
            await axios.patch(
                `${API_BASE_URL}/api/notifications/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
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
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    if (!token) return null;

    return (
        <div className="global-notification-shell">
            <button
                type="button"
                className="global-notification-bell"
                onClick={() => setOpen((value) => !value)}
                aria-label="Open notifications"
            >
                <span className="global-notification-icon">🔔</span>
                {unreadCount > 0 && <span className="global-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {open && (
                <div className="global-notification-panel">
                    <div className="global-notification-header">
                        <strong>Notifications</strong>
                        <div className="global-notification-actions">
                            <button type="button" onClick={fetchNotifications}>Refresh</button>
                            <button type="button" onClick={markAllAsRead} disabled={unreadCount === 0}>Read all</button>
                        </div>
                    </div>

                    <div className="global-notification-list">
                        {loading && <div className="global-notification-empty">Loading...</div>}
                        {!loading && notifications.length === 0 && (
                            <div className="global-notification-empty">No notifications yet.</div>
                        )}

                        {!loading && notifications.map((item) => (
                            <button
                                key={item._id}
                                type="button"
                                className={`global-notification-item ${item.isRead ? 'read' : 'unread'}`}
                                onClick={() => !item.isRead && markOneAsRead(item._id)}
                            >
                                <div className="global-notification-title-row">
                                    <span className="global-notification-title">{item.title}</span>
                                    {!item.isRead && <span className="global-notification-dot" />}
                                </div>
                                <div className="global-notification-message">{item.message}</div>
                                <div className="global-notification-time">{new Date(item.createdAt).toLocaleString()}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalNotifications;

