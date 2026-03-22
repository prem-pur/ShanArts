import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DesignEditor from "./DesignEditor";
import { API_BASE_URL } from "../../apiBase";
import { useNavigate, useLocation } from "react-router-dom";

const OrderWorkspace = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [filterTab, setFilterTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list"); // "list" or "studio"
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newOrdersDismissed, setNewOrdersDismissed] = useState(false);
    const [sentOrdersDismissed, setSentOrdersDismissed] = useState(false);
    const [shopOrder, setShopOrder] = useState(null);

    const STATUS = {
        DRAFT: "Draft",
        SENT: "Sent to Customer",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        COMPLETED: "Completed",
        WAITING: "waiting_approval",
        REVISION: "revision_requested"
    };

    const fetchOrders = useCallback(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/api/orders`)
            .then(res => {
                const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sortedOrders);

                setSelectedOrder(prev => {
                    // 1. If we already had an order selected, keep it selected but with fresh data
                    if (prev) {
                        const updatedOrder = sortedOrders.find(o => o._id === prev._id);
                        return updatedOrder || prev;
                    }
                    // 2. If we navigated from a specific order link
                    if (location.state?.selectedOrderId) {
                        const navOrder = sortedOrders.find(o => o._id === location.state.selectedOrderId);
                        if (navOrder) {
                            setViewMode("studio"); // It's fine to call this here, React batches state updates
                            return navOrder;
                        }
                    }
                    // 3. Fallback to the first order
                    return sortedOrders.length > 0 ? sortedOrders[0] : null;
                });
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [location.state?.selectedOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Fetch the linked ShopOrder when a studio order is selected
    useEffect(() => {
        if (selectedOrder?.shopOrderId) {
            const token = localStorage.getItem('token');
            axios.get(`${API_BASE_URL}/api/shop-orders/${selectedOrder.shopOrderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => setShopOrder(res.data))
                .catch(() => setShopOrder(null));
        } else {
            setShopOrder(null);
        }
    }, [selectedOrder]);

    const normalizeStatus = (rawStatus) => {
        const s = (rawStatus || "").trim().toLowerCase();

        if (s === 'draft' || s === 'design in progress' || !s) return STATUS.DRAFT;
        if (s === 'sent to customer' || s === 'waiting_approval' || s === 'waiting approval') return STATUS.SENT;
        if (s === 'rejected' || s === 'revision_requested' || s === 'revision requested') return STATUS.REJECTED;
        if (s === 'approved' || s === 'scheduled') return STATUS.APPROVED;
        if (s === 'completed') return STATUS.COMPLETED;

        return rawStatus;
    };


    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Delete this design project?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/orders/${orderId}`);
            setSelectedOrder(null);
            setViewMode("list");
            fetchOrders();
        } catch (err) {
            alert("Failed to delete project");
        }
    };

    const handleSendForApproval = async () => {
        if (!selectedOrder) return;
        if (!selectedOrder.currentVersionId) {
            alert("Please create at least one design version before sending for approval.");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Use shopOrderId if available (for orders created from customer orders)
            const orderId = selectedOrder.shopOrderId || selectedOrder._id;
            await axios.post(`${API_BASE_URL}/api/shop-orders/${orderId}/submit-design`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Show a temporary success state
            const btn = document.getElementById('send-approval-btn');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = "✅ SENT!";
                btn.style.background = "#059669";
                setTimeout(() => {
                    if (btn) {
                        btn.innerText = originalText;
                        btn.style.background = "#10b981";
                    }
                }, 3000);
            }

            // Optimistically update the UI to instantly show it
            const newStatus = "waiting_approval"; // Use backend string
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            setOrders(prevOrders => prevOrders.map(o => o._id === selectedOrder._id ? { ...o, status: newStatus } : o));

            setTimeout(fetchOrders, 1000); // Wait a bit for backend to sync
        } catch (err) {
            console.error('Error submitting design:', err);
            alert("Failed to send design for approval: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const status = normalizeStatus(order.status);
        if (filterTab !== "all" && status !== filterTab) return false;
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (order.customerName || "").toLowerCase().includes(term);
    });

    const renderOrderList = () => {
        // Count new orders (excluding ones dismissed by the user)
        const lastViewedTime = parseInt(localStorage.getItem('lastViewedNewOrdersTime') || '0', 10);
        const newOrders = orders.filter(order => {
            const createdAt = new Date(order.createdAt).getTime();
            return order.status === 'Draft' && createdAt > lastViewedTime;
        });

        // Count orders sent to customer (excluding ones dismissed by the user)
        const lastViewedSentTime = parseInt(localStorage.getItem('lastViewedSentOrdersTime') || '0', 10);
        const sentToCustomerOrders = orders.filter(order => {
            const updatedAt = new Date(order.updatedAt || order.createdAt).getTime();
            return order.status === 'Sent to Customer' && updatedAt > lastViewedSentTime;
        });

        // Count approved orders ready for scheduling
        const approvedOrders = orders.filter(order => order.status === 'Approved');

        return (
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
                {newOrders.length > 0 && !newOrdersDismissed && (
                    <div style={{
                        background: 'var(--accent-color)',
                        color: '#fff',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>
                                🎨 {newOrders.length} New Order{newOrders.length > 1 ? 's' : ''} to Design
                            </h3>
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                                Customer orders received and ready for design work
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setFilterTab(STATUS.DRAFT);
                                setNewOrdersDismissed(true);
                                localStorage.setItem('lastViewedNewOrdersTime', Date.now().toString());
                            }}
                            style={{
                                background: '#fff',
                                color: 'var(--accent-color)',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            View New Orders
                        </button>
                    </div>
                )}

                {sentToCustomerOrders.length > 0 && !sentOrdersDismissed && (
                    <div style={{
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>
                                📤 {sentToCustomerOrders.length} Design{sentToCustomerOrders.length > 1 ? 's' : ''} Sent to Customer
                            </h3>
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                                Awaiting customer approval
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setFilterTab(STATUS.SENT);
                                setSentOrdersDismissed(true);
                                localStorage.setItem('lastViewedSentOrdersTime', Date.now().toString());
                            }}
                            style={{
                                background: '#fff',
                                color: '#3b82f6',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            View Sent Orders
                        </button>
                    </div>
                )}


                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Order Management</h1>
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>Create and manage all customer printing orders.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
                        <input
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                padding: '14px 20px 14px 44px',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                width: '320px',
                                outline: 'none',
                                background: '#fff',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                fontSize: '15px'
                            }}
                        />
                    </div>
                </header>

                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '32px', gap: '8px' }}>
                    {["all", STATUS.DRAFT, STATUS.SENT, STATUS.APPROVED, STATUS.REJECTED].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterTab(tab)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                background: filterTab === tab ? '#ef4444' : '#fff',
                                color: filterTab === tab ? '#fff' : '#6b7280',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: '0.2s',
                                border: filterTab === tab ? 'none' : '1px solid #e5e7eb',
                                boxShadow: filterTab === tab ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none'
                            }}
                        >
                            {tab === 'all' ? 'All Projects' : tab}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {filteredOrders.map(order => (
                        <div
                            key={order._id}
                            onClick={() => { setSelectedOrder(order); setViewMode("studio"); }}
                            style={{
                                background: '#fff',
                                padding: '28px',
                                borderRadius: '20px',
                                border: '1px solid #e5e7eb',
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🖼️</div>
                                <span style={{ fontSize: '12px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                    {normalizeStatus(order.status)}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{order.customerName || "Untitled"}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                                {order.printSpecs?.designType} • {order.printSpecs?.size ?
                                `${order.printSpecs.size.width || 0}x${order.printSpecs.size.height || 0}${order.printSpecs.size.unit || 'mm'}` :
                                'Custom size'
                            }
                            </p>
                            {(order.status === 'revision_requested' || order.status === 'Rejected') && order.revisionNotes && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
                                        {order.status === 'Rejected' ? '🚫 Rejected:' : '⚠️ Revision:'}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', fontStyle: 'italic' }}>"{order.revisionNotes}"</p>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                <div style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '14px' }}>OPEN STUDIO →</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDesignStudio = () => {
        if (!selectedOrder) return null;
        return (
            <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={() => setViewMode("list")} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#fff', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>←</button>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Studio: {selectedOrder.customerName}
                            <span style={{
                                fontSize: '14px',
                                fontWeight: '800',
                                padding: '6px 16px',
                                borderRadius: '12px',
                                background: selectedOrder.status === STATUS.DRAFT ? '#fef3c7' : '#dbeafe',
                                color: selectedOrder.status === STATUS.DRAFT ? '#d97706' : '#2563eb',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transform: 'translateY(-2px)'
                            }}>
                                {normalizeStatus(selectedOrder.status)}
                            </span>
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {(normalizeStatus(selectedOrder.status) === STATUS.DRAFT || normalizeStatus(selectedOrder.status) === STATUS.REJECTED) && (
                            <button
                                id="send-approval-btn"
                                onClick={handleSendForApproval}
                                disabled={loading}
                                style={{
                                    background: loading ? '#9ca3af' : '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {loading ? '⏳ SENDING...' : '📤 SEND FOR APPROVAL'}
                            </button>
                        )}
                        <button onClick={() => setShowEditor(true)} style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>🎨 LAUNCH EDITOR</button>
                        <button onClick={() => handleDeleteOrder(selectedOrder._id)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>🗑️ DELETE</button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>🖼️</span> Design Preview
                            </h3>
                            <div style={{ background: '#f9fafb', borderRadius: '16px', border: '2px dashed #e5e7eb', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {selectedOrder.currentVersionId ? (
                                    <img src={`${API_BASE_URL}${selectedOrder.currentVersionId.pngFilePath}`} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌄</div>
                                        <p style={{ fontWeight: '600' }}>No design versions created yet.</p>
                                        <button onClick={() => setShowEditor(true)} style={{ marginTop: '16px', background: 'transparent', border: '1.5px solid var(--accent-color)', color: 'var(--accent-color)', padding: '8px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Create First Version</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>Customer Brief</h3>
                            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '15px', background: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
                                {shopOrder?.preferences || selectedOrder.requestId?.textContent || 'No specific instructions provided.'}
                            </div>

                            {/* Customer uploaded sample photo */}
                            {shopOrder?.samplePhoto && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample / Reference Photo</div>
                                    <img
                                        src={`${API_BASE_URL}${shopOrder.samplePhoto}`}
                                        alt="Customer sample"
                                        style={{ width: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', objectFit: 'cover', maxHeight: '240px' }}
                                    />
                                </div>
                            )}

                            {/* Customer uploaded design files */}
                            {shopOrder?.designFiles?.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Design Files</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {shopOrder.designFiles.map((filePath, i) => {
                                            const fileName = filePath.split('/').pop();
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f3f4f6', borderRadius: '10px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                                        {isImage ? '🖼️' : '📄'} {fileName}
                                                    </span>
                                                    <a href={`${API_BASE_URL}${filePath}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '800', textDecoration: 'none' }}>VIEW</a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '24px' }}>Project Specifications</h3>

                            {(selectedOrder.status === 'revision_requested' || selectedOrder.status === 'Rejected') && (() => {
                                const notes = selectedOrder.revisionNotes || '';
                                const reasonMatch = notes.match(/REASON:\s*([\s\S]*?)(?=\n\nWHAT TO CHANGE:|$)/);
                                const changesMatch = notes.match(/WHAT TO CHANGE:\s*([\s\S]*?)$/);
                                const reason = reasonMatch ? reasonMatch[1].trim() : notes;
                                const changes = changesMatch ? changesMatch[1].trim() : null;
                                return (
                                    <div style={{ background: '#fff5f5', border: '2px solid #fca5a5', padding: '20px', borderRadius: '14px', marginBottom: '24px' }}>
                                        <div style={{ fontWeight: '900', color: '#dc2626', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
                                            🚫 Customer Rejected This Design
                                        </div>
                                        <div style={{ marginBottom: changes ? '14px' : 0 }}>
                                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Rejection Reason</div>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6', fontWeight: '600', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>"{reason}"</p>
                                        </div>
                                        {changes && (
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', marginTop: '12px' }}>What Should Change</div>
                                                <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6', fontWeight: '600', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>"{changes}"</p>
                                            </div>
                                        )}
                                        <div style={{ marginTop: '14px', fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>
                                            ➡ Update the design and click SEND FOR APPROVAL again.
                                        </div>
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <DetailRow label="Product Type" value={selectedOrder.printSpecs?.designType} />
                                <DetailRow label="Dimensions" value={
                                    selectedOrder.printSpecs?.size ?
                                        `${selectedOrder.printSpecs.size.width || 0}x${selectedOrder.printSpecs.size.height || 0}${selectedOrder.printSpecs.size.unit || 'mm'}` :
                                        'Custom size'
                                } />
                                <DetailRow label="Quantity" value={selectedOrder.printSpecs?.quantity} />
                                <DetailRow label="Material" value={selectedOrder.printSpecs?.material || "Standard"} />
                            </div>
                        </div>


                    </div>
                </div>

                {showEditor && (
                    <DesignEditor
                        template={{ name: 'Studio Design', type: selectedOrder.printSpecs?.designType, layoutJson: { width: 900, height: 600, elements: [] } }}
                        order={selectedOrder}
                        onClose={(saved, newVersion) => {
                            setShowEditor(false);
                            if (saved && newVersion) {
                                // Instantly patch the selectedOrder for snappy UI update
                                setSelectedOrder(prev => ({
                                    ...prev,
                                    currentVersionId: newVersion
                                }));
                            }
                            fetchOrders();
                        }}
                    />
                )}
            </div>
        );
    };

    if (loading && orders.length === 0) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>Loading Studio...</div>;

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {viewMode === "list" ? renderOrderList() : renderDesignStudio()}

            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '48px', borderRadius: '24px', width: '100%', maxWidth: '550px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px' }}>Start New Design</h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const payload = {
                                customerName: formData.get('customerName'),
                                status: STATUS.DRAFT,
                                printSpecs: {
                                    designType: formData.get('designType'),
                                    size: formData.get('size'),
                                    quantity: 1
                                }
                            };
                            try {
                                setLoading(true);
                                await axios.post(`${API_BASE_URL}/api/orders`, payload);
                                setShowCreateModal(false);
                                fetchOrders();
                            } catch (err) {
                                alert("Failed to create design project");
                            } finally {
                                setLoading(false);
                            }
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '14px' }}>Customer Name</label>
                                <input name="customerName" placeholder="Enter name" required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '14px' }}>Design Category</label>
                                <select name="designType" required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                    <option value="Poster">Poster</option>
                                    <option value="Flyer">Flyer</option>
                                    <option value="Business Card">Business Card</option>
                                    <option value="Banner">Banner</option>
                                    <option value="Social Media">Social Media Post</option>
                                    <option value="Brochure">Brochure</option>
                                    <option value="Custom">Custom / Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '14px' }}>Preferred Size</label>
                                <input name="size" placeholder="e.g. A4 (210x297mm)" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f9fafb' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{value || "—"}</span>
    </div>
);

export default OrderWorkspace;
