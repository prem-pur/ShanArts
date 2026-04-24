import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const AddMaterialModal = ({ isOpen, onClose, onSuccess, categories, fetchCategories, userRole }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: categories.length > 0 ? categories[0].name : 'Paper',
        unit: 'sheets',
        reorderThreshold: 50,
        costPerUnit: 0,
        supplier: ''
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Ensure category defaults to first category if empty and categories are available
    useEffect(() => {
        if (!formData.category && categories.length > 0) {
            setFormData(prev => ({ ...prev, category: categories[0].name }));
        }
    }, [categories, formData.category]);

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/inventory`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Reset form
            setFormData({ name: '', category: categories.length > 0 ? categories[0].name : 'Paper', unit: 'sheets', reorderThreshold: 50, costPerUnit: 0, supplier: '' });

            // Call success callback
            onSuccess(response.data.material);
        } catch (err) {
            alert('Failed to add material');
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/inventory/categories`, { name: newCategoryName }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setNewCategoryName('');
                setIsAddingCategory(false);
                fetchCategories();
                setFormData(prev => ({ ...prev, category: response.data.data.name }));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add category');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <form onSubmit={handleAddMaterial} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '6px' }}>Add New Material</h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>A QR code will be automatically generated.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Material Name</label>
                        <input type="text" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Category</label>
                                {userRole === 'admin' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                                    >
                                        {isAddingCategory ? 'Cancel' : '+ New Category'}
                                    </button>
                                )}
                            </div>

                            {isAddingCategory ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Category Name"
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }}
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        style={{ padding: '0 16px', borderRadius: '10px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            ) : (
                                <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    {categories.length === 0 && <option value="Paper">Paper</option>}
                                </select>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Unit</label>
                            <input type="text" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="sheets, ml, etc." />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Reorder Threshold</label>
                            <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={formData.reorderThreshold} onChange={e => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Cost Per Unit</label>
                            <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={formData.costPerUnit} onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Supplier (Optional)</label>
                        <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                    <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f3f4f6', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>ADD MATERIAL + GENERATE QR</button>
                </div>
            </form>
        </div>
    );
};

export default AddMaterialModal;
