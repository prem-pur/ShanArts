import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="sidebar" style={{ width: 260, backgroundColor: '#1a1a1b', display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(user.role === 'admin' ? '/admin-dashboard' : '/')}>
                    <img
                        src="/logo.png"
                        alt="SHAN Logo"
                        style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <div>
                        <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px', letterSpacing: '-0.5px', lineHeight: 1 }}>SHAN</div>
                        <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Art Advertising</div>
                    </div>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <SidebarLink to={user.role === 'admin' ? '/admin-dashboard' : '/'} icon="🏠" label="Home" />

                <div style={{ padding: '10px 32px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '16px' }}>Management</div>

                {user.role === 'admin' && (
                    <>
                        <SidebarLink to="/admin-dashboard" icon="📊" label="Overview" />
                        <SidebarLink to="/inventory" icon="🏭" label="Inventory" />
                        <SidebarLink to="/invoices" icon="🧾" label="Invoices" />
                        <SidebarLink to="/machines" icon="⚙️" label="Fleet" />
                    </>
                )}

                {(user.role === 'admin' || user.role === 'staff_system') && (
                    <SidebarLink to="/system-manager" icon="🖥️" label="System Monitor" />
                )}

                {(user.role === 'admin' || user.role === 'staff_designer') && (
                    <SidebarLink to="/orders" icon="🎨" label="Design Workspace" />
                )}

                {(user.role === 'admin' || user.role === 'staff_schedule') && (
                    <SidebarLink to="/schedule" icon="📅" label="Scheduling" />
                )}

                {(user.role === 'admin' || user.role === 'staff_operator') && (
                    <SidebarLink to="/operator" icon="🛠️" label="Operator Hub" />
                )}

                {(user.role === 'admin' || user.role === 'staff_inventory') && (
                    <SidebarLink to="/inventory" icon="📦" label="Stock" />
                )}

                {(user.role === 'admin' || user.role === 'staff_finance') && (
                    <SidebarLink to="/invoices" icon="💰" label="Finance" />
                )}

                {(user.role === 'staff_operator' || user.role === 'staff_schedule') && (
                    <SidebarLink to="/machines" icon="⚙️" label="Machines" />
                )}
            </nav>

            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                    ◈ Logout
                </button>
            </div>
        </div>
    );
};

const SidebarLink = ({ to, icon, label }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 32px',
            textDecoration: 'none',
            background: isActive ? 'var(--accent-color)' : 'transparent',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s',
            borderLeft: isActive ? '4px solid #fff' : '4px solid transparent'
        })}
    >
        <span style={{ fontSize: '18px' }}>{icon}</span>
        {label}
    </NavLink>
);

export default Sidebar;
