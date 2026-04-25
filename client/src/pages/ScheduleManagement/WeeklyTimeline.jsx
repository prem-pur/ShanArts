import React, { useMemo } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ORDER_COLORS = {
    scheduled: { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' },
    rescheduled: { bg: '#fff5f5', text: '#000000', border: '#000000' },
    urgent: { bg: '#fff5f5', text: '#ef4444', border: '#ef4444' }, // Added for Legend
    in_progress: { bg: '#eff6ff', text: '#3b82f6', border: '#3b82f6' },
    no_slot: { bg: '#fff7ed', text: '#f59e0b', border: '#f59e0b' },
};

const RISK_BORDER = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#10b981',
};

const WeeklyTimeline = ({ machines, orders }) => {
    const { weekDays, today } = useMemo(() => {
        const today = new Date();
        const days = [];
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek.setDate(today.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return { weekDays: days, today };
    }, []);

    const weekStart = weekDays[0];
    const weekEnd = new Date(weekDays[6]);
    weekEnd.setHours(23, 59, 59, 999);
    const totalMs = weekEnd.getTime() - weekStart.getTime();

    const getBarStyle = (start, end) => {
        if (!start || !end) return null;
        const sTime = Math.max(new Date(start).getTime(), weekStart.getTime());
        const eTime = Math.min(new Date(end).getTime(), weekEnd.getTime());
        if (eTime < weekStart.getTime() || sTime > weekEnd.getTime()) return null;
        const left = ((sTime - weekStart.getTime()) / totalMs) * 100;
        const width = ((eTime - sTime) / totalMs) * 100;
        return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
    };

    const isToday = (d) => d.toDateString() === today.toDateString();

    const dateRangeStr = `${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>Weekly Timeline</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>{dateRangeStr}</p>
            </div>

            {/* Day Column Headers */}
            <div style={{ display: 'flex', marginBottom: '16px', paddingLeft: '160px' }}>
                {weekDays.map((d, i) => (
                    <div key={i} style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '6px 4px',
                        borderRadius: '99px',
                        background: isToday(d) ? '#3b82f6' : 'transparent',
                        color: isToday(d) ? '#fff' : '#64748b',
                    }}>
                        {DAYS[i]} {d.getDate()}
                    </div>
                ))}
            </div>

            {/* Machine Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {machines.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>
                        No machines found
                    </div>
                )}
                {machines.map(machine => {
                    const isUnderMaintenance = machine.status === 'Under Maintenance';
                    const machineOrders = orders.filter(o =>
                        (o.assignedMachineId?._id || o.assignedMachineId) === machine._id &&
                        o.status !== 'completed'
                    );

                    return (
                        <div key={machine._id} style={{ display: 'flex', alignItems: 'center' }}>
                            {/* Machine Label */}
                            <div style={{ width: '160px', flexShrink: 0, paddingRight: '16px' }}>
                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b', lineHeight: 1.2 }}>{machine.name}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>{machine.type || 'Machine'}</div>
                            </div>

                            {/* Timeline Track */}
                            <div style={{
                                flex: 1,
                                height: '48px',
                                background: '#f1f5f9',
                                borderRadius: '12px',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0'
                            }}>
                                {/* Day grid lines */}
                                {weekDays.map((d, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        top: 0, bottom: 0,
                                        left: `${(i / 7) * 100}%`,
                                        width: '1px',
                                        background: '#e2e8f0',
                                        zIndex: 0
                                    }} />
                                ))}

                                {/* Today column highlight */}
                                {weekDays.map((d, i) => isToday(d) && (
                                    <div key={'today-' + i} style={{
                                        position: 'absolute',
                                        top: 0, bottom: 0,
                                        left: `${(i / 7) * 100}%`,
                                        width: `${(1 / 7) * 100}%`,
                                        background: 'rgba(59,130,246,0.07)',
                                        zIndex: 0
                                    }} />
                                ))}

                                {/* Maintenance overlay */}
                                {isUnderMaintenance && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: 'repeating-linear-gradient(45deg, #cbd5e1 0px, #cbd5e1 3px, transparent 3px, transparent 10px)',
                                        opacity: 0.8,
                                        zIndex: 1
                                    }} />
                                )}

                                {/* Order Bars */}
                                {!isUnderMaintenance && machineOrders.map(order => {
                                    const isNoSlot = !order.scheduledStart || !order.scheduledEnd;
                                    // Only treat as rescheduled if rescheduleReason is a non-empty string
                                    const isRescheduled = Boolean(order.rescheduleReason && order.rescheduleReason.trim());

                                    let colorKey = 'scheduled';
                                    if (isNoSlot) colorKey = 'no_slot';
                                    else if (isRescheduled) colorKey = 'rescheduled';
                                    else if (order.status === 'in_progress') colorKey = 'in_progress';

                                    const colors = ORDER_COLORS[colorKey];

                                    if (isNoSlot) {
                                        return (
                                            <div key={order._id} style={{
                                                position: 'absolute',
                                                top: '8px', left: '8px',
                                                height: '32px',
                                                padding: '0 12px',
                                                borderRadius: '8px',
                                                border: `1.5px dashed ${colors.border}`,
                                                background: colors.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: colors.text,
                                                zIndex: 2,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                &nbsp;
                                            </div>
                                        );
                                    }

                                    const barStyle = getBarStyle(order.scheduledStart, order.scheduledEnd);
                                    if (!barStyle) return null;

                                    const isUrgent = order.priority?.toLowerCase() === 'urgent' || order.priority?.toLowerCase() === 'ugent' || order.priority?.toLowerCase() === 'high';

                                    // If urgent, override rescheduled color with a stronger urgent style if needed,
                                    // but for now, we'll use the user's specific "red border" for rescheduled
                                    // and maybe a bold red border for urgent.
                                    let finalBg = colors.bg;
                                    let finalBorder = `1.5px solid ${colors.border}`;
                                    let finalColor = colors.text;

                                    if (isUrgent) {
                                        finalBg = '#fff5f5';
                                        finalBorder = '2px solid #ef4444';
                                        finalColor = '#ef4444';
                                    } else if (isRescheduled) {
                                        finalBorder = '2px solid #000000'; // Specific black border for rescheduled
                                    }

                                    // Delay-risk border hint (only when not urgent/rescheduled)
                                    const risk = order.delayRiskLevel;
                                    if (!isUrgent && !isRescheduled && risk && RISK_BORDER[risk]) {
                                        finalBorder = `2px solid ${RISK_BORDER[risk]}`;
                                    }

                                    return (
                                        <div key={order._id}
                                             title={`#${order.orderNumber} | ${order.jobType || ''} | ${new Date(order.scheduledStart).toLocaleString()}${isUrgent ? ' | URGENT' : ''}${isRescheduled ? ' | RESCHEDULED' : ''}${order.delayRiskLevel ? ` | RISK: ${order.delayRiskLevel}` : ''}`}
                                             style={{
                                                 position: 'absolute',
                                                 top: '8px', height: '32px',
                                                 borderRadius: '8px',
                                                 background: finalBg,
                                                 border: finalBorder,
                                                 display: 'flex',
                                                 alignItems: 'center',
                                                 padding: '0 10px',
                                                 gap: '6px',
                                                 fontSize: '11px',
                                                 fontWeight: '900',
                                                 color: finalColor,
                                                 zIndex: 10,
                                                 whiteSpace: 'nowrap',
                                                 boxShadow: isUrgent ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                                                 cursor: 'default',
                                                 ...barStyle,
                                                 minWidth: '40px'
                                             }}>
                                            <span style={{ pointerEvents: 'none' }}></span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                {[
                    { colors: ORDER_COLORS.scheduled, label: 'Scheduled' },
                    { colors: ORDER_COLORS.rescheduled, label: 'Rescheduled' },
                    { colors: ORDER_COLORS.urgent, label: 'Urgent' },
                    { colors: ORDER_COLORS.in_progress, label: 'Printing' },
                ].map(({ colors, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        <div style={{
                            width: '16px',
                            height: '12px',
                            borderRadius: '4px',
                            background: colors.bg,
                            border: label === 'Urgent' ? '2px solid #ef4444' : (label === 'Rescheduled' ? '2px solid #000000' : `1.5px solid ${colors.border}`)
                        }} />
                        {label}
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    <div style={{ width: '16px', height: '12px', borderRadius: '4px', border: '1.5px dashed #ef4444', background: 'transparent' }} />
                    No slot
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    <div style={{
                        width: '16px', height: '12px', borderRadius: '4px',
                        backgroundImage: 'repeating-linear-gradient(45deg, #cbd5e1 0px, #cbd5e1 2px, transparent 2px, transparent 6px)',
                    }} />
                    Maintenance
                </div>
            </div>
        </div>
    );
};

export default WeeklyTimeline;
