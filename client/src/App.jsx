import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMatchMedia } from "./hooks/useMatchMedia";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import OrderWorkspace from "./pages/OrderManagement/OrderWorkspace";
import Inventory from "./pages/InventoryManagement/Inventory";
import Invoices from "./pages/BillingManagement/Invoices";

import ShopOrders from "./pages/OrderManagement/ShopOrders";
import OrderList from "./pages/OrderManagement/OrderList";
import OrderDetail from "./pages/OrderManagement/OrderDetail";
import DesignWorkspace from "./pages/OrderManagement/DesignWorkspace";
import CustomerDashboard from "./pages/UserManagement/CustomerDashboard";
import StaffLogin from "./pages/UserManagement/StaffLogin";
import CustomerHome from "./pages/UserManagement/CustomerHome";
import AdminDashboard from "./pages/UserManagement/AdminDashboard";
import ScheduleDashboard from "./pages/ScheduleManagement/ScheduleDashboard";
import OperatorWorkspace from "./pages/InventoryManagement/OperatorWorkspace";
import SimpleOperatorWorkspace from "./pages/InventoryManagement/SimpleOperatorWorkspace";
import FeedbackPage from "./pages/FeedbackNotificationManagement/FeedbackPage";
import NotificationsPage from "./pages/FeedbackNotificationManagement/NotificationPage";
import MachineManagement from "./pages/InventoryManagement/MachineManagement";
import GlobalNotifications from "./components/GlobalNotifications";
import AppGlobalFooter from "./components/AppGlobalFooter";
import "./App.css";

function AppContent() {
    const location = useLocation();
    const staffCompact = useMatchMedia("(max-width: 900px)");
    const [staffMenuOpen, setStaffMenuOpen] = useState(false);

    const isHomePage = location.pathname === '/';
    const isCustomerDashboard = location.pathname === '/customer-dashboard';
    const isStaffLogin = location.pathname === '/staff-login';
    const isCustomerHome = location.pathname === '/customer-home';

    useEffect(() => {
        if (!staffCompact) setStaffMenuOpen(false);
    }, [staffCompact]);

    useEffect(() => {
        if (!staffMenuOpen || !staffCompact) return;
        const onKey = (e) => {
            if (e.key === "Escape") setStaffMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [staffMenuOpen, staffCompact]);

    useBodyScrollLock(staffCompact && staffMenuOpen);

// These pages get a clean full-screen layout
    if (isHomePage || isCustomerHome || isCustomerDashboard || isStaffLogin) {
        const isCustomerUI = isCustomerHome || isCustomerDashboard;

        return (
            <div className={`App shan-app ${isCustomerUI ? 'light-layout' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <GlobalNotifications />
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/customer-home" element={<CustomerHome />} />
                        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                        <Route path="/staff-login" element={<StaffLogin />} />
                    </Routes>
                </div>
                <AppGlobalFooter />
            </div>
        );
    }

    // Staff/Internal Management Pages
    return (
        <div className="App shan-app light-layout staff-app-root" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            {staffCompact && (
                <header
                    className="staff-mobile-topbar"
                    style={{
                        flexShrink: 0,
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "0 14px",
                        borderBottom: "1px solid var(--border-color)",
                        background: "var(--card-bg)",
                        zIndex: 210,
                    }}
                >
                    <button
                        type="button"
                        aria-expanded={staffMenuOpen}
                        aria-controls="staff-sidebar-nav"
                        aria-label={staffMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        onClick={() => setStaffMenuOpen((o) => !o)}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            border: "1px solid var(--border-color)",
                            background: "var(--surface-muted)",
                            color: "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <Menu size={22} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Staff workspace</span>
                </header>
            )}

            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
                <Sidebar
                    id="staff-sidebar-nav"
                    mode={staffCompact ? "drawer" : "desktop"}
                    drawerOpen={staffMenuOpen}
                    onDrawerClose={() => setStaffMenuOpen(false)}
                />
                {staffCompact && staffMenuOpen && (
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setStaffMenuOpen(false)}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 180,
                            border: "none",
                            padding: 0,
                            margin: 0,
                            background: "rgba(15,23,42,0.42)",
                            cursor: "pointer",
                        }}
                    />
                )}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1 }}>
                    <GlobalNotifications />

                    <main className="app-main-canvas" style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
                        <Routes>
                            <Route path="/admin-dashboard" element={<AdminDashboard />} />
                            <Route path="/orders" element={<OrderList />} />
                            <Route path="/orders/:id" element={<OrderDetail />} />
                            <Route path="/design-workspace" element={<DesignWorkspace />} />
                            <Route path="/design-editor" element={<OrderWorkspace />} />
                            <Route path="/shop-orders" element={<ShopOrders />} />
                            <Route path="/machines" element={<MachineManagement />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/schedule" element={<ScheduleDashboard />} />
                            <Route path="/operator" element={<OperatorWorkspace />} />
                            <Route path="/operator-simple" element={<SimpleOperatorWorkspace />} />
                            <Route path="/machine-management" element={<MachineManagement />} />
                            <Route path="/feedback" element={<FeedbackPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                        </Routes>
                    </main>
                    <AppGlobalFooter />
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
