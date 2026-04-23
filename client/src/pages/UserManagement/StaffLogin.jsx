import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const StaffLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [forgotData, setForgotData] = useState({ email: '', nic: '', phone: '', newPassword: '' });
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleForgotInputChange = (e) => {
        setForgotData({ ...forgotData, [e.target.name]: e.target.value });
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

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, forgotData);
            setSuccessMessage(response.data.message);
            // Switch back to login after a short delay
            setTimeout(() => {
                setIsForgotMode(false);
                setSuccessMessage('');
                setForgotData({ email: '', nic: '', phone: '', newPassword: '' });
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please check your details.');
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
            backgroundColor: 'var(--bg-color)',
            padding: '20px',
            fontFamily: 'var(--font-sans, "Outfit", sans-serif)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        color: '#fff',
                        fontSize: '28px',
                        fontWeight: '900',
                        boxShadow: '0 8px 28px var(--accent-glow)'
                    }}>
                        SP
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {isForgotMode ? 'Identity Verification' : 'Staff Portal'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        {isForgotMode 
                          ? 'Verify your identity to reset your password'
                          : 'Sign in to access your professional workspace'
                        }
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '14px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: '1px solid #ef444433'
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div style={{
                        padding: '14px',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: '1px solid #22c55e33'
                    }}>
                        {successMessage}
                    </div>
                )}

                {!isForgotMode ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Work Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--border-color)',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '15px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="staff@shanart.com"
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Password</label>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsForgotMode(true);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: 'var(--accent-color)', 
                                        fontSize: '12px', 
                                        fontWeight: '700', 
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Forgot?
                                </button>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--border-color)',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '15px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'var(--accent-color)',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: '800',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: '8px',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 20px var(--accent-glow)'
                            }}
                        >
                            {loading ? 'Authenticating...' : 'Sign In to Portal'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Work Email</label>
                            <input
                                type="email"
                                name="email"
                                value={forgotData.email}
                                onChange={handleForgotInputChange}
                                required
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                placeholder="staff@shanart.com"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>NIC Number</label>
                                <input
                                    type="text"
                                    name="nic"
                                    value={forgotData.nic}
                                    onChange={handleForgotInputChange}
                                    required
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="10 characters"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={forgotData.phone}
                                    onChange={handleForgotInputChange}
                                    required
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    placeholder="10 digits"
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={forgotData.newPassword}
                                onChange={handleForgotInputChange}
                                required
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                placeholder="Min 8 characters"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'var(--accent-color)',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: '800',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                marginTop: '4px',
                                boxShadow: '0 4px 20px var(--accent-glow)'
                            }}
                        >
                            {loading ? 'Verifying...' : 'Set New Password'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsForgotMode(false);
                                setError('');
                                setSuccessMessage('');
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Back to Login
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        ← Back to Site
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
