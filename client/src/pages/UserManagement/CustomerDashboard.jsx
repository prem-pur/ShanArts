import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lightbulb, ArrowLeft } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { API_BASE_URL } from '../../apiBase';

/**
 * Fills the card width: Google GSI only accepts pixel width, so we measure the row.
 * use_fedcm_for_button={false} avoids broken / clipped FedCM button in some browsers.
 */
const GoogleSignInButton = ({ onSuccess, onError, disabled }) => {
    const rowRef = useRef(null);
    const [btnWidth, setBtnWidth] = useState(360);

    useLayoutEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const measure = () => {
            const w = el.getBoundingClientRect().width;
            if (w > 0) {
                setBtnWidth(Math.max(220, Math.floor(w)));
            }
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    return (
        <div
            ref={rowRef}
            style={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                display: 'block',
                minHeight: 48,
                opacity: disabled ? 0.65 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
            }}
        >
            <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                text="signin_with"
                theme="outline"
                size="large"
                width={btnWidth}
                shape="rectangular"
                use_fedcm_for_button={false}
                containerProps={{
                    style: {
                        width: '100%',
                        maxWidth: '100%',
                        minHeight: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'visible',
                    },
                }}
            />
        </div>
    );
};

const CustomerAuthScreen = () => {
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
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const envGoogleId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim();
    const [googleClientId, setGoogleClientId] = useState(envGoogleId);
    const [oauthLoading, setOauthLoading] = useState(!envGoogleId);
    /** Set when /oauth-config fails (usually API not running); empty string when server returned no id. */
    const [oauthFetchError, setOauthFetchError] = useState(null);

    useEffect(() => {
        if (envGoogleId) {
            setOauthFetchError(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/auth/oauth-config`);
                if (!cancelled) {
                    const id = (data.googleClientId || '').trim();
                    setGoogleClientId(id);
                    setOauthFetchError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setGoogleClientId('');
                    setOauthFetchError(
                        `Could not reach the API at ${API_BASE_URL}. Start the server, or set REACT_APP_GOOGLE_CLIENT_ID in client/.env.development and restart npm start.`,
                    );
                }
            } finally {
                if (!cancelled) {
                    setOauthLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [envGoogleId]);

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

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setGoogleLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
                credential: credentialResponse.credential,
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/customer-home');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Google sign-in failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-color)',
            padding: 'clamp(14px, 4vw, 24px)',
            fontFamily: 'var(--font-sans, "Outfit", sans-serif)',
            boxSizing: 'border-box',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '20px',
                padding: 'clamp(22px, 5vw, 48px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <img
                        src={`${process.env.PUBLIC_URL || ''}/logo.png?v=7`}
                        alt="Shan Art Advertising"
                        style={{
                            display: 'block',
                            margin: '0 auto 24px',
                            maxHeight: '76px',
                            width: 'auto',
                            maxWidth: 'min(300px, 100%)',
                            objectFit: 'contain',
                            borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                        }}
                    />
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        {isLogin ? 'Sign in to access your dashboard' : 'Join Shan Art community today'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '16px',
                        backgroundColor: error.includes('successful') ? 'var(--surface-muted)' : '#fef2f2',
                        color: error.includes('successful') ? '#ff3333' : '#dc2626',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: `1px solid ${error.includes('successful') ? '#ff333333' : '#ef444433'}`
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Full Name</label>
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
                                    border: '1.5px solid var(--border-color)',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Email Address</label>
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
                                border: '1.5px solid var(--border-color)',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                            placeholder="you@example.com"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Confirm Email Address</label>
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
                                    border: '1.5px solid var(--border-color)',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px',
                                    outline: 'none'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                placeholder="Repeat your email"
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Password</label>
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
                                    border: '1.5px solid var(--border-color)',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Confirm Password</label>
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
                                        border: '1.5px solid var(--border-color)',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)',
                                        fontSize: '16px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
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
                        disabled={loading || googleLoading}
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--accent-color)',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: '800',
                            cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                            marginTop: '12px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 20px var(--accent-glow)',
                            opacity: googleLoading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>

                    {isLogin && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                            }}
                            disabled={loading || googleLoading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '2px solid var(--accent-color)',
                                backgroundColor: 'var(--card-bg)',
                                color: 'var(--accent-color)',
                                fontSize: '17px',
                                fontWeight: '800',
                                cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                                marginTop: '4px',
                                transition: 'all 0.2s',
                                opacity: loading || googleLoading ? 0.6 : 1
                            }}
                        >
                            Sign Up
                        </button>
                    )}
                </form>

                <div
                    style={{
                        width: '100%',
                        maxWidth: '100%',
                        marginTop: '28px',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '12px',
                        }}
                    >
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                        <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                    </div>
                    {oauthLoading ? (
                        <p
                            style={{
                                margin: 0,
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                fontSize: '14px',
                            }}
                        >
                            Loading sign-in options…
                        </p>
                    ) : googleClientId ? (
                        <GoogleOAuthProvider clientId={googleClientId}>
                            <GoogleSignInButton
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google sign-in was cancelled or failed.')}
                                disabled={loading || googleLoading}
                            />
                        </GoogleOAuthProvider>
                    ) : oauthFetchError ? (
                        <p
                            style={{
                                margin: 0,
                                minHeight: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                fontSize: '13px',
                                textAlign: 'center',
                                lineHeight: 1.5,
                            }}
                        >
                            {oauthFetchError}
                        </p>
                    ) : (
                        <p
                            style={{
                                margin: 0,
                                minHeight: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                fontSize: '13px',
                                textAlign: 'center',
                            }}
                        >
                            Google sign-in is not configured. Add{' '}
                            <code
                                style={{
                                    fontSize: '12px',
                                    background: 'var(--surface-muted-2)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                GOOGLE_CLIENT_ID
                            </code>{' '}
                            to <code style={{ fontSize: '12px', background: 'var(--surface-muted-2)', padding: '2px 6px', borderRadius: '4px' }}>server/.env</code> or{' '}
                            <code style={{ fontSize: '12px', background: 'var(--surface-muted-2)', padding: '2px 6px', borderRadius: '4px' }}>REACT_APP_GOOGLE_CLIENT_ID</code> to{' '}
                            <code style={{ fontSize: '12px', background: 'var(--surface-muted-2)', padding: '2px 6px', borderRadius: '4px' }}>client/.env.development</code>, then restart.
                        </p>
                    )}
                </div>

                {!isLogin && (
                    <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '15px', color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <span
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                            }}
                            style={{
                                color: 'var(--accent-color)',
                                fontWeight: '800',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Log In
                        </span>
                    </div>
                )}

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

const CustomerDashboard = () => <CustomerAuthScreen />;

export default CustomerDashboard;
