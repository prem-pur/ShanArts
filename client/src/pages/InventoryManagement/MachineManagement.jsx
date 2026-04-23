import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Cpu, 
    Plus, 
    Settings, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    PlayCircle, 
    Trash2,
    Wrench,
    RefreshCw,
    Info
} from 'lucide-react';
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
            case 'Available': return '#64748b'; // Grey
            case 'In Use': return '#111827'; // Black
            case 'Scheduled': return '#111827'; // Black
            case 'Under Maintenance': return '#111827'; // Black
            case 'Out of Order': return '#ef4444'; // Red
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status, size=16) => {
        switch (status) {
            case 'Available': return <CheckCircle2 size={size} />;
            case 'In Use': return <PlayCircle size={size} />;
            case 'Scheduled': return <Clock size={size} />;
            case 'Under Maintenance': return <Wrench size={size} />;
            case 'Out of Order': return <AlertTriangle size={size} />;
            default: return <Info size={size} />;
        }
    };

    if (!isScheduleManager) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f3f4f6', height: '100vh' }}>
                <h2>Access Denied</h2>
                <p>You don't have permission to access machine management.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '28px 36px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Settings size={28} color="#ef4444" /> Machine Control
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
                      Monitor and manage production equipment status and maintenance
                  </p>
                </div>
                {isScheduleManager && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        <Plus size={20} /> Add Machine
                    </button>
                )}
            </div>

            {/* Production Summary Cards */}
            {productionSummary && (
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '40px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ 
                        background: '#fff', 
                        padding: '24px', 
                        borderRadius: '24px', 
                        border: '1px solid #e2e8f0', 
                        flex: 1, 
                        minWidth: '200px',
                        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
                    }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Cpu size={14} /> Total Machines
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>
                            {productionSummary.totalMachines}
                        </div>
                    </div>

                    {Object.entries(productionSummary.statusCounts).map(([status, count]) => (
                        <div key={status} style={{ 
                            background: '#fff', 
                            padding: '24px', 
                            borderRadius: '24px', 
                            border: '1px solid #e2e8f0', 
                            flex: 1, 
                            minWidth: '190px',
                            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
                        }}>
                            <div style={{ 
                                fontSize: '11px', 
                                color: '#64748b', 
                                fontWeight: '800', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.8px', 
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ color: getStatusColor(status) }}>{getStatusIcon(status, 14)}</span> {status}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: getStatusColor(status) }}>
                                {count}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Filter */}
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>Filter By:</span>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Machines</option>
                    <option value="Available">⚪ Available</option>
                    <option value="In Use">⚪ In Use</option>
                    <option value="Scheduled">⚪ Scheduled</option>
                    <option value="Under Maintenance">⚪ Under Maintenance</option>
                </select>
            </div>

            {/* Machines List Container */}
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                        Connected Hardware ({machines.length})
                    </h3>
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                        Loading equipment data...
                    </div>
                ) : (
                    <div>
                        {machines.map(machine => (
                            <div key={machine._id} style={{
                                padding: '24px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'grid',
                                gridTemplateColumns: '1fr 200px 180px',
                                gap: '30px',
                                alignItems: 'center'
                            }}>
                                {/* Machine Info */}
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                                        {machine.name}
                                    </h4>
                                    <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                        {machine.type}
                                    </p>
                                    
                                    {(machine.status === 'In Use' || machine.status === 'Scheduled') && machine.currentOrderId && (
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: '#1e293b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px 14px',
                                            background: '#f8fafc',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <span style={{ color: '#ef4444', fontWeight: '900' }}>#{machine.currentOrderId.orderNumber}</span>
                                            <span style={{ color: '#cbd5e1' }}>|</span>
                                            <span>{machine.operatorId?.name || 'Operator Pending'}</span>
                                            {machine.startTime && (
                                                <>
                                                    <span style={{ color: '#cbd5e1' }}>|</span>
                                                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} /> Started {new Date(machine.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {machine.assignedOrders && machine.assignedOrders.length > 0 && (
                                        <div style={{ marginTop: '16px' }}>
                                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: '800', marginBottom: '8px' }}>
                                                Next Operations
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {machine.assignedOrders.map((order) => (
                                                    <div key={order._id} style={{
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: '#475569',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        background: '#fff',
                                                        borderRadius: '8px',
                                                        border: '1px solid #f1f5f9'
                                                    }}>
                                                        <span style={{ color: '#3b82f6', fontWeight: '800' }}>#{order.orderNumber}</span>
                                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                                        <span>{order.assignedOperatorId?.name || 'Unassigned'}</span>
                                                        <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>{new Date(order.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                <div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        color: getStatusColor(machine.status),
                                        backgroundColor: `${getStatusColor(machine.status)}15`,
                                        border: `1px solid ${getStatusColor(machine.status)}30`,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {getStatusIcon(machine.status, 14)} {machine.status}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => machine.status === 'Under Maintenance' ? handleSetAvailable(machine._id) : openMaintenanceModal(machine)}
                                        disabled={!isScheduleManager}
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            backgroundColor: '#fff',
                                            color: '#475569',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                    >
                                        <Wrench size={14} /> {machine.status === 'Under Maintenance' ? 'Ready' : 'Repair'}
                                    </button>
                                    {isScheduleManager && (
                                        <button
                                            onClick={() => handleDeleteMachine(machine._id)}
                                            style={{
                                                padding: '10px',
                                                border: '1px solid #fee2e2',
                                                borderRadius: '10px',
                                                fontSize: '13px',
                                                backgroundColor: '#fff',
                                                color: '#ef4444',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                        >
                                            <Trash2 size={16} />
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '460px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444' }}><Cpu size={24} /></div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Add New Equipment</h3>
                        </div>
                        <form onSubmit={handleAddMachine} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Machine Identifier</label>
                                <input type="text" value={newMachineData.name} onChange={(e) => setNewMachineData({ ...newMachineData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }} placeholder="e.g. Roland VersaExpress-1" required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Hardware Type</label>
                                <select value={newMachineData.type} onChange={(e) => setNewMachineData({ ...newMachineData, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#fff' }} required>
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

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Cancel</button>
                                <button type="submit" style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: '#ef4444', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>Register Machine</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Maintenance Modal */}
            {showMaintenanceModal && selectedMachine && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '460px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', borderRadius: '12px', background: '#f1f5f9', color: '#111827' }}><Wrench size={24} /></div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Log Maintenance</h3>
                        </div>

                        <div style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            Hardware: <strong style={{ color: '#0f172a' }}>{selectedMachine.name}</strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Breakdown Date</label>
                                <input
                                    type="date"
                                    value={maintenanceData.breakdownDate}
                                    onChange={(e) => setMaintenanceData({ ...maintenanceData, breakdownDate: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Maintenance Notes</label>
                                <textarea
                                    value={maintenanceData.maintenanceNotes}
                                    onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenanceNotes: e.target.value })}
                                    style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '12px', minHeight: '120px', fontSize: '14px', outline: 'none', resize: 'none' }}
                                    placeholder="Describe the issue or required servicing..."
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                type="button"
                                onClick={() => setShowMaintenanceModal(false)}
                                style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff', color: '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={updateMaintenance}
                                style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: '#111827', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
                            >
                                Set Under Repair
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineManagement;
