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
        breakdownDate: '',
        maintenanceNotes: ''
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMachineData, setNewMachineData] = useState({ name: '', type: '' });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isScheduleManager = user.role === 'admin' || user.role === 'staff_schedule';

    useEffect(() => {
        fetchMachines();
        fetchProductionSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            breakdownDate: machine.breakdownDate ? new Date(machine.breakdownDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            maintenanceNotes: machine.notes || ''
        });
        setShowMaintenanceModal(true);
    };

    const updateMaintenance = async () => {
        if (!selectedMachine) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_BASE_URL}/api/machines/${selectedMachine._id}/maintenance`, {
                status: 'Under Maintenance',
                breakdownDate: maintenanceData.breakdownDate,
                maintenanceNotes: maintenanceData.maintenanceNotes
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setShowMaintenanceModal(false);
                fetchMachines();
                fetchProductionSummary();
                alert("Machine status updated to Under Maintenance.");
            }
        } catch (err) {
            console.error('Failed to update maintenance info:', err);
            const msg = err.response?.data?.message || err.message || "Unknown error occurred";
            alert(`Failed: ${msg}`);
        }
    };

    const handleSetAvailable = async (machineId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/machines/${machineId}/maintenance`, {
                status: 'Available'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchMachines();
            fetchProductionSummary();
        } catch (err) {
            console.error('Failed to set machine available:', err);
        }
    };

    const handleAddMachine = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/machines`, newMachineData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShowAddModal(false);
            setNewMachineData({ name: '', type: '' });
            fetchMachines();
            fetchProductionSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add machine');
        }
    };

    const handleDeleteMachine = async (machineId) => {
        if (!window.confirm("Are you sure you want to permanently remove this machine from the system?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/machines/${machineId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchMachines();
            fetchProductionSummary();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete machine');
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
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '900',
                        color: '#111827',
                        margin: 0,
                        letterSpacing: '-1px',
                        lineHeight: 1,
                        textTransform: 'uppercase'
                    }}>
                        Machine Control
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>
                        Monitor and manage production equipment status and maintenance
                    </p>
                </div>
                {isScheduleManager && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#D93232',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        + Add Machine
                    </button>
                )}
            </div>

            {/* Production Summary */}
            {productionSummary && (
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '40px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ background: '#fff', padding: '22px 26px', borderRadius: '14px', border: '1px solid #e5e7eb', whiteSpace: 'nowrap', minWidth: '200px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '700', marginBottom: '8px' }}>📊 Total Machines</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#111827' }}>
                            {productionSummary.totalMachines}
                        </div>
                    </div>

                    {Object.entries(productionSummary.statusCounts).map(([status, count]) => (
                        <div key={status} style={{ background: '#fff', padding: '22px 26px', borderRadius: '14px', border: '1px solid #e5e7eb', whiteSpace: 'nowrap', minWidth: '190px' }}>
                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '700', marginBottom: '8px' }}>
                                {getStatusIcon(status)} {status}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: getStatusColor(status) }}>
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
                                gridTemplateColumns: '3fr 1fr 1fr',
                                gap: '30px',
                                alignItems: 'center'
                            }}>
                                {/* Machine Info & Active Order */}
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                                        {machine.name}
                                    </h4>
                                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                        {machine.type}
                                    </p>
                                    {(machine.status === 'In Use' || machine.status === 'Scheduled') && machine.currentOrderId && (
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '800',
                                            color: '#0f172a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '10px',
                                            padding: '8px 12px',
                                            background: '#f1f5f9',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid #3b82f6'
                                        }}>
                                            <span style={{ color: '#3b82f6' }}>#{machine.currentOrderId.orderNumber}</span>
                                            <span style={{ color: '#94a3b8' }}>•</span>
                                            <span>{machine.operatorId?.name || 'Unassigned'}</span>
                                            {machine.startTime && (
                                                <>
                                                    <span style={{ color: '#94a3b8' }}>•</span>
                                                    <span style={{ color: '#64748b', fontWeight: '600' }}>
                                                            🕒 Start date: {new Date(machine.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {machine.assignedOrders && machine.assignedOrders.length > 0 && (
                                        <div style={{ marginTop: '12px' }}>
                                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: '900', marginBottom: '6px' }}>
                                                ⏭️ UP NEXT (ASSIGNED)
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {machine.assignedOrders.map((order) => (
                                                    <div key={order._id} style={{
                                                        fontSize: '13px',
                                                        fontWeight: '800',
                                                        color: '#0f172a',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        background: '#f1f5f9',
                                                        borderRadius: '8px',
                                                        borderLeft: '4px solid #3b82f6'
                                                    }}>
                                                        <span style={{ color: '#3b82f6' }}>#{order.orderNumber}</span>
                                                        <span style={{ color: '#94a3b8' }}>•</span>
                                                        <span>{order.assignedOperatorId?.name || 'Unassigned Operator'}</span>
                                                        <span style={{ color: '#94a3b8' }}>•</span>
                                                        <span style={{ color: '#64748b', fontWeight: '600' }}>{order.jobType} • 🕒 {new Date(order.scheduledStart).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span style={{
                                                            marginLeft: 'auto',
                                                            fontSize: '10px',
                                                            color: '#3b82f6',
                                                            textTransform: 'uppercase',
                                                            background: '#eff6ff',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #dbeafe',
                                                            fontWeight: '900'
                                                        }}>
                                                                {order.status}
                                                            </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Status */}
                                <div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: 'white',
                                        backgroundColor: getStatusColor(machine.status)
                                    }}>
                                        {getStatusIcon(machine.status)} {machine.status}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                    {/* Manual status dropdown removed as requested. Transitions are now automated. */}

                                    <button
                                        onClick={() => machine.status === 'Under Maintenance' ? handleSetAvailable(machine._id) : openMaintenanceModal(machine)}
                                        disabled={!isScheduleManager}
                                        style={{
                                            padding: '10px',
                                            border: '1px solid #dfe3ea',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            backgroundColor: !isScheduleManager ? '#f3f4f6' : '#eef0f6',
                                            color: !isScheduleManager ? '#94a3b8' : '#5b4f78',
                                            fontWeight: '700',
                                            cursor: !isScheduleManager ? 'not-allowed' : 'pointer',
                                            opacity: !isScheduleManager ? 0.7 : 1,
                                            width: '100%'
                                        }}
                                        title={!isScheduleManager ? "Only managers can update machine status" : ""}
                                    >
                                        {machine.status === 'Under Maintenance' ? '🔄 Set Available' : '🔧 Maintenance'}
                                    </button>
                                    {isScheduleManager && (
                                        <button
                                            onClick={() => handleDeleteMachine(machine._id)}
                                            style={{
                                                padding: '10px',
                                                border: '1px solid #f3c7c9',
                                                borderRadius: '10px',
                                                fontSize: '13px',
                                                backgroundColor: '#fff7f7',
                                                color: '#d93232',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                width: '100%'
                                            }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Machine Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '32px' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Add New Machine</h3>
                        <form onSubmit={handleAddMachine} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Machine Name</label>
                                <input type="text" value={newMachineData.name} onChange={(e) => setNewMachineData({ ...newMachineData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Machine Type</label>
                                <select value={newMachineData.type} onChange={(e) => setNewMachineData({ ...newMachineData, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }} required>
                                    <option value="">Select Category...</option>
                                    <option value="Digital Printer">Digital Printer</option>
                                    <option value="Offset Printer">Offset Printer</option>
                                    <option value="Large Format Printer">Large Format Printer</option>
                                    <option value="Cutter">Cutter</option>
                                    <option value="Laminator">Laminator</option>
                                    <option value="Folding Machine">Folding Machine</option>
                                    <option value="Embossing Machine">Embossing Machine</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f3f4f6', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                                <button type="submit" style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#D93232', color: 'white', fontWeight: '800', cursor: 'pointer' }}>Add Machine</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                    Breakdown Date
                                </label>
                                <input
                                    type="date"
                                    value={maintenanceData.breakdownDate}
                                    onChange={(e) => setMaintenanceData({ ...maintenanceData, breakdownDate: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                    Maintenance Notes
                                </label>
                                <textarea
                                    value={maintenanceData.maintenanceNotes}
                                    onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenanceNotes: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Enter maintenance details..."
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setShowMaintenanceModal(false)}
                                style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={updateMaintenance}
                                style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#D93232', color: '#fff', fontWeight: '600' }}
                            >
                                Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineManagement;
