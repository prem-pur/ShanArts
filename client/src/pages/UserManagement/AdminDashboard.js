import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../apiBase';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [staffData, setStaffData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff_operator'
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleInputChange = (e) => {
        setStaffData({ ...staffData, [e.target.name]: e.target.value });
    };

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/auth/register`, staffData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-admin-token': 'sachi-admin-super-secret-key'
                }
            });

            setMessage({ type: 'success', text: `Staff member ${staffData.name} registered successfully!` });
            setStaffData({ name: '', email: '', password: '', role: 'staff_operator' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to register staff' });
        } finally {
            setLoading(false);
        }
    };

    const managementLinks = [
        { name: 'Order Management', path: '/orders', icon: '📦' },
        { name: 'Machine Status', path: '/machines', icon: '⚙️' },
        { name: 'Inventory & Stock', path: '/inventory', icon: '🏭' },
        { name: 'Invoices', path: '/invoices', icon: '📄' },
        { name: 'Schedule', path: '/schedule', icon: '📅' },
        { name: 'Feedback', path: '/feedback', icon: '💬' },
    ];

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px' }}>SYSTEM CENTRAL</h1>
                    <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Overview and staff management.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#111827', fontSize: '15px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Administrator</div>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>A</div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignContent: 'start' }}>
                    {managementLinks.map(link => (
                        <div
                            key={link.path}
                            onClick={() => navigate(link.path)}
                            style={{ background: '#fff', padding: '32px 24px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)', transition: '0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        >
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>{link.icon}</div>
                            <div style={{ fontWeight: '800', color: '#111827', fontSize: '14px' }}>{link.name}</div>
                        </div>
                    ))}
                </div>

                <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Register Staff</h2>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '32px' }}>Grant access to new team members.</p>

                    {message.text && (
                        <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '24px', backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#059669' : '#dc2626', fontSize: '13px', fontWeight: '600', textAlign: 'center', border: `1px solid ${message.type === 'success' ? '#10b98133' : '#ef444433'}` }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleRegisterStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="admin-field">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>Full Name</label>
                            <input type="text" name="name" value={staffData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111827', outline: 'none' }} />
                        </div>
                        <div className="admin-field">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>Email Address</label>
                            <input type="email" name="email" value={staffData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111827', outline: 'none' }} />
                        </div>
                        <div className="admin-field">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>Team Password</label>
                            <input type="password" name="password" value={staffData.password} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111827', outline: 'none' }} />
                        </div>
                        <div className="admin-field">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>Team Role</label>
                            <select name="role" value={staffData.role} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111827', outline: 'none' }}>
                                <option value="staff_designer">Designer</option>
                                <option value="staff_operator">Machine Operator</option>
                                <option value="staff_schedule">Scheduling Manager</option>
                                <option value="staff_inventory">Inventory Manager</option>
                                <option value="staff_finance">Finance Officer</option>
                                <option value="staff_system">System Manager</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 15px rgba(211, 47, 47, 0.3)' }}>
                            {loading ? 'Processing...' : 'Complete Registration'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
