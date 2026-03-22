import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../apiBase';

const ROLE_LABELS = {
    staff_designer: 'Designer',
    staff_operator: 'Machine Operator',
    staff_schedule: 'Scheduling Manager',
    staff_inventory: 'Inventory Manager',
    staff_finance: 'Finance Officer',
    staff_system: 'System Manager',
    admin: 'Administrator',
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('register'); // 'register' | 'attendance'
    const [staffData, setStaffData] = useState({ name: '', email: '', password: '', role: 'staff_operator' });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [newQR, setNewQR] = useState(null); // { qrCode, name, role }

    // Attendance state
    const [attendanceList, setAttendanceList] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const managementLinks = [
        { name: 'Orders', path: '/orders', icon: '🎨' },
        { name: 'Scheduling', path: '/schedule', icon: '📅' },
        { name: 'Machines', path: '/machines', icon: '⚙️' },
        { name: 'Inventory', path: '/inventory', icon: '📦' },
        { name: 'Invoice', path: '/invoices', icon: '🧾' },
        { name: 'System Monitor', path: '/system-manager', icon: '🖥️' },
    ];

    // ── Fetch today's attendance ──────────────────────────────────────────────
    const fetchAttendance = useCallback(async () => {
        setAttendanceLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/attendance/today`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAttendanceList(res.data.attendance || []);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        } finally {
            setAttendanceLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'attendance') {
            fetchAttendance();
        }
    }, [activeTab, fetchAttendance]);

    // ── QR Scanner ────────────────────────────────────────────────────────────
    const startScanner = useCallback(async () => {
        if (html5QrRef.current) return;
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-reader');
        html5QrRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await scanner.stop();
                    html5QrRef.current = null;
                    setScannerActive(false);
                    await handleScan(decodedText);
                },
                () => {} // ignore errors
            );
            setScannerActive(true);
        } catch (err) {
            console.error('Camera error', err);
            html5QrRef.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopScanner = useCallback(async () => {
        if (html5QrRef.current) {
            try { await html5QrRef.current.stop(); } catch {}
            html5QrRef.current = null;
        }
        setScannerActive(false);
    }, []);

    // Cleanup when leaving tab
    useEffect(() => {
        return () => { stopScanner(); };
    }, [stopScanner]);

    const handleScan = async (decodedText) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/attendance/scan`, { qrData: decodedText }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setScanResult({ type: 'success', text: res.data.message });
            fetchAttendance();
        } catch (err) {
            setScanResult({ type: 'error', text: err.response?.data?.message || 'Scan failed' });
        }
    };

    // ── Register Staff ────────────────────────────────────────────────────────
    const handleInputChange = (e) => setStaffData({ ...staffData, [e.target.name]: e.target.value });

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        setNewQR(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/auth/register`, staffData, {
                headers: { Authorization: `Bearer ${token}`, 'x-admin-token': 'sachi-admin-super-secret-key' },
            });
            setMessage({ type: 'success', text: `${staffData.name} registered! QR code generated.` });
            if (res.data.qrCode) {
                setNewQR({ qrCode: res.data.qrCode, name: staffData.name, role: staffData.role });
            }
            setStaffData({ name: '', email: '', password: '', role: 'staff_operator' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to register staff' });
        } finally {
            setLoading(false);
        }
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const tabStyle = (tab) => ({
        padding: '10px 24px',
        borderRadius: '10px',
        border: 'none',
        fontWeight: '800',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: activeTab === tab ? 'var(--accent-color)' : '#f3f4f6',
        color: activeTab === tab ? '#fff' : '#374151',
        boxShadow: activeTab === tab ? '0 4px 12px rgba(211,47,47,0.25)' : 'none',
    });

    const statusBadge = (status) => ({
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: status === 'present' ? '#dcfce7' : '#fef2f2',
        color: status === 'present' ? '#16a34a' : '#dc2626',
    });

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-1px' }}>SYSTEM CENTRAL</h1>
                    <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Overview, staff management & attendance.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#111827', fontSize: '15px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Administrator</div>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>A</div>
                </div>
            </header>

            {/* Navigation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '40px' }}>
                {managementLinks.map(link => (
                    <div
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        style={{ background: '#fff', padding: '24px 16px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #e5e7eb', transition: '0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    >
                        <div style={{ fontSize: '28px', marginBottom: '12px' }}>{link.icon}</div>
                        <div style={{ fontWeight: '800', color: '#111827', fontSize: '13px' }}>{link.name}</div>
                    </div>
                ))}
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <button style={tabStyle('register')} onClick={() => { setActiveTab('register'); stopScanner(); }}>
                    👤 Register Staff
                </button>
                <button style={tabStyle('attendance')} onClick={() => setActiveTab('attendance')}>
                    📋 Attendance Scanner
                </button>
            </div>

            {/* ── Register Staff Tab ── */}
            {activeTab === 'register' && (
                <div style={{ display: 'grid', gridTemplateColumns: newQR ? '1fr 1fr' : '1fr', gap: '32px', maxWidth: newQR ? '900px' : '480px' }}>
                    {/* Form */}
                    <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>Register Staff Member</h2>
                        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '32px' }}>A unique QR code is generated automatically.</p>

                        {message.text && (
                            <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '24px', backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#059669' : '#dc2626', fontSize: '13px', fontWeight: '600', textAlign: 'center', border: `1px solid ${message.type === 'success' ? '#10b98133' : '#ef444433'}` }}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleRegisterStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { label: 'Full Name', name: 'name', type: 'text' },
                                { label: 'Email Address', name: 'email', type: 'email' },
                                { label: 'Team Password', name: 'password', type: 'password' },
                            ].map(f => (
                                <div key={f.name}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>{f.label}</label>
                                    <input type={f.type} name={f.name} value={staffData[f.name]} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            ))}
                            <div>
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
                                {loading ? 'Processing...' : '✅ Complete Registration'}
                            </button>
                        </form>
                    </div>

                    {/* QR Code Card */}
                    {newQR && (
                        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎫</div>
                            <h3 style={{ fontWeight: '900', color: '#111827', marginBottom: '4px' }}>{newQR.name}</h3>
                            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>{ROLE_LABELS[newQR.role] || newQR.role}</p>
                            <img src={newQR.qrCode} alt="Staff QR Code" style={{ width: '220px', height: '220px', borderRadius: '12px', border: '2px solid #e5e7eb', padding: '12px', background: '#fff' }} />
                            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>Scan this QR at the attendance reader to mark presence.</p>
                            <a
                                href={newQR.qrCode}
                                download={`qr_${newQR.name.replace(/\s/g, '_')}.png`}
                                style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '10px', background: '#111827', color: '#fff', fontWeight: '700', fontSize: '13px', textDecoration: 'none' }}
                            >
                                ⬇️ Download QR
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* ── Attendance Scanner Tab ── */}
            {activeTab === 'attendance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px' }}>
                    {/* Scanner Panel */}
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', marginBottom: '8px' }}>QR Attendance Reader</h2>
                        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>Point camera at staff member's QR code to mark them present.</p>

                        {/* Scanner viewport */}
                        <div id="qr-reader" ref={scannerRef} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#000', minHeight: scannerActive ? '250px' : '0' }} />

                        {!scannerActive ? (
                            <button onClick={startScanner} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 14px rgba(211,47,47,0.3)' }}>
                                📷 Start Camera Scanner
                            </button>
                        ) : (
                            <button onClick={stopScanner} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#374151', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                                ⏹ Stop Scanner
                            </button>
                        )}

                        {scanResult && (
                            <div style={{ marginTop: '20px', padding: '14px', borderRadius: '12px', background: scanResult.type === 'success' ? '#ecfdf5' : '#fef2f2', color: scanResult.type === 'success' ? '#059669' : '#dc2626', fontWeight: '700', fontSize: '14px', textAlign: 'center', border: `1px solid ${scanResult.type === 'success' ? '#10b98133' : '#ef444433'}` }}>
                                {scanResult.type === 'success' ? '✅' : '❌'} {scanResult.text}
                                <button onClick={() => setScanResult(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: '700' }}>✕</button>
                            </div>
                        )}
                    </div>

                    {/* Attendance List */}
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', marginBottom: '4px' }}>Today's Attendance</h2>
                                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    &nbsp;· Resets at midnight
                                </p>
                            </div>
                            <button onClick={fetchAttendance} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#f9fafb', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                                🔄 Refresh
                            </button>
                        </div>

                        {/* Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: 'Active (Present)', value: attendanceList.filter(a => a.status === 'present').length, color: '#dcfce7', text: '#16a34a' },
                                { label: 'Inactive (Absent)', value: attendanceList.filter(a => a.status !== 'present').length, color: '#fef2f2', text: '#dc2626' },
                            ].map(s => (
                                <div key={s.label} style={{ background: s.color, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: s.text }}>{s.value}</div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: s.text, marginTop: '4px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {attendanceLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</div>
                        ) : attendanceList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No staff found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                                {attendanceList.map(member => (
                                    <div key={member.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', border: '1px solid #f3f4f6', background: member.status === 'present' ? '#f0fdf4' : '#fff' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: '#111827', fontSize: '14px' }}>{member.name}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{ROLE_LABELS[member.role] || member.role}</div>
                                            {member.scannedAt && (
                                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                                    Scanned at {new Date(member.scannedAt).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                        <span style={statusBadge(member.status)}>
                                            {member.status === 'present' ? '🟢 Active' : '🔴 Inactive'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
