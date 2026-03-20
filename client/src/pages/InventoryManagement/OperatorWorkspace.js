import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const OperatorWorkspace = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [materialsUsed, setMaterialsUsed] = useState([{ materialId: '', quantity: 1 }]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchTasks();
        fetchInventory();

        // Set up auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchTasks();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            if (!token) {
                setTasks([]);
                setLoading(false);
                return;
            }

            // Fetch shop orders (scheduled/production orders)
            const ordersResponse = await axios.get(`${API_BASE_URL}/api/shop-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const allOrders = ordersResponse.data.orders || ordersResponse.data;

            // Filter orders assigned to THIS operator
            // We check both ID and Name to ensure reliability as requested
            const assignedTasks = allOrders.filter(order => {
                const opId = order.assignedOperatorId?._id || order.assignedOperatorId;
                const opName = order.assignedOperatorId?.name || order.assignedOperatorName;

                const isMyId = opId === currentUser._id;
                const isMyName = opName === currentUser.name;

                // Only show tasks that are confirmed, in_progress, printing, or completed
                const isProductionStatus = ['confirmed', 'in_progress', 'printing', 'completed'].includes(order.status);

                return (isMyId || isMyName) && isProductionStatus;
            });

            setTasks(assignedTasks);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch operator tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/inventory`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setInventory(response.data.data);
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        }
    };

    const getMachineTypeForOrder = (orderType) => {
        const machineTypeMap = {
            'business_card': 'Digital Printer + Laminator + Cutting Machine',
            'flyer': 'Digital Printer + Offset Printer',
            'banner': 'Large Format Printer + Laminator + Cutting Machine',
            'brochure': 'Digital Printer + Folding Machine',
            'poster': 'Large Format Printer + Laminator + Cutting Machine',
            'sticker': 'Digital Printer + Cutting Machine',
            'invitation': 'Digital Printer + Embossing Machine',
            'social_media': 'Digital Printer',
            'other': 'Digital Printer + Laminator'
        };

        return machineTypeMap[orderType] || 'Digital Printer + Laminator';
    };

    const getMachineIcon = (orderType) => {
        const iconMap = {
            'business_card': '🖨️',
            'flyer': '🖨️',
            'banner': '🖨️',
            'brochure': '🖨️',
            'poster': '🖨️',
            'sticker': '🖨️',
            'invitation': '🖨️',
            'social_media': '🖨️',
            'other': '🖨️'
        };

        return iconMap[orderType] || '🖨️';
    };

    const handleStartPrinting = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/shop-orders/${taskId}/status`, {
                status: 'in_progress'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Printing started!");
            fetchTasks();
        } catch (err) {
            console.error('Failed to start printing:', err);
            alert("Failed to start printing");
        }
    };

    const handleCompleteJob = async () => {
        if (materialsUsed.some(m => !m.materialId)) {
            alert("Please select materials or remove empty entries.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/shop-orders/${selectedTask._id}/status`, {
                status: 'completed',
                materialsUsed
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update machine status back to available
            if (selectedTask.assignedMachineId) {
                const machineId = selectedTask.assignedMachineId?._id || selectedTask.assignedMachineId;
                await axios.patch(`${API_BASE_URL}/api/machines/${machineId}/status`, {
                    status: 'Available'
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            alert("Job marked as completed!");
            setShowMaterialModal(false);
            setMaterialsUsed([{ materialId: '', quantity: 1 }]);
            fetchTasks();
        } catch (err) {
            console.error('Failed to complete job:', err);
            alert("Failed to complete job");
        }
    };

    const addMaterialRow = () => setMaterialsUsed([...materialsUsed, { materialId: '', quantity: 1 }]);
    const removeMaterialRow = (index) => setMaterialsUsed(materialsUsed.filter((_, i) => i !== index));

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Workspace...</div>;

    const navigate = (path) => window.location.href = path; // Simple navigate for now or use useNavigate hook

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Operator Workspace</h2>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>View and manage your assigned printing tasks.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={fetchTasks}
                        style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🔄 Refresh Tasks
                    </button>
                    <button
                        onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                        style={{ background: '#1a1a1b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>My Active Tasks</h3>
                {tasks.filter(t => t.status !== 'completed').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>☕</div>
                        <div style={{ fontWeight: '700' }}>No active tasks. Take a break!</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                        {tasks.filter(t => t.status !== 'completed').map(task => {
                            const isPrinting = task.status === 'in_progress' || task.status === 'printing';
                            const machineIcon = getMachineIcon(task.jobType || task.printSpecs?.designType);
                            const jobType = (task.jobType || task.printSpecs?.designType || '').replace('_', ' ');

                            return (
                                <div key={task._id} style={{ border: '1.5px solid #f3f4f6', borderRadius: '16px', padding: '24px', transition: 'transform 0.2s', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '18px', color: '#111827' }}>#{task.orderNumber || task.orderId}</div>
                                            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{jobType}</div>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: task.status === 'confirmed' ? '#eff6ff' : isPrinting ? '#f5f3ff' : '#fff7ed',
                                            color: task.status === 'confirmed' ? '#2563eb' : isPrinting ? '#8b5cf6' : '#ea580c',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>
                                            {task.status === 'confirmed' ? 'Assigned' : isPrinting ? 'Printing' : task.status}
                                        </span>
                                    </div>

                                    {/* Assigned Machine Section */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>{machineIcon}</span>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Machine</div>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: '700' }}>
                                            {task.assignedMachineId?.name || task.assignedMachineName || 'Production Unit'}
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '20px', lineHeight: '1.5' }}>{task.printSpecs?.description || task.description || 'No additional instructions.'}</p>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontWeight: '600' }}>
                                        <span>🕒 Est: {task.estimatedCompletionTime || 4}h</span>
                                        <span>📦 Qty: {task.quantity || task.printSpecs?.quantity}</span>
                                        {task.deadline && (
                                            <span style={{ color: '#ef4444' }}>📅 Needed: {new Date(task.deadline).toLocaleDateString()}</span>
                                        )}
                                    </div>

                                    {!isPrinting ? (
                                        <button
                                            onClick={() => handleStartPrinting(task._id)}
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                        >
                                            🚀 START PRODUCTION
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setSelectedTask(task); setShowMaterialModal(true); }}
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(17, 24, 39, 0.3)' }}
                                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                        >
                                            ✅ MARK COMPLETED
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Recently Finished Jobs</h3>
                {tasks.filter(t => t.status === 'completed').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontStyle: 'italic' }}>
                        No completed jobs yet.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                        {tasks.filter(t => t.status === 'completed').map(task => {
                            const jobType = (task.jobType || task.printSpecs?.designType || '').replace('_', ' ');

                            return (
                                <div key={task._id} style={{ border: '1.5px solid #f3f4f6', borderRadius: '16px', padding: '24px', background: '#f9fafb', opacity: 0.8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '18px', color: '#111827' }}>#{task.orderNumber || task.orderId}</div>
                                            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{jobType}</div>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: '#ecfdf5',
                                            color: '#10b981',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>
                                            Completed
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>
                                        Quantity: <strong>{task.quantity || task.printSpecs?.quantity}</strong>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Completed on: {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showMaterialModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Log Material Usage</h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '600' }}>Please record the materials used for order #{selectedTask.orderNumber} before completion.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', paddingRight: '8px' }}>
                            {materialsUsed.map((row, index) => (
                                <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <select
                                        style={{ flex: 2, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }}
                                        value={row.materialId}
                                        onChange={(e) => {
                                            const newRows = [...materialsUsed];
                                            newRows[index].materialId = e.target.value;
                                            setMaterialsUsed(newRows);
                                        }}
                                    >
                                        <option value="">Select Material...</option>
                                        {inventory.map(item => (
                                            <option key={item._id} value={item._id}>{item.name} ({item.currentStock} {item.unit} available)</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        style={{ width: '80px', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '14px', fontWeight: '600' }}
                                        value={row.quantity}
                                        onChange={(e) => {
                                            const newRows = [...materialsUsed];
                                            newRows[index].quantity = Number(e.target.value);
                                            setMaterialsUsed(newRows);
                                        }}
                                    />
                                    <button onClick={() => removeMaterialRow(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addMaterialRow}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px dashed #e5e7eb', background: 'none', color: '#6b7280', fontWeight: '700', cursor: 'pointer', marginBottom: '32px' }}
                        >
                            + ADD ANOTHER MATERIAL
                        </button>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setShowMaterialModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: '#f3f4f6', color: '#374151', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCompleteJob} style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)' }}>FINISH JOB</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorWorkspace;
