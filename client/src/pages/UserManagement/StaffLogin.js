import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const StaffLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
            const { token, user } = response.data;

            if (user.role === 'customer') {
                throw new Error('Access denied. This portal is for staff only.');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'admin') {
                navigate('/admin-dashboard');
            } else if (user.role === 'staff_designer') {
                navigate('/orders');
            } else if (user.role === 'staff_schedule') {
                navigate('/schedule');
            } else if (user.role === 'staff_operator') {
                navigate('/operator');
            } else if (user.role === 'staff_system') {
                navigate('/system-manager');
            } else if (user.role === 'staff_finance') {
                navigate('/invoices');
            } else if (user.role === 'staff_inventory') {
                navigate('/inventory');
            } else {
                navigate('/shop-orders');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: '48px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#fff',
                        fontSize: '32px',
                        fontWeight: '900'
                    }}>
                        SP
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '12px' }}>Staff Portal</h2>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Sign in to access your professional workspace</p>
                </div>

                {error && (
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: '1px solid #ef444433'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Work Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '10px',
                                border: '1.5px solid #e5e7eb',
                                backgroundColor: '#f9fafb',
                                color: '#111827',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            placeholder="staff@shanart.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '10px',
                                border: '1.5px solid #e5e7eb',
                                backgroundColor: '#f9fafb',
                                color: '#111827',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--accent-color)',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: '800',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '12px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)'
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Portal'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '14px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        ← Back to Site
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
