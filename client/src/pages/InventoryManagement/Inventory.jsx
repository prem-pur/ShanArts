import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import QRCodeDisplay from './QRCodeDisplay';
import QRScanner from './QRScanner';
import AddMaterialModal from './AddMaterialModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const Inventory = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [categories, setCategories] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [qrMaterial, setQrMaterial] = useState(null); // material whose QR to display
    const [newlyCreatedMaterial, setNewlyCreatedMaterial] = useState(null); // show QR after create
    const [stockInData, setStockInData] = useState({
        quantity: 0,
        costPerUnit: 0,
        supplier: '',
        notes: ''
    });
    const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [materialToDelete, setMaterialToDelete] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isInventoryManager = user.role === 'admin' || user.role === 'staff_inventory';

    useEffect(() => {
        fetchMaterials();
        fetchCategories();
        if (user.role === 'admin') {
            fetchNotifications();
        }
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const stockRemovalAlerts = (response.data.data || []).filter(n => n.type === 'stock_removal');
            setNotifications(stockRemovalAlerts);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/inventory/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/inventory`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMaterials(response.data.data);
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStockIn = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/inventory/stock-in`, {
                materialId: selectedMaterial._id,
                ...stockInData
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShowStockInModal(false);
            setStockInData({ quantity: 0, costPerUnit: 0, supplier: '', notes: '' });
            fetchMaterials();
        } catch (err) {
            alert('Failed to record stock-in');
        }
    };

    const handleRequestDelete = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/inventory/${materialToDelete._id}/request-delete`, {
                password: deletePassword
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShowDeleteRequestModal(false);
            setDeletePassword('');
            setMaterialToDelete(null);
            fetchMaterials();
            alert('Deletion request sent to admin successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to request deletion. Check your password.');
        }
    };

    const handleAdminDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this material?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/inventory/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchMaterials();
        } catch (err) {
            alert('Failed to delete material');
        }
    };

    const getCategoryIcon = (category) => {
        const icons = { Ink: '🧪', Paper: '📄', Vinyl: '🎞️', Other: '📦' };
        return icons[category] || '📦';
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Inventory...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        opacity: 0;
                    }
                `}
            </style>
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px', marginBottom: '8px' }}>INVENTORY CONTROL</h1>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Track and manage production materials and stock levels.</p>
                </div>
                {isInventoryManager && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowQRScanner(true)}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            📷 QR SCANNER
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)' }}
                        >
                            + NEW MATERIAL
                        </button>
                    </div>
                )}
            </div>

            {/* Emergency Stock Removal Alerts */}
            {user.role === 'admin' && notifications.length > 0 && (
                <div className="animate-fade-in" style={{ background: '#fff', borderRadius: '24px', padding: '32px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '2px solid #fee2e2', animationDelay: '0.05s' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🚨 Emergency Stock Removal Alerts
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.map(n => (
                            <div key={n._id} style={{ padding: '16px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#991b1b', marginBottom: '6px' }}>{n.title}</div>
                                    <div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: '1.5' }}>{n.message}</div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inventory Levels Dashboard Graph */}
            <div className="animate-fade-in" style={{ background: '#fff', borderRadius: '24px', padding: '32px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6', animationDelay: '0.1s' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📊 Stock Levels Overview
                </h2>
                <div style={{ height: '350px', width: '100%' }}>
                    {materials.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={materials} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const isLow = data.currentStock <= data.reorderThreshold;
                                            return (
                                                <div style={{ background: '#111827', color: '#fff', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <p style={{ margin: '0 0 6px 0', fontWeight: '800', fontSize: '14px' }}>{data.name}</p>
                                                    <p style={{ margin: '0', fontSize: '13px', color: '#9ca3af' }}>
                                                        Stock: <span style={{ color: isLow ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '16px' }}>{data.currentStock}</span> {data.unit}
                                                    </p>
                                                    {isLow && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase' }}>⚠️ Low Stock Alert</p>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="currentStock" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {materials.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.currentStock <= entry.reorderThreshold ? '#ef4444' : '#8b5cf6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: '600' }}>
                            No inventory data available for graph.
                        </div>
                    )}
                </div>
            </div>

            {/* Material Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {materials.map((item, index) => {
                    const isLowStock = item.currentStock <= item.reorderThreshold;
                    return (
                        <div key={item._id} className="animate-fade-in" style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: isLowStock ? '2px solid #fee2e2' : '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', position: 'relative', animationDelay: `${0.2 + (index * 0.05)}s` }}>
                            {isLowStock && (
                                <span style={{ position: 'absolute', top: '24px', right: '24px', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>LOW STOCK</span>
                            )}
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>{getCategoryIcon(item.category)}</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>{item.name}</h3>
                            <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '600', marginBottom: '16px' }}>{item.category.toUpperCase()}</div>

                            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>Current Stock</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: isLowStock ? '#dc2626' : '#111827' }}>
                                    {item.currentStock} <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>{item.unit}</span>
                                </div>
                            </div>

                            {/* QR Code indicator */}
                            {item.qrCode && (
                                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                                    <img
                                        src={item.qrCode}
                                        alt="QR"
                                        style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px' }}>
                                {/* View full QR code */}
                                <button
                                    onClick={() => setQrMaterial(item)}
                                    title="View / Download QR Code"
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #e5e7eb',
                                        background: 'none',
                                        color: '#374151',
                                        fontWeight: '700',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={e => e.target.style.background = '#f9fafb'}
                                    onMouseOut={e => e.target.style.background = 'none'}
                                >
                                    🔲 QR CODE
                                </button>

                                {isInventoryManager && (
                                    <button
                                        onClick={() => { setSelectedMaterial(item); setShowStockInModal(true); }}
                                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'none', color: '#374151', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.target.style.background = '#f9fafb'}
                                        onMouseOut={e => e.target.style.background = 'none'}
                                    >
                                        RESTOCK
                                    </button>
                                )}
                            </div>

                            {/* Deletion Controls */}
                            {isInventoryManager && (user.role !== 'admin' || item.deletionRequested) && (
                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                    {user.role === 'admin' ? (
                                        <button
                                            onClick={() => handleAdminDelete(item._id)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '2px solid #ef4444', background: '#fef2f2', color: '#ef4444', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseOver={e => e.target.style.background = '#fecaca'}
                                            onMouseOut={e => e.target.style.background = '#fef2f2'}
                                        >
                                            ⚠️ APPROVE DELETION
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setMaterialToDelete(item); setShowDeleteRequestModal(true); }}
                                            disabled={item.deletionRequested}
                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #fecaca', background: item.deletionRequested ? '#f3f4f6' : 'none', color: item.deletionRequested ? '#9ca3af' : '#ef4444', fontWeight: '700', fontSize: '13px', cursor: item.deletionRequested ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                                            onMouseOver={e => { if(!item.deletionRequested) e.target.style.background = '#fef2f2' }}
                                            onMouseOut={e => { if(!item.deletionRequested) e.target.style.background = 'none' }}
                                        >
                                            {item.deletionRequested ? 'DELETION REQUESTED' : 'REQUEST DELETE'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Material Modal */}
            <AddMaterialModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={(material) => {
                    setShowAddModal(false);
                    fetchMaterials();
                    if (material) {
                        setNewlyCreatedMaterial(material);
                    }
                }}
                categories={categories}
                fetchCategories={fetchCategories}
                userRole={user.role}
            />

            {/* Newly Created Material QR modal */}
            {newlyCreatedMaterial && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', color: '#111827' }}>Material Created!</h3>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                            <strong>{newlyCreatedMaterial.name}</strong> — QR code generated
                        </p>
                        {newlyCreatedMaterial.qrCode && (
                            <div style={{ display: 'inline-block', padding: '14px', background: '#f9fafb', borderRadius: '14px', border: '1.5px solid #e5e7eb', marginBottom: '20px' }}>
                                <img src={newlyCreatedMaterial.qrCode} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = newlyCreatedMaterial.qrCode;
                                    link.download = `qr-${newlyCreatedMaterial.name.replace(/\s+/g, '-')}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                            >
                                ⬇️ Save QR
                            </button>
                            <button
                                onClick={() => setNewlyCreatedMaterial(null)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Display Modal */}
            {qrMaterial && (
                <QRCodeDisplay material={qrMaterial} onClose={() => setQrMaterial(null)} />
            )}

            {/* QR Scanner Modal */}
            {showQRScanner && (
                <QRScanner
                    onClose={() => setShowQRScanner(false)}
                    onStockUpdated={() => { fetchMaterials(); setShowQRScanner(false); }}
                />
            )}

            {/* Stock-In Modal */}
            {showStockInModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleStockIn} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '12px' }}>Restock: {selectedMaterial?.name}</h3>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Update current levels with new inventory intake.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Quantity Received</label>
                                <input type="number" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={stockInData.quantity} onChange={e => setStockInData({ ...stockInData, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Supplier (Optional)</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={stockInData.supplier} onChange={e => setStockInData({ ...stockInData, supplier: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Notes</label>
                                <textarea style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', height: '80px', resize: 'none', boxSizing: 'border-box' }} value={stockInData.notes} onChange={e => setStockInData({ ...stockInData, notes: e.target.value })} placeholder="Any details about this shipment..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                            <button type="button" onClick={() => setShowStockInModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>RECORD STOCK</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Request Password Modal */}
            {showDeleteRequestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleRequestDelete} style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '12px', color: '#dc2626' }}>Additional Security</h3>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Please enter your password to request the deletion of <strong>{materialToDelete?.name}</strong>.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Your Password</label>
                                <input type="password" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                            <button type="button" onClick={() => { setShowDeleteRequestModal(false); setDeletePassword(''); setMaterialToDelete(null); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>REQUEST DELETION</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Inventory;
