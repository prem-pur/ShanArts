import React, { useState } from 'react';

const STATUS_CONFIG = {
    scheduled: { label: 'Awaiting', color: '#111827', bg: '#f1f5f9' },
    confirmed: { label: 'Assigned', color: '#111827', bg: '#f1f5f9' },
    in_progress: { label: 'Printing', color: '#ef4444', bg: '#fef2f2' },
    completed: { label: 'Completed', color: '#64748b', bg: '#f8fafc' },
};



const Icons = {
    Back: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    ),
    NoOperators: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    )
};

const OperatorsDashboard = ({ operators, orders, machineStats, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const operatorWorkloads = operators.map(op => ({
        ...op,
        tasks: orders.filter(o =>
            (o.assignedOperatorId?._id || o.assignedOperatorId) === op._id && o.status !== 'completed'
        )
    }));

    const filteredOperators = operatorWorkloads.filter(op => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return op.name.toLowerCase().includes(term) || (op.role || '').toLowerCase().includes(term);
    });

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                                color: '#0f172a',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Icons.Back />
                        </button>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#111827' }}>Production Operators</h3>
                    </div>
                    <div style={{ minWidth: '280px', width: '100%', maxWidth: '360px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <span style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none'
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4a7 7 0 1 0 4.9 12.1l4 4a1 1 0 0 0 1.4-1.4l-4-4A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" fill="#9ca3af"/>
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search operators..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    color: '#111827',
                                    outline: 'none',
                                    boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.06)'
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                    {filteredOperators.map(op => (
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
                                        color: '#64748b',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: '18px', color: '#111827' }}>{op.name}</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {(op.role || '').replace('_', ' ').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: op.tasks.length > 0 ? '#111827' : '#f9fafb',
                                    color: op.tasks.length > 0 ? '#fff' : '#9ca3af',
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
                    {filteredOperators.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', gridColumn: '1/-1' }}>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                <Icons.NoOperators />
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '18px' }}>{operators.length === 0 ? 'No operators available' : 'No operators match your search'}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OperatorsDashboard;
