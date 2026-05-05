import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Palette, Calendar, Settings, Package, CreditCard, Monitor, Bell, MessageSquare, LogOut } from 'lucide-react';

const SidebarLink = ({ to, icon, label, onNavigate }) => (
  <NavLink
    to={to}
    onClick={() => onNavigate?.()}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 28px',
      textDecoration: 'none',
      background: isActive ? 'var(--accent-color)' : 'transparent',
      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      borderLeft: isActive ? '4px solid rgba(255,255,255,0.9)' : '4px solid transparent',
      boxShadow: isActive ? 'inset 0 0 0 1px rgba(255, 51, 51, 0.35)' : 'none',
    })}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>
    {label}
  </NavLink>
);

/**
 * @param {object} props
 * @param {'desktop' | 'drawer'} props.mode — drawer: off-canvas overlay; desktop: flex column in layout
 * @param {boolean} [props.drawerOpen]
 * @param {() => void} [props.onDrawerClose]
 * @param {() => void} [props.onLogout]
 */
const Sidebar = ({ mode = 'desktop', drawerOpen = false, onDrawerClose, onLogout, id }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDrawer = mode === 'drawer';

  const goHome = () => {
    navigate(user.role === 'admin' ? '/admin-dashboard' : '/');
  };

  const logout = () => {
    onDrawerClose?.();
    if (onLogout) onLogout();
    else {
      localStorage.clear();
      navigate('/');
    }
  };

  const closeIfDrawer = () => {
    if (isDrawer) onDrawerClose?.();
  };

  /**
   * Desktop: CSS grid keeps logo / scrollable nav / logout in stable rows.
   * Mobile drawer: flex + **absolute** logout bar so the button never sits under the
   * viewport (common flex/overflow bug on WebKit with overlay drawers).
   */
  const shellStyle = isDrawer
    ? {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'min(300px, 88vw)',
        zIndex: 220,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-108%)',
        transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: drawerOpen ? '12px 0 48px rgba(0,0,0,0.45)' : 'none',
        pointerEvents: drawerOpen ? 'auto' : 'none',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        minHeight: 0,
        maxHeight: '100%',
      }
    : {
        width: 260,
        flexShrink: 0,
        alignSelf: 'stretch',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
      };

  return (
    <aside id={id || undefined} className="staff-sidebar-shell" style={shellStyle} aria-hidden={isDrawer && !drawerOpen}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => { goHome(); closeIfDrawer(); }}>
          <img
            src="/logo.png?v=7"
            alt="Shan Art Advertising"
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '48px',
              objectFit: 'contain',
              borderRadius: '10px',
              boxShadow: '0 6px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          ...(isDrawer ? { flex: 1 } : {}),
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          ...(isDrawer
            ? { paddingBottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }
            : {}),
        }}
      >
        <SidebarLink
          onNavigate={closeIfDrawer}
          to={
            user.role === 'admin'
              ? '/admin-dashboard'
              : user.role === 'staff_operator'
                ? '/operator'
                : user.role === 'staff_schedule'
                  ? '/schedule'
                  : user.role === 'staff_designer'
                    ? '/orders'
                    : user.role === 'staff_inventory'
                      ? '/inventory'
                      : user.role === 'staff_system'
                        ? '/feedback'
                        : user.role === 'staff_finance'
                          ? '/invoices'
                          : '/admin-dashboard'
          }
          icon={<Home size={18} />}
          label="Home"
        />

        {user.role !== 'staff_operator' && (
          <div style={{ padding: '10px 28px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '12px' }}>
            Management
          </div>
        )}

        {(user.role === 'admin' || user.role === 'staff_designer') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/orders" icon={<ClipboardList size={18} />} label="Orders" />
        )}
        {(user.role === 'admin' || user.role === 'staff_designer') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/design-workspace" icon={<Palette size={18} />} label="Design Workspace" />
        )}
        {(user.role === 'admin' || user.role === 'staff_schedule') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/schedule" icon={<Calendar size={18} />} label="Scheduling" />
        )}
        {(user.role === 'admin' || user.role === 'staff_schedule') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/machines" icon={<Settings size={18} />} label="Machines" />
        )}
        {(user.role === 'admin' || user.role === 'staff_inventory') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/inventory" icon={<Package size={18} />} label="Inventory" />
        )}
        {(user.role === 'admin' || user.role === 'staff_finance') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/invoices" icon={<CreditCard size={18} />} label="Billing" />
        )}
        {(user.role === 'admin' || user.role === 'staff_system') && (
          <SidebarLink onNavigate={closeIfDrawer} to="/feedback" icon={<MessageSquare size={18} />} label="Feedback" />
        )}
        {Boolean(user.role) && <SidebarLink onNavigate={closeIfDrawer} to="/notifications" icon={<Bell size={18} />} label="Notifications" />}
      </nav>

      <div
        style={{
          padding: '18px 20px',
          paddingBottom: 'max(18px, env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'var(--sidebar-bg)',
          ...(isDrawer
            ? {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                boxShadow: '0 -10px 28px rgba(0,0,0,0.35)',
                zIndex: 4,
              }
            : {}),
        }}
      >
        <button
          type="button"
          onClick={logout}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
