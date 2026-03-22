import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const ShopOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/orders`);
                setOrders(res.data);
            } catch (err) {
                console.error("Error fetching shop orders:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || "";
        if (s.includes('pending') || s.includes('draft')) return '#6b7280';
        if (s.includes('approved')) return '#d32f2f';
        if (s.includes('completed')) return '#111827';
        return '#4b5563';
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px' }}>PRODUCTION ORDERS</h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Real-time production tracking and order management.</p>
            </header>

            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center', color: '#6b7280' }}>Loading production data...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Customer</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Product</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Size</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Needed</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' }}>Order Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fcfcfc'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '700', color: '#111827' }}>{order.customerName}</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {order.customerId || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '20px 24px', color: '#374151', fontWeight: '600' }}>{order.printSpecs?.designType || '—'}</td>
                                <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '14px' }}>{order.printSpecs?.size || '—'}</td>
                                <td style={{ padding: '20px 24px', color: '#111827', fontWeight: '700' }}>{order.printSpecs?.quantity || 1}</td>
                                <td style={{ padding: '20px 24px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            backgroundColor: `${getStatusColor(order.status)}15`,
                                            color: getStatusColor(order.status),
                                            border: `1px solid ${getStatusColor(order.status)}30`
                                        }}>
                                            {order.status || 'Draft'}
                                        </span>
                                </td>
                                <td style={{ padding: '20px 24px', color: '#d32f2f', fontSize: '13px', fontWeight: '700' }}>
                                    {order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ padding: '20px 24px', color: '#6b7280', fontSize: '13px' }}>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No active production orders found.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ShopOrders;
