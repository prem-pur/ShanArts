import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const STATUS_CONFIG = {
    scheduled: { label: 'Awaiting Assignment', color: '#f59e0b', bg: '#fffbeb' },
    confirmed: { label: 'Assigned to Machine', color: '#ff3333', bg: '#fee2e2' },
    in_progress: { label: 'Printing', color: '#cc0000', bg: '#fee2e2' },
    completed: { label: 'Completed', color: '#ff3333', bg: 'var(--surface-muted)' },
};

const Machines = () => {
    const [machines, setMachines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [machinesRes, ordersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/machines`, { headers }),
                axios.get(`${API_BASE_URL}/api/shop-orders`, { headers })
            ]);

            setMachines(machinesRes.data.data || machinesRes.data);
            const allOrders = ordersRes.data.orders || ordersRes.data;
            setOrders(allOrders.filter(o => ['scheduled', 'confirmed', 'in_progress', 'completed'].includes(o.status)));
        } catch (error) {
            console.error('Failed to fetch machine data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMachineStatus = async (machineId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/machines/${machineId}/status`, {
                status: newStatus
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Failed to update machine status:', err);
            alert("Failed to update status");
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)', fontSize: '18px', fontWeight: '600' }}>
            Synchronizing Machines...
        </div>
    );

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "var(--font-sans, sans-serif)", backgroundColor: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px', margin: 0 }}>MACHINE FLEET</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '8px', fontWeight: '500' }}>Real-time production monitoring and asset management.</p>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '12px 24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Total Capacity</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>{machines.length} Units</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Active Production</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-color)' }}>{machines.filter(m => orders.some(o => (o.assignedMachineId?._id || o.assignedMachineId) === m._id && o.status !== 'completed')).length} In Use</div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
                {/* Main Machine Grid */}
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>Machine Status</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {machines.map(machine => {
                            const machineOrders = orders.filter(order => (order.assignedMachineId?._id || order.assignedMachineId) === machine._id && order.status !== 'completed');
                            const statusColor = machine.status === 'In Use' ? 'var(--accent-color)' : machine.status === 'Available' ? '#ff3333' : '#f59e0b';
                            const statusBg = machine.status === 'In Use' ? '#fee2e2' : machine.status === 'Available' ? 'var(--surface-muted)' : '#fffbeb';

                            return (
                                <div key={machine._id} style={{ border: '1.5px solid var(--border-color)', borderRadius: '16px', padding: '24px', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                                                🖨️
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text-primary)', lineHeight: '1.2' }}>{machine.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.2px' }}>{machine.type}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <div style={{ background: statusBg, color: statusColor, padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                                                {machineOrders.length} ACTIVE
                                            </div>
                                            <select
                                                value={machine.status}
                                                onChange={(e) => updateMachineStatus(machine._id, e.target.value)}
                                                style={{ fontSize: '10px', fontWeight: '800', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 6px', background: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
                                            >
                                                <option value="Available">Available</option>
                                                <option value="In Use">In Use</option>
                                                <option value="Under Maintenance">Maintenance</option>
                                                <option value="Out of Order">Out of Order</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                        {/* Derived Operator Logic: Find operator from active orders for this machine */}
                                        {machine.status === 'In Use' && machineOrders.length > 0 && (
                                            <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px' }}>👷</span>
                                                <span style={{ fontWeight: '700' }}>Active Operator:</span> {
                                                machineOrders[0].assignedOperatorId?.name ||
                                                machineOrders[0].assignedOperatorName ||
                                                'Assigned Staff'
                                            }
                                            </div>
                                        )}

                                        {machineOrders.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '24px', background: 'var(--surface-muted)', borderRadius: '14px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
                                                No active jobs — {machine.status}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {machineOrders.map(order => {
                                                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.scheduled;
                                                    return (
                                                        <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-muted)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                            <div>
                                                                <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-primary)' }}>#{order.orderId || order.orderNumber}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>{(order.jobType || '').replace('_', ' ')}</div>
                                                            </div>
                                                            <span style={{ background: cfg.bg, color: cfg.color, padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                                                                {cfg.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Machines;
