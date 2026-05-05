import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../../apiBase';

function SimpleOperatorWorkspace() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debug, setDebug] = useState({});

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('No token found. Please login again.');
                setLoading(false);
                return;
            }

            console.log('Fetching with token:', token);

            // Get user info
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Current user:', user);

            // Fetch orders and machines in parallel
            const [ordersResponse, machinesResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/orders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/api/machines`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            console.log('Orders response:', ordersResponse.data);
            console.log('Machines response:', machinesResponse.data);

            // Find machines assigned to this operator by name
            const operatorMachines = machinesResponse.data.data.filter(machine => {
                const isAssigned = machine.operatorId && machine.operatorId.name === user.name;
                console.log(`Machine ${machine.name} assigned to operator:`, isAssigned);
                return isAssigned;
            });

            console.log('Operator machines:', operatorMachines);
            console.log('Operator machine IDs:', operatorMachines.map(m => m._id));

            // Filter orders that are assigned to this operator's machines
            const assignedOrders = ordersResponse.data.filter(order => {
                const hasMachine = !!order.assignedMachineId;
                const isInProgress = order.status === 'In Progress' || order.status === 'Printing';
                const isOperatorMachine = operatorMachines.some(machine =>
                    machine._id === order.assignedMachineId
                );

                console.log(`Order ${order.orderId}:`, {
                    hasAssignedMachine: hasMachine,
                    isInProgress: isInProgress,
                    isOperatorMachine: isOperatorMachine,
                    orderMachineId: order.assignedMachineId,
                    operatorMachineIds: operatorMachines.map(m => m._id)
                });

                return hasMachine && isInProgress && isOperatorMachine;
            });

            console.log('Final assigned orders:', assignedOrders);

            setDebug({
                token: token ? 'Present' : 'Missing',
                user: user,
                totalOrders: ordersResponse.data.length,
                totalMachines: machinesResponse.data.data.length,
                operatorMachines: operatorMachines.length,
                assignedOrders: assignedOrders.length,
                operatorMachineNames: operatorMachines.map(m => m.name),
                sampleOrder: assignedOrders[0] || null
            });

            setTasks(assignedOrders);
            setLoading(false);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Error: {error}</h2>
                <button onClick={fetchTasks}>Retry</button>
                <pre style={{ background: '#f0f0f0', padding: '10px' }}>
                    {JSON.stringify(debug, null, 2)}
                </pre>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Operator Dashboard</h1>
            <p>Showing assigned jobs for printing</p>

            <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
                <h3>Debug Info:</h3>
                <pre style={{ fontSize: '12px' }}>
                    {JSON.stringify(debug, null, 2)}
                </pre>
            </div>

            <h2>Assigned Tasks ({tasks.length})</h2>

            {tasks.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
                    <h3>No assigned tasks found</h3>
                    <p>Either no jobs are assigned to machines, or there might be an issue with the data.</p>
                    <button onClick={fetchTasks} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                        Refresh
                    </button>
                </div>
            ) : (
                tasks.map(task => (
                    <div key={task._id} style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', borderRadius: '5px', background: 'white' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{task.orderId}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                            <div><strong>Status:</strong> <span style={{ color: task.status === 'In Progress' ? '#28a745' : '#007bff' }}>{task.status}</span></div>
                            <div><strong>Machine:</strong> {task.assignedMachineName}</div>
                            <div><strong>Type:</strong> {task.printSpecs?.designType}</div>
                            <div><strong>Quantity:</strong> {task.printSpecs?.quantity}</div>
                        </div>
                        {task.printSpecs?.description && (
                            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#666' }}>
                                {task.printSpecs.description}
                            </p>
                        )}
                        <div style={{ marginTop: '15px' }}>
                            <button style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
                                Start Printing
                            </button>
                            <button style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>
                                Complete Job
                            </button>
                        </div>
                    </div>
                ))
            )}

            <div style={{ marginTop: '20px' }}>
                <button onClick={fetchTasks} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                    Refresh Tasks
                </button>
            </div>
        </div>
    );
}

export default SimpleOperatorWorkspace;
