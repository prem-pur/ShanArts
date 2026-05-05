import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    Bell,
    Search,
    Image as ImageIcon,
    Palette,
    Clock,
    ChevronRight,
    Layout
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';
import DesignWorkspaceTools from '../../components/DesignWorkspaceTools';
import { useMatchMedia } from '../../hooks/useMatchMedia';

const STATUS_MAP = {
    'draft':              { label: 'Draft',               color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
    'design in progress': { label: 'Design In Progress',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    'pending_design':     { label: 'Pending Design',      color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    'waiting_approval':   { label: 'Waiting Approval',    color: '#ff3333', bg: '#fee2e2', border: '#fecaca' },
    'waiting approval':   { label: 'Waiting Approval',    color: '#ff3333', bg: '#fee2e2', border: '#fecaca' },
    'sent to customer':   { label: 'Sent to Customer',    color: '#ff3333', bg: '#fee2e2', border: '#fecaca' },
    'revision_requested': { label: 'Revision Requested',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'revision requested': { label: 'Revision Requested',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'rejected':           { label: 'Rejected',             color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'approved':           { label: 'Approved',             color: '#ff3333', bg: 'var(--surface-muted)', border: 'var(--border-color)' },
    'scheduled':          { label: 'Scheduled',            color: '#cc0000', bg: '#fee2e2', border: '#fecaca' },
    'confirmed':          { label: 'Confirmed',            color: '#cc0000', bg: '#fee2e2', border: '#fecaca' },
    'in_progress':        { label: 'In Progress',          color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'in progress':        { label: 'In Progress',          color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'printing':           { label: 'Printing',             color: '#cc0000', bg: '#fee2e2', border: '#fecaca' },
    'machine_maintenance':{ label: 'Machine Maintenance',  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    'completed':          { label: 'Completed',            color: '#ff3333', bg: 'var(--surface-muted)', border: 'var(--border-color)' },
};

const getStatusConf = (raw) => {
    const key = (raw || '').trim().toLowerCase();
    return STATUS_MAP[key] || { label: raw || 'Draft', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
};

const PriorityBadge = ({ priority }) => {
    const isUrgent = (priority || '').toLowerCase() === 'urgent';
    return isUrgent ? (
        <span style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900',
            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', textTransform: 'uppercase'
        }}>Urgent</span>
    ) : (
        <span style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
            background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', textTransform: 'uppercase'
        }}>Normal</span>
    );
};

const DesignWorkspaceCardView = () => {
    const navigate = useNavigate();
    const isCompact = useMatchMedia('(max-width: 900px)');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All Projects');
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
        const interval = setInterval(fetchOrders, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const newOrdersCount = orders.filter(o => {
        const key = (o.status || '').trim().toLowerCase();
        return key === 'draft' || key === 'pending_design' || key === 'design in progress';
    }).length;

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesSearch = (order.customerName || '').toLowerCase().includes(term) ||
                    (order.printSpecs?.designType || '').toLowerCase().includes(term);
                if (!matchesSearch) return false;
            }

            const rawKey = (order.status || '').trim().toLowerCase();
            const label = STATUS_MAP[rawKey]?.label || 'Draft';

            if (filterStatus === 'All Projects') return true;
            if (filterStatus === 'Draft' && (label === 'Draft' || label === 'Design In Progress' || label === 'Pending Design')) return true;
            if (filterStatus === 'Sent to Customer' && (label === 'Sent to Customer' || label === 'Waiting Approval')) return true;
            if (filterStatus === 'Rejected' && (label === 'Rejected' || label === 'Revision Requested')) return true;
            if (filterStatus === 'Approved' && (label === 'Approved' || label === 'Completed' || label === 'Scheduled' || label === 'In Progress' || label === 'Printing' || label === 'Machine Maintenance')) return true;

            return false;
        });
    }, [orders, filterStatus, searchTerm]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin' && user.role !== 'staff_designer') {
        if (user.role === 'customer') {
            return <Navigate to="/customer-home" replace />;
        }
        if (!user.role) {
            return <Navigate to="/" replace />;
        }
        return <Navigate to="/admin-dashboard" replace />;
    }

    if (loading) return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading workspace...</div>
    );

    return (
        <div className="shan-page" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', fontFamily: 'var(--font-sans, sans-serif)', padding: isCompact ? 'clamp(14px, 4vw, 24px)' : '28px 36px', color: 'var(--text-primary)', boxSizing: 'border-box', maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Banner */}
            {newOrdersCount > 0 && (
                <div style={{ background: 'rgba(255, 51, 51, 0.12)', borderRadius: '14px', border: '1px solid rgba(255, 51, 51, 0.35)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-color)' }}>
                        <Bell size={20} />
                        <span style={{ fontWeight: '800', fontSize: '15px' }}>{newOrdersCount} New Orders to Design</span>
                    </div>
                    <button
                        onClick={() => setFilterStatus('Draft')}
                        style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>
                        View New Orders
                    </button>
                </div>
            )}

            <DesignWorkspaceTools />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompact ? 'flex-start' : 'center', flexWrap: 'wrap', gap: '16px', marginBottom: isCompact ? '28px' : '40px' }}>
                <h1 style={{ fontSize: isCompact ? 'clamp(1.1rem, 4vw, 1.45rem)' : '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <Layout size={isCompact ? 24 : 28} color="var(--accent-color)" /> Design Workspace
                </h1>

                <div style={{ position: 'relative', flex: isCompact ? '1 1 100%' : '0 1 auto', minWidth: 0, maxWidth: isCompact ? '100%' : 300 }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                        <Search size={18} />
                    </span>
                    <input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid var(--border-color)', width: '100%', outline: 'none', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {['All Projects', 'Draft', 'Sent to Customer', 'Approved', 'Rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilterStatus(tab)}
                        style={{
                            padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                            border: filterStatus === tab ? 'none' : '1px solid var(--border-color)',
                            background: filterStatus === tab ? 'var(--accent-color)' : 'var(--card-bg)',
                            color: filterStatus === tab ? '#fff' : 'var(--text-secondary)',
                            boxShadow: filterStatus === tab ? '0 4px 16px var(--accent-glow)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
                {filteredOrders.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', padding: '40px 0', fontWeight: '600' }}>No projects match your criteria.</div>
                ) : (
                    filteredOrders.map(order => {
                        const statusConf = getStatusConf(order.status);
                        const sizeText = order.printSpecs?.size ? `${order.printSpecs.size.width}x${order.printSpecs.size.height}${order.printSpecs.size.unit||'mm'}` : '';

                        return (
                            <div key={order._id} style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                        <ImageIcon size={20} />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', flex: 1 }}>
                                        <PriorityBadge priority={order.printSpecs?.priority || order.priority} />
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900',
                                            color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}`,
                                            textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}>
                                            {statusConf.label}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        {order.customerName || `Order #${order.orderId || order._id.slice(-6).toUpperCase()}`}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Palette size={14} strokeWidth={2.5} /> {order.printSpecs?.designType} {sizeText ? `• ${sizeText}` : ''}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => navigate('/design-editor', { state: { selectedOrderId: order._id } })}
                                        style={{
                                            background: 'var(--card-bg)', color: 'var(--accent-color)', border: '1.5px solid var(--accent-color)',
                                            padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '13px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-color)'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                                    >
                                        Studio <ChevronRight size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DesignWorkspaceCardView;
