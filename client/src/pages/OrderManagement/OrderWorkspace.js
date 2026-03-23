import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DesignEditor from "./DesignEditor";
import { API_BASE_URL } from "../../apiBase";
import { useNavigate, useLocation } from "react-router-dom";

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const ImageIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);

const PaintIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

const ImageIconLarge = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const STATUS = {
    DRAFT: "Draft",
    SENT: "Sent to Customer",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
    WAITING: "waiting_approval",
    REVISION: "revision_requested"
};

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
    });    const renderOrderList = () => {
        const newOrdersCount = orders.filter(order => order.status === 'Draft' || order.status === 'pending_design').length;

        return (
            <div style={{ padding: '24px 40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out', minHeight: '100vh' }}>
                {/* Red Notification Banner */}
                {newOrdersCount > 0 && (
                    <div style={{
                        background: '#fee2e2',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #fecaca'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ color: '#ef4444', display: 'flex' }}>
                                <BellIcon />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#b91c1c' }}>
                                    {newOrdersCount} New Orders to Design
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilterTab(STATUS.DRAFT)}
                            style={{
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                fontSize: '13px',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            View New Orders
                        </button>
                    </div>
                )}

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Order Management</h1>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
                            <SearchIcon />
                        </span>
                        <input
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px 16px 10px 42px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                width: '280px',
                                outline: 'none',
                                background: '#fff',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        />
                    </div>
                </header>

                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '24px', gap: '8px' }}>
                    {["all", STATUS.DRAFT, STATUS.SENT, STATUS.APPROVED, STATUS.REJECTED].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterTab(tab)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '12px',
                                background: filterTab === tab ? '#ef4444' : '#fff',
                                color: filterTab === tab ? '#fff' : '#64748b',
                                fontWeight: '800',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: filterTab === tab ? 'none' : '1px solid #e2e8f0',
                                boxShadow: filterTab === tab ? '0 8px 20px rgba(239, 68, 68, 0.25)' : 'none',
                                fontSize: '13px'
                            }}
                        >
                            {tab === 'all' ? 'All Projects' : tab}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {filteredOrders.map(order => {
                        const status = normalizeStatus(order.status);
                        const isApproved = status === STATUS.APPROVED;
                        const isDraft = status === STATUS.DRAFT;
                        const isRejected = status === STATUS.REJECTED;

                        return (
                            <div
                                key={order._id}
                                style={{
                                    background: '#fff',
                                    padding: '20px',
                                    borderRadius: '20px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.02)',
                                    cursor: 'default',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <ImageIcon />
                                    </div>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: isApproved ? '#ecfdf5' : isDraft ? '#f8fafc' : isRejected ? '#fef2f2' : '#f1f5f9',
                                        color: isApproved ? '#059669' : isDraft ? '#64748b' : isRejected ? '#ef4444' : '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.8px',
                                        border: `1px solid ${isApproved ? '#a7f3d0' : isDraft ? '#e2e8f0' : isRejected ? '#fecaca' : '#e2e8f0'}`
                                    }}>
                                        {status}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '2px', letterSpacing: '-0.3px' }}>
                                        {order.customerName || "Untitled Project"}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '0' }}>
                                        {order.printSpecs?.designType || 'General Product'} • {order.printSpecs?.size ?
                                        `${order.printSpecs.size.width || 0}x${order.printSpecs.size.height || 0}${order.printSpecs.size.unit || 'mm'}` :
                                        'Custom size'
                                    }
                                    </p>
                                </div>

                                {(isRejected || status === 'Revision') && order.revisionNotes && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#ef4444', marginBottom: '4px', textTransform: 'uppercase' }}>
                                            Revision Requested:
                                        </div>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#991b1b', fontStyle: 'italic', lineHeight: '1.4', fontWeight: '500' }}>
                                            "{order.revisionNotes}"
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={() => { setSelectedOrder(order); setViewMode("studio"); }}
                                        style={{
                                            background: 'transparent',
                                            color: '#ef4444',
                                            border: '1.5px solid #ef4444',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontWeight: '800',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        Open Studio <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDesignStudio = () => {
        if (!selectedOrder) return null;

        return (
            <div style={{ padding: '24px 40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button onClick={() => setViewMode("list")} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Studio: {selectedOrder.customerName}
                            <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: selectedOrder.status === STATUS.DRAFT ? '#fef3c7' : '#dbeafe',
                                color: selectedOrder.status === STATUS.DRAFT ? '#d97706' : '#2563eb',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                border: `1px solid ${selectedOrder.status === STATUS.DRAFT ? '#fde68a' : '#bfdbfe'}`
                            }}>
                                {normalizeStatus(selectedOrder.status)}
                            </span>
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(normalizeStatus(selectedOrder.status) === STATUS.DRAFT || normalizeStatus(selectedOrder.status) === STATUS.REJECTED) && (
                            <button
                                id="send-approval-btn"
                                onClick={handleSendForApproval}
                                disabled={loading}
                                style={{
                                    background: loading ? '#9ca3af' : '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <SendIcon /> {loading ? 'SENDING...' : 'SEND FOR APPROVAL'}
                            </button>
                        )}
                        <button onClick={() => setShowEditor(true)} style={{ background: 'transparent', color: 'var(--accent-color)', border: '1.5px solid var(--accent-color)', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PaintIcon /> LAUNCH EDITOR
                        </button>
                        <button onClick={() => handleDeleteOrder(selectedOrder._id)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrashIcon /> DELETE
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1.5px solid #d1d5db', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#64748b', display: 'flex' }}><ImageIcon /></span> Design Preview
                            </h3>
                            <div style={{ background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {selectedOrder.currentVersionId ? (
                                    <img src={`${API_BASE_URL}${selectedOrder.currentVersionId.pngFilePath}`} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><ImageIconLarge /></div>
                                        <p style={{ fontWeight: '600', fontSize: '13px' }}>No design versions created yet.</p>
                                        <button onClick={() => setShowEditor(true)} style={{ marginTop: '12px', background: 'transparent', border: '1.5px solid var(--accent-color)', color: 'var(--accent-color)', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>Create First Version</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1.5px solid #d1d5db', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>Customer Brief</h3>
                            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '13px', background: '#f9fafb', padding: '14px', borderRadius: '10px' }}>
                                {shopOrder?.preferences || selectedOrder.requestId?.textContent || 'No specific instructions provided.'}
                            </div>

                            {/* Customer uploaded sample photo */}
                            {shopOrder?.samplePhoto && (
                                <div style={{ marginTop: '14px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Sample / Reference Photo</div>
                                    <img
                                        src={`${API_BASE_URL}${shopOrder.samplePhoto}`}
                                        alt="Customer sample"
                                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #d1d5db', objectFit: 'cover', maxHeight: '180px' }}
                                    />
                                </div>
                            )}

                            {/* Customer uploaded design files */}
                            {shopOrder?.designFiles?.length > 0 && (
                                <div style={{ marginTop: '14px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Design Files</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {shopOrder.designFiles.map((filePath, i) => {
                                            const fileName = filePath.split('/').pop();
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f3f4f6', borderRadius: '8px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                                        {isImage ? '🖼️' : '📄'} {fileName}
                                                    </span>
                                                    <a href={`${API_BASE_URL}${filePath}`} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: '800', textDecoration: 'none' }}>VIEW</a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1.5px solid #d1d5db', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '14px' }}>Specifications</h3>

                            {(selectedOrder.status === 'revision_requested' || selectedOrder.status === 'Rejected') && (() => {
                                const notes = selectedOrder.revisionNotes || '';
                                const reasonMatch = notes.match(/REASON:\s*([\s\S]*?)(?=\n\nWHAT TO CHANGE:|$)/);
                                const changesMatch = notes.match(/WHAT TO CHANGE:\s*([\s\S]*?)$/);
                                const reason = reasonMatch ? reasonMatch[1].trim() : notes;
                                const changes = changesMatch ? changesMatch[1].trim() : null;
                                return (
                                    <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                                        <div style={{ fontWeight: '900', color: '#dc2626', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                                            🚫 Rejected
                                        </div>
                                        <div style={{ marginBottom: changes ? '8px' : 0 }}>
                                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Reason</div>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.5', fontWeight: '600', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5' }}>"{reason}"</p>
                                        </div>
                                        {changes && (
                                            <div>
                                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px', marginTop: '8px' }}>Changes</div>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.5', fontWeight: '600', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5' }}>"{changes}"</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <DetailRow label="Product" value={selectedOrder.printSpecs?.designType} />
                                <DetailRow label="Size" value={
                                    selectedOrder.printSpecs?.size ?
                                        `${selectedOrder.printSpecs.size.width || 0}x${selectedOrder.printSpecs.size.height || 0}${selectedOrder.printSpecs.size.unit || 'mm'}` :
                                        'Custom size'
                                } />
                                <DetailRow label="Qty" value={selectedOrder.printSpecs?.quantity} />
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

    if (loading && orders.length === 0) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#64748b', fontWeight: '600' }}>Loading Studio...</div>;

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {viewMode === "list" ? renderOrderList() : renderDesignStudio()}

            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '20px' }}>Start New Design</h2>
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
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>Customer Name</label>
                                <input name="customerName" placeholder="Enter name" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>Category</label>
                                <select name="designType" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', outline: 'none' }}>
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
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>Size</label>
                                <input name="size" placeholder="e.g. A4" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                                <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>{value || "—"}</span>
    </div>
);

export default OrderWorkspace;
