import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import InvoiceEditModal from './InvoiceEditModal';

const AdminBilling = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalAmount: 0, totalPaid: 0, totalOutstanding: 0 });
    const [editingInvoice, setEditingInvoice] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/invoices?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = response.data.data;
            setInvoices(data);

            // Calculate totals
            let totalAmount = 0;
            let totalPaid = 0;
            let totalOutstanding = 0;

            data.forEach(inv => {
                totalAmount += (inv.totalAmount || 0);
                totalPaid += (inv.amountPaid || 0);
                totalOutstanding += (inv.balanceDue || 0);
            });

            setStats({ totalAmount, totalPaid, totalOutstanding });
        } catch (err) {
            console.error('Failed to fetch admin billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return { bg: '#d1fae5', color: '#065f46' };
            case 'partial': return { bg: '#fef3c7', color: '#92400e' };
            case 'unpaid': return { bg: '#fee2e2', color: '#991b1b' };
            default: return { bg: '#f3f4f6', color: '#374151' };
        }
    };

    if (loading && invoices.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Billing Overview...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px', marginBottom: '8px' }}>ADMIN BILLING</h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Executive overview of all financial transactions and invoice management.</p>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Invoiced Amount</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#111827' }}>LKR {stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Paid Revenue</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#059669' }}>LKR {stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Outstanding Balance</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#dc2626' }}>LKR {stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* Main Table Layer */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderRadius: '12px' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Invoice No</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Customer</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Date Issued</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Amount (LKR)</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => {
                            const statusStyle = getStatusStyle(inv.paymentStatus);
                            return (
                                <tr key={inv._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px', fontWeight: '800', color: '#111827' }}>#{inv.invoiceNumber}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '700', color: '#374151' }}>{inv.customerId?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{inv.customerId?.email}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#4b5563', fontSize: '14px' }}>
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#111827' }}>
                                        {inv.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                            textTransform: 'uppercase', background: statusStyle.bg, color: statusStyle.color
                                        }}>
                                            {inv.paymentStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setEditingInvoice(inv)}
                                            style={{
                                                padding: '8px 16px', background: 'transparent', border: '1px solid currentColor',
                                                borderRadius: '8px', color: '#4f46e5', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#e0e7ff'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            EDIT
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No invoices found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingInvoice && (
                <InvoiceEditModal
                    invoice={editingInvoice}
                    onClose={() => setEditingInvoice(null)}
                    onRefresh={fetchData}
                />
            )}
        </div>
    );
};

export default AdminBilling;
