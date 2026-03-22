import React from 'react';

const WeeklyTimeline = ({ machines, orders }) => {
    const getTimelineStyle = (start, end) => {
        if (!start || !end) return { display: 'none' };

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (today.getDay() || 7) + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const totalMs = endOfWeek.getTime() - startOfWeek.getTime();
        const sTime = new Date(start).getTime();
        const eTime = new Date(end).getTime();

        if (eTime < startOfWeek.getTime() || sTime > endOfWeek.getTime()) {
            return { display: 'none' };
        }

        const clampStart = Math.max(sTime, startOfWeek.getTime());
        const clampEnd = Math.min(eTime, endOfWeek.getTime());

        const leftPercent = ((clampStart - startOfWeek.getTime()) / totalMs) * 100;
        const widthPercent = ((clampEnd - clampStart) / totalMs) * 100;

        return {
            left: `${leftPercent}%`,
            width: `${Math.max(widthPercent, 0.5)}%`
        };
    };

    return (
        <div style={{ 
            background: 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '24px', 
            padding: '32px', 
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
            marginBottom: '32px' 
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>Weekly Timeline</h2>
                <button style={{ 
                    padding: '8px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #e5e7eb', 
                    background: '#fff', 
                    fontWeight: '600', 
                    cursor: 'pointer', 
                    color: '#374151', 
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
                }}>
                    Full Calendar
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {machines.map(machine => {
                    const machineOrders = orders.filter(o =>
                        (o.assignedMachineId?._id || o.assignedMachineId) === machine._id &&
                        o.status !== 'completed'
                    );

                    return (
                        <div key={machine._id} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '140px', fontWeight: '700', color: '#4b5563', fontSize: '14px', flexShrink: 0 }}>
                                {machine.name}
                            </div>
                            <div style={{ 
                                flex: 1, 
                                height: '40px', 
                                background: 'rgba(0, 0, 0, 0.03)', 
                                borderRadius: '12px', 
                                position: 'relative', 
                                overflow: 'hidden', 
                                display: 'flex', 
                                alignItems: 'center' 
                            }}>
                                {machineOrders.map(order => {
                                    if (!order.scheduledStart || !order.scheduledEnd) {
                                        return (
                                            <div key={order._id} style={{
                                                position: 'relative',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                height: '100%',
                                                padding: '0 12px',
                                                color: '#ef4444',
                                                fontWeight: '700',
                                                fontSize: '12px'
                                            }}>
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#ef4444', borderRadius: '4px 0 0 4px' }} />
                                                <span style={{ marginLeft: '4px' }}>{order.orderId || `ORD-${order.orderNumber}`} — No slot</span>
                                            </div>
                                        );
                                    }

                                    const style = getTimelineStyle(order.scheduledStart, order.scheduledEnd);
                                    return (
                                        <div key={order._id} style={{
                                            position: 'absolute',
                                            top: '6px',
                                            bottom: '6px',
                                            background: '#fff',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            ...style,
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0 10px',
                                            minWidth: '20px',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}>
                                            <div style={{ position: 'absolute', left: 0, top: '4px', bottom: '4px', width: '3px', background: '#374151', borderRadius: '4px' }} />
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: '6px' }}>
                                                {order.orderId || `ORD-${order.orderNumber}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyTimeline;
