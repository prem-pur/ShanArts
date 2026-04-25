import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Calendar, 
    ClipboardList, 
    Printer, 
    CheckCircle, 
    Settings,
    Activity,
} from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';
import OrdersDashboard from './OrdersDashboard';
import OperatorsDashboard from './OperatorsDashboard';
import WeeklyTimeline from './WeeklyTimeline';
import UpcomingJobs from './UpcomingJobs';
import { useToast, ToastContainer } from './Toast';

const ScheduleDashboard = () => {
    const navigate = useNavigate();
    const { toasts, showToast, removeToast } = useToast();
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

    const StatCard = ({ label, value, color, icon: Icon, subtitle }) => (
        <div style={{
            background: 'var(--card-bg)',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
            transition: 'transform 0.2s ease',
            flex: 1
        }}>
            <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `${color}15`,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={28} />
            </div>
            <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
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
                showToast("Cannot schedule in the past.", 'warning');
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
                ['scheduled', 'confirmed', 'in_progress', 'printing', 'completed', 'machine_maintenance'].includes(o.status)
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
            showToast("Please select both an operator and a machine.", 'warning');
            return;
        }

        const startD = new Date(assignment.scheduledStart);
        if (startD < new Date()) {
            showToast("Scheduled start time cannot be in the past.", 'warning');
            return;
        }

        const hours = startD.getHours();
        if (hours < 8 || hours >= 17) {
            showToast("Scheduling is allowed only between 8:00 AM and 5:00 PM.", 'warning');
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
                showToast(
                    `Conflict: Selected ${who.join(' & ')} already assigned to Order #${conflict.orderNumber} in this time slot.`,
                    'error'
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

            showToast(isReschedule ? "Order rescheduled successfully!" : "Order assigned successfully!", 'success');
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
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to assign order", 'error');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/shop-orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast("Order deleted successfully!", 'success');
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete order", 'error');
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
        <div className="shan-fade-in" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)', fontWeight: '600', gap: '14px', fontFamily: 'var(--font-sans, sans-serif)' }}>
            <div className="shan-spin" />
            Initializing Scheduler...
        </div>
    );

    return (
        <div className="shan-page" style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-color)',
            fontFamily: 'var(--font-sans, sans-serif)',
            padding: '28px 36px',
            color: 'var(--text-primary)'
        }}>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Header section managed like OrderList */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calendar size={28} color="var(--accent-color)" /> Schedule Management
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
                      Production Central Control Dashboard
                  </p>
                </div>

                <div style={{
                    display: 'flex',
                    background: 'var(--card-bg)',
                    padding: '4px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)'
                }}>
                    {['overview', 'orders', 'operators'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveView(tab)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                background: activeView === tab ? 'var(--accent-color)' : 'transparent',
                                color: activeView === tab ? '#fff' : 'var(--text-secondary)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textTransform: 'capitalize',
                                fontSize: '13px'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                    <button
                        onClick={() => navigate('/machines')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Settings size={14} />
                        Machines
                    </button>
                </div>
            </div>

            {/* Dashboard View */}
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {activeView === 'overview' ? (
                    <>
                        {/* Stats Bar */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                            <StatCard
                                 label="Awaiting"
                                 value={orders.filter(o => o.status === 'scheduled').length}
                                 color="var(--text-primary)"
                                 icon={ClipboardList}
                                 subtitle={`${orders.filter(o => o.status === 'scheduled' && (o.priority?.toLowerCase() === 'urgent' || o.priority?.toLowerCase() === 'high' || o.priority?.toLowerCase() === 'ugent' )).length} Urgent Jobs`}
                            />
                            <StatCard 
                                 label="Assigned" 
                                 value={orders.filter(o => o.status === 'confirmed').length} 
                                 color="var(--text-primary)" 
                                 icon={Activity} 
                            />
                            <StatCard 
                                 label="Printing" 
                                 value={orders.filter(o => o.status === 'in_progress' || o.status === 'printing').length} 
                                 color="var(--accent-color)" 
                                 icon={Printer} 
                            />
                            <StatCard 
                                 label="Completed Today" 
                                 value={orders.filter(o => o.status === 'completed' && new Date(o.updatedAt).toDateString() === new Date().toDateString()).length} 
                                 color="var(--text-secondary)" 
                                 icon={CheckCircle} 
                                 subtitle="Last 24 hours"
                            />
                        </div>

                        {/* Two Column: Timeline + Upcoming Jobs */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 380px',
                            gap: '32px',
                            alignItems: 'start'
                        }}>
                            <div style={{ minWidth: 0, background: 'var(--card-bg)', borderRadius: '18px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
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
                        showToast={showToast}
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
    );
};

export default ScheduleDashboard;
