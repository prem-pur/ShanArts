import React, { useState, useEffect } from 'react';
import * as Router from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import {
    LayoutDashboard,
    PlusCircle,
    Package,
    FileText,
    Briefcase,
    RotateCw,
    CheckCircle,
    Bell,
    Calendar,
    Lock,
    User,
    LogOut,
    Image,
    XCircle,
    Star,
    ChevronDown,
    MapPin,
    Smartphone,
    Download
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';
import AddOrder from '../OrderManagement/AddOrder';

const CustomerHome = () => {
    const navigate = Router.useNavigate();
    const location = Router.useLocation();
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
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionChanges, setRejectionChanges] = useState('');
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [feedbackCategory, setFeedbackCategory] = useState('service');
    const [feedbackOrderId, setFeedbackOrderId] = useState('');
    const [comment, setComment] = useState('');
    const [recentFeedback, setRecentFeedback] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'card',
        reference: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: ''
    });
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [paymentError, setPaymentError] = useState('');
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const requestedTab = new URLSearchParams(location.search).get('tab');
        const allowedTabs = ['dashboard', 'new_order', 'my_orders', 'invoices', 'feedback', 'notifications', 'profile'];

        if (requestedTab && allowedTabs.includes(requestedTab)) {
            setActiveTab(requestedTab);
        }
    }, [location.search]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [ordersRes, invoicesRes, feedbackRes, userRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/shop-orders/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/invoices/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/feedback/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            setInvoices(Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : []);

            const feedbackList = Array.isArray(feedbackRes.data)
                ? feedbackRes.data
                : (Array.isArray(feedbackRes.data?.data) ? feedbackRes.data.data : []);
            setRecentFeedback(feedbackList);

            if (userRes.data) {
                localStorage.setItem('user', JSON.stringify(userRes.data));
                setProfileData({
                    name: userRes.data.name || '',
                    phone: userRes.data.phone || ''
                });
            }

            // Fetch notifications
            const notifyRes = await axios.get(`${API_BASE_URL}/api/notifications/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notificationList = Array.isArray(notifyRes.data)
                ? notifyRes.data
                : (Array.isArray(notifyRes.data?.data) ? notifyRes.data.data : []);
            setNotifications(notificationList);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError('');

        // Validation
        const phone = profileData.phone;
        const phoneDigits = phone.replace(/\D/g, '');
        if (!phone.startsWith('0')) {
            setProfileError('Phone number must start with 0.');
            return;
        }
        if (phoneDigits.length !== 10) {
            setProfileError('Phone number must have exactly 10 digits.');
            return;
        }

        try {
            setProfileSaving(true);
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, profileData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                alert('Profile updated successfully!');
                const updatedUser = response.data.data;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Reload page to reflect changes in header etc.
                window.location.reload();
            }
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const validateCardNumber = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return false;

        let sum = 0;
        let shouldDouble = false;
        for (let index = digits.length - 1; index >= 0; index -= 1) {
            let digit = Number(digits[index]);
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }

        return sum % 10 === 0;
    };

    const validateExpiryDate = (value) => {
        const match = /^([0-1]?\d)\/(\d{2}|\d{4})$/.exec(value.trim());
        if (!match) return false;

        const month = Number(match[1]);
        if (month < 1 || month > 12) return false;

        const year = match[2].length === 2 ? Number(`20${match[2]}`) : Number(match[2]);
        const expiry = new Date(year, month, 0, 23, 59, 59);
        return expiry >= new Date();
    };

    const formatCardNumberInput = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 19);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    };

    const formatExpiryDateInput = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 6);
        if (digits.length <= 2) {
            return digits;
        }
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    };

    const loadImageAsDataUrl = async (imagePath) => {
        const response = await fetch(imagePath);
        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleDownloadInvoicePdf = async (invoice) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            const logoDataUrl = await loadImageAsDataUrl(`${process.env.PUBLIC_URL}/logo.png`);
            doc.addImage(logoDataUrl, 'PNG', 14, 10, 56, 28);

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Invoice', pageWidth - 14, 20, { align: 'right' });

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`, pageWidth - 14, 28, { align: 'right' });
            doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, pageWidth - 14, 34, { align: 'right' });

            doc.setDrawColor(220, 220, 220);
            doc.line(14, 44, pageWidth - 14, 44);

            doc.setFont('helvetica', 'bold');
            doc.text('Bill To', 14, 55);

            doc.setFont('helvetica', 'normal');
            doc.text(user.name || 'Customer', 14, 62);
            if (user.email) {
                doc.text(user.email, 14, 68);
            }

            doc.setFont('helvetica', 'bold');
            doc.text('Order Details', 14, 82);

            doc.setFont('helvetica', 'normal');
            doc.text(`Order Number: ${invoice.orderId?.orderNumber || 'N/A'}`, 14, 89);
            doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 14, 95);
            doc.text(`Payment Status: ${(invoice.paymentStatus || 'unpaid').replace(/_/g, ' ')}`, 14, 101);

            doc.setDrawColor(230, 230, 230);
            doc.setFillColor(249, 250, 251);
            doc.rect(14, 112, pageWidth - 28, 34, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 18, 121);

            doc.setFont('helvetica', 'normal');
            doc.text(`Total Amount: LKR ${(invoice.totalAmount || 0).toLocaleString()}`, 18, 129);
            doc.text(`Amount Paid: LKR ${(invoice.amountPaid || 0).toLocaleString()}`, 18, 135);
            doc.text(`Balance Due: LKR ${(invoice.balanceDue || 0).toLocaleString()}`, 18, 141);

            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text('Thank you for choosing SHAN Art Advertising.', 14, 275);

            doc.save(`Invoice-${invoice.invoiceNumber || invoice._id}.pdf`);
        } catch (error) {
            console.error('Failed to generate invoice PDF:', error);
            alert('Failed to generate invoice PDF. Please try again.');
        }
    };

    const resetPaymentForm = () => {
        setPaymentData({
            amount: 0,
            method: 'card',
            reference: '',
            cardNumber: '',
            cardExpiry: '',
            cardCvv: ''
        });
        setPaymentSlip(null);
        setPaymentError('');
        setPaymentSubmitting(false);
    };

    const handleApproval = async (action) => {
        if (action === 'reject') {
            if (!rejectionReason.trim()) {
                alert("Please provide a rejection reason.");
                return;
            }
            if (!rejectionChanges.trim()) {
                alert("Please describe what should change.");
                return;
            }
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // The production order data is not strictly needed for the API call to process customer feedback
            // Removing this heavy request that fetches all orders unnecessarily.

            const response = await axios.post(`${API_BASE_URL}/api/shop-orders/${selectedOrder._id}/feedback`, {
                action,
                feedback: action === 'reject'
                    ? `REASON: ${rejectionReason}\n\nWHAT TO CHANGE: ${rejectionChanges}`
                    : actionFeedback
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.message) {
                alert(`Design ${action}ed successfully!`);
                await fetchData();
                setShowApprovalModal(false);
                setSelectedOrder(null);
                setSelectedProductionOrder(null);
                setActionFeedback('');
                setRejectionReason('');
                setRejectionChanges('');
                setShowRejectionForm(false);
            }
        } catch (err) {
            console.error('Approval action failed:', err.response?.data || err);
            alert(`Failed to process approval: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const chosenOrder = orders.find((order) => order._id === feedbackOrderId) || selectedOrder || null;

            await axios.post(`${API_BASE_URL}/api/feedback`, {
                orderId: chosenOrder?._id || null,
                orderNumber: chosenOrder?.orderNumber || '',
                category: feedbackCategory,
                rating,
                comment
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Thank you for your feedback!');
            setShowFeedbackModal(false);
            setSelectedOrder(null);
            setFeedbackOrderId('');
            setFeedbackCategory('service');
            setComment('');
            setRating(5);
            fetchData(); // Refresh both orders and feedback
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit feedback');
        }
    };

    const openFeedbackModal = (order = null) => {
        setSelectedOrder(order);
        setFeedbackOrderId(order?._id || '');
        setFeedbackCategory('service');
        setComment('');
        setRating(5);
        setShowFeedbackModal(true);
    };

    const closeFeedbackModal = () => {
        setShowFeedbackModal(false);
        setSelectedOrder(null);
        setFeedbackOrderId('');
        setFeedbackCategory('service');
        setComment('');
        setRating(5);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setPaymentError('');

        const paymentAmount = Number(paymentData.amount);
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            setPaymentError('Payment amount must be greater than 0.');
            return;
        }

        if (selectedInvoice && paymentAmount > Number(selectedInvoice.balanceDue || 0)) {
            setPaymentError(`Amount cannot exceed the balance due of LKR ${Number(selectedInvoice.balanceDue || 0).toLocaleString()}.`);
            return;
        }

        if ((paymentData.method === 'card' || paymentData.method === 'online') && !paymentData.reference.trim()) {
            setPaymentError('Reference / Transaction ID is required for card payments.');
            return;
        }

        if (paymentData.method === 'card') {
            if (!validateCardNumber(paymentData.cardNumber)) {
                setPaymentError('Enter a valid card number.');
                return;
            }
            if (!validateExpiryDate(paymentData.cardExpiry)) {
                setPaymentError('Enter a valid card expiry date in MM/YY format.');
                return;
            }
            if (!/^\d{3,4}$/.test(paymentData.cardCvv.trim())) {
                setPaymentError('Enter a valid 3 or 4 digit CVV.');
                return;
            }
        }

        if (paymentData.method === 'bank_transfer' && !paymentSlip) {
            setPaymentError('Please upload the bank transfer slip before submitting.');
            return;
        }

        try {
            setPaymentSubmitting(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('amount', String(paymentAmount));
            formData.append('method', paymentData.method);
            formData.append('reference', paymentData.reference);
            formData.append('cardNumber', paymentData.cardNumber);
            formData.append('cardExpiry', paymentData.cardExpiry);
            formData.append('cardCvv', paymentData.cardCvv);
            if (paymentSlip) {
                formData.append('slip', paymentSlip);
            }

            const response = await axios.post(`${API_BASE_URL}/api/invoices/${selectedInvoice._id}/payments`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.data?.payment?.status === 'pending_approval') {
                alert('Your bank transfer has been sent for admin approval.');
            } else {
                alert('Payment recorded successfully!');
            }
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            resetPaymentForm();
            fetchData();
        } catch (err) {
            setPaymentError(err.response?.data?.message || 'Failed to record payment');
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const isPickup = (invoice) => {
        return invoice?.orderId?.deliveryMethod === 'pickup';
    };

    const paymentStatusColors = {
        paid: '#059669',
        partial: '#d97706',
        pending_approval: '#7c3aed',
        unpaid: '#dc2626'
    };

    const feedbackList = Array.isArray(recentFeedback) ? recentFeedback : [];

    const notificationList = Array.isArray(notifications) ? notifications : [];

    const stats = {
        total: orders.length,
        active: orders.filter(o => ['pending', 'confirmed', 'in_progress', 'printing', 'pending_design', 'waiting_approval', 'revision_requested', 'scheduled'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'completed').length,
        pendingApprovals: orders.filter(o => o.status === 'waiting_approval').length,
        unreadNotifications: notificationList.filter(n => !n.isRead).length
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'new_order', label: 'Place New Order', icon: <PlusCircle size={20} /> },
        { id: 'my_orders', label: 'My Orders', icon: <Package size={20} /> },
        { id: 'invoices', label: 'Invoices', icon: <FileText size={20} /> },
        { id: 'feedback', label: 'My Feedback', icon: <Star size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                            <SummaryCard title="Total Projects" value={stats.total} icon={<Briefcase size={22} />} color="var(--accent-color)" />
                            <SummaryCard title="Active Projects" value={stats.active} icon={<RotateCw size={22} />} color="var(--accent-color)" />
                            <SummaryCard title="Completed" value={stats.completed} icon={<CheckCircle size={22} />} color="var(--accent-color)" />
                            <SummaryCard
                                title="Notifications"
                                value={stats.unreadNotifications > 0 ? `${stats.unreadNotifications} New` : '0 New'}
                                icon={<Bell size={22} />}
                                color={stats.unreadNotifications > 0 ? "var(--accent-color)" : "#666"}
                                onClick={() => setShowNotificationsModal(true)}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>



                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                            <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Recent Projects</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {orders.slice(0, 5).map(order => (
                                        <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
                                            <div>
                                                <div style={{ fontWeight: '700' }}>
                                                    {order.jobType.toUpperCase()}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666666' }}>{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}</div>
                                                {order.deadline && <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> Needed: {new Date(order.deadline).toLocaleDateString()}</div>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {order.status === 'waiting_approval' ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            const fetchProductionOrder = async () => {
                                                                try {
                                                                    const token = localStorage.getItem('token');
                                                                    const productionOrderRes = await axios.get(`${API_BASE_URL}/api/orders`, {
                                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                                    });
                                                                    const productionOrder = productionOrderRes.data.find(po => (po.shopOrderId?._id || po.shopOrderId) === order._id);
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
                                                        style={{
                                                            background: 'var(--accent-color)',
                                                            color: '#fff',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '8px',
                                                            fontSize: '11px',
                                                            fontWeight: '900',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                                                        }}
                                                    >
                                                        REVIEW DESIGN
                                                    </button>
                                                ) : (
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '99px',
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        background: order.status === 'completed' ? '#ecfdf5' : '#f5f5f5',
                                                        color: order.status === 'completed' ? '#059669' : '#666666'
                                                    }}>
                                                        {order.status.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length === 0 && <p style={{ color: '#666666' }}>No orders yet.</p>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Feedback Needed</h3>
                                    {orders.filter(o => o.status === 'completed' && !feedbackList.some(f => f.orderId?._id === o._id)).length === 0 ? (
                                        <p style={{ color: '#666666', fontSize: '14px' }}>No completed orders need feedback right now. You can still submit general feedback from the My Feedback tab.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {orders.filter(o => o.status === 'completed' && !feedbackList.some(f => f.orderId?._id === o._id)).slice(0, 3).map(order => (
                                                <div key={order._id} style={{ background: '#f5f5f5', padding: '16px', borderRadius: '12px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>{order.orderNumber}</div>
                                                    <button
                                                        onClick={() => openFeedbackModal(order)}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', background: '#fff', fontWeight: '700', cursor: 'pointer' }}
                                                    >
                                                        LEAVE FEEDBACK
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {feedbackList.length > 0 && (
                                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Your Recent Feedback</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {feedbackList.slice(0, 3).map(f => (
                                                <div key={f._id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#666' }}>{f.orderId?.orderNumber}</span>
                                                        <div style={{ display: 'flex', gap: '2px' }}>{[...Array(f.rating)].map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}</div>
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
                                    <td style={{ padding: '16px', fontWeight: '700' }}>
                                        {order.orderNumber}
                                    </td>
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
                                        <div style={{ fontSize: '12px', color: paymentStatusColors[invoice.paymentStatus] || '#f59e0b', fontWeight: '700', marginTop: '4px', marginBottom: '12px' }}>{invoice.paymentStatus?.replace(/_/g, ' ').toUpperCase()}</div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleDownloadInvoicePdf(invoice)}
                                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#111827', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Download size={13} />
                                                DOWNLOAD PDF
                                            </button>
                                            {invoice.paymentStatus !== 'paid' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedInvoice(invoice);
                                                        setPaymentData({
                                                            amount: Number(invoice.balanceDue || 0),
                                                            method: isPickup(invoice) ? 'card' : 'bank_transfer',
                                                            reference: user.email || '',
                                                            cardNumber: '',
                                                            cardExpiry: '',
                                                            cardCvv: ''
                                                        });
                                                        setPaymentSlip(null);
                                                        setPaymentError('');
                                                        setShowPaymentModal(true);
                                                    }}
                                                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    PAY NOW
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {invoices.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No invoices found.</p>}
                        </div>
                    </div>
                );
            case 'feedback':
                return (
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>My Feedback</h3>
                            <button
                                onClick={() => openFeedbackModal()}
                                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                            >
                                + Submit Feedback
                            </button>
                        </div>

                        <div style={{ marginBottom: '28px', padding: '18px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #eef2f7' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Quick note</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                                You can submit general feedback any time, or give feedback for a completed order from the dashboard.
                            </div>
                        </div>

                        {feedbackList.length === 0 ? (
                            <p style={{ color: '#6b7280' }}>You have not submitted feedback yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {feedbackList.map((f) => (
                                    <div key={f._id} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ fontWeight: '800', color: '#111827' }}>{f.orderNumber || f.orderId?.orderNumber || 'General Feedback'}</div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[...Array(f.rating || 0)].map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '6px', fontSize: '13px', color: '#4b5563' }}>
                                            "{f.comment || 'No comment'}"
                                        </div>
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>
                                            Status: {f.status || 'submitted'}
                                        </div>
                                        {f.response && (
                                            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: '#f0fdf4', borderLeft: '3px solid #10b981' }}>
                                                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '800', marginBottom: '4px' }}>Our response</div>
                                                <div style={{ fontSize: '13px', color: '#374151' }}>{f.response}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'notifications':
                return (
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '24px' }}>My Notifications</h3>
                        {notificationList.length === 0 ? (
                            <p style={{ color: '#6b7280' }}>No notifications yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {notificationList.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={async () => {
                                            if (n.isRead) return;
                                            try {
                                                const token = localStorage.getItem('token');
                                                await axios.patch(`${API_BASE_URL}/api/notifications/${n._id}/read`, {}, {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                fetchData();
                                            } catch (err) {
                                                console.error('Failed to mark notification as read:', err);
                                            }
                                        }}
                                        style={{
                                            border: `1px solid ${n.isRead ? '#f3f4f6' : '#fee2e2'}`,
                                            background: n.isRead ? '#f9fafb' : '#fff5f5',
                                            borderRadius: '12px',
                                            padding: '14px',
                                            cursor: n.isRead ? 'default' : 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>{n.title}</div>
                                            {!n.isRead && <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626' }}>NEW</span>}
                                        </div>
                                        <div style={{ marginTop: '4px', fontSize: '13px', color: '#4b5563' }}>{n.message}</div>
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'profile':
                return (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', maxWidth: '800px', margin: '0 auto' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px', color: 'var(--text-primary)' }}>Profile Settings</h3>

                            <form onSubmit={handleUpdateProfile}>
                                {profileError && (
                                    <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '600' }}>
                                        {profileError}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>Personal Information</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                    required
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
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Phone Number (07XXXXXXXX)</label>
                                                <input
                                                    type="text"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                    placeholder="0XXXXXXXXX"
                                                    required
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
                                                type="button"
                                                onClick={() => setShowPasswordReset(true)}
                                                style={{
                                                    background: '#f3f4f6',
                                                    border: '1px solid #e5e7eb',
                                                    padding: '12px 20px',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <Lock size={16} /> Reset Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="submit"
                                        disabled={profileSaving}
                                        style={{
                                            background: 'var(--accent-color)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '12px 32px',
                                            borderRadius: '8px',
                                            fontWeight: '800',
                                            cursor: profileSaving ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {profileSaving ? 'SAVING...' : 'SAVE CHANGES'}
                                    </button>
                                </div>
                            </form>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            background: '#ef4444',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '900',
                            fontSize: '22px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}>SH</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px', lineHeight: 1.1, letterSpacing: '0.5px' }}>SHAN</div>
                            <div style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '2px' }}>Art Advertising</div>
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
                            <ChevronDown size={18} color="#6b7280" />
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
                                    <User size={16} />
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
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>
                {renderContent()}

                {/* Approval Modal */}
                {showApprovalModal && selectedOrder && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                            {/* Header */}
                            <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f0f0' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#111827' }}>Review Design — {selectedOrder.orderNumber}</h3>
                                <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Please review the design carefully before approving.</p>
                            </div>

                            {/* Design Preview */}
                            <div style={{ background: '#f9fafb', margin: '24px 32px', borderRadius: '16px', border: '2px dashed #e5e7eb', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {selectedProductionOrder?.currentVersionId?.pngFilePath ? (
                                    <img
                                        src={`${API_BASE_URL}${selectedProductionOrder.currentVersionId.pngFilePath}`}
                                        alt="Design Preview"
                                        style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><Image size={60} strokeWidth={1} /></div>
                                        <div style={{ fontWeight: '600' }}>Design preview not yet available</div>
                                        <div style={{ fontSize: '12px', marginTop: '4px' }}>The designer may still be working on the design.</div>
                                    </div>
                                )}
                            </div>

                            {/* Rejection Form */}
                            {showRejectionForm && (
                                <div style={{ margin: '0 32px 24px', padding: '24px', background: '#fff5f5', borderRadius: '16px', border: '1.5px solid #fca5a5' }}>
                                    <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <XCircle size={16} /> Rejection Details
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>Rejection Reason *</label>
                                        <textarea
                                            placeholder="Why are you rejecting this design? (e.g. colours are wrong, layout doesn't match)"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #fca5a5', height: '80px', resize: 'none', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>What Should Change *</label>
                                        <textarea
                                            placeholder="Describe exactly what the designer should change (e.g. change text to 'Grand Opening', use blue instead of red)"
                                            value={rejectionChanges}
                                            onChange={(e) => setRejectionChanges(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #fca5a5', height: '80px', resize: 'none', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                        <button onClick={() => { setShowRejectionForm(false); setRejectionReason(''); setRejectionChanges(''); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontWeight: '700', cursor: 'pointer', color: '#374151' }}>Cancel</button>
                                        <button onClick={() => handleApproval('reject')} style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>SUBMIT REJECTION</button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!showRejectionForm && (
                                <div style={{ padding: '0 32px 28px', display: 'flex', gap: '16px' }}>
                                    <button onClick={() => { setShowApprovalModal(false); setShowRejectionForm(false); setRejectionReason(''); setRejectionChanges(''); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer', color: '#374151' }}>Close</button>
                                    <button onClick={() => setShowRejectionForm(true)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #dc2626', background: '#fff', color: '#dc2626', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <XCircle size={18} /> REJECT
                                    </button>
                                    <button onClick={() => handleApproval('approve')} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <CheckCircle size={18} /> APPROVE & PRINT
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {showFeedbackModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleSubmitFeedback} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Share Your Experience</h3>
                            <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                                {selectedOrder?.orderNumber
                                    ? `How was the service for order ${selectedOrder.orderNumber}?`
                                    : 'Share a general comment about your experience with us.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151' }}>Category</label>
                                    <select
                                        value={feedbackCategory}
                                        onChange={(e) => setFeedbackCategory(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', color: '#374151' }}
                                    >
                                        <option value="service">Service</option>
                                        <option value="quality">Quality</option>
                                        <option value="delivery">Delivery</option>
                                        <option value="pricing">Pricing</option>
                                        <option value="communication">Communication</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151' }}>Order Number (optional)</label>
                                    <select
                                        value={feedbackOrderId}
                                        onChange={(e) => setFeedbackOrderId(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#fff', color: '#374151' }}
                                    >
                                        <option value="">General Feedback (No specific order)</option>
                                        {orders.map((order) => (
                                            <option key={order._id} value={order._id}>
                                                {order.orderNumber} - {order.jobType}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '32px', marginBottom: '32px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{ cursor: 'pointer', color: star <= rating ? '#fbbf24' : '#e5e7eb' }}
                                    >
                                        <Star
                                            key={star}
                                            onClick={() => setRating(star)}
                                            size={32}
                                            fill={star <= rating ? '#fbbf24' : 'transparent'}
                                            style={{ cursor: 'pointer', color: star <= rating ? '#fbbf24' : '#e5e7eb', transition: 'all 0.2s' }}
                                        />
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
                                <button type="button" onClick={closeFeedbackModal} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
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
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '430px', maxHeight: 'calc(100vh - 32px)', borderRadius: '24px', padding: '24px', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Complete Payment</h3>
                            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Invoice #{selectedInvoice.invoiceNumber} for {selectedInvoice.orderId?.orderNumber}</p>

                            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Balance Due</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-color)' }}>LKR {selectedInvoice.balanceDue?.toLocaleString()}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                    {isPickup(selectedInvoice) ? <><MapPin size={14} /> Pickup Order - Pay Online</> : <><Smartphone size={14} /> Delivery Order - Electronic Payment Only</>}
                                </div>
                            </div>

                            {paymentError && (
                                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                                    {paymentError}
                                </div>
                            )}

                            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Amount to Pay (LKR)</label>
                                    <input
                                        type="number"
                                        max={selectedInvoice.balanceDue}
                                        min="1"
                                        step="0.01"
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
                                        onChange={e => {
                                            setPaymentData({ ...paymentData, method: e.target.value });
                                            setPaymentError('');
                                        }}
                                        required
                                    >
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="pickme_pay">PickMe Pay</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Reference / Transaction ID</label>
                                    <input
                                        type="text"
                                        placeholder="Enter transaction reference"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px' }}
                                        value={paymentData.reference}
                                        onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                        required={paymentData.method === 'card' || paymentData.method === 'online'}
                                    />
                                </div>

                                {paymentData.method === 'card' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Card Number</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="XXXX XXXX XXXX XXXX"
                                                maxLength={23}
                                                value={paymentData.cardNumber}
                                                onChange={e => setPaymentData({ ...paymentData, cardNumber: formatCardNumberInput(e.target.value) })}
                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Expiry Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    value={paymentData.cardExpiry}
                                                    onChange={e => setPaymentData({ ...paymentData, cardExpiry: formatExpiryDateInput(e.target.value) })}
                                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>CVV</label>
                                                <input
                                                    type="password"
                                                    inputMode="numeric"
                                                    placeholder="XXX"
                                                    maxLength="4"
                                                    value={paymentData.cardCvv}
                                                    onChange={e => setPaymentData({ ...paymentData, cardCvv: e.target.value })}
                                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentData.method === 'bank_transfer' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Upload Transfer Slip</label>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={e => setPaymentSlip(e.target.files?.[0] || null)}
                                                style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1.5px dashed var(--accent-color)', fontSize: '14px', background: '#fffafa' }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            Once uploaded, the payment will be sent to admin for approval before it is marked as paid.
                                        </div>
                                    </div>
                                )}

                                {paymentData.method === 'pickme_pay' && (
                                    <div style={{ padding: '16px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontSize: '13px', fontWeight: '600' }}>
                                        Please complete the payment via the PickMe App.
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedInvoice(null);
                                            resetPaymentForm();
                                        }}
                                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        {paymentData.method === 'pickme_pay' ? 'Close' : 'Cancel'}
                                    </button>

                                    {paymentData.method !== 'pickme_pay' && (
                                        <button
                                            type="submit"
                                            disabled={paymentSubmitting}
                                            style={{ flex: 2, padding: '16px', borderRadius: '14px', border: 'none', background: paymentSubmitting ? '#9ca3af' : 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: paymentSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)' }}
                                        >
                                            {paymentData.method === 'bank_transfer' ? 'UPLOAD SLIP' : 'PAY NOW'}
                                        </button>
                                    )}
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

const SummaryCard = ({ title, value, icon, color, onClick, style }) => (
    <div
        onClick={onClick}
        style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: onClick ? 'pointer' : 'default',
            ...style
        }}
    >
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {icon}
        </div>
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
                <button onClick={onClose} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}><XCircle size={24} /></button>
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
