import React from 'react';
import ScheduleForm from './ScheduleForm';

const STATUS_CONFIG = {
    scheduled: { label: 'Awaiting Assignment', color: '#f59e0b', bg: '#fffbeb' },
    confirmed: { label: 'Assigned to Machine', color: '#3b82f6', bg: '#eff6ff' },
    in_progress: { label: 'Printing', color: '#8b5cf6', bg: '#f5f3ff' },
    completed: { label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
};

const thStyle = { padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '20px 16px', fontSize: '14px', borderBottom: '1px solid #f8fafc' };

const OrdersDashboard = ({
    orders,
    operators,
    machines,
    machineStats,
    selectedOrder,
    setSelectedOrder,
    assignment,
    setAssignment,
    handleAssign,
    handleReschedule,
    handleDeleteOrder,
    handleStartTimeChange,
    handleEstChange,
    onBack
}) => {
    return (
        <div style={{ marginBottom: '32px', position: 'relative' }}>
            {/* Modal Overlay for Assignment Form */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <ScheduleForm
                        selectedOrder={selectedOrder}
                        setSelectedOrder={setSelectedOrder}
                        operators={operators}
                        machines={machines}
                        assignment={assignment}
                        setAssignment={setAssignment}
                        handleAssign={handleAssign}
                        handleStartTimeChange={handleStartTimeChange}
                    />
                </div>
            )}

            <div style={{ transition: 'all 0.3s ease' }}>
                {/* Orders Table */}
                <div style={{
                    background: '#fff',
                    borderRadius: '28px',
                    padding: '32px',
                    border: '1px solid rgba(0,0,0,0.03)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '16px' }}>
                        <button
                            onClick={onBack}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: '#fff',
                                border: '1.5px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '20px',
                                color: '#64748b',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            ←
                        </button>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Production Queue</h1>
                    </div>

                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 32px', color: '#94a3b8' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
                            <div style={{ fontWeight: '800', fontSize: '20px', color: '#64748b' }}>Queue is empty</div>
                            <p style={{ marginTop: '8px', fontSize: '15px' }}>All production orders have been completed or cleared.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Order</th>
                                        <th style={thStyle}>Priority</th>
                                        <th style={thStyle}>Process</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Assignee</th>
                                        <th style={thStyle}>Machine</th>
                                        <th style={thStyle}>Timeline</th>
                                        <th style={thStyle}>Control</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => {
                                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.scheduled;
                                        const opName = order.assignedOperatorId?.name || 'Unassigned';
                                        const machineName = order.assignedMachineId?.name || '—';

                                        // Priority Styling
                                        const prio = (order.priority || 'normal').toLowerCase();
                                        const isUrgent = prio === 'urgent' || prio === 'ugent' || prio === 'high';
                                        const prioColor = isUrgent ? '#ef4444' : '#64748b';
                                        const prioBg = isUrgent ? '#fef2f2' : '#f8fafc';
                                        const prioLabel = isUrgent ? (prio === 'ugent' ? 'UGENT' : 'URGENT') : 'NORMAL';

                                        return (
                                            <tr key={order._id} style={{ transition: 'all 0.2s' }}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>#{order.orderNumber}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px', fontWeight: '600' }}>{order.customerId?.name}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{
                                                        color: prioColor,
                                                        fontWeight: '800',
                                                        fontSize: '11px',
                                                        background: prioBg,
                                                        padding: '5px 10px',
                                                        borderRadius: '8px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {isUrgent && '🔥'} {prioLabel}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ background: '#f1f5f9', padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                                                        {(order.jobType || '').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ background: cfg.bg, color: cfg.color, padding: '6px 16px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' }}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, fontWeight: '700', color: opName === 'Unassigned' ? '#94a3b8' : '#334155' }}>{opName}</td>
                                                <td style={{ ...tdStyle, fontWeight: '700', color: '#334155' }}>{machineName}</td>
                                                <td style={{ ...tdStyle, fontWeight: '800', color: '#ef4444', fontSize: '12px' }}>
                                                    {order.scheduledStart ?
                                                        <div style={{ lineHeight: 1.4 }}>
                                                            <div style={{ color: '#0f172a' }}>{new Date(order.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                                                {new Date(order.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        : (order.deadline ? `Deadline: ${new Date(order.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : '—')
                                                    }
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {order.status === 'scheduled' ? (
                                                            <button onClick={() => {
                                                                setSelectedOrder(order);
                                                                setAssignment({
                                                                    assignedOperatorId: '',
                                                                    assignedMachineId: (machines.filter(m => m.status === 'Available')[0]?._id || ''),
                                                                    estimatedCompletionTime: 4,
                                                                    scheduledStart: '',
                                                                    scheduledEnd: '',
                                                                    priority: 'normal'
                                                                });
                                                            }}
                                                                style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)' }}>
                                                                ASSIGN
                                                            </button>
                                                        ) : order.status !== 'completed' ? (
                                                            <button onClick={() => handleReschedule(order)}
                                                                style={{ background: '#fff', color: '#334155', border: '1.5px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>
                                                                RESCHEDULE
                                                            </button>
                                                        ) :
                                                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '800' }}>DONE ✅</span>
                                                        }

                                                        {order.status !== 'completed' && order.status !== 'scheduled' && (
                                                            <button
                                                                onClick={() => handleDeleteOrder(order._id)}
                                                                style={{
                                                                    background: '#fff',
                                                                    color: '#ef4444',
                                                                    border: '1.5px solid #fee2e2',
                                                                    width: '38px',
                                                                    height: '38px',
                                                                    borderRadius: '10px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    fontSize: '16px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    e.currentTarget.style.background = '#fef2f2';
                                                                    e.currentTarget.style.borderColor = '#fecaca';
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    e.currentTarget.style.background = '#fff';
                                                                    e.currentTarget.style.borderColor = '#fee2e2';
                                                                }}
                                                                title="Delete Order"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                tr:hover td {
                    background-color: #f8fafc;
                }
            `}</style>
        </div>
    );
};

export default OrdersDashboard;
