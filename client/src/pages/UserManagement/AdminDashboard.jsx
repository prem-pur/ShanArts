import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    QrCode,
    Contact,
    Search,
    Users,
    ClipboardList,
    Calendar,
    Settings,
    Package,
    CreditCard,
    Monitor,
    Eye,
    EyeOff,
    Check,
    Ticket,
    Download,
    Mail,
    FileDigit,
    Phone,
    MapPin,
    XCircle,
    User,
    Loader2,
    Square,
    RefreshCw,
    Edit3,
    X,
    Save,
    Trash2,
    Smartphone,
    Camera
} from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState('register'); // 'register' | 'attendance' | 'merchantQR'
    const [staffData, setStaffData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff_operator',
        nic: '',
        phone: '',
        address: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [newQR, setNewQR] = useState(null); // { qrCode, name, role }
    const [showPassword, setShowPassword] = useState(false);

    // Merchant QR Lookup state
    const [merchantCodeInput, setMerchantCodeInput] = useState('');
    const [merchantQRResult, setMerchantQRResult] = useState(null); // { qrCode, name, role, merchantCode, nic, phone, address, email }
    const [merchantQRError, setMerchantQRError] = useState('');
    const [merchantQRLoading, setMerchantQRLoading] = useState(false);
    const [showMerchantDetails, setShowMerchantDetails] = useState(false);

    // Attendance state
    const [attendanceList, setAttendanceList] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);

    // Profile Scanner state
    const [profileScannerActive, setProfileScannerActive] = useState(false);
    const [scannedProfile, setScannedProfile] = useState(null);
    const [profileScanError, setProfileScanError] = useState('');
    const [profileScanLoading, setProfileScanLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const profileScannerRef = useRef(null);
    const html5QrProfileRef = useRef(null);

    // Customers State
    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);

    // Staff List State
    const [staffList, setStaffList] = useState([]);
    const [staffListLoading, setStaffListLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const managementLinks = [
        { name: 'Orders', path: '/orders', icon: <ClipboardList size={24} color="var(--accent-color)" strokeWidth={2.25} /> },
        { name: 'Scheduling', path: '/schedule', icon: <Calendar size={24} color="var(--accent-color)" strokeWidth={2.25} /> },
        { name: 'Machines', path: '/machines', icon: <Settings size={24} color="var(--accent-color)" strokeWidth={2.25} /> },
        { name: 'Inventory', path: '/inventory', icon: <Package size={24} color="var(--accent-color)" strokeWidth={2.25} /> },
        { name: 'Invoice', path: '/invoices', icon: <CreditCard size={24} color="var(--accent-color)" strokeWidth={2.25} /> },
        { name: 'System Monitor', path: '/system-manager', icon: <Monitor size={24} color="var(--accent-color)" strokeWidth={2.25} /> },
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(staffData.email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address.' });
            setLoading(false);
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(staffData.password)) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
            setLoading(false);
            return;
        }

        // NIC validation (10 chars/digits)
        if (staffData.nic.length !== 10) {
            setMessage({ type: 'error', text: 'NIC must be exactly 10 characters long.' });
            setLoading(false);
            return;
        }

        // Phone number validation (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(staffData.phone)) {
            setMessage({ type: 'error', text: 'Phone number must be exactly 10 digits.' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/auth/register`, staffData, {
                headers: { Authorization: `Bearer ${token}`, 'x-admin-token': 'sachi-admin-super-secret-key' },
            });
            setMessage({ type: 'success', text: `${staffData.name} registered! QR code generated.` });
            if (res.data.qrCode) {
                setNewQR({
                    qrCode: res.data.qrCode,
                    name: staffData.name,
                    role: staffData.role,
                    merchantCode: res.data.merchantCode
                });
            }
            setStaffData({ name: '', email: '', password: '', role: 'staff_operator', nic: '', phone: '', address: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to register staff' });
        } finally {
            setLoading(false);
        }
    };

    // ── Profile QR Scanner ────────────────────────────────────────────────────
    const startProfileScanner = useCallback(async () => {
        if (html5QrProfileRef.current) return;
        setProfileScanError('');
        setScannedProfile(null);
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-profile-reader');
        html5QrProfileRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await scanner.stop();
                    html5QrProfileRef.current = null;
                    setProfileScannerActive(false);
                    await handleProfileScan(decodedText);
                },
                () => {}
            );
            setProfileScannerActive(true);
        } catch (err) {
            console.error('Camera error', err);
            html5QrProfileRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopProfileScanner = useCallback(async () => {
        if (html5QrProfileRef.current) {
            try { await html5QrProfileRef.current.stop(); } catch {}
            html5QrProfileRef.current = null;
        }
        setProfileScannerActive(false);
    }, []);

    const handleProfileScan = async (decodedText) => {
        setProfileScanLoading(true);
        setProfileScanError('');
        try {
            const parsed = JSON.parse(decodedText);
            const { userId } = parsed;
            if (!userId) throw new Error('Invalid QR code');

            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/staff/${userId}/details`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setScannedProfile(res.data);
        } catch (err) {
            setProfileScanError(err.response?.data?.message || 'Failed to read QR code. Please try again.');
        } finally {
            setProfileScanLoading(false);
        }
    };

    // ── Staff Profile Actions ──────────────────────────────────────────────────
    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/auth/staff/${scannedProfile._id}`, editingProfile, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScannedProfile({ ...scannedProfile, ...res.data.user });
            setEditMode(false);
            alert('Staff member updated successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update staff');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteStaff = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete ${scannedProfile.name}?`)) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/auth/staff/${scannedProfile._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Staff member deleted successfully');
            setScannedProfile(null);
            setEditMode(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete staff');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Customers ─────────────────────────────────────────────────────────────
    const fetchCustomers = useCallback(async () => {
        setCustomersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/customers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(res.data);
        } catch (err) {
            console.error('Failed to fetch customers', err);
        } finally {
            setCustomersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'customers') {
            fetchCustomers();
        }
    }, [activeTab, fetchCustomers]);

    // ── Staff List ────────────────────────────────────────────────────────────
    const fetchStaffList = useCallback(async () => {
        setStaffListLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/staff`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStaffList(res.data);
        } catch (err) {
            console.error('Failed to fetch staff list', err);
        } finally {
            setStaffListLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'staffList') {
            fetchStaffList();
        }
    }, [activeTab, fetchStaffList]);

    // ── Merchant QR Lookup ─────────────────────────────────────────────────────

    const handleFindMerchantQR = async (e) => {
        e.preventDefault();
        setMerchantQRError('');
        setMerchantQRResult(null);
        if (!merchantCodeInput.trim()) {
            setMerchantQRError('Please enter a merchant code.');
            return;
        }
        setMerchantQRLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/merchant/${merchantCodeInput.trim().toUpperCase()}/qr`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMerchantQRResult(res.data);
        } catch (err) {
            setMerchantQRError(err.response?.data?.message || 'Failed to find staff member.');
        } finally {
            setMerchantQRLoading(false);
        }
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const tabStyle = (tab) => ({
        padding: '10px 24px',
        borderRadius: '10px',
        border: activeTab === tab ? 'none' : '1px solid var(--border-color)',
        fontWeight: '800',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        background: activeTab === tab ? 'var(--accent-color)' : 'var(--card-bg)',
        color: activeTab === tab ? '#fff' : 'var(--text-primary)',
        boxShadow: activeTab === tab ? '0 4px 20px var(--accent-glow)' : 'none',
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
        <div className="shan-page" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans, sans-serif)', color: 'var(--text-primary)' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}>SYSTEM CENTRAL</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>Overview, staff management & attendance.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administrator</div>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '14px', boxShadow: '0 4px 16px var(--accent-glow)' }}>{user.name?.[0] || 'A'}</div>
                </div>
            </header>

            {/* Navigation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '40px' }}>
                {managementLinks.map(link => (
                    <div
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(link.path); }}
                        style={{ background: 'var(--card-bg)', padding: '24px 16px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s', boxShadow: 'var(--shadow-sm)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255, 51, 51, 0.5)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    >
                        <div style={{ fontSize: '28px', marginBottom: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{link.icon}</div>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '13px' }}>{link.name}</div>
                    </div>
                ))}
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px', whiteSpace: 'nowrap' }}>
                <button style={{ ...tabStyle('register'), display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => { setActiveTab('register'); stopScanner(); stopProfileScanner(); }}>
                    <UserPlus size={16} /> Register Staff
                </button>
                <button style={{ ...tabStyle('attendance'), display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => { setActiveTab('attendance'); stopProfileScanner(); }}>
                    <QrCode size={16} /> Attendance Scanner
                </button>
                <button style={{ ...tabStyle('profileScan'), display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => { setActiveTab('profileScan'); stopScanner(); }}>
                    <Contact size={16} /> Staff Profile Scan
                </button>
                <button style={{ ...tabStyle('merchantQR'), display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => { setActiveTab('merchantQR'); stopScanner(); stopProfileScanner(); }}>
                    <Search size={16} /> Merchant QR Lookup
                </button>
                <button style={{ ...tabStyle('staffList'), display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => { setActiveTab('staffList'); stopScanner(); stopProfileScanner(); }}>
                    <Users size={16} /> Staff List
                </button>
                <button style={{ ...tabStyle('customers'), display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }} onClick={() => { setActiveTab('customers'); stopScanner(); stopProfileScanner(); }}>
                    <Users size={16} /> Customers List
                </button>
            </div>

            {/* ── Register Staff Tab ── */}
            {activeTab === 'register' && (
                <div style={{ display: 'grid', gridTemplateColumns: newQR ? '1fr 1fr' : '1fr', gap: '32px', maxWidth: newQR ? '900px' : '480px' }}>
                    {/* Form */}
                    <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>Register Staff Member</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px' }}>A unique QR code is generated automatically.</p>

                        {message.text && (
                            <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '24px', backgroundColor: message.type === 'success' ? 'var(--surface-muted)' : '#fef2f2', color: message.type === 'success' ? '#ff3333' : '#dc2626', fontSize: '13px', fontWeight: '600', textAlign: 'center', border: `1px solid ${message.type === 'success' ? 'var(--border-color)' : '#ef444433'}` }}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleRegisterStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { label: 'Full Name', name: 'name', type: 'text' },
                                { label: 'Email Address', name: 'email', type: 'email' },
                                { label: 'NIC Number', name: 'nic', type: 'text' },
                                { label: 'Phone Number', name: 'phone', type: 'text' },
                                { label: 'Address', name: 'address', type: 'text' },
                                { label: 'Team Password', name: 'password', type: 'password' },
                            ].map(f => (
                                <div key={f.name}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>{f.label}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={f.name === 'password' && !showPassword ? 'password' : 'text'}
                                            name={f.name}
                                            value={staffData[f.name]}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                paddingRight: f.name === 'password' ? '40px' : '12px',
                                                borderRadius: '8px',
                                                border: '1.5px solid var(--border-color)',
                                                backgroundColor: 'var(--input-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        {f.name === 'password' && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Team Role</label>
                                <select name="role" value={staffData.role} onChange={handleInputChange} className="shan-input" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
                                    <option value="staff_designer">Designer</option>
                                    <option value="staff_operator">Machine Operator</option>
                                    <option value="staff_schedule">Scheduling Manager</option>
                                    <option value="staff_inventory">Inventory Manager</option>
                                    <option value="staff_finance">Finance Officer</option>
                                    <option value="staff_system">System Manager</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '12px', boxShadow: '0 4px 20px var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {loading ? 'Processing...' : <><Check size={20} /> Complete Registration</>}
                            </button>
                        </form>
                    </div>

                    {/* QR Code Card */}
                    {newQR && (
                        <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Ticket size={24} /> {newQR.merchantCode}</div>
                            <h3 style={{ fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{newQR.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>{ROLE_LABELS[newQR.role] || newQR.role}</p>
                            <p style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: '800', marginBottom: '24px' }}>Code: {newQR.merchantCode}</p>
                            <img src={newQR.qrCode} alt="Staff QR Code" style={{ width: '220px', height: '220px', borderRadius: '12px', border: '2px solid var(--border-color)', padding: '12px', background: '#fafafa' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>Scan this QR at the attendance reader to mark presence.</p>
                            <a
                                href={newQR.qrCode}
                                download={`qr_${newQR.name.replace(/\s/g, '_')}.png`}
                                style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '10px', background: 'var(--text-primary)', color: 'var(--bg-color)', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Download size={16} /> Download QR
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* ── Attendance Scanner Tab ── */}
            {activeTab === 'attendance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px' }}>
                    {/* Scanner Panel */}
                    <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>QR Attendance Reader</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Point camera at staff member's QR code to mark them present.</p>

                        {/* Scanner viewport */}
                        <div id="qr-reader" ref={scannerRef} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#000', minHeight: scannerActive ? '250px' : '0' }} />

                        {!scannerActive ? (
                            <button onClick={startScanner} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 20px var(--accent-glow)' }}>
                                📷 Start Camera Scanner
                            </button>
                        ) : (
                            <button type="button" onClick={stopScanner} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)', color: 'var(--text-primary)', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                                ⏹ Stop Scanner
                            </button>
                        )}

                        {scanResult && (
                            <div style={{ marginTop: '20px', padding: '14px', borderRadius: '12px', background: scanResult.type === 'success' ? 'var(--surface-muted)' : '#fef2f2', color: scanResult.type === 'success' ? '#ff3333' : '#dc2626', fontWeight: '700', fontSize: '14px', textAlign: 'center', border: `1px solid ${scanResult.type === 'success' ? 'var(--border-color)' : '#ef444433'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {scanResult.type === 'success' ? <Check size={18} /> : <XCircle size={18} />} {scanResult.text}
                                <button onClick={() => setScanResult(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: '700' }}>✕</button>
                            </div>
                        )}
                    </div>

                    {/* Attendance List */}
                    <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>Today's Attendance</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    &nbsp;· Resets at midnight
                                </p>
                            </div>
                            <button type="button" onClick={fetchAttendance} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid var(--border-color)', background: 'var(--surface-muted-2)', color: 'var(--text-primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
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
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
                        ) : attendanceList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No staff found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                                {attendanceList.map(member => (
                                    <div key={member.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', background: member.status === 'present' ? 'var(--surface-muted-2)' : 'var(--surface-muted-2)' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>{member.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                                {ROLE_LABELS[member.role] || member.role}
                                            </div>
                                            {member.merchantCode && (
                                                <div style={{ marginTop: '4px' }}>
                                                    <span style={{ padding: '3px 10px', background: '#fef2f2', borderRadius: '6px', fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '2px', border: '1px solid #fecaca' }}>
                                                        {member.merchantCode}
                                                    </span>
                                                </div>
                                            )}
                                            {member.scannedAt && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
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

            {/* ── Merchant QR Lookup Tab ── */}
            {activeTab === 'merchantQR' && (
                <div style={{ display: 'grid', gridTemplateColumns: merchantQRResult ? '1fr 1fr' : '1fr', gap: '32px', maxWidth: merchantQRResult ? '860px' : '480px' }}>
                    {/* Search Panel */}
                    <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}><Search size={48} /></div>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>Merchant QR Lookup</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px', textAlign: 'center' }}>Enter a staff member's merchant code to retrieve their QR code.</p>

                        {merchantQRError && (
                            <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: '600', textAlign: 'center', border: '1px solid #ef444433' }}>
                                ❌ {merchantQRError}
                            </div>
                        )}

                        <form onSubmit={handleFindMerchantQR} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Merchant Code</label>
                                <input
                                    type="text"
                                    value={merchantCodeInput}
                                    onChange={e => setMerchantCodeInput(e.target.value.toUpperCase())}
                                    placeholder="e.g. I48293"
                                    maxLength={6}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--border-color)',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        letterSpacing: '4px',
                                        textAlign: 'center',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>Format: 1 letter + 5 digits (e.g. I48293, O12345)</p>
                            </div>
                            <button
                                type="submit"
                                disabled={merchantQRLoading}
                                style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 20px var(--accent-glow)', transition: '0.2s' }}
                            >
                                {merchantQRLoading ? '⏳ Searching...' : <><Search size={16} /> Find QR Code</>}
                            </button>
                            {merchantQRResult && (
                                <button
                                    type="button"
                                    onClick={() => { setMerchantQRResult(null); setMerchantCodeInput(''); setMerchantQRError(''); setShowMerchantDetails(false); }}
                                    style={{ background: 'var(--surface-muted-2)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    🔄 Search Again
                                </button>
                            )}
                        </form>
                    </div>

                    {/* QR Result Card */}
                    {merchantQRResult && (
                        <div style={{ background: 'var(--card-bg)', padding: '32px 40px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '12px', boxShadow: '0 8px 24px var(--accent-glow)' }}><Ticket size={28} /></div>
                            <h3 style={{ fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px', fontSize: '18px' }}>{merchantQRResult.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>{ROLE_LABELS[merchantQRResult.role] || merchantQRResult.role}</p>
                            <div style={{ padding: '6px 16px', background: '#fef2f2', borderRadius: '20px', marginBottom: '20px' }}>
                                <span style={{ fontWeight: '900', color: 'var(--accent-color)', fontSize: '16px', letterSpacing: '3px' }}>{merchantQRResult.merchantCode}</span>
                            </div>
                            <img
                                src={merchantQRResult.qrCode}
                                alt={`QR for ${merchantQRResult.name}`}
                                style={{ width: '180px', height: '180px', borderRadius: '12px', border: '2px solid var(--border-color)', padding: '10px', background: '#fafafa' }}
                            />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px', textAlign: 'center', marginBottom: '16px' }}>Use this QR at the attendance scanner.</p>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <a
                                    href={merchantQRResult.qrCode}
                                    download={`qr_${merchantQRResult.name.replace(/\s/g, '_')}_${merchantQRResult.merchantCode}.png`}
                                    style={{ flex: '1', minWidth: '130px', textAlign: 'center', padding: '10px 16px', borderRadius: '10px', background: 'var(--text-primary)', color: 'var(--bg-color)', fontWeight: '700', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Download size={16} /> Download QR
                                </a>
                                <button
                                    onClick={() => setShowMerchantDetails(!showMerchantDetails)}
                                    style={{ flex: '1', minWidth: '130px', padding: '10px 16px', borderRadius: '10px', border: '1.5px solid var(--accent-color)', background: showMerchantDetails ? 'var(--accent-color)' : 'var(--card-bg)', color: showMerchantDetails ? '#fff' : 'var(--accent-color)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}
                                >
                                    {showMerchantDetails ? '🔽 Hide Details' : '📄 More Details'}
                                </button>
                            </div>

                            {/* Expandable Details Panel */}
                            {showMerchantDetails && (
                                <div style={{ width: '100%', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Member Details</h4>
                                    {[
                                        { icon: <Mail size={16} />, label: 'Email', value: merchantQRResult.email || '—' },
                                        { icon: <FileDigit size={16} />, label: 'NIC', value: merchantQRResult.nic || '—' },
                                        { icon: <Phone size={16} />, label: 'Phone', value: merchantQRResult.phone || '—' },
                                        { icon: <MapPin size={16} />, label: 'Address', value: merchantQRResult.address || '—' },
                                        { icon: <Calendar size={16} />, label: 'Registered', value: merchantQRResult.registeredAt ? new Date(merchantQRResult.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                                    ].map(row => (
                                        <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <span style={{ color: 'var(--accent-color)', minWidth: '20px' }}>{row.icon}</span>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>{row.label}</div>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{row.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Staff Profile Scan Tab ── */}
            {activeTab === 'profileScan' && (
                <div style={{ display: 'grid', gridTemplateColumns: scannedProfile ? '1fr 1.4fr' : '1fr', gap: '32px', maxWidth: scannedProfile ? '900px' : '480px' }}>
                    {/* Scanner Panel */}
                    <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Staff Profile Scanner</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Scan a staff member's QR code to view their full profile.</p>

                        {/* Scanner viewport */}
                        <div id="qr-profile-reader" ref={profileScannerRef} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', background: 'var(--input-bg)', minHeight: profileScannerActive ? '250px' : '0', border: profileScannerActive ? '2px solid var(--border-color)' : 'none' }} />

                        {profileScanLoading && (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Loader2 size={20} className="animate-spin" /> Loading profile...
                            </div>
                        )}

                        {profileScanError && (
                            <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '16px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: '600', border: '1px solid #ef444433', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <XCircle size={18} /> {profileScanError}
                            </div>
                        )}

                        {!profileScannerActive ? (
                            <button onClick={startProfileScanner} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 20px var(--accent-glow)' }}>
                                <Camera size={18} /> Start Scanner
                            </button>
                        ) : (
                            <button type="button" onClick={stopProfileScanner} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)', color: 'var(--text-primary)', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                                <Square size={18} /> Stop Scanner
                            </button>
                        )}

                        {scannedProfile && (
                            <button
                                onClick={() => { setScannedProfile(null); setProfileScanError(''); }}
                                style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--surface-muted-2)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                            >
                                <RefreshCw size={16} /> Scan Another
                            </button>
                        )}
                    </div>

                    {/* Profile Card */}
                    {scannedProfile && (
                        <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                            {/* Header strip */}
                            <div style={{ background: 'linear-gradient(135deg, var(--surface-muted) 0%, #252b3a 100%)', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: '#fff', flexShrink: 0 }}>
                                    {scannedProfile.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{scannedProfile.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{ROLE_LABELS[scannedProfile.role] || scannedProfile.role}</div>
                                    {scannedProfile.merchantCode && (
                                        <div style={{ marginTop: '6px', display: 'inline-block', padding: '3px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '2px', fontSize: '13px' }}>{scannedProfile.merchantCode}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div style={{ padding: '24px 32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Member Information</h4>
                                    {!editMode ? (
                                        <button type="button" onClick={() => { setEditingProfile(scannedProfile); setEditMode(true); }} style={{ background: 'var(--surface-muted-2)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Edit3 size={12} /> Edit Profile
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => setEditMode(false)} style={{ background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <X size={12} /> Cancel Edit
                                        </button>
                                    )}
                                </div>

                                {editMode ? (
                                    <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {[
                                            { label: 'Name', name: 'name', type: 'text' },
                                            { label: 'NIC', name: 'nic', type: 'text' },
                                            { label: 'Phone', name: 'phone', type: 'text' },
                                            { label: 'Address', name: 'address', type: 'text' },
                                        ].map(f => (
                                            <div key={f.name}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>{f.label}</label>
                                                <input className="shan-input" required type={f.type} value={editingProfile[f.name] || ''} onChange={e => setEditingProfile({ ...editingProfile, [f.name]: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Role</label>
                                            <select className="shan-input" value={editingProfile.role} onChange={e => setEditingProfile({ ...editingProfile, role: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                                                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                                    <option key={k} value={k}>{v}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={editingProfile.isActive} onChange={e => setEditingProfile({ ...editingProfile, isActive: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                Account Active
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                            <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '12px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                {actionLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                            </button>
                                            <button type="button" onClick={handleDeleteStaff} disabled={actionLoading} style={{ flex: 1, padding: '12px', background: 'rgba(220, 38, 38, 0.15)', color: '#f87171', border: '1px solid rgba(220, 38, 38, 0.4)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <Trash2 size={18} /> Delete Staff
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        {/* Row items */}
                                        {[
                                            { icon: <Mail size={18} />, label: 'Email Address', value: scannedProfile.email || '—' },
                                            { icon: <FileDigit size={18} />, label: 'NIC Number', value: scannedProfile.nic || '—' },
                                            { icon: <Phone size={18} />, label: 'Phone Number', value: scannedProfile.phone || '—' },
                                            { icon: <MapPin size={18} />, label: 'Address', value: scannedProfile.address || '—' },
                                            { icon: <Check size={18} />, label: 'Status', value: scannedProfile.isActive ? 'Active' : 'Inactive' },
                                            { icon: <Calendar size={18} />, label: 'Registered On', value: scannedProfile.registeredAt ? new Date(scannedProfile.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                                        ].map(row => (
                                            <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                                <span style={{ color: 'var(--accent-color)', minWidth: '22px' }}>{row.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>{row.label}</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: row.label === 'Status' ? (scannedProfile.isActive ? '#16a34a' : '#dc2626') : 'var(--text-primary)' }}>{row.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Mini QR */}
                                {scannedProfile.qrCode && (
                                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>QR Code</div>
                                        <img src={scannedProfile.qrCode} alt="staff qr" style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1.5px solid var(--border-color)', padding: '6px', background: '#fafafa' }} />
                                        <a href={scannedProfile.qrCode} download={`qr_${scannedProfile.name?.replace(/\\s/g,'_')}.png`} style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--bg-color)', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>⬇️ Download QR</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* ── Customers List Tab ── */}
            {activeTab === 'customers' && (
                <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} /> Customers List</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>View all registered customers in the system.</p>
                        </div>
                        <button type="button" onClick={fetchCustomers} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid var(--border-color)', background: 'var(--surface-muted-2)', color: 'var(--text-primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    {customersLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No customers found.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {customers.map(c => (
                                <div key={c._id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--surface-muted-2)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--surface-muted), #252b3a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                            {c.name?.charAt(0).toUpperCase() || 'C'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '15px' }}>{c.name}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>{c.email}</div>
                                            {c.phone && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Smartphone size={12} /> {c.phone}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Staff List Tab ── */}
            {activeTab === 'staffList' && (
                <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} /> Staff List</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>View all fully registered staff members in the system.</p>
                        </div>
                        <button type="button" onClick={fetchStaffList} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid var(--border-color)', background: 'var(--surface-muted-2)', color: 'var(--text-primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    {staffListLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading staff members...</div>
                    ) : staffList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No staff members found.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                            {staffList.map(s => (
                                <div key={s._id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--surface-muted-2)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', flexShrink: 0, boxShadow: '0 4px 14px var(--accent-glow)' }}>
                                            {s.name?.charAt(0).toUpperCase() || 'S'}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '15px' }}>{s.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '700' }}>{ROLE_LABELS[s.role] || s.role}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <Smartphone size={12} /> {s.phone || '—'}
                                            </div>
                                            {s.merchantCode && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <span style={{ padding: '2px 8px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-color)', borderRadius: '6px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
                                                        {s.merchantCode}
                                                    </span>
                                                    <span style={{ padding: '2px 8px', marginLeft: '6px', background: s.isActive === false ? 'rgba(220, 38, 38, 0.12)' : 'var(--surface-muted-2)', color: s.isActive === false ? '#f87171' : '#ff3333', border: `1px solid ${s.isActive === false ? 'rgba(220, 38, 38, 0.3)' : 'var(--border-color)'}`, borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                                                        {s.isActive === false ? 'Inactive' : 'Active'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScannedProfile(s);
                                            setActiveTab('profileScan');
                                        }}
                                        style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        Edit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
