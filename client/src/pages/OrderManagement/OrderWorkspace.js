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

    const STATUS = {
        DRAFT: "Draft",
        SENT: "Sent to Customer",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        COMPLETED: "Completed",
    };

    const fetchOrders = useCallback(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/api/orders`)
            .then(res => {
                const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sortedOrders);

                if (location.state?.selectedOrderId) {
                    const navOrder = sortedOrders.find(o => o._id === location.state.selectedOrderId);
                    if (navOrder) {
                        setSelectedOrder(navOrder);
                        setViewMode("studio");
                    }
                } else if (sortedOrders.length > 0 && !selectedOrder) {
                    setSelectedOrder(sortedOrders[0]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [location.state?.selectedOrderId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const normalizeStatus = (rawStatus) => {
        const legacyMap = {
            "Design In Progress": STATUS.DRAFT,
            "Waiting Approval": STATUS.SENT,
            "Revision Requested": STATUS.REJECTED,
        };
        const s = (rawStatus || "").trim();
        return legacyMap[s] || s || STATUS.DRAFT;
    };

    const getBadgeClassForStatus = (status) => {
        const s = normalizeStatus(status);
        if (s === STATUS.DRAFT) return "draft";
        if (s === STATUS.SENT) return "sent";
        if (s === STATUS.APPROVED) return "approved";
        if (s === STATUS.REJECTED) return "rejected";
        if (s === STATUS.COMPLETED) return "completed";
        return "draft";
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
        if (!window.confirm("Send this design to the customer for approval?")) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Use shopOrderId if available (for orders created from customer orders)
            const orderId = selectedOrder.shopOrderId || selectedOrder._id;
            await axios.post(`${API_BASE_URL}/api/shop-orders/${orderId}/submit-design`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Design sent to customer!");
            fetchOrders();
            setViewMode("list");
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
        // Count new orders (created within last 24 hours, excluding rejected/sent orders)
        const newOrders = orders.filter(order => {
            const createdAt = new Date(order.createdAt);
            const now = new Date();
            const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
            return hoursDiff <= 24 && order.status === 'Draft';
        });

        // Count orders sent to customer (waiting approval)
        const sentToCustomerOrders = orders.filter(order => order.status === 'Sent to Customer');

        // Count approved orders ready for scheduling
        const approvedOrders = orders.filter(order => order.status === 'Approved');

        return (
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
                {newOrders.length > 0 && (
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
                            onClick={() => setFilterTab(STATUS.DRAFT)}
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

                {sentToCustomerOrders.length > 0 && (
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
                            onClick={() => setFilterTab(STATUS.SENT)}
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

                {approvedOrders.length > 0 && (
                    <div style={{
                        background: '#10b981',
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
                                ✅ {approvedOrders.length} Order{approvedOrders.length > 1 ? 's' : ''} Ready for Scheduling
                            </h3>
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                                Customer approved - ready for production scheduling
                            </p>
                        </div>
                        <button
                            onClick={() => setFilterTab(STATUS.APPROVED)}
                            style={{
                                background: '#fff',
                                color: '#10b981',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            View Approved Orders
                        </button>
                    </div>
                )}

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>Design Workspace</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage and create professional print designs for customers.</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#1a1a1b', color: '#fff', border: 'none', padding: '14px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        ◈ Logout
                    </button>
                </header>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: '#fff', padding: '8px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {["all", STATUS.DRAFT, STATUS.SENT, STATUS.APPROVED, STATUS.REJECTED].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterTab(tab)}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: filterTab === tab ? 'var(--accent-color)' : 'transparent',
                                    color: filterTab === tab ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                {tab === 'all' ? 'All Projects' : tab}
                            </button>
                        ))}
                    </div>
                    <input
                        placeholder="Search by customer..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #e5e7eb', width: '300px', outline: 'none' }}
                    />
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
                        <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>Studio: {selectedOrder.customerName}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedOrder.status !== 'waiting_approval' && selectedOrder.status !== 'scheduled' && (
                            <button
                                onClick={handleSendForApproval}
                                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                📤 SEND FOR APPROVAL
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
                            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', background: '#f9fafb', padding: '24px', borderRadius: '12px' }}>
                                {selectedOrder.requestId?.textContent || "No specific instructions provided by customer."}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '24px' }}>Project Specifications</h3>

                            {(selectedOrder.status === 'revision_requested' || selectedOrder.status === 'Rejected') && (
                                <div style={{ background: '#fff5f5', border: '1.5px dashed var(--accent-color)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                                    <div style={{ fontWeight: '800', color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        {selectedOrder.status === 'Rejected' ? '🚫 ORDER REJECTED' : '⚠️ REVISION REQUESTED'}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6', fontWeight: '600' }}>"{selectedOrder.revisionNotes}"</p>
                                </div>
                            )}

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

                        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>Shared Assets</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(selectedOrder.uploadedFiles || []).map((file, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{file.fileName}</span>
                                        <a href={`${API_BASE_URL}${file.filePath}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '800', textDecoration: 'none' }}>VIEW</a>
                                    </div>
                                ))}
                                {(!selectedOrder.uploadedFiles || selectedOrder.uploadedFiles.length === 0) && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No assets uploaded.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {showEditor && (
                    <DesignEditor
                        template={{ name: 'Studio Design', type: selectedOrder.printSpecs?.designType, layoutJson: { width: 900, height: 600, elements: [] } }}
                        order={selectedOrder}
                        onClose={() => { setShowEditor(false); fetchOrders(); }}
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
