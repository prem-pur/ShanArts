import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const InvoiceEditModal = ({ invoice, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        dueDate: '',
        tax: 0,
        discount: 0,
        lineItems: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (invoice) {
            setFormData({
                dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
                tax: invoice.tax || 0,
                discount: invoice.discount || 0,
                lineItems: invoice.lineItems ? JSON.parse(JSON.stringify(invoice.lineItems)) : []
            });
        }
    }, [invoice]);

    const handleLineItemChange = (index, field, value) => {
        const updatedItems = [...formData.lineItems];
        updatedItems[index][field] = value;
        setFormData({ ...formData, lineItems: updatedItems });
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0 }]
        });
    };

    const removeLineItem = (index) => {
        const updatedItems = formData.lineItems.filter((_, i) => i !== index);
        setFormData({ ...formData, lineItems: updatedItems });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/api/invoices/${invoice._id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Invoice updated successfully!');
            onRefresh();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/invoices/${invoice._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Invoice deleted successfully!');
            onRefresh();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete invoice');
        } finally {
            setLoading(false);
        }
    };

    if (!invoice) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#fff', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '700px',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Edit Invoice #{invoice.invoiceNumber}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Tax (LKR)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                value={formData.tax}
                                onChange={e => setFormData({ ...formData, tax: Number(e.target.value) })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Discount (LKR)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                value={formData.discount}
                                onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ fontSize: '16px', fontWeight: '700' }}>Line Items</label>
                            <button type="button" onClick={addLineItem} style={{ padding: '6px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                + Add Item
                            </button>
                        </div>
                        
                        {formData.lineItems.map((item, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'center', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Unit Price"
                                    min="0" step="0.01"
                                    value={item.unitPrice}
                                    onChange={e => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    required
                                />
                                <button type="button" onClick={() => removeLineItem(index)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    X
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading || invoice.paymentStatus !== 'unpaid'}
                            style={{ padding: '12px 24px', background: invoice.paymentStatus !== 'unpaid' ? '#f3f4f6' : '#fee2e2', color: invoice.paymentStatus !== 'unpaid' ? '#9ca3af' : '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: invoice.paymentStatus !== 'unpaid' ? 'not-allowed' : 'pointer' }}
                        >
                            Delete Invoice
                        </button>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" disabled={loading} style={{ padding: '12px 24px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceEditModal;
