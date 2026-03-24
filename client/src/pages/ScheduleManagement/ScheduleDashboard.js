import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import OrdersDashboard from './OrdersDashboard';
import OperatorsDashboard from './OperatorsDashboard';
import WeeklyTimeline from './WeeklyTimeline';
import UpcomingJobs from './UpcomingJobs';

const ScheduleDashboard = () => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('overview'); // overview, orders, operators
    const [orders, setOrders] = useState([]);
    const [operators, setOperators] = useState([]);
    const [machines, setMachines] = useState([]);
    const [machineStats, setMachineStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [assignment, setAssignment] = useState({
        assignedOperatorId: '',
        assignedMachineId: '',
        estimatedCompletionTime: 4,
        scheduledStart: '',
        scheduledEnd: '',
        priority: 'normal',
        rescheduleReason: ''
    });

    const StatCard = ({ label, value, color, icon, subtitle }) => (
        <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s ease'
        }}>
            <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: `${color}10`,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '34px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{value}</div>
                {subtitle && <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginTop: '6px' }}>{subtitle}</div>}
            </div>
        </div>
    );

    const toDatetimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const handleStartTimeChange = (val) => {
        if (val) {
            const d = new Date(val);
            const now = new Date();

            if (d < now) {
                alert("Cannot schedule in the past.");
                return;
            }

            setAssignment(prev => ({ ...prev, scheduledStart: val }));
        } else {
            setAssignment(prev => ({ ...prev, scheduledStart: '', scheduledEnd: '' }));
        }
    };

    const handleEstChange = (val) => {
        const est = Number(val) || 0;
        setAssignment(prev => ({ ...prev, estimatedCompletionTime: est }));
    };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [ordersRes, staffRes, machinesRes, machineSummaryRes, attendanceRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/shop-orders`, { headers }),
                axios.get(`${API_BASE_URL}/api/auth/staff?role=staff_operator`, { headers }),
                axios.get(`${API_BASE_URL}/api/machines`, { headers }),
                axios.get(`${API_BASE_URL}/api/machines/status/summary`, { headers }),
                axios.get(`${API_BASE_URL}/api/attendance/today`, { headers })
            ]);

            const productionOrders = (ordersRes.data.orders || ordersRes.data).filter(o =>
                ['scheduled', 'confirmed', 'in_progress', 'printing', 'completed'].includes(o.status)
            );

            const attendanceData = attendanceRes.data.attendance || [];
            const presentOperatorIds = new Set(
                attendanceData.filter(a => a.status === 'present').map(a => a.userId)
            );

            const presentOperators = staffRes.data.filter(op => presentOperatorIds.has(op._id));

            setOrders(productionOrders);
            setOperators(presentOperators);
            setMachines(machinesRes.data.data || machinesRes.data);
            setMachineStats(machineSummaryRes.data.data);
        } catch (err) {
            console.error('Failed to fetch scheduling data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignment.assignedOperatorId || !assignment.assignedMachineId) {
            alert("Please select both an operator and a machine.");
            return;
        }

        const startD = new Date(assignment.scheduledStart);
        if (startD < new Date()) {
            alert("Scheduled start time cannot be in the past.");
            return;
        }

        const hours = startD.getHours();
        if (hours < 8 || hours >= 17) {
            alert("Scheduling is allowed only between 8:00 AM and 5:00 PM.");
            return;
        }

        // --- Availability / overlap check ---
        if (assignment.scheduledStart && assignment.scheduledEnd) {
            const newStart = new Date(assignment.scheduledStart).getTime();
            const newEnd = new Date(assignment.scheduledEnd).getTime();

            const conflictingOrders = orders.filter(o => {
                // Skip the order currently being assigned/rescheduled
                if (o._id === selectedOrder._id) return false;
                // Only check orders that have a time slot and are active
                if (!o.scheduledStart || !o.scheduledEnd) return false;
                if (o.status === 'completed' || o.status === 'cancelled') return false;

                const oStart = new Date(o.scheduledStart).getTime();
                const oEnd = new Date(o.scheduledEnd).getTime();

                // Overlap condition: newStart < oEnd AND newEnd > oStart
                const overlaps = newStart < oEnd && newEnd > oStart;
                if (!overlaps) return false;

                const sameOperator = (o.assignedOperatorId?._id || o.assignedOperatorId) === assignment.assignedOperatorId;
                const sameMachine = (o.assignedMachineId?._id || o.assignedMachineId) === assignment.assignedMachineId;

                return sameOperator || sameMachine;
            });

            if (conflictingOrders.length > 0) {
                const conflict = conflictingOrders[0];
                const who = [];
                const opId = conflict.assignedOperatorId?._id || conflict.assignedOperatorId;
                const machId = conflict.assignedMachineId?._id || conflict.assignedMachineId;
                if (opId === assignment.assignedOperatorId) who.push('operator');
                if (machId === assignment.assignedMachineId) who.push('machine');
                alert(
                    `Scheduling conflict: The selected ${who.join(' and ')} is already assigned to Order #${conflict.orderNumber} during this time period.\n\nPlease choose a different ${who.join(' or ')} or a different time slot.`
                );
                return;
            }
        }
        try {
            const token = localStorage.getItem('token');
            const isReschedule = selectedOrder.status !== 'pending' && selectedOrder.status !== 'scheduled';
            const endpoint = isReschedule ? 'reschedule' : 'assign';

            const payload = { ...assignment };

            await axios.patch(`${API_BASE_URL}/api/shop-orders/${selectedOrder._id}/${endpoint}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert(isReschedule ? "Order rescheduled successfully!" : "Order assigned successfully!");
            setSelectedOrder(null);
            setAssignment({
                assignedOperatorId: '',
                assignedMachineId: '',
                estimatedCompletionTime: 4,
                scheduledStart: '',
                scheduledEnd: '',
                priority: 'normal',
                rescheduleReason: ''
            });
            await fetchData();
            setActiveView('overview');
        } catch (err) {
            alert(err.response?.data?.message || "Failed to assign order");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/shop-orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Order deleted successfully!");
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete order");
        }
    };

    const handleReschedule = (order) => {
        setSelectedOrder(order);
        setAssignment({
            assignedOperatorId: order.assignedOperatorId?._id || order.assignedOperatorId || '',
            assignedMachineId: order.assignedMachineId?._id || order.assignedMachineId || '',
            estimatedCompletionTime: order.estimatedCompletionTime || 4,
            scheduledStart: order.scheduledStart ? toDatetimeLocal(order.scheduledStart) : '',
            scheduledEnd: order.scheduledEnd ? toDatetimeLocal(order.scheduledEnd) : '',
            priority: order.priority || 'normal',
            rescheduleReason: order.rescheduleReason || ''
        });
    };

    if (loading) return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            fontFamily: "'Inter', sans-serif",
            color: '#64748b',
            fontWeight: '700'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>⏳</div>
                Initializing Scheduler...
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            fontFamily: "'Inter', sans-serif",
            color: '#1e293b'
        }}>
            <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Top Navigation & Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: '48px',
                    paddingBottom: '24px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '42px',
                            fontWeight: '900',
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-1.5px',
                            lineHeight: 1
                        }}>
                            Scheduling Manager
                        </h1>
                        <p style={{
                            color: '#64748b',
                            fontSize: '16px',
                            marginTop: '12px',
                            fontWeight: '500'
                        }}>
                            Production Central Control Dashboard
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        background: '#fff',
                        padding: '6px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.02)'
                    }}>
                        {['orders', 'operators'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveView(tab)}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: activeView === tab ? '#0f172a' : 'transparent',
                                    color: activeView === tab ? '#fff' : '#64748b',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textTransform: 'capitalize',
                                    fontSize: '14px'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                        <button
                            onClick={() => navigate('/machines')}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'transparent',
                                color: '#64748b',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '14px'
                            }}
                        >
                            Machines
                        </button>
                    </div>
                </div>


                {/* Dashboard View */}
                <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {activeView === 'overview' ? (
                        <>
                            {/* Stats Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '36px' }}>
                                <StatCard
                                    label="Awaiting"
                                    value={orders.filter(o => o.status === 'scheduled').length}
                                    color="#f59e0b"
                                    icon="📋"
                                    subtitle={`${orders.filter(o => o.status === 'scheduled' && (o.priority?.toLowerCase() === 'urgent' || o.priority?.toLowerCase() === 'ugent' || o.priority?.toLowerCase() === 'high')).length} Urgent`}
                                />
                                <StatCard label="Assigned" value={orders.filter(o => o.status === 'confirmed').length} color="#3b82f6" icon="🔧" />
                                <StatCard label="Printing" value={orders.filter(o => o.status === 'in_progress').length} color="#8b5cf6" icon="🖨️" />
                                <StatCard label="Completed" value={orders.filter(o => o.status === 'completed').length} color="#10b981" icon="✅" />
                                <StatCard
                                    label="Machines Busy"
                                    value={machineStats?.statusCounts?.['In Use'] || 0}
                                    color="#ef4444"
                                    icon="⚙️"
                                    subtitle={`${machineStats?.totalMachines || 0} total`}
                                />
                            </div>

                            {/* Two Column: Timeline + Upcoming Jobs */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 380px',
                                gap: '32px',
                                alignItems: 'start'
                            }}>
                                <div style={{ minWidth: 0 }}>
                                    <WeeklyTimeline machines={machines} orders={orders} />
                                </div>
                                <UpcomingJobs orders={orders} />
                            </div>
                        </>

                    ) : activeView === 'orders' ? (
                        <OrdersDashboard
                            orders={orders}
                            operators={operators}
                            machines={machines}
                            machineStats={machineStats}
                            selectedOrder={selectedOrder}
                            setSelectedOrder={setSelectedOrder}
                            assignment={assignment}
                            setAssignment={setAssignment}
                            handleAssign={handleAssign}
                            handleReschedule={handleReschedule}
                            handleStartTimeChange={handleStartTimeChange}
                            handleEstChange={handleEstChange}
                            onBack={() => setActiveView('overview')}
                            handleDeleteOrder={handleDeleteOrder}
                        />
                    ) : (
                        <OperatorsDashboard
                            operators={operators}
                            orders={orders}
                            machineStats={machineStats}
                            onBack={() => setActiveView('overview')}
                        />
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ScheduleDashboard;
