import React, { useState } from 'react';
import ScheduleForm from './ScheduleForm';

const STATUS_CONFIG = {
    scheduled: { label: 'Awaiting Assignment', color: '#f59e0b', bg: '#fffbeb' },
    confirmed: { label: 'Assigned to Machine', color: '#3b82f6', bg: '#eff6ff' },
    in_progress: { label: 'Printing', color: '#8b5cf6', bg: '#f5f3ff' },
    completed: { label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
    machine_maintenance: { label: 'Machine Under Maintenance', color: '#ef4444', bg: '#fef2f2' },
};

const thStyle = { padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '20px 16px', fontSize: '14px', borderBottom: '1px solid #f8fafc' };



const Icons = {
    Back: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    ),
    Empty: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
            <polyline points="3.29 7 12 12 20.71 7"></polyline>
            <line x1="12" y1="22" x2="12" y2="12"></line>
        </svg>
    ),
    Delete: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    ),
    Done: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )
};

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
                             handleStartTimeChange,
                             handleEstChange,
                             onBack,
                             handleDeleteOrder,
                             showToast
                         }) => {
    const [sortBy, setSortBy] = useState('default'); // 'default', 'timeline', 'priority'

    const awaiting = orders.filter(o => o.status === 'scheduled').length;
    const assigned = orders.filter(o => o.status === 'confirmed').length;
    const printing = orders.filter(o => o.status === 'in_progress').length;
    const done = orders.filter(o => o.status === 'completed').length;

    // Sorting logic: prioritize machine_maintenance and scheduled (unassigned), demote completed
    const getStatusPriority = (status) => {
        if (status === 'machine_maintenance') return 1;
        if (status === 'scheduled') return 2; // Awaiting Assignment
        if (status === 'completed') return 4; // Completed goes to the bottom
        return 3; // Others (confirmed, in_progress)
    };

    const getPriorityWeight = (prio) => {
        const p = (prio || 'normal').toLowerCase();
        if (p === 'urgent' || p === 'ugent' || p === 'high') return 1;
        return 2;
    };

    const sortedOrders = [...orders].sort((a, b) => {
        if (sortBy === 'priority') {
            const prioA = getPriorityWeight(a.priority);
            const prioB = getPriorityWeight(b.priority);
            if (prioA !== prioB) return prioA - prioB;

            const statusA = getStatusPriority(a.status);
            const statusB = getStatusPriority(b.status);
            if (statusA !== statusB) return statusA - statusB;

            const timeA = new Date(a.scheduledStart || a.deadline || 8640000000000000).getTime();
            const timeB = new Date(b.scheduledStart || b.deadline || 8640000000000000).getTime();
            return (isNaN(timeA) ? Infinity : timeA) - (isNaN(timeB) ? Infinity : timeB);
        }

        if (sortBy === 'timeline') {
            const timeA = new Date(a.scheduledStart || a.deadline || 8640000000000000).getTime();
            const timeB = new Date(b.scheduledStart || b.deadline || 8640000000000000).getTime();
            const validTimeA = isNaN(timeA) ? Infinity : timeA;
            const validTimeB = isNaN(timeB) ? Infinity : timeB;
            if (validTimeA !== validTimeB) return validTimeA - validTimeB;

            const endA = new Date(a.scheduledEnd || 8640000000000000).getTime();
            const endB = new Date(b.scheduledEnd || 8640000000000000).getTime();
            const validEndA = isNaN(endA) ? Infinity : endA;
            const validEndB = isNaN(endB) ? Infinity : endB;
            return validEndA - validEndB;
        }

        // Default
        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        const timeA = new Date(a.scheduledStart || a.deadline || 8640000000000000).getTime();
        const timeB = new Date(b.scheduledStart || b.deadline || 8640000000000000).getTime();

        const validTimeA = isNaN(timeA) ? Infinity : timeA;
        const validTimeB = isNaN(timeB) ? Infinity : timeB;

        return validTimeA - validTimeB;
    });

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
                        orders={orders}
                        showToast={showToast}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
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
                            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Production Queue</h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <option value="default">Status & Deadline based</option>
                                <option value="timeline">Schedule Based</option>
                                <option value="priority">Priority based</option>
                            </select>
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 32px', color: '#94a3b8' }}>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <Icons.Empty />
                            </div>
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
                                    <th style={thStyle}>Qty</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Assignee</th>
                                    <th style={thStyle}>Machine</th>
                                    <th style={thStyle}>Timeline</th>
                                    <th style={thStyle}>Control</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedOrders.map(order => {
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
                                                        {prioLabel}
                                                    </span>
                                            </td>
                                            <td style={tdStyle}>
                                                    <span style={{ background: '#f1f5f9', padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                                                        {(order.jobType || '').toUpperCase()}
                                                    </span>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: '700', color: '#334155' }}>{order.quantity || '—'}</td>
                                            <td style={tdStyle}>
                                                    <span style={{ background: cfg.bg, color: cfg.color, padding: '6px 16px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' }}>
                                                        {cfg.label}
                                                    </span>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: '700', color: opName === 'Unassigned' ? '#94a3b8' : '#334155' }}>{opName}</td>
                                            <td style={{ ...tdStyle, fontWeight: '700', color: '#334155' }}>{machineName}</td>
                                            <td style={{ ...tdStyle, fontWeight: '800', color: '#0f172a', fontSize: '11px' }}>
                                                {order.scheduledStart ?
                                                    <div style={{ lineHeight: 1.4 }}>
                                                        <div>
                                                            <span style={{ color: '#64748b' }}>S:</span> {new Date(order.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(order.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        {order.scheduledEnd && (
                                                            <div style={{ marginTop: '2px' }}>
                                                                <span style={{ color: '#64748b' }}>E:</span> {new Date(order.scheduledEnd).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(order.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    : (order.deadline ? <span style={{ color: '#ef4444' }}>Requested date: {new Date(order.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span> : '—')
                                                }
                                            </td>
                                            <td style={tdStyle}>
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
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => handleReschedule(order)}
                                                                    style={{
                                                                        background: order.status === 'machine_maintenance' ? '#ef4444' : '#fff',
                                                                        color: order.status === 'machine_maintenance' ? '#fff' : '#334155',
                                                                        border: order.status === 'machine_maintenance' ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                                                                        padding: '10px 18px',
                                                                        borderRadius: '12px',
                                                                        fontWeight: '800',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        transition: 'all 0.2s',
                                                                        boxShadow: order.status === 'machine_maintenance' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none'
                                                                    }}>
                                                                RESCHEDULE
                                                            </button>
                                                            <button onClick={() => {
                                                                if (window.confirm("Are you sure you want to delete this order?")) {
                                                                    handleDeleteOrder(order._id);
                                                                }
                                                            }}
                                                                    style={{ background: '#fff', color: '#ef4444', border: '1.5px solid #fee2e2', padding: '10px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    title="Delete Order"
                                                            >
                                                                <Icons.Delete />
                                                            </button>
                                                        </div>
                                                    ) :
                                                    <span style={{ color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                            DONE <Icons.Done />
                                                        </span>
                                                }
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
