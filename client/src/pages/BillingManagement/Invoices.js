import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending'
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        method: 'cash',
        reference: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isFinanceManager = user.role === 'admin' || user.role === 'staff_finance' || user.role === 'staff_system';

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            if (activeTab === 'active') {
                const url = user.role === 'customer' ? `${API_BASE_URL}/api/invoices/my` : `${API_BASE_URL}/api/invoices`;
                const response = await axios.get(url, { headers });
                setInvoices(response.data.data);
            } else if (activeTab === 'pending' && isFinanceManager) {
                const response = await axios.get(`${API_BASE_URL}/api/invoices/pending-billing`, { headers });
                setPendingOrders(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch ledger data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/invoices`, { orderId }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Invoice generated successfully!');
            setActiveTab('active');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate invoice');
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
            setSelectedInvoice(null);
            setPaymentData({ amount: 0, method: 'cash', reference: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record payment');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return '#10b981';
            case 'partial': return '#f59e0b';
            case 'unpaid': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const isPickup = (invoice) => {
        return invoice?.orderId?.deliveryMethod === 'pickup';
    };

    if (loading && !invoices.length && !pendingOrders.length) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Ledger...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px', marginBottom: '8px' }}>FINANCIAL LEDGER</h1>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Manage billing, invoices, and payment tracking.</p>
                </div>
                {isFinanceManager && (
                    <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px' }}>
                        <button
                            onClick={() => setActiveTab('active')}
                            style={{
                                padding: '8px 20px',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: activeTab === 'active' ? '#fff' : 'transparent',
                                color: activeTab === 'active' ? '#111827' : '#6b7280',
                                boxShadow: activeTab === 'active' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Active Invoices
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            style={{
                                padding: '8px 20px',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: activeTab === 'pending' ? '#fff' : 'transparent',
                                color: activeTab === 'pending' ? '#111827' : '#6b7280',
                                boxShadow: activeTab === 'pending' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Pending Billing {pendingOrders.length > 0 && <span style={{ marginLeft: '6px', background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: '10px' }}>{pendingOrders.length}</span>}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '32px', alignItems: 'start' }}>
                {/* Main Content Area */}
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                    {activeTab === 'active' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f9fafb' }}>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Invoice</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Customer</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Amount</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(invoice => (
                                        <tr key={invoice._id} style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '800', color: '#111827' }}>#{invoice.invoiceNumber}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>{invoice.customerId?.name}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{invoice.orderId?.orderNumber}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '900', color: '#111827' }}>LKR {invoice.totalAmount?.toLocaleString()}</div>
                                                <div style={{ fontSize: '12px', color: (invoice.balanceDue || 0) > 0 ? '#dc2626' : '#10b981' }}>
                                                    {(invoice.balanceDue || 0) > 0 ? `Due: LKR ${invoice.balanceDue?.toLocaleString()}` : 'Fully Paid'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: '900',
                                                    textTransform: 'uppercase',
                                                    background: `${getStatusColor(invoice.paymentStatus)}15`,
                                                    color: getStatusColor(invoice.paymentStatus),
                                                    border: `1px solid ${getStatusColor(invoice.paymentStatus)}30`
                                                }}>
                                                    {invoice.paymentStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <button
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                    disabled={invoice.paymentStatus === 'paid'}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: invoice.paymentStatus === 'paid' ? '#f3f4f6' : '#111827',
                                                        color: invoice.paymentStatus === 'paid' ? '#9ca3af' : '#fff',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        cursor: invoice.paymentStatus === 'paid' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {invoice.paymentStatus === 'paid' ? 'COMPLETE' : (user.role === 'customer' ? 'PAY NOW' : 'COLLECT')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {invoices.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>No active invoices.</div>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f9fafb' }}>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Order</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Customer</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Method</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Total Price</th>
                                        <th style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingOrders.map(order => (
                                        <tr key={order._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '800', color: '#111827' }}>{order.orderNumber}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '700' }}>{order.jobType.toUpperCase()}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>{order.customerId?.name}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: order.deliveryMethod === 'pickup' ? '#2563eb' : '#9333ea' }}>
                                                    {order.deliveryMethod?.toUpperCase()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '900', color: '#111827' }}>LKR {order.totalPrice?.toLocaleString()}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <button
                                                    onClick={() => handleCreateInvoice(order._id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: 'var(--accent-color)',
                                                        color: '#fff',
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    CREATE INVOICE
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pendingOrders.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>No orders pending billing.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Side Panel */}
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', position: 'sticky', top: '40px' }}>
                    {selectedInvoice ? (
                        <>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px' }}>Record Payment</h3>
                            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Invoice Balance</div>
                                <div style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>LKR {selectedInvoice.balanceDue?.toLocaleString()}</div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                    Invoice #{selectedInvoice.invoiceNumber} • {isPickup(selectedInvoice) ? '🏠 Pickup Order' : '🚚 Delivery Order'}
                                </div>
                            </div>

                            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Payment Amount</label>
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
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Method</label>
                                    <select
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}
                                        value={paymentData.method}
                                        onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                                    >
                                        {isPickup(selectedInvoice) && <option value="cash">Cash</option>}
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="pickme_pay">PickMe Pay</option>
                                    </select>
                                    {!isPickup(selectedInvoice) && <p style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>* Cash only available for pickup orders.</p>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Reference / Receipt #</label>
                                    <input
                                        type="text"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px' }}
                                        value={paymentData.reference}
                                        onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })}
                                        placeholder="Optional reference note"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    style={{ width: '100%', background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)' }}
                                >
                                    CONFIRM PAYMENT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(null)}
                                    style={{ width: '100%', background: 'none', border: 'none', color: '#6b7280', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>Revenue Overview</h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                                {isFinanceManager
                                    ? "Select an invoice to record a payment, or switch to the Pending tab to issue new invoices."
                                    : "View your invoice history and settle outstanding balances securely."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Invoices;
