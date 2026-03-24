import React from 'react';

const STATUS_CONFIG = {
    scheduled: { label: 'Awaiting', color: '#f59e0b', bg: '#fffbeb' },
    confirmed: { label: 'Assigned', color: '#3b82f6', bg: '#eff6ff' },
    in_progress: { label: 'Printing', color: '#8b5cf6', bg: '#f5f3ff' },
    completed: { label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
};



const OperatorsDashboard = ({ operators, orders, machineStats, onBack }) => {
    const operatorWorkloads = operators.map(op => ({
        ...op,
        tasks: orders.filter(o =>
            (o.assignedOperatorId?._id || o.assignedOperatorId) === op._id && o.status !== 'completed'
        )
    }));

    const awaiting = orders.filter(o => o.status === 'scheduled').length;
    const assigned = orders.filter(o => o.status === 'confirmed').length;
    const printing = orders.filter(o => o.status === 'in_progress').length;
    const done = orders.filter(o => o.status === 'completed').length;

    return (
        <div style={{ marginBottom: '32px' }}>


            <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid rgba(0,0,0,0.03)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: '#fff',
                            border: '1.5px solid #e2e8f0',
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '20px',
                            color: '#0f172a',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s'
                        }}
                    >
                        ←
                    </button>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#111827' }}>Production Operators</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                    {operatorWorkloads.map(op => (
                        <div key={op._id} style={{
                            border: '1.5px solid #f3f4f6',
                            borderRadius: '20px',
                            padding: '24px',
                            background: '#fff',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '14px',
                                        background: '#f9fafb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        👷
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: '18px', color: '#111827' }}>{op.name}</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {(op.role || '').replace('_', ' ').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: op.tasks.length > 0 ? '#eff6ff' : '#f9fafb',
                                    color: op.tasks.length > 0 ? '#3b82f6' : '#9ca3af',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: '900'
                                }}>
                                    {op.tasks.length} {op.tasks.length === 1 ? 'JOB' : 'JOBS'}
                                </div>
                            </div>

                            {op.tasks.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '24px',
                                    background: '#f9fafb',
                                    borderRadius: '16px',
                                    color: '#9ca3af',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    fontStyle: 'italic',
                                    border: '1px dashed #e5e7eb'
                                }}>
                                    No active assignments
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {op.tasks.map(order => {
                                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.scheduled;
                                        return (
                                            <div key={order._id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '14px 16px',
                                                background: 'rgba(248, 250, 252, 0.5)',
                                                borderRadius: '14px',
                                                border: '1px solid #f1f5f9'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#111827' }}>#{order.orderNumber}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>{(order.jobType || '').toUpperCase()}</div>
                                                        {order.priority && (order.priority.toLowerCase() === 'urgent' || order.priority.toLowerCase() === 'ugent' || order.priority.toLowerCase() === 'high') && (
                                                            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '900' }}>URGENT</span>
                                                        )}
                                                    </div>
                                                    {(order.scheduledStart || order.scheduledEnd) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                            {order.scheduledStart && (
                                                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ color: '#94a3b8', fontWeight: '700' }}>Start:</span>
                                                                    {new Date(order.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(order.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            )}
                                                            {order.scheduledEnd && (
                                                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ color: '#94a3b8', fontWeight: '700' }}>Est. End:</span>
                                                                    {new Date(order.scheduledEnd).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(order.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{
                                                    background: cfg.bg,
                                                    color: cfg.color,
                                                    padding: '4px 12px',
                                                    borderRadius: '99px',
                                                    fontSize: '10px',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                    {operators.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', gridColumn: '1/-1' }}>
                            <div style={{ fontSize: '56px', marginBottom: '16px' }}>👥</div>
                            <div style={{ fontWeight: '700', fontSize: '18px' }}>No operators available</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OperatorsDashboard;
