import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Package, 
    Camera, 
    Plus, 
    AlertCircle, 
    BarChart3, 
    ChevronRight, 
    QrCode, 
    RefreshCcw,
    Trash2,
    ShieldAlert,
    Download,
    CheckCircle2
} from 'lucide-react';
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

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-color)', height: '100vh', color: 'var(--text-secondary)', fontWeight: '600' }}>Loading Inventory Data...</div>;

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', fontFamily: "var(--font-sans, sans-serif)", backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
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
            
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Package size={28} color="var(--accent-color)" /> Inventory Control
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
                      Track and manage production materials and stock levels
                  </p>
                </div>
                {isInventoryManager && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowQRScanner(true)}
                            style={{ background: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)', fontSize: '14px' }}
                        >
                            <Camera size={18} /> QR Scanner
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px var(--accent-glow)', fontSize: '14px' }}
                        >
                            <Plus size={18} /> New Material
                        </button>
                    </div>
                )}
            </div>

            {/* Emergency Stock Removal Alerts */}
            {user.role === 'admin' && notifications.length > 0 && (
                <div className="animate-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '32px', marginBottom: '40px', border: '1px solid #fee2e2', boxShadow: 'var(--shadow-md)', animationDelay: '0.05s' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldAlert size={20} /> Emergency Stock Removal Alerts
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.map(n => (
                            <div key={n._id} style={{ padding: '16px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#991b1b', marginBottom: '4px' }}>{n.title}</div>
                                    <div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: '1.4', fontWeight: '500' }}>{n.message}</div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '800', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inventory Levels Dashboard Graph */}
            <div className="animate-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '32px', marginBottom: '40px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', animationDelay: '0.1s' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={20} color="var(--text-primary)" /> Stock Levels Overview
                </h2>
                <div style={{ height: '350px', width: '100%' }}>
                    {materials.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={materials} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'var(--surface-muted)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const isLow = data.currentStock <= data.reorderThreshold;
                                            return (
                                                <div style={{ background: 'var(--text-primary)', color: 'var(--bg-color)', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <p style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '14px' }}>{data.name}</p>
                                                    <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                                        Current: <span style={{ color: isLow ? '#fca5a5' : '#86efac', fontWeight: '900', fontSize: '18px' }}>{data.currentStock}</span> {data.unit}
                                                    </p>
                                                    {isLow && <div style={{ marginTop: '10px', fontSize: '11px', color: '#fca5a5', fontWeight: '900', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Low Stock Alert</div>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="currentStock" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                    {materials.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.currentStock <= entry.reorderThreshold ? 'var(--accent-color)' : 'var(--text-primary)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Zero inventory items registered in the system.
                        </div>
                    )}
                </div>
            </div>

            {/* Material Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {materials.map((item, index) => {
                    const isLowStock = item.currentStock <= item.reorderThreshold;
                    return (
                        <div key={item._id} className="animate-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '28px', border: isLowStock ? '2px solid #ef444430' : '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', position: 'relative', animationDelay: `${0.2 + (index * 0.05)}s`, transition: 'transform 0.2s' }}>
                            {isLowStock && (
                                <span style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--accent-color)', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Critical Level</span>
                            )}
                            
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{item.category}</div>
                            </div>

                            <div style={{ background: 'var(--surface-muted)', padding: '20px', borderRadius: '18px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Available Units</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: isLowStock ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                                    {item.currentStock} <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-secondary)' }}>{item.unit}</span>
                                </div>
                            </div>

                            {/* QR Code thumbnail */}
                            {item.qrCode && (
                                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ padding: '8px', background: 'var(--surface-muted)', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <img
                                            src={item.qrCode}
                                            alt="QR"
                                            style={{ width: '80px', height: '80px', borderRadius: '8px', display: 'block' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setQrMaterial(item)}
                                    title="View / Download QR Code"
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #e2e8f0',
                                        background: '#fff',
                                        color: '#475569',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => { e.target.style.background = 'var(--surface-muted)'; e.target.style.borderColor = '#cbd5e1'; }}
                                    onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#e2e8f0'; }}
                                >
                                    <QrCode size={16} /> QR Code
                                </button>

                                {isInventoryManager && (
                                    <button
                                        onClick={() => { setSelectedMaterial(item); setShowStockInModal(true); }}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.target.style.background = 'var(--text-primary)'}
                                        onMouseOut={e => e.target.style.background = '#1e293b'}
                                    >
                                        <RefreshCcw size={16} /> Restock
                                    </button>
                                )}
                            </div>

                            {/* Deletion Controls */}
                            {isInventoryManager && (user.role !== 'admin' || item.deletionRequested) && (
                                <div style={{ marginTop: '10px' }}>
                                    {user.role === 'admin' ? (
                                        <button
                                            onClick={() => handleAdminDelete(item._id)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <ShieldAlert size={16} /> Approve Deletion
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setMaterialToDelete(item); setShowDeleteRequestModal(true); }}
                                            disabled={item.deletionRequested}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #fee2e2', background: item.deletionRequested ? '#f1f5f9' : '#fff7f7', color: item.deletionRequested ? 'var(--text-muted)' : '#ef4444', fontWeight: '800', fontSize: '13px', cursor: item.deletionRequested ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <Trash2 size={16} /> {item.deletionRequested ? 'Approval Pending' : 'Request Delete'}
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

            {/* Newly Created Material QR Outcome modal */}
            {newlyCreatedMaterial && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-muted)', color: '#ff3333', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px', color: 'var(--text-primary)' }}>Material Registered</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', fontWeight: '500' }}>
                            AI generated identifier for <strong>{newlyCreatedMaterial.name}</strong> ready for print.
                        </p>
                        
                        {newlyCreatedMaterial.qrCode && (
                            <div style={{ display: 'inline-block', padding: '20px', background: 'var(--surface-muted)', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                                <img src={newlyCreatedMaterial.qrCode} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    const link = document.createElement('a'); link.href = newlyCreatedMaterial.qrCode;
                                    link.download = `qr-${newlyCreatedMaterial.name.replace(/\s+/g, '-')}.png`;
                                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                                }}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Download size={18} /> Save Label
                            </button>
                            <button
                                onClick={() => setNewlyCreatedMaterial(null)}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '800', cursor: 'pointer' }}
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleStockIn} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--surface-muted)', color: 'var(--text-primary)' }}><RefreshCcw size={20} /></div>
                            <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>Inventory Intake</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px', fontWeight: '500' }}>Updating stock levels for <strong>{selectedMaterial?.name}</strong>.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>Quantity Received</label>
                                <input type="number" required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: '15px' }} value={stockInData.quantity} onChange={e => setStockInData({ ...stockInData, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>Supplier Reference</label>
                                <input type="text" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: '15px' }} value={stockInData.supplier} onChange={e => setStockInData({ ...stockInData, supplier: e.target.value })} placeholder="Company name or ID" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>Internal Notes</label>
                                <textarea style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)', height: '100px', outline: 'none', fontSize: '15px', resize: 'none' }} value={stockInData.notes} onChange={e => setStockInData({ ...stockInData, notes: e.target.value })} placeholder="Details about batch quality or shipping status..." />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                            <button type="button" onClick={() => setShowStockInModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-color)', fontWeight: '800', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>Record Intake</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Request Password Modal */}
            {showDeleteRequestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleRequestDelete} style={{ background: '#fff', width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                            <ShieldAlert size={36} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '12px', color: 'var(--text-primary)', textAlign: 'center' }}>Identity Check</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px', textAlign: 'center', fontWeight: '500' }}>Confirm password to request the removal of <strong>{materialToDelete?.name}</strong>.</p>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Your Secure Password</label>
                            <input type="password" required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => { setShowDeleteRequestModal(false); setDeletePassword(''); setMaterialToDelete(null); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ flex: 1.5, padding: '14px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Submit Request</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Inventory;
