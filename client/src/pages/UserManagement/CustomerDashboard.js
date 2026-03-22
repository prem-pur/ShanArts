import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../apiBase';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
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
            if (isLogin) {
                const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                    email: formData.email,
                    password: formData.password
                });
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/customer-home');
            } else {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                await axios.post(`${API_BASE_URL}/api/auth/register`, {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: 'customer'
                });
                setIsLogin(true);
                setError('Registration successful! Please log in.');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Something went wrong');
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
                maxWidth: '450px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '48px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        backgroundColor: 'var(--accent-color)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#fff',
                        fontSize: '32px',
                        fontWeight: '900',
                        boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)'
                    }}>
                        {isLogin ? 'LG' : 'RG'}
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '12px' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>
                        {isLogin ? 'Sign in to access your dashboard' : 'Join Shan Art community today'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '16px',
                        backgroundColor: error.includes('successful') ? '#ecfdf5' : '#fef2f2',
                        color: error.includes('successful') ? '#059669' : '#dc2626',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: `1px solid ${error.includes('successful') ? '#10b98133' : '#ef444433'}`
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
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
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Email Address</label>
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
                            placeholder="you@example.com"
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

                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
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
                                placeholder="Repeat password"
                            />
                        </div>
                    )}

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
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '15px', color: '#6b7280' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        style={{
                            color: 'var(--accent-color)',
                            fontWeight: '800',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </span>
                </div>

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
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
