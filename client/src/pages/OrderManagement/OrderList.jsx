import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    ChevronRight,
    ClipboardList,
    AlertCircle,
    Layout
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';

// Maps every raw status string → { display label, color, bg, border }
const STATUS_MAP = {
    // Design phase
    'draft':              { label: 'Draft',               color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
    'design in progress': { label: 'Design In Progress',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    'pending_design':     { label: 'Pending Design',      color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    // Approval phase
    'waiting_approval':   { label: 'Waiting Approval',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'waiting approval':   { label: 'Waiting Approval',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'sent to customer':   { label: 'Sent to Customer',    color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
    'revision_requested': { label: 'Revision Requested',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'revision requested': { label: 'Revision Requested',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'rejected':           { label: 'Rejected',             color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'approved':           { label: 'Approved',             color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    // Production phase
    'scheduled':          { label: 'Scheduled',            color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
    'confirmed':          { label: 'Confirmed',            color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
    'in_progress':        { label: 'In Progress',          color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'in progress':        { label: 'In Progress',          color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'printing':           { label: 'Printing',             color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'machine_maintenance':{ label: 'Machine Maintenance',  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    // Done
    'completed':          { label: 'Completed',            color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};

const getStatusConf = (raw) => {
    const key = (raw || '').trim().toLowerCase();
    return STATUS_MAP[key] || { label: raw || 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
};

// Filter tabs: broad categories. 'All' shows everything.
const FILTER_TABS = [
    { key: 'all',        label: 'All' },
    { key: 'design',     label: 'Design Phase' },
    { key: 'approval',   label: 'Awaiting Approval' },
    { key: 'production', label: 'In Production' },
    { key: 'done',       label: 'Completed' },
];

const FILTER_GROUPS = {
    design:     ['draft', 'design in progress', 'pending_design'],
    approval:   ['waiting_approval', 'waiting approval', 'sent to customer', 'revision_requested', 'revision requested', 'rejected', 'approved'],
    production: ['scheduled', 'confirmed', 'in_progress', 'in progress', 'printing', 'machine_maintenance'],
    done:       ['completed'],
};

const matchesFilter = (rawStatus, filterKey) => {
    if (filterKey === 'all') return true;
    const key = (rawStatus || '').trim().toLowerCase();
    return (FILTER_GROUPS[filterKey] || []).includes(key);
};

// Removed BellIcon as the banner is no longer needed

const StatusBadge = ({ rawStatus }) => {
    const conf = getStatusConf(rawStatus);
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
            color: conf.color, background: conf.bg, border: `1px solid ${conf.border}`,
            textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: conf.color, display: 'inline-block' }} />
            {conf.label}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const isUrgent = (priority || '').toLowerCase() === 'urgent';
    return isUrgent ? (
        <span style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900',
            background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', textTransform: 'uppercase'
        }}>Urgent</span>
    ) : (
        <span style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
            background: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', textTransform: 'uppercase'
        }}>Normal</span>
    );
};

const OrderList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = useCallback(() => {
        axios.get(`${API_BASE_URL}/api/orders`)
            .then(res => {
                const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sorted);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const filteredOrders = orders.filter(order => {
        if (!matchesFilter(order.status, filterTab)) return false;
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            (order.customerName || '').toLowerCase().includes(term) ||
            (order.printSpecs?.designType || '').toLowerCase().includes(term)
        );
    });



    const statusCounts = FILTER_TABS.reduce((acc, tab) => {
        acc[tab.key] = tab.key === 'all' ? orders.length : orders.filter(o => matchesFilter(o.status, tab.key)).length;
        return acc;
    }, {});

    if (loading) return (
        <div className="shan-fade-in" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)', fontWeight: '600', gap: '14px' }}>
            <div className="shan-spin" />
            Loading Orders...
        </div>
    );

    return (
        <div className="shan-page" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', fontFamily: 'var(--font-sans, sans-serif)', padding: '28px 36px', color: 'var(--text-primary)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Layout size={28} color="var(--accent-color)" /> Order Management
                </h1>

                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                        <Search size={18} />
                    </span>
                    <input
                        placeholder="Search by customer or product…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="shan-input"
                        style={{ padding: '10px 16px 10px 40px', width: '300px', fontSize: '14px', fontWeight: '500' }}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterTab(tab.key)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                            border: filterTab === tab.key ? 'none' : '1px solid var(--border-color)',
                            background: filterTab === tab.key ? 'var(--accent-color)' : 'var(--card-bg)',
                            color: filterTab === tab.key ? '#fff' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: filterTab === tab.key ? '0 4px 20px var(--accent-glow)' : 'none'
                        }}
                    >
                        {tab.label}
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: filterTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--surface-muted)',
                            color: filterTab === tab.key ? '#fff' : 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800'
                        }}>
                            {statusCounts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="shan-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1fr 80px', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
                    {['Customer', 'Product', 'Status', 'Needed By', 'Priority', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</div>
                    ))}
                </div>

                {filteredOrders.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                            <ClipboardList size={40} />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>No orders found</div>
                        <div style={{ fontSize: '13px', marginTop: '6px' }}>Try adjusting your search or filter</div>
                    </div>
                ) : (
                    filteredOrders.map((order, idx) => {
                        const deadline = order.printSpecs?.deadline || order.shopOrderId?.deadline || order.deadline || order.requestId?.deadline;
                        const priority = order.printSpecs?.priority || order.shopOrderId?.priority || order.priority;
                        const rawKey = (order.status || '').trim().toLowerCase();
                        const isProduction = ['scheduled', 'confirmed', 'in_progress', 'in progress', 'printing'].includes(rawKey);
                        const isOverdue = deadline && new Date(deadline) < new Date() && rawKey !== 'completed';

                        return (
                            <div
                                key={order._id}
                                className="order-row"
                                onClick={() => navigate(`/orders/${order._id}`)}
                                style={{
                                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1fr 80px',
                                    padding: '16px 24px', borderBottom: idx < filteredOrders.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    cursor: 'pointer', alignItems: 'center',
                                    background: 'var(--card-bg)'
                                }}
                            >
                                {/* Customer */}
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-primary)' }}>
                                        {order.customerName || 'Unnamed Customer'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>
                                        #{order._id.slice(-6).toUpperCase()}
                                    </div>
                                </div>

                                {/* Product */}
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                        {order.printSpecs?.designType || 'General'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {order.printSpecs?.size
                                            ? `${order.printSpecs.size.width}×${order.printSpecs.size.height}${order.printSpecs.size.unit || 'mm'}`
                                            : order.printSpecs?.quantity ? `Qty: ${order.printSpecs.quantity}` : '—'}
                                    </div>
                                </div>

                                {/* Status */}
                                <div><StatusBadge rawStatus={order.status} /></div>

                                {/* Needed By */}
                                <div>
                                    {deadline ? (
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: isOverdue ? '#f87171' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {isOverdue && <AlertCircle size={14} />}
                                            {new Date(deadline).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>—</span>
                                    )}
                                </div>

                                {/* Priority */}
                                <div><PriorityBadge priority={priority} /></div>

                                {/* Arrow */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--text-secondary)' }}>
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {filteredOrders.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}
                    className="shan-fade-in"
                >
                    Showing {filteredOrders.length} of {orders.length} orders
                </div>
            )}
        </div>
    );
};

export default OrderList;
