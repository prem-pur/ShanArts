import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    AlertTriangle,
    Calendar,
    Palette,
    XCircle,
    Clock,
    User,
    Store,
    Truck,
    Car,
    Flame,
    Box,
    Printer,
    FileText,
    Image,
    File,
    Check
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';

const STATUS_MAP = {
    'draft':              { label: 'Draft',               color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
    'design in progress': { label: 'Design In Progress',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    'pending_design':     { label: 'Pending Design',      color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    'waiting_approval':   { label: 'Waiting Approval',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'waiting approval':   { label: 'Waiting Approval',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'sent to customer':   { label: 'Sent to Customer',    color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
    'revision_requested': { label: 'Revision Requested',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'revision requested': { label: 'Revision Requested',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'rejected':           { label: 'Rejected',             color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    'approved':           { label: 'Approved',             color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    'scheduled':          { label: 'Scheduled',            color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
    'confirmed':          { label: 'Confirmed',            color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
    'in_progress':        { label: 'In Progress',          color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'in progress':        { label: 'In Progress',          color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    'printing':           { label: 'Printing',             color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'machine_maintenance':{ label: 'Machine Maintenance',  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    'completed':          { label: 'Completed',            color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};

const getStatusConf = (raw) => {
    const key = (raw || '').trim().toLowerCase();
    return STATUS_MAP[key] || { label: raw || 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
};

const PriorityBadge = ({ priority }) => {
    const isUrgent = (priority || '').toLowerCase() === 'urgent';
    return isUrgent ? (
        <span style={{
            padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900',
            background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', textTransform: 'uppercase'
        }}>Urgent</span>
    ) : (
        <span style={{
            padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
            background: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', textTransform: 'uppercase'
        }}>Normal</span>
    );
};

const InfoRow = ({ label, value, accent }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '800', color: accent || 'var(--text-primary)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
);

const SectionCard = ({ title, icon, children, style, className = '' }) => (
    <div className={className} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', boxShadow: 'var(--shadow-sm)', ...style }}>
        {title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>{icon}</span>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</h3>
            </div>
        )}
        {children}
    </div>
);

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [shopOrder, setShopOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = useCallback(() => {
        axios.get(`${API_BASE_URL}/api/orders`)
            .then(res => {
                const found = res.data.find(o => o._id === id);
                setOrder(found || null);
                return found;
            })
            .then(found => {
                if (found?.shopOrderId) {
                    // Check if shopOrderId is already a populated object
                    if (typeof found.shopOrderId === 'object' && found.shopOrderId._id) {
                        setShopOrder(found.shopOrderId);
                        return;
                    }
                    const token = localStorage.getItem('token');
                    return axios.get(`${API_BASE_URL}/api/shop-orders/${found.shopOrderId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(r => setShopOrder(r.data)).catch(() => setShopOrder(null));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { fetchOrder(); }, [fetchOrder]);

    if (loading) return (
        <div className="shan-fade-in" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)', fontWeight: '600', gap: '14px' }}>
            <div className="shan-spin" />
            Loading Order...
        </div>
    );

    if (!order) return (
        <div className="shan-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)', fontWeight: '600', gap: '16px' }}>
            <div style={{ color: 'var(--text-secondary)' }}><Search size={48} /></div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Order not found</div>
            <button type="button" onClick={() => navigate('/orders')} className="shan-btn-primary" style={{ padding: '10px 20px' }}>Back to Orders</button>
        </div>
    );

    const statusConf = getStatusConf(order.status);
    const deadline = order.printSpecs?.deadline || shopOrder?.deadline || order.deadline;
    const rawKey = (order.status || '').trim().toLowerCase();
    const isOverdue = deadline && new Date(deadline) < new Date() && rawKey !== 'completed';

    const preferences = shopOrder?.preferences || order.printSpecs?.preferences || order.requestId?.textContent || '';
    const deliveryMethod = shopOrder?.deliveryMethod || order.printSpecs?.deliveryMethod || order.deliveryMethod;
    const address = shopOrder?.address || order.printSpecs?.address || order.address;
    const phone = shopOrder?.customerPhone || order.printSpecs?.customerPhone || order.customerPhone;
    const priority = order.printSpecs?.priority || shopOrder?.priority || order.priority;

    // Parse revision notes
    let revisionReason = '', revisionChanges = '';
    if (order.revisionNotes) {
        const reasonMatch = order.revisionNotes.match(/REASON:\s*([\s\S]*?)(?=\n\nWHAT TO CHANGE:|$)/);
        const changesMatch = order.revisionNotes.match(/WHAT TO CHANGE:\s*([\s\S]*?)$/);
        revisionReason = reasonMatch ? reasonMatch[1].trim() : order.revisionNotes;
        revisionChanges = changesMatch ? changesMatch[1].trim() : '';
    }

    return (
        <div className="shan-page" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', fontFamily: 'var(--font-sans, sans-serif)', padding: '28px 36px', color: 'var(--text-primary)' }}>

            {/* Header */}
            <div className="shan-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/orders')}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-muted)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                                {order.customerName || 'Unnamed Order'}
                            </h1>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}`,
                                textTransform: 'uppercase', letterSpacing: '0.5px'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusConf.color, display: 'inline-block', marginRight: '5px', verticalAlign: 'middle' }} />
                                {statusConf.label}
                            </span>
                            <PriorityBadge priority={priority} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Order #{order._id.slice(-8).toUpperCase()}
                            {deadline && (
                                <span style={{ marginLeft: '6px', color: isOverdue ? '#f87171' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {isOverdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                                    {isOverdue ? 'Overdue — ' : 'Needed by '}
                                    {new Date(deadline).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Rejection Banner */}
            {(rawKey === 'rejected' || rawKey === 'revision_requested' || rawKey === 'revision requested') && order.revisionNotes && (
                <div className="shan-fade-in" style={{ background: 'rgba(127, 29, 29, 0.2)', border: '1.5px solid rgba(248, 113, 113, 0.45)', borderRadius: '14px', padding: '18px 22px', marginBottom: '24px' }}>
                    <div style={{ fontWeight: '900', color: '#fca5a5', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <XCircle size={16} /> Design Rejected — Revision Required
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: revisionChanges ? '1fr 1fr' : '1fr', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Reason</div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: '600', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                "{revisionReason}"
                            </p>
                        </div>
                        {revisionChanges && (
                            <div>
                                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Changes Requested</div>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: '600', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    "{revisionChanges}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Expanded Order Timeline */}
            <SectionCard title="Production Process Timeline" icon={<Clock size={18} />} className="shan-fade-in" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {[
                        { label: 'Order Placed', desc: 'Order received', done: true, date: new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }) },
                        { label: 'Design Phase', desc: 'Working on request', done: rawKey !== 'draft' || !!order.currentVersionId },
                        { label: 'Pending Approval', desc: 'Sent for review', done: ['sent to customer', 'approved', 'rejected', 'revision_requested', 'revision requested', 'completed', 'scheduled', 'in_progress', 'printing', 'machine_maintenance'].includes(rawKey) },
                        { label: 'Approved', desc: 'Design confirmed', done: ['approved', 'completed', 'scheduled', 'in_progress', 'printing', 'machine_maintenance'].includes(rawKey) },
                        { label: 'Scheduled', desc: 'In queue', done: ['scheduled', 'in_progress', 'printing', 'machine_maintenance', 'completed'].includes(rawKey) },
                        { label: 'Production', desc: 'Printing/Progress', done: ['in_progress', 'printing', 'machine_maintenance', 'completed'].includes(rawKey) },
                        { label: 'Completed', desc: 'Finished & ready', done: rawKey === 'completed' },
                    ].map((step, i, arr) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', flex: 1, minWidth: '110px' }}>
                            {i < arr.length - 1 && <div style={{ position: 'absolute', left: '50%', top: '13px', width: '100%', height: '2px', background: step.done ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)', zIndex: 0 }} />}
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: step.done ? '#059669' : 'var(--surface-muted)', border: `2px solid ${step.done ? '#059669' : 'var(--border-color)'}`, zIndex: 1, boxShadow: step.done ? '0 0 0 3px rgba(16, 185, 129, 0.25)' : 'none',
                                marginBottom: '12px'
                            }}>
                                {step.done ? (
                                    <Check size={14} color="#fff" strokeWidth={3} />
                                ) : (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-secondary)' }} />
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: step.done ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: '1.3' }}>{step.label}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500', lineHeight: '1.3' }}>{step.desc}</div>
                                {step.date && <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '700' }}>{step.date}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Main Grid */}
            <div className="shan-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Customer Info */}
                    <SectionCard title="Customer Information" icon={<User size={18} />}>
                        <InfoRow label="Name" value={order.customerName} />
                        <InfoRow label="Phone" value={phone} />
                        <InfoRow label="Delivery" value={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {deliveryMethod === 'pickup' ? <Store size={14} /> :
                                    deliveryMethod === 'delivery' ? <Truck size={14} /> :
                                        deliveryMethod === 'pickme' ? <Car size={14} /> : null}
                                {deliveryMethod === 'pickup' ? 'Pickup' :
                                    deliveryMethod === 'delivery' ? 'Delivery' :
                                        deliveryMethod === 'pickme' ? 'PickMe' :
                                            deliveryMethod}
                            </span>
                        } />
                        {address && (deliveryMethod === 'delivery' || deliveryMethod === 'pickme') && (
                            <InfoRow label="Address" value={[address.street, address.city, address.postalCode].filter(Boolean).join(', ')} />
                        )}
                        <InfoRow label="Priority" value={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {priority === 'urgent' ? <Flame size={14} color="#dc2626" /> : <Box size={14} />}
                                {priority === 'urgent' ? 'Urgent' : 'Normal'}
                            </span>
                        } accent={priority === 'urgent' ? '#dc2626' : undefined} />
                        {deadline && (
                            <InfoRow
                                label="Needed By"
                                value={new Date(deadline).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                accent={isOverdue ? '#dc2626' : undefined}
                            />
                        )}
                        <InfoRow label="Order Date" value={new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })} />
                    </SectionCard>

                    {/* Print Specifications */}
                    <SectionCard title="Print Specifications" icon={<Printer size={18} />}>
                        <InfoRow label="Product" value={order.printSpecs?.designType} />
                        <InfoRow label="Size" value={
                            order.printSpecs?.size
                                ? `${order.printSpecs.size.width}×${order.printSpecs.size.height} ${order.printSpecs.size.unit || 'mm'}`
                                : shopOrder?.dimensions
                                    ? `${shopOrder.dimensions.width}×${shopOrder.dimensions.height} ${shopOrder.dimensions.unit || 'mm'}`
                                    : null
                        } />
                        <InfoRow label="Quantity" value={order.printSpecs?.quantity || shopOrder?.quantity} />
                        <InfoRow label="Material" value={order.printSpecs?.material || 'Standard'} />
                        {shopOrder?.jobType && <InfoRow label="Job Type" value={shopOrder.jobType.replace(/_/g, ' ')} />}
                    </SectionCard>

                    {/* Customer Brief */}
                    <SectionCard title="Customer Brief & Preferences" icon={<FileText size={18} />}>
                        {preferences ? (
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', background: 'var(--input-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', fontWeight: '500' }}>
                                {preferences}
                            </div>
                        ) : (
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center', padding: '20px 0' }}>
                                No special instructions provided.
                            </div>
                        )}

                        {/* Sample Photo */}
                        {(shopOrder?.samplePhoto || order.printSpecs?.samplePhoto) && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reference Photo</div>
                                <img
                                    src={`${API_BASE_URL}${shopOrder?.samplePhoto || order.printSpecs?.samplePhoto}`}
                                    alt="Customer sample"
                                    style={{ width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', objectFit: 'cover', maxHeight: '200px', cursor: 'pointer' }}
                                    onClick={() => window.open(`${API_BASE_URL}${shopOrder?.samplePhoto || order.printSpecs?.samplePhoto}`, '_blank')}
                                />
                            </div>
                        )}

                        {/* Design Files */}
                        {shopOrder?.designFiles?.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uploaded Design Files</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {shopOrder.designFiles.map((filePath, i) => {
                                        const fileName = filePath.split('/').pop();
                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isImage ? <Image size={14} /> : <File size={14} />} {fileName}
                                                </span>
                                                <a href={`${API_BASE_URL}${filePath}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800', textDecoration: 'none' }}>VIEW</a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Design Preview */}
                    <SectionCard title="Design Preview" icon={<Palette size={18} />}>
                        <div style={{ background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                            {order.currentVersionId ? (
                                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                    <img
                                        src={`${API_BASE_URL}${order.currentVersionId.pngFilePath}`}
                                        alt="Design Preview"
                                        style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                                        <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Check size={12} strokeWidth={3} /> Design Created
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Image size={48} /></div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>No design yet</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>The design preview will appear here once it has been created by the designer.</div>
                                </div>
                            )}
                        </div>

                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
