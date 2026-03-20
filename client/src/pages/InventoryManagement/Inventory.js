import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';
import BarcodeScanner from './BarcodeScanner';

const Inventory = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Paper',
        unit: 'sheets',
        reorderThreshold: 50,
        costPerUnit: 0,
        supplier: ''
    });
    const [stockInData, setStockInData] = useState({
        quantity: 0,
        costPerUnit: 0,
        supplier: '',
        notes: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isInventoryManager = user.role === 'admin' || user.role === 'staff_inventory';

    useEffect(() => {
        fetchMaterials();
    }, []);

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

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/inventory`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShowAddModal(false);
            setFormData({ name: '', category: 'Paper', unit: 'sheets', reorderThreshold: 50, costPerUnit: 0, supplier: '' });
            fetchMaterials();
        } catch (err) {
            alert('Failed to add material');
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

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Inventory...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px', marginBottom: '8px' }}>INVENTORY CONTROL</h1>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Track and manage production materials and stock levels.</p>
                </div>
                {isInventoryManager && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowBarcodeScanner(true)}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                        >
                            📱 BARCODE SCANNER
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {materials.map(item => {
                    const isLowStock = item.currentStock <= item.reorderThreshold;
                    return (
                        <div key={item._id} style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: isLowStock ? '2px solid #fee2e2' : '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}>
                            {isLowStock && (
                                <span style={{ position: 'absolute', top: '24px', right: '24px', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>LOW STOCK</span>
                            )}
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.category === 'Ink' ? '🧪' : '📄'}</div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>{item.name}</h3>
                            <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '600', marginBottom: '20px' }}>{item.category.toUpperCase()}</div>

                            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>Current Stock</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: isLowStock ? '#dc2626' : '#111827' }}>
                                    {item.currentStock} <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>{item.unit}</span>
                                </div>
                            </div>

                            {isInventoryManager && (
                                <button
                                    onClick={() => { setSelectedMaterial(item); setShowStockInModal(true); }}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'none', color: '#374151', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.target.style.background = '#f9fafb'}
                                    onMouseOut={e => e.target.style.background = 'none'}
                                >
                                    RESTOCK
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Material Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleAddMaterial} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '24px' }}>Add New Material</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Material Name</label>
                                <input type="text" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Category</label>
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="Paper">Paper</option>
                                        <option value="Ink">Ink</option>
                                        <option value="Vinyl">Vinyl</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Unit</label>
                                    <input type="text" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="sheets, ml, etc." />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Reorder Threshold</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={formData.reorderThreshold} onChange={e => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Cost Per Unit</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={formData.costPerUnit} onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                            <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>ADD MATERIAL</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Barcode Scanner Modal */}
            {showBarcodeScanner && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    background: 'rgba(0,0,0,0.5)', 
                    backdropFilter: 'blur(8px)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    zIndex: 1000 
                }}>
                    <div style={{ 
                        background: '#fff', 
                        width: '100%', 
                        maxWidth: '700px', 
                        maxHeight: '90vh', 
                        borderRadius: '16px', 
                        padding: '0', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        overflow: 'auto'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '20px 24px', 
                            borderBottom: '1px solid #e5e7eb' 
                        }}>
                            <h3 style={{ 
                                margin: 0, 
                                fontSize: '20px', 
                                fontWeight: '700', 
                                color: '#111827' 
                            }}>
                                📱 USB Barcode Scanner
                            </h3>
                            <button
                                onClick={() => setShowBarcodeScanner(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '4px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <BarcodeScanner 
                                onScanComplete={(data) => {
                                    fetchMaterials(); // Refresh inventory after scan
                                    setShowBarcodeScanner(false);
                                }}
                                onMaterialFound={(material) => {
                                    console.log('Material found:', material);
                                }}
                            />
                        </div>
                    </div>
                </div>
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
                                <input type="number" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={stockInData.quantity} onChange={e => setStockInData({ ...stockInData, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Supplier (Optional)</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={stockInData.supplier} onChange={e => setStockInData({ ...stockInData, supplier: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Notes</label>
                                <textarea style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', height: '80px', resize: 'none' }} value={stockInData.notes} onChange={e => setStockInData({ ...stockInData, notes: e.target.value })} placeholder="Any details about this shipment..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                            <button type="button" onClick={() => setShowStockInModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#111827', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>RECORD STOCK</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Inventory;
