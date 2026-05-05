import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { API_BASE_URL } from '../apiBase';
import { useMatchMedia } from '../hooks/useMatchMedia';

/** Routes that use the customer-style shell (no staff mobile top bar). */
const CUSTOMER_SHELL_PATHS = new Set(['/', '/customer-home', '/customer-dashboard', '/staff-login']);

const GlobalNotifications = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const staffCompact = useMatchMedia('(max-width: 900px)');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPublicRoute = ['/', '/customer-dashboard', '/staff-login'].includes(location.pathname);

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
            const list = Array.isArray(response.data)
                ? response.data
                : (Array.isArray(response.data?.data) ? response.data.data : []);
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

    const goToNotificationsPage = () => {
        setOpen(false);
        if (user.role === 'customer') {
            navigate('/customer-home?tab=notifications');
            return;
        }

        navigate('/notifications');
    };

    if (!token || !user.role || isPublicRoute) return null;

    const staffMobileTopBar = staffCompact && !CUSTOMER_SHELL_PATHS.has(location.pathname);

    const shell = (
        <div
            className={`global-notification-shell${staffMobileTopBar ? ' global-notification-shell--staff-mobile' : ''}`}
        >
            <button
                type="button"
                className="global-notification-bell"
                onClick={() => setOpen((value) => !value)}
                aria-label="Open notifications"
            >
                <Bell size={22} className="global-notification-icon" />
                {unreadCount > 0 && <span className="global-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {open && (
                <div className="global-notification-panel">
                    <div className="global-notification-header">
                        <strong>Notifications</strong>
                        <div className="global-notification-actions">
                            <button type="button" onClick={fetchNotifications}>Refresh</button>
                            <button type="button" onClick={markAllAsRead} disabled={unreadCount === 0}>Read all</button>
                            <button type="button" onClick={goToNotificationsPage}>See more</button>
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

    if (typeof document === 'undefined') return null;

    return createPortal(shell, document.body);
};

export default GlobalNotifications;

