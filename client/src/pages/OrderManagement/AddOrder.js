import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const AddOrder = ({ onOrderCreated, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        jobType: 'poster',
        description: '',
        quantity: 1,
        dimensions: { width: 297, height: 420, unit: 'mm' },
        address: { street: '', city: '', postalCode: '', distance: 0 },
        deliveryMethod: 'pickup',
        preferences: '',
        deadline: '',
        customerPhone: '',
    });

    const [samplePhoto, setSamplePhoto] = useState(null);
    const [designFiles, setDesignFiles] = useState([]);

    const productTemplates = {
        poster: {
            name: 'Poster',
            desc: 'Events, promotions, advertisements',
            sizes: [
                { label: 'A3 — 297 × 420 mm', w: 297, h: 420, u: 'mm' },
                { label: 'A2 — 420 × 594 mm', w: 420, h: 594, u: 'mm' },
                { label: 'A1 — 594 × 841 mm', w: 594, h: 841, u: 'mm' },
                { label: 'A0 — 841 × 1189 mm', w: 841, h: 1189, u: 'mm' }
            ]
        },
        flyer: {
            name: 'Flyer',
            desc: 'Handouts, promotions',
            sizes: [
                { label: 'A6 — 105 × 148 mm', w: 105, h: 148, u: 'mm' },
                { label: 'A5 — 148 × 210 mm', w: 148, h: 210, u: 'mm' },
                { label: 'A4 — 210 × 297 mm', w: 210, h: 297, u: 'mm' },
                { label: 'DL — 99 × 210 mm', w: 99, h: 210, u: 'mm' }
            ]
        },
        business_card: {
            name: 'Business Card',
            desc: 'Professional networking',
            sizes: [
                { label: 'Standard (US) — 3.5 × 2 inch', w: 3.5, h: 2, u: 'inch' },
                { label: 'Standard (EU) — 85 × 55 mm', w: 85, h: 55, u: 'mm' },
                { label: 'Square — 65 × 65 mm', w: 65, h: 65, u: 'mm' }
            ]
        },
        banner: {
            name: 'Banner',
            desc: 'Roll-up and Web banners',
            sizes: [
                { label: 'Roll-up (850 × 2000 mm)', w: 850, h: 2000, u: 'mm' },
                { label: 'Large (1000 × 2000 mm)', w: 1000, h: 2000, u: 'mm' },
                { label: 'Web (1920 × 600 px)', w: 1920, h: 600, u: 'px' },
                { label: 'Web (1200 × 300 px)', w: 1200, h: 300, u: 'px' }
            ]
        },
        social_media: {
            name: 'Social Media Post',
            desc: 'Digital social marketing',
            sizes: [
                { label: 'Instagram Post — 1080 × 1080 px', w: 1080, h: 1080, u: 'px' },
                { label: 'Instagram Story — 1080 × 1920 px', w: 1080, h: 1920, u: 'px' },
                { label: 'Facebook Post — 1200 × 630 px', w: 1200, h: 630, u: 'px' },
                { label: 'YouTube Thumbnail — 1280 × 720 px', w: 1280, h: 720, u: 'px' }
            ]
        },
        brochure: {
            name: 'Brochure',
            desc: 'Detailed product guides',
            sizes: [
                { label: 'A4 Bi-fold — 210 × 297 mm', w: 210, h: 297, u: 'mm' },
                { label: 'A4 Tri-fold — 210 × 297 mm', w: 210, h: 297, u: 'mm' },
                { label: 'A5 Brochure — 148 × 210 mm', w: 148, h: 210, u: 'mm' }
            ]
        },
        other: {
            name: 'Custom / Other',
            desc: 'Type your own sizes',
            sizes: []
        }
    };

    useEffect(() => {
        const template = productTemplates[formData.jobType];
        if (template && template.sizes.length > 0) {
            setFormData(prev => ({
                ...prev,
                dimensions: {
                    width: template.sizes[0].w,
                    height: template.sizes[0].h,
                    unit: template.sizes[0].u
                }
            }));
        } else if (formData.jobType === 'other') {
            setFormData(prev => ({
                ...prev,
                dimensions: { width: '', height: '', unit: 'mm' }
            }));
        }
    }, [formData.jobType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.name === 'samplePhoto') {
            setSamplePhoto(e.target.files[0]);
        } else {
            setDesignFiles([...e.target.files]);
        }
    };

    const checkDistance = () => {
        // Phone validation
        const phone = formData.customerPhone;
        const phoneDigits = phone.replace(/\D/g, '');

        if (phone.startsWith('94')) {
            if (phoneDigits.length !== 11) {
                setError('Sri Lankan number starting with 94 must have exactly 11 digits.');
                return;
            }
        } else if (phone.startsWith('+94')) {
            if (phoneDigits.length !== 11) {
                setError('Sri Lankan number starting with +94 must have exactly 11 digits (excluding +).');
                return;
            }
        } else {
            setError('Phone number must start with +94 or 94.');
            return;
        }

        const city = formData.address.city.toLowerCase();
        let distance = 15;
        if (city === 'anuradhapura') distance = 5;
        if (city === 'mihintale') distance = 12;

        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, distance }
        }));
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        data.append('jobType', formData.jobType);
        data.append('description', formData.description);
        data.append('quantity', formData.quantity);
        data.append('dimensions', JSON.stringify(formData.dimensions));
        data.append('address', JSON.stringify(formData.address));
        data.append('deliveryMethod', formData.deliveryMethod);
        data.append('preferences', formData.preferences);
        data.append('deadline', formData.deadline);
        data.append('customerPhone', formData.customerPhone);

        if (samplePhoto) data.append('samplePhoto', samplePhoto);
        designFiles.forEach(file => data.append('designFiles', file));

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/shop-orders`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            onOrderCreated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '14px',
        borderRadius: '10px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        color: '#111827',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' };

    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>Place New Order</h2>
                <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Step {step} of 2</div>
            </div>

            <div style={{ padding: '32px' }}>
                {error && <div style={{ color: '#ef4444', marginBottom: '20px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '14px', fontWeight: '600' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>What do you want to print?</label>
                                <select
                                    name="jobType" value={formData.jobType} onChange={handleInputChange}
                                    style={inputStyle}
                                >
                                    {Object.keys(productTemplates).map(key => (
                                        <option key={key} value={key}>{productTemplates[key].name}</option>
                                    ))}
                                </select>
                                {productTemplates[formData.jobType]?.desc && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                                        ✅ Good for: {productTemplates[formData.jobType].desc}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {formData.jobType !== 'other' ? (
                                    <div>
                                        <label style={labelStyle}>Select Size</label>
                                        <select
                                            onChange={(e) => {
                                                const [w, h, u] = e.target.value.split(',');
                                                setFormData(prev => ({ ...prev, dimensions: { width: Number(w), height: Number(h), unit: u } }));
                                            }}
                                            style={inputStyle}
                                            value={`${formData.dimensions.width},${formData.dimensions.height},${formData.dimensions.unit}`}
                                        >
                                            {productTemplates[formData.jobType]?.sizes.map((s, i) => (
                                                <option key={i} value={`${s.w},${s.h},${s.u}`}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px', gridColumn: 'span 2' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Width</label>
                                            <input type="number" name="dimensions.width" value={formData.dimensions.width} onChange={handleInputChange} style={inputStyle} placeholder="Width" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Height</label>
                                            <input type="number" name="dimensions.height" value={formData.dimensions.height} onChange={handleInputChange} style={inputStyle} placeholder="Height" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Unit</label>
                                            <select name="dimensions.unit" value={formData.dimensions.unit} onChange={handleInputChange} style={inputStyle}>
                                                <option value="mm">mm</option>
                                                <option value="cm">cm</option>
                                                <option value="inch">inch</option>
                                                <option value="px">px</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label style={labelStyle}>Quantity</label>
                                    <input
                                        type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="1"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Delivery Address</label>
                                <input
                                    type="text" name="address.street" placeholder="Street" value={formData.address.street} onChange={handleInputChange}
                                    style={{ ...inputStyle, marginBottom: '12px' }}
                                />
                                <input
                                    type="text" name="address.city" placeholder="City (e.g. Anuradhapura)" value={formData.address.city} onChange={handleInputChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Phone Number (+94 / 94)</label>
                                <input
                                    type="text" name="customerPhone" placeholder="+94XXXXXXXXX or 94XXXXXXXXX"
                                    value={formData.customerPhone} onChange={handleInputChange}
                                    style={inputStyle}
                                    required
                                />
                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
                                    Must be 11 digits if starting with 94.
                                </div>
                            </div>

                            <button type="button" onClick={checkDistance} style={{ width: '100%', background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.3)' }}>
                                Next: Delivery & Attachments
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>Delivery Method</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <label style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${formData.deliveryMethod === 'pickup' ? 'var(--accent-color)' : '#e5e7eb'}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', background: formData.deliveryMethod === 'pickup' ? '#fff5f5' : '#fff' }}>
                                        <input type="radio" name="deliveryMethod" value="pickup" checked={formData.deliveryMethod === 'pickup'} onChange={handleInputChange} style={{ display: 'none' }} />
                                        <div style={{ fontSize: '20px' }}>🏪</div>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: formData.deliveryMethod === 'pickup' ? 'var(--accent-color)' : '#374151' }}>Pickup</div>
                                    </label>
                                    {formData.address.distance <= 10 ? (
                                        <>
                                            <label style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${formData.deliveryMethod === 'delivery' ? 'var(--accent-color)' : '#e5e7eb'}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', background: formData.deliveryMethod === 'delivery' ? '#fff5f5' : '#fff' }}>
                                                <input type="radio" name="deliveryMethod" value="delivery" checked={formData.deliveryMethod === 'delivery'} onChange={handleInputChange} style={{ display: 'none' }} />
                                                <div style={{ fontSize: '20px' }}>🚚</div>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: formData.deliveryMethod === 'delivery' ? 'var(--accent-color)' : '#374151' }}>Delivery</div>
                                            </label>
                                            <label style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${formData.deliveryMethod === 'pickme' ? 'var(--accent-color)' : '#e5e7eb'}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', background: formData.deliveryMethod === 'pickme' ? '#fff5f5' : '#fff' }}>
                                                <input type="radio" name="deliveryMethod" value="pickme" checked={formData.deliveryMethod === 'pickme'} onChange={handleInputChange} style={{ display: 'none' }} />
                                                <div style={{ fontSize: '20px' }}>🚖</div>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: formData.deliveryMethod === 'pickme' ? 'var(--accent-color)' : '#374151' }}>PickMe</div>
                                            </label>
                                        </>
                                    ) : (
                                        <div style={{ flex: 2, padding: '16px', borderRadius: '12px', border: '1px dashed #e5e7eb', color: '#9ca3af', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                            ⚠️ Distance over 10km. Only pickup is available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Sample Photos</label>
                                    <input type="file" name="samplePhoto" onChange={handleFileChange} style={{ fontSize: '13px' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Design Files</label>
                                    <input type="file" name="designFiles" multiple onChange={handleFileChange} style={{ fontSize: '13px' }} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Date Needed By</label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleInputChange}
                                    required
                                    style={inputStyle}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
                                    Please select the date you need the final product.
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Special Instructions</label>
                                <textarea
                                    name="preferences" value={formData.preferences} onChange={handleInputChange}
                                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Any specific colors, fonts, or styling preferences..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Back</button>
                                <button type="submit" disabled={loading} style={{ flex: 2, background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.3)' }}>
                                    {loading ? 'Submitting...' : 'Confirm Order'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddOrder;
