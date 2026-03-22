import React from 'react';

const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
};

const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    fontSize: '15px',
    fontWeight: '500',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
};

const ScheduleForm = ({
    selectedOrder,
    setSelectedOrder,
    operators,
    machines,
    assignment,
    setAssignment,
    handleAssign,
    handleStartTimeChange
}) => {
    if (!selectedOrder) return null;

    const isRescheduling = selectedOrder.status !== 'scheduled';

    // Formatting date/time for "Current Status"
    const formatDateTime = (dt) => {
        if (!dt) return 'N/A';
        return new Date(dt).toLocaleString([], {
            month: 'numeric', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
        });
    };

    return (
        <div style={{
            background: '#fff',
            borderRadius: '28px',
            padding: '36px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            width: '100%',
            maxWidth: isRescheduling ? '480px' : '440px',
            position: 'relative',
            animation: 'slideIn 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#334155', margin: 0, letterSpacing: '-0.5px' }}>
                    {isRescheduling ? 'Reschedule Job' : 'Assign Job'}
                </h3>
                <button
                    onClick={() => setSelectedOrder(null)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '24px',
                        fontWeight: '300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>✕</button>
            </div>

            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {isRescheduling ? (
                    /* --- RESCHEDULE SPECIFIC LAYOUT --- */
                    <>
                        <div style={{
                            background: '#f8fafc',
                            padding: '24px',
                            borderRadius: '16px',
                            borderLeft: '5px solid #0f172a',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                                <div><span style={{ color: '#64748b' }}>Order:</span> <strong style={{ color: '#1e293b' }}>{selectedOrder.orderNumber}</strong></div>
                                {selectedOrder.priority && (
                                    <div>
                                        <span style={{ color: '#64748b' }}>Priority:</span>
                                        <strong style={{
                                            marginLeft: '8px',
                                            color: (selectedOrder.priority.toLowerCase() === 'urgent' || selectedOrder.priority.toLowerCase() === 'ugent' || selectedOrder.priority.toLowerCase() === 'high') ? '#ef4444' : '#1e293b'
                                        }}>
                                            {(selectedOrder.priority.toLowerCase() === 'urgent' || selectedOrder.priority.toLowerCase() === 'ugent' || selectedOrder.priority.toLowerCase() === 'high') ? '🔥 ' : ''}
                                            {selectedOrder.priority.toUpperCase()}
                                        </strong>
                                    </div>
                                )}
                                <div><span style={{ color: '#64748b' }}>Current Machine:</span> <strong style={{ color: '#1e293b' }}>{selectedOrder.assignedMachineId?.name || 'N/A'}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Current Operator:</span> <strong style={{ color: '#1e293b' }}>{selectedOrder.assignedOperatorId?.name || 'N/A'}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Current Start:</span> <strong style={{ color: '#1e293b' }}>{formatDateTime(selectedOrder.scheduledStart)}</strong></div>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>NEW MACHINE</label>
                            <select
                                style={inputStyle}
                                value={assignment.assignedMachineId}
                                onChange={(e) => setAssignment({ ...assignment, assignedMachineId: e.target.value })}
                                required
                            >
                                <option value="">Select Machine...</option>
                                {machines.map(m => (
                                    <option key={m._id} value={m._id}>{m.name} ({m.type || 'N/A'})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>NEW OPERATOR</label>
                            <select
                                style={inputStyle}
                                value={assignment.assignedOperatorId}
                                onChange={(e) => setAssignment({ ...assignment, assignedOperatorId: e.target.value })}
                                required
                            >
                                <option value="">Choose Operator...</option>
                                {operators.map(op => (
                                    <option key={op._id} value={op._id}>{op.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>NEW START TIME *</label>
                            <input
                                type="datetime-local"
                                style={inputStyle}
                                value={assignment.scheduledStart}
                                onChange={(e) => handleStartTimeChange(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>REASON FOR RESCHEDULE</label>
                            <textarea
                                style={{ ...inputStyle, height: '100px', resize: 'none' }}
                                placeholder="E.g., Machine breakdown, operator unavailable..."
                                value={assignment.rescheduleReason || ''}
                                onChange={(e) => setAssignment({ ...assignment, rescheduleReason: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    background: '#fff',
                                    color: '#64748b',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >Cancel</button>
                            <button
                                type="submit"
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#d90404',
                                    color: '#fff',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    minWidth: '120px'
                                }}
                            >Reschedule</button>
                        </div>
                    </>
                ) : (
                    /* --- ASSIGN SPECIFIC LAYOUT --- */
                    <>
                        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                                Order Details
                            </div>
                            <div style={{ fontWeight: '900', fontSize: '24px', color: '#0f172a', marginBottom: '4px' }}>#{selectedOrder.orderNumber}</div>
                            <div style={{ fontSize: '15px', color: '#475569', fontWeight: '700', marginBottom: '16px' }}>
                                {(selectedOrder.jobType || '').toUpperCase()} • Qty: {selectedOrder.quantity || 'N/A'}
                                {selectedOrder.priority && (
                                    <span style={{ marginLeft: '12px', color: selectedOrder.priority.toLowerCase() === 'urgent' ? '#ef4444' : '#64748b' }}>
                                        • {selectedOrder.priority.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#ef4444',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                📅 Requested Deadline: {selectedOrder.deadline ? new Date(selectedOrder.deadline).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>OPERATOR</label>
                            <select
                                style={inputStyle}
                                value={assignment.assignedOperatorId}
                                onChange={(e) => setAssignment({ ...assignment, assignedOperatorId: e.target.value })}
                                required
                            >
                                <option value="">Choose Operator...</option>
                                {operators.map(op => (
                                    <option key={op._id} value={op._id}>{op.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>MACHINE</label>
                            <select
                                style={inputStyle}
                                value={assignment.assignedMachineId}
                                onChange={(e) => setAssignment({ ...assignment, assignedMachineId: e.target.value })}
                                required
                            >
                                <option value="">Select Machine...</option>
                                {machines
                                    .filter(m => m.status === 'Available' || (selectedOrder.assignedMachineId?._id === m._id))
                                    .map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.type || 'N/A'})</option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>START TIME</label>
                            <input
                                type="datetime-local"
                                style={inputStyle}
                                value={assignment.scheduledStart}
                                onChange={(e) => handleStartTimeChange(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginTop: '8px' }}>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    background: '#0f172a',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '22px',
                                    borderRadius: '18px',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >
                                CONFIRM & ASSIGN
                            </button>
                        </div>
                    </>
                )}
            </form>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                select:focus, input:focus, textarea:focus {
                    border-color: #0f172a !important;
                    box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
                }
            `}</style>
        </div>
    );
};

export default ScheduleForm;
