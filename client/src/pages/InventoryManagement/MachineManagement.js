import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const MachineManagement = () => {
    const [machines, setMachines] = useState([]);
    const [productionSummary, setProductionSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [maintenanceData, setMaintenanceData] = useState({
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        maintenanceNotes: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isScheduleManager = user.role === 'admin' || user.role === 'staff_schedule';

    useEffect(() => {
        fetchMachines();
        fetchProductionSummary();
    }, [selectedStatus]);

    const fetchMachines = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL}/api/machines`;
            
            if (selectedStatus !== 'all') {
                url += `/filter/${selectedStatus}`;
            }
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setMachines(response.data.data);
        } catch (err) {
            console.error('Failed to fetch machines:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductionSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/machines/status/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setProductionSummary(response.data.data);
        } catch (err) {
            console.error('Failed to fetch production summary:', err);
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
            
            fetchMachines();
            fetchProductionSummary();
        } catch (err) {
            console.error('Failed to update machine status:', err);
        }
    };

    const openMaintenanceModal = (machine) => {
        setSelectedMachine(machine);
        setMaintenanceData({
            lastMaintenanceDate: machine.lastMaintenanceDate ? new Date(machine.lastMaintenanceDate).toISOString().split('T')[0] : '',
            nextMaintenanceDate: machine.nextMaintenanceDate ? new Date(machine.nextMaintenanceDate).toISOString().split('T')[0] : '',
            maintenanceNotes: machine.notes || ''
        });
        setShowMaintenanceModal(true);
    };

    const updateMaintenance = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/machines/${selectedMachine._id}/maintenance`, {
                lastMaintenanceDate: maintenanceData.lastMaintenanceDate,
                nextMaintenanceDate: maintenanceData.nextMaintenanceDate,
                maintenanceNotes: maintenanceData.maintenanceNotes
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setShowMaintenanceModal(false);
            fetchMachines();
            fetchProductionSummary();
        } catch (err) {
            console.error('Failed to update maintenance:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return '#10b981';
            case 'In Use': return '#3b82f6';
            case 'Scheduled': return '#8b5cf6';
            case 'Under Maintenance': return '#f59e0b';
            case 'Out of Order': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Available': return '🟢';
            case 'In Use': return '🔵';
            case 'Scheduled': return '🟣';
            case 'Under Maintenance': return '🟡';
            case 'Out of Order': return '🔴';
            default: return '⚫';
        }
    };

    if (!isScheduleManager) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You don't have permission to access machine management.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>
                        🖨️ Machine Management
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>
                        Monitor and manage production equipment status and maintenance
                    </p>
                </div>
            </div>

            {/* Production Summary */}
            {productionSummary && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '40px' 
                }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📊 Total Machines</h3>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#111827' }}>
                            {productionSummary.totalMachines}
                        </div>
                    </div>
                    
                    {Object.entries(productionSummary.statusCounts).map(([status, count]) => (
                        <div key={status} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>
                                {getStatusIcon(status)} {status}
                            </h3>
                            <div style={{ fontSize: '36px', fontWeight: '900', color: getStatusColor(status) }}>
                                {count}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Filter */}
            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Filter by Status:
                </label>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        minWidth: '200px'
                    }}
                >
                    <option value="all">All Machines</option>
                    <option value="Available">🟢 Available</option>
                    <option value="In Use">🔵 In Use</option>
                    <option value="Scheduled">🟣 Scheduled</option>
                    <option value="Under Maintenance">🟡 Under Maintenance</option>
                    <option value="Out of Order">🔴 Out of Order</option>
                </select>
            </div>

            {/* Machines List */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                        Machines ({machines.length})
                    </h3>
                </div>
                
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        Loading machines...
                    </div>
                ) : (
                    <div>
                        {machines.map(machine => (
                            <div key={machine._id} style={{ 
                                padding: '24px', 
                                borderBottom: '1px solid #f3f4f6',
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                                gap: '20px',
                                alignItems: 'center'
                            }}>
                                {/* Machine Info */}
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                                        {machine.name}
                                    </h4>
                                    <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>
                                        {machine.type}
                                    </p>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
                                        📍 {machine.location}
                                    </p>
                                    {machine.currentOrderId && (
                                        <p style={{ margin: '4px 0 0 0', color: '#3b82f6', fontSize: '12px' }}>
                                            📋 Current: {machine.currentOrderId.orderId}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'white',
                                        backgroundColor: getStatusColor(machine.status)
                                    }}>
                                        {getStatusIcon(machine.status)} {machine.status}
                                    </div>
                                </div>

                                {/* Operator */}
                                <div>
                                    {machine.operatorId ? (
                                        <div>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                                {machine.operatorId.name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                                                Operator
                                            </p>
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                                            Unassigned
                                        </p>
                                    )}
                                </div>

                                {/* Time Info */}
                                <div>
                                    {machine.startTime && (
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                                            🕒 Started: {new Date(machine.startTime).toLocaleTimeString()}
                                        </p>
                                    )}
                                    {machine.estimatedEndTime && (
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                                            ⏱️ Est. End: {new Date(machine.estimatedEndTime).toLocaleTimeString()}
                                        </p>
                                    )}
                                    {machine.nextMaintenanceDate && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#f59e0b' }}>
                                            🔧 Maintenance: {new Date(machine.nextMaintenanceDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    <select
                                        value={machine.status}
                                        onChange={(e) => updateMachineStatus(machine._id, e.target.value)}
                                        style={{
                                            padding: '8px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="Available">🟢 Available</option>
                                        <option value="In Use">🔵 In Use</option>
                                        <option value="Scheduled">🟣 Scheduled</option>
                                        <option value="Under Maintenance">🟡 Under Maintenance</option>
                                        <option value="Out of Order">🔴 Out of Order</option>
                                    </select>
                                    
                                    <button
                                        onClick={() => openMaintenanceModal(machine)}
                                        style={{
                                            padding: '8px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            backgroundColor: '#f3f4f6',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🔧 Maintenance
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Maintenance Modal */}
            {showMaintenanceModal && selectedMachine && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '16px',
                        padding: '32px'
                    }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>
                            🔧 Maintenance: {selectedMachine.name}
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                    Last Maintenance Date
                                </label>
                                <input
                                    type="date"
                                    value={maintenanceData.lastMaintenanceDate}
                                    onChange={(e) => setMaintenanceData({...maintenanceData, lastMaintenanceDate: e.target.value})}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                    Next Maintenance Date
                                </label>
                                <input
                                    type="date"
                                    value={maintenanceData.nextMaintenanceDate}
                                    onChange={(e) => setMaintenanceData({...maintenanceData, nextMaintenanceDate: e.target.value})}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                    Maintenance Notes
                                </label>
                                <textarea
                                    value={maintenanceData.maintenanceNotes}
                                    onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceNotes: e.target.value})}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Enter maintenance details..."
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={() => setShowMaintenanceModal(false)}
                                style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f3f4f6', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateMaintenance}
                                style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                            >
                                Update Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineManagement;
