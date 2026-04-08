import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import { useToast, ToastContainer } from './Toast';

const Schedule = () => {
    const [orders, setOrders] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [showMachineModal, setShowMachineModal] = useState(false);
    const { toasts, showToast, removeToast } = useToast();

    useEffect(() => {
        fetchOrders();
        fetchMachines();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Filter orders that are approved or scheduled
            const scheduledOrders = response.data.filter(order =>
                order.status === 'Approved' || order.status === 'Completed'
            );
            setOrders(scheduledOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/machines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMachines(response.data);
        } catch (error) {
            console.error('Failed to fetch machines:', error);
        }
    };

    const getRelatedMachines = (orderType) => {
        const machineTypeMap = {
            'business_card': ['digital_printer', 'laminator', 'cutting_machine'],
            'flyer': ['digital_printer', 'offset_printer'],
            'banner': ['large_format_printer', 'laminator', 'cutting_machine'],
            'brochure': ['digital_printer', 'folding_machine'],
            'poster': ['large_format_printer', 'laminator', 'cutting_machine'],
            'sticker': ['digital_printer', 'cutting_machine'],
            'invitation': ['digital_printer', 'embossing_machine'],
            'social_media': ['digital_printer'],
            'other': ['digital_printer', 'laminator']
        };

        return machineTypeMap[orderType] || [];
    };

    const handleMachineSelection = (order) => {
        setSelectedOrder(order);
        setSelectedMachine(null);
        setShowMachineModal(true);
    };

    const handleAssignMachine = async () => {
        if (!selectedOrder || !selectedMachine) {
            showToast('Please select a machine', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/api/orders/${selectedOrder._id}/assign-machine`, {
                machineId: selectedMachine,
                status: 'In Progress'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            showToast('Machine assigned successfully!', 'success');
            setShowMachineModal(false);
            fetchOrders();
        } catch (error) {
            console.error('Failed to assign machine:', error);
            showToast('Failed to assign machine', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return '#10b981';
            case 'Completed': return '#059669';
            case 'In Progress': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return '⏳';
            case 'Completed': return '✅';
            case 'In Progress': return '🔄';
            default: return '📋';
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f3f4f6'
            }}>
                <div style={{
                    textAlign: 'center',
                    color: '#6b7280'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '16px' }}>Loading schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            {/* Header */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(229, 231, 235, 0.1)',
                padding: '24px 48px',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '36px',
                            fontWeight: '900',
                            color: '#111827',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            🗓️ Production Schedule
                        </h1>
                        <p style={{
                            color: '#6b7280',
                            margin: '8px 0 0 24px',
                            fontSize: '16px',
                            fontWeight: '500'
                        }}>
                            Manage production timelines and order scheduling
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
                {orders.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 40px',
                        background: '#fff',
                        borderRadius: '20px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            color: '#111827',
                            marginBottom: '16px'
                        }}>
                            No Scheduled Orders
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            lineHeight: 1.6,
                            maxWidth: '400px'
                        }}>
                            Orders that have been approved by customers will appear here in the production schedule.
                        </p>
                    </div>
                ) : (
                    /* Timeline View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {orders.map((order, index) => (
                            <div key={order._id} style={{
                                display: 'flex',
                                gap: '24px',
                                alignItems: 'flex-start',
                                padding: '24px',
                                background: '#fff',
                                borderRadius: '16px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                borderLeft: `4px solid ${getStatusColor(order.status)}`,
                                transition: 'all 0.3s ease'
                            }}>
                                {/* Date & Status */}
                                <div style={{ minWidth: '200px' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#6b7280',
                                        marginBottom: '8px'
                                    }}>
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 12px',
                                        background: `${getStatusColor(order.status)}20`,
                                        borderRadius: '20px',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}>
                                        <span>{getStatusIcon(order.status)}</span>
                                        <span>{order.status}</span>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '12px'
                                    }}>
                                        <div>
                                            <h4 style={{
                                                fontSize: '18px',
                                                fontWeight: '800',
                                                color: '#111827',
                                                marginBottom: '4px'
                                            }}>
                                                {order.customerName}
                                            </h4>
                                            <p style={{
                                                color: '#6b7280',
                                                fontSize: '14px',
                                                margin: 0
                                            }}>
                                                {order.printSpecs?.designType} • {order.printSpecs?.quantity} units
                                            </p>
                                        </div>
                                        <div style={{
                                            fontSize: '20px',
                                            fontWeight: '900',
                                            color: '#111827'
                                        }}>
                                            #{order.orderId}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '16px',
                                        flexWrap: 'wrap',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            background: '#f8fafc',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#059669'
                                        }}>
                                            📐 {order.printSpecs?.size?.width || 0}x{order.printSpecs?.size?.height || 0}{order.printSpecs?.size?.unit || 'mm'}
                                        </div>
                                        <div style={{
                                            background: '#fef3c7',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#92400e'
                                        }}>
                                            ⏱️ {new Date(order.printSpecs?.deadline).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Machine Selection Button */}
                                    {order.status === 'Approved' && (
                                        <button
                                            onClick={() => handleMachineSelection(order)}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: '#3b82f6',
                                                color: '#fff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            🖨️ Assign Machine
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Machine Selection Modal */}
            {showMachineModal && selectedOrder && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: '600px',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: '900',
                                color: '#111827',
                                marginBottom: '8px'
                            }}>
                                🖨️ Assign Machine to Order #{selectedOrder.orderId}
                            </h3>
                            <p style={{
                                color: '#6b7280',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>
                                {selectedOrder.printSpecs?.designType} • {selectedOrder.printSpecs?.quantity} units
                            </p>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#374151'
                            }}>
                                Select Machine
                            </label>
                            <select
                                value={selectedMachine || ''}
                                onChange={(e) => setSelectedMachine(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    background: '#fff',
                                    color: '#374151'
                                }}
                            >
                                <option value="">Choose a machine...</option>
                                {machines
                                    .filter(machine => {
                                        const relatedTypes = getRelatedMachines(selectedOrder.printSpecs?.designType);
                                        return relatedTypes.includes(machine.type) && machine.status === 'available';
                                    })
                                    .map(machine => (
                                        <option key={machine._id} value={machine._id}>
                                            {machine.name} ({machine.type}) - {machine.status}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={() => setShowMachineModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#f3f4f6',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignMachine}
                                style={{
                                    flex: 2,
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                Assign Machine
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{
                textAlign: 'center',
                padding: '24px',
                borderTop: '1px solid rgba(229, 231, 235, 0.1)',
                color: '#6b7280',
                fontSize: '14px'
            }}>
                <p>© 2026 Shan Art Advertising. Production Scheduling System.</p>
            </div>
        </div>
    );
};

export default Schedule;
