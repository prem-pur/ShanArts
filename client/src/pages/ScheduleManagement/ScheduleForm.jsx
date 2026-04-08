import React from 'react';

const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    fontSize: '14px',
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
                          handleStartTimeChange,
                          orders = [],
                          showToast
                      }) => {
    if (!selectedOrder) return null;

    const isRescheduling = selectedOrder.status !== 'scheduled';

    const isOverlap = (start1, end1, start2, end2) => {
        const s1 = new Date(start1).getTime();
        const e1 = new Date(end1).getTime();
        const s2 = new Date(start2).getTime();
        const e2 = new Date(end2).getTime();
        return s1 < e2 && e1 > s2;
    };

    const getBusyResources = () => {
        if (!assignment.scheduledStart || !assignment.scheduledEnd) return { busyOps: new Set(), busyMachines: new Set() };

        const busyOps = new Set();
        const busyMachines = new Set();

        orders.forEach(o => {
            if (o._id === selectedOrder._id) return;
            if (!o.scheduledStart || !o.scheduledEnd) return;
            if (['completed', 'cancelled'].includes(o.status)) return;

            if (isOverlap(assignment.scheduledStart, assignment.scheduledEnd, o.scheduledStart, o.scheduledEnd)) {
                if (o.assignedOperatorId) busyOps.add(o.assignedOperatorId._id || o.assignedOperatorId);
                if (o.assignedMachineId) busyMachines.add(o.assignedMachineId._id || o.assignedMachineId);
            }
        });

        return { busyOps, busyMachines };
    };

    const { busyOps, busyMachines } = getBusyResources();

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
            borderRadius: '24px',
            padding: '16px 20px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            width: '100%',
            maxWidth: isRescheduling ? '400px' : '380px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            animation: 'slideIn 0.3s ease-out',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#334155', margin: 0, letterSpacing: '-0.5px' }}>
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

            <form onSubmit={(e) => {
                if (assignment.scheduledStart && assignment.scheduledEnd && new Date(assignment.scheduledEnd) <= new Date(assignment.scheduledStart)) {
                    e.preventDefault();
                    showToast('Estimated End Time must be after Start Time', 'warning');
                    return;
                }
                handleAssign(e);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isRescheduling ? (
                    /* --- RESCHEDULE SPECIFIC LAYOUT --- */
                    <>
                        <div style={{
                            background: '#f8fafc',
                            padding: '16px 20px',
                            borderRadius: '24px',
                            border: '1px solid rgba(0,0,0,0.02)',
                            fontSize: '13px'
                        }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                                Current Assignment
                            </div>
                            <div style={{ fontWeight: '900', fontSize: '20px', color: '#0f172a', marginBottom: '12px' }}>#{selectedOrder.orderNumber}</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600' }}>Machine:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '800' }}>{selectedOrder.assignedMachineId?.name || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600' }}>Operator:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '800' }}>{selectedOrder.assignedOperatorId?.name || 'N/A'}</span>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(15, 23, 42, 0.05)', margin: '4px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', fontSize: '11px' }}>Scheduled Start:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '800' }}>{formatDateTime(selectedOrder.scheduledStart)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', fontSize: '11px' }}>Est. Completion:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '800' }}>{formatDateTime(selectedOrder.scheduledEnd)}</span>
                                </div>
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
                                {machines
                                    .filter(m => m.status !== 'Under Maintenance' && m.status !== 'Out of Order')
                                    .map(m => {
                                        const isBusy = busyMachines.has(m._id);
                                        return (
                                            <option key={m._id} value={m._id} disabled={isBusy}>
                                                {m.name} ({m.type || 'N/A'}) {isBusy ? '— (BUSY)' : ''}
                                            </option>
                                        );
                                    })}
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
                                {operators.map(op => {
                                    const isBusy = busyOps.has(op._id);
                                    return (
                                        <option key={op._id} value={op._id} disabled={isBusy}>
                                            {op.name} {isBusy ? '— (BUSY)' : ''}
                                        </option>
                                    );
                                })}
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
                            <label style={labelStyle}>EST. END TIME *</label>
                            <input
                                type="datetime-local"
                                style={inputStyle}
                                value={assignment.scheduledEnd || ''}
                                min={assignment.scheduledStart || ''}
                                onChange={(e) => setAssignment({ ...assignment, scheduledEnd: e.target.value })}
                                onInvalid={(e) => {
                                    if (e.target.validity.rangeUnderflow && assignment.scheduledStart) {
                                        const dt = new Date(assignment.scheduledStart);
                                        const formatted = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getDate().toString().padStart(2, '0')}/${dt.getFullYear()} ${dt.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                                        e.target.setCustomValidity(`Value must be ${formatted} or later.`);
                                    } else if (e.target.validity.valueMissing) {
                                        e.target.setCustomValidity('Please fill out this field.');
                                    } else {
                                        e.target.setCustomValidity('');
                                    }
                                }}
                                onInput={(e) => e.target.setCustomValidity('')}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>REASON FOR RESCHEDULE</label>
                            <textarea
                                style={{ ...inputStyle, height: '60px', resize: 'none' }}
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
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #e2e8f0',
                                    background: '#fff',
                                    color: '#64748b',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '13px'
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
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    minWidth: '120px',
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >Reschedule</button>
                        </div>
                    </>
                ) : (
                    /* --- ASSIGN SPECIFIC LAYOUT --- */
                    <>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                Order Details
                            </div>
                            <div style={{ fontWeight: '900', fontSize: '20px', color: '#0f172a', marginBottom: '2px' }}>#{selectedOrder.orderNumber}</div>
                            <div style={{ fontSize: '13px', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>
                                {(selectedOrder.jobType || '').toUpperCase()} • Qty: {selectedOrder.quantity || 'N/A'}
                                {selectedOrder.priority && (
                                    <span style={{ marginLeft: '12px', color: (selectedOrder.priority.toLowerCase() === 'urgent' || selectedOrder.priority.toLowerCase() === 'ugent' || selectedOrder.priority.toLowerCase() === 'high') ? '#ef4444' : '#64748b' }}>
                                        • {selectedOrder.priority.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#ef4444',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                Requested date: {selectedOrder.deadline ? new Date(selectedOrder.deadline).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'N/A'}
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
                                {operators.map(op => {
                                    const isBusy = busyOps.has(op._id);
                                    return (
                                        <option key={op._id} value={op._id} disabled={isBusy}>
                                            {op.name} {isBusy ? '— (BUSY)' : ''}
                                        </option>
                                    );
                                })}
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
                                    .filter(m => m.status !== 'Under Maintenance' && m.status !== 'Out of Order')
                                    .map(m => {
                                        const isBusy = busyMachines.has(m._id);
                                        return (
                                            <option key={m._id} value={m._id} disabled={isBusy}>
                                                {m.name} ({m.type || 'N/A'}) {isBusy ? '— (BUSY)' : ''}
                                            </option>
                                        );
                                    })}
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

                        <div>
                            <label style={labelStyle}>EST. END TIME *</label>
                            <input
                                type="datetime-local"
                                style={inputStyle}
                                value={assignment.scheduledEnd || ''}
                                min={assignment.scheduledStart || ''}
                                onChange={(e) => setAssignment({ ...assignment, scheduledEnd: e.target.value })}
                                onInvalid={(e) => {
                                    if (e.target.validity.rangeUnderflow && assignment.scheduledStart) {
                                        const dt = new Date(assignment.scheduledStart);
                                        const formatted = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getDate().toString().padStart(2, '0')}/${dt.getFullYear()} ${dt.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                                        e.target.setCustomValidity(`Value must be ${formatted} or later.`);
                                    } else if (e.target.validity.valueMissing) {
                                        e.target.setCustomValidity('Please fill out this field.');
                                    } else {
                                        e.target.setCustomValidity('');
                                    }
                                }}
                                onInput={(e) => e.target.setCustomValidity('')}
                                required
                            />
                        </div>

                        <div style={{ marginTop: '4px' }}>
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    background: '#d90404',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    fontSize: '14px',
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
        </div >
    );
};

export default ScheduleForm;
