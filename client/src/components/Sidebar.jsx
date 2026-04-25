import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Palette, Calendar, Settings, Package, CreditCard, Monitor, Bell, MessageSquare, LogOut } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="sidebar" style={{ 
            width: 260, 
            backgroundColor: 'var(--sidebar-bg)', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto' 
        }}>
            <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(user.role === 'admin' ? '/admin-dashboard' : '/')}>
                    <img
                        src="/logo.png"
                        alt="SHAN Logo"
                        style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <div>
                        <div style={{ color: '#fff', fontWeight: '900', fontSize: '20px', letterSpacing: '-0.5px', lineHeight: 1 }}>SHAN</div>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Art Advertising</div>
                    </div>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <SidebarLink to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'staff_operator' ? '/operator' : user.role === 'staff_schedule' ? '/schedule' : user.role === 'staff_designer' ? '/orders' : user.role === 'staff_inventory' ? '/inventory' : user.role === 'staff_system' ? '/feedback' : user.role === 'staff_finance' ? '/invoices' : '/admin-dashboard'} icon={<Home size={18} />} label="Home" />

                {user.role !== 'staff_operator' && (
                    <div style={{ padding: '10px 32px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '16px' }}>Management</div>
                )}

                {(user.role === 'admin' || user.role === 'staff_designer') && (
                    <SidebarLink to="/orders" icon={<ClipboardList size={18} />} label="Orders" />
                )}

                {(user.role === 'admin' || user.role === 'staff_designer') && (
                    <SidebarLink to="/design-workspace" icon={<Palette size={18} />} label="Design Workspace" />
                )}

                {(user.role === 'admin' || user.role === 'staff_schedule') && (
                    <SidebarLink to="/schedule" icon={<Calendar size={18} />} label="Scheduling" />
                )}

                {(user.role === 'admin' || user.role === 'staff_schedule') && (
                    <SidebarLink to="/machines" icon={<Settings size={18} />} label="Machines" />
                )}

                {(user.role === 'admin' || user.role === 'staff_inventory') && (
                    <SidebarLink to="/inventory" icon={<Package size={18} />} label="Inventory" />
                )}

                {(user.role === 'admin' || user.role === 'staff_finance') && (
                    <SidebarLink to="/invoices" icon={<CreditCard size={18} />} label="Billing" />
                )}


                {(user.role === 'admin' || user.role === 'staff_system') && (
                    <SidebarLink to="/feedback" icon={<MessageSquare size={18} />} label="Feedback" />
                )}

                {Boolean(user.role) && (
                    <SidebarLink to="/notifications" icon={<Bell size={18} />} label="Notifications" />
                )}
            </nav>

            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto', flexShrink: 0 }}>
                <button
                    onClick={() => { localStorage.clear(); navigate('/'); }}
                    style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <LogOut size={16} /> Logout
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
            transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            borderLeft: isActive ? '4px solid rgba(255,255,255,0.9)' : '4px solid transparent',
            boxShadow: isActive ? 'inset 0 0 0 1px rgba(255, 51, 51, 0.35)' : 'none'
        })}
    >
        <span style={{ fontSize: '18px' }}>{icon}</span>
        {label}
    </NavLink>
);

export default Sidebar;
