import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lightbulb, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../../apiBase';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        confirmEmail: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(formData.email)) {
                    throw new Error('Please enter a valid email address.');
                }
                if (formData.email !== formData.confirmEmail) {
                    throw new Error('Emails do not match');
                }
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                if (!passwordRegex.test(formData.password)) {
                    throw new Error('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
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

                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Confirm Email Address</label>
                            <input
                                type="email"
                                name="confirmEmail"
                                value={formData.confirmEmail}
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
                                placeholder="Repeat your email"
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    paddingRight: '45px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #e5e7eb',
                                    backgroundColor: '#f9fafb',
                                    color: '#111827',
                                    fontSize: '16px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#9ca3af'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {!isLogin && (
                            <p style={{ marginTop: '6px', fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>
                                <Lightbulb size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Minimum 8 characters with upper, lower, number & special char.
                            </p>
                        )}
                    </div>

                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#374151' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        paddingRight: '45px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #e5e7eb',
                                        backgroundColor: '#f9fafb',
                                        color: '#111827',
                                        fontSize: '16px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    placeholder="Repeat password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9ca3af'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
