import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const STATUS_CONFIG = {
    scheduled: { label: 'Awaiting Assignment', color: '#f59e0b', bg: '#fffbeb' },
    confirmed: { label: 'Assigned to Machine', color: '#3b82f6', bg: '#eff6ff' },
    in_progress: { label: 'Printing', color: '#8b5cf6', bg: '#f5f3ff' },
    completed: { label: 'Completed', color: '#10b981', bg: '#ecfdf5' },
};

const ScheduleDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [operators, setOperators] = useState([]);
    const [machines, setMachines] = useState([]);
    const [machineStats, setMachineStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');
    const [assignment, setAssignment] = useState({ assignedOperatorId: '', assignedMachineId: '', estimatedCompletionTime: 4 });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [ordersRes, staffRes, machinesRes, machineSummaryRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/shop-orders`, { headers }),
                axios.get(`${API_BASE_URL}/api/auth/staff?role=staff_operator`, { headers }),
                axios.get(`${API_BASE_URL}/api/machines`, { headers }),
                axios.get(`${API_BASE_URL}/api/machines/status/summary`, { headers })
            ]);
            // Only show production-relevant orders
            const productionOrders = (ordersRes.data.orders || ordersRes.data).filter(o =>
                ['scheduled', 'confirmed', 'in_progress', 'completed'].includes(o.status)
            );
            setOrders(productionOrders);
            setOperators(staffRes.data);
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
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/shop-orders/${selectedOrder._id}/assign`, assignment, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Order assigned successfully!");
            setSelectedOrder(null);
            setAssignment({ assignedOperatorId: '', assignedMachineId: '', estimatedCompletionTime: 4 });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to assign order");
        }
    };

    const handleReschedule = (order) => {
        setSelectedOrder(order);
        setAssignment({
            assignedOperatorId: order.assignedOperatorId?._id || order.assignedOperatorId || '',
            assignedMachineId: order.assignedMachineId?._id || order.assignedMachineId || '',
            estimatedCompletionTime: order.estimatedCompletionTime || 4
        });
    };

    // Stats
    const awaiting = orders.filter(o => o.status === 'scheduled').length;
    const assigned = orders.filter(o => o.status === 'confirmed').length;
    const printing = orders.filter(o => o.status === 'in_progress').length;
    const done = orders.filter(o => o.status === 'completed').length;

    // Group orders by operator
    const operatorWorkloads = operators.map(op => ({
        ...op,
        tasks: orders.filter(o =>
            (o.assignedOperatorId?._id || o.assignedOperatorId) === op._id && o.status !== 'completed'
        )
    }));

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Schedule...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '4px' }}>Scheduling Manager</h1>
                    <p style={{ color: '#6b7280' }}>Assign and track production orders across operators and machines.</p>
                </div>
                <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#1a1a1b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>🚪 Logout</button>
            </div>

            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <StatCard label="Awaiting" value={awaiting} color="#f59e0b" icon="📋" />
                <StatCard label="Assigned" value={assigned} color="#3b82f6" icon="🔧" />
                <StatCard label="Printing" value={printing} color="#8b82f6" icon="🖨️" />
                <StatCard label="Completed" value={done} color="#10b981" icon="✅" />
                <StatCard
                    label="Machines Busy"
                    value={machineStats?.statusCounts?.['In Use'] || 0}
                    color="#ef4444"
                    icon="⚙️"
                    subtitle={`${machineStats?.totalMachines || 0} total`}
                />
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '12px', marginBottom: '32px', width: 'fit-content' }}>
                {[{ id: 'orders', label: '📦 All Orders' }, { id: 'operators', label: '👷 Operators' }, { id: 'machines', label: '🖨️ Machines' }].map(tab => (
                    <button key={tab.id}
                        onClick={() => {
                            if (tab.id === 'machines') {
                                navigate('/machines');
                            } else {
                                setActiveTab(tab.id);
                            }
                        }}
                        style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: activeTab === tab.id ? '#fff' : 'transparent', fontWeight: '700', cursor: 'pointer', color: activeTab === tab.id ? '#111827' : '#6b7280', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 380px' : '1fr', gap: '32px' }}>
                {/* Main Content */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #f0f0f0' }}>
                    {activeTab === 'orders' ? (
                        <>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Production Orders</h3>
                            {orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                                    <div style={{ fontWeight: '700' }}>No approved orders in the pipeline.</div>
                                </div>
                            ) :
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                                            <th style={thStyle}>Order</th>
                                            <th style={thStyle}>Type</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Operator</th>
                                            <th style={thStyle}>Machine</th>
                                            <th style={thStyle}>Needed</th>
                                            <th style={thStyle}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.scheduled;
                                            const opName = order.assignedOperatorId?.name || '—';
                                            const machineName = order.assignedMachineId?.name || '—';
                                            return (
                                                <tr key={order._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: '800' }}>#{order.orderNumber}</div>
                                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.customerId?.name}</div>
                                                    </td>
                                                    <td style={tdStyle}><span style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>{(order.jobType || '').toUpperCase()}</span></td>
                                                    <td style={tdStyle}><span style={{ background: cfg.bg, color: cfg.color, padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' }}>{cfg.label}</span></td>
                                                    <td style={{ ...tdStyle, fontWeight: '600' }}>{opName}</td>
                                                    <td style={{ ...tdStyle, fontWeight: '600' }}>{machineName}</td>
                                                    <td style={{ ...tdStyle, fontWeight: '800', color: '#d32f2f' }}>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}</td>
                                                    <td style={tdStyle}>
                                                        {order.status === 'scheduled' ? (
                                                            <button onClick={() => { setSelectedOrder(order); setAssignment({ assignedOperatorId: '', assignedMachineId: '', estimatedCompletionTime: 4 }); }}
                                                                style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                                                                ASSIGN
                                                            </button>
                                                        ) : order.status !== 'completed' ? (
                                                            <button onClick={() => handleReschedule(order)}
                                                                style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                                                                RESCHEDULE
                                                            </button>
                                                        ) :
                                                            <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>Done</span>
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            }
                        </>
                    ) : activeTab === 'operators' ? (
                        <>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Production Operators</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                                {operatorWorkloads.map(op => (
                                    <div key={op._id} style={{ border: '1.5px solid #f3f4f6', borderRadius: '16px', padding: '24px', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                                    👷
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#111827' }}>{op.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{(op.role || '').replace('_', ' ').toUpperCase()}</div>
                                                </div>
                                            </div>
                                            <div style={{ background: op.tasks.length > 0 ? '#eff6ff' : '#f9fafb', color: op.tasks.length > 0 ? '#3b82f6' : '#9ca3af', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                                                {op.tasks.length} ACTIVE
                                            </div>
                                        </div>

                                        {op.tasks.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '12px', color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
                                                No active assignments.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {op.tasks.map(order => {
                                                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.scheduled;
                                                    return (
                                                        <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '700', fontSize: '13px' }}>#{order.orderNumber}</div>
                                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{(order.jobType || '').toUpperCase()}</div>
                                                            </div>
                                                            <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: '800' }}>
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
                                    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', gridColumn: '1/-1' }}>
                                        No operators found.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Assignment Panel */}
                {selectedOrder && (
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #f0f0f0', height: 'fit-content', position: 'sticky', top: '40px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>{selectedOrder.status === 'scheduled' ? 'Assign Job' : 'Reschedule Job'}</h3>
                        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Order</div>
                            <div style={{ fontWeight: '800' }}>#{selectedOrder.orderNumber}</div>
                            <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>{(selectedOrder.jobType || '').toUpperCase()} • Qty: {selectedOrder.quantity || 'N/A'}</div>
                            <div style={{ fontSize: '12px', color: '#d32f2f', fontWeight: '800', marginTop: '8px' }}>📅 NEEDED BY: {selectedOrder.deadline ? new Date(selectedOrder.deadline).toLocaleDateString() : 'N/A'}</div>
                        </div>

                        <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Operator</label>
                                <select style={inputStyle} value={assignment.assignedOperatorId} onChange={(e) => setAssignment({ ...assignment, assignedOperatorId: e.target.value })} required>
                                    <option value="">Choose Operator...</option>
                                    {operators.map(op => (
                                        <option key={op._id} value={op._id}>{op.name} ({operatorWorkloads.find(o => o._id === op._id)?.tasks.length || 0} tasks)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Machine</label>
                                <select style={inputStyle} value={assignment.assignedMachineId} onChange={(e) => setAssignment({ ...assignment, assignedMachineId: e.target.value })} required>
                                    {machines
                                        .filter(m => m.status === 'Available')
                                        .map(m => (
                                            <option key={m._id} value={m._id}>{m.name} ({m.type || 'Available'})</option>
                                        ))}
                                    {machines.filter(m => m.status === 'Available').length === 0 && (
                                        <option disabled>No available machines found</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Estimated Hours</label>
                                <input type="number" min="1" style={inputStyle} value={assignment.estimatedCompletionTime} onChange={(e) => setAssignment({ ...assignment, estimatedCompletionTime: Number(e.target.value) })} />
                            </div>
                            <button type="submit" style={{ width: '100%', background: '#111827', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' }}>
                                {selectedOrder.status === 'scheduled' ? 'CONFIRM & ASSIGN' : 'RESCHEDULE & UPDATE'}
                            </button>
                            <button type="button" onClick={() => setSelectedOrder(null)} style={{ width: '100%', background: 'transparent', color: '#6b7280', border: 'none', padding: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const thStyle = { padding: '12px 16px', color: '#6b7280', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '14px 16px', fontSize: '14px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', fontWeight: '600', outline: 'none' };

const StatCard = ({ label, value, color, icon, subtitle }) => (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{icon}</div>
        <div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#111827' }}>{value}</div>
            {subtitle && <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>{subtitle}</div>}
        </div>
    </div>
);

export default ScheduleDashboard;

