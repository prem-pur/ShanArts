import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import GlobalNotifications from "./components/GlobalNotifications";
import OrderWorkspace from "./pages/OrderManagement/OrderWorkspace";
import Inventory from "./pages/InventoryManagement/Inventory";
import Invoices from "./pages/BillingManagement/Invoices";

import ShopOrders from "./pages/OrderManagement/ShopOrders";
import CustomerDashboard from "./pages/UserManagement/CustomerDashboard";
import StaffLogin from "./pages/UserManagement/StaffLogin";
import CustomerHome from "./pages/UserManagement/CustomerHome";
import AdminDashboard from "./pages/UserManagement/AdminDashboard";
import ScheduleDashboard from "./pages/ScheduleManagement/ScheduleDashboard";
import OperatorWorkspace from "./pages/InventoryManagement/OperatorWorkspace";
import SimpleOperatorWorkspace from "./pages/InventoryManagement/SimpleOperatorWorkspace";
import SystemManagerDashboard from "./pages/FeedbackNotificationManagement/SystemManagerDashboard";
import FeedbackPage from "./pages/FeedbackNotificationManagement/FeedbackPage";
import NotificationsPage from "./pages/FeedbackNotificationManagement/NotificationsPage";
import MachineManagement from "./pages/InventoryManagement/MachineManagement";
import "./App.css";

function AppContent() {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const isHomePage = location.pathname === '/';
    const isCustomerDashboard = location.pathname === '/customer-dashboard';
    const isStaffLogin = location.pathname === '/staff-login';
    const isCustomerHome = location.pathname === '/customer-home';
    const isNotificationsPage = location.pathname === '/notifications';
    const isFeedbackPage = location.pathname === '/feedback';
    const isPublicRoute = isHomePage || isCustomerDashboard || isStaffLogin;
    const isCustomerAuxPage = user.role === 'customer' && (isNotificationsPage || isFeedbackPage);

    if (!token && !isPublicRoute) {
        return <Navigate to={location.pathname.startsWith('/customer') ? '/customer-dashboard' : '/staff-login'} replace />;
    }

    // These pages get a clean full-screen layout
    if (isPublicRoute || isCustomerHome || isCustomerAuxPage) {
        return (
            <>
                <div className="App" style={{ height: '100vh', overflow: 'auto' }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/customer-home" element={<CustomerHome />} />
                        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                        <Route path="/staff-login" element={<StaffLogin />} />
                        <Route path="/feedback" element={<FeedbackPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                    </Routes>
                    {isHomePage && <footer className="app-footer">shan art advertising | 2026</footer>}
                </div>
                <GlobalNotifications />
            </>
        );
    }

    // Staff/Internal Management Pages
    return (
        <>
            <div className="App" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                <Sidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <main style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-color)' }}>
                        <Routes>
                            <Route path="/admin-dashboard" element={<AdminDashboard />} />
                            <Route path="/orders" element={<OrderWorkspace />} />
                            <Route path="/shop-orders" element={<ShopOrders />} />
                            <Route path="/machines" element={<MachineManagement />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/schedule" element={<ScheduleDashboard />} />
                            <Route path="/operator" element={<OperatorWorkspace />} />
                            <Route path="/operator-simple" element={<SimpleOperatorWorkspace />} />
                            <Route path="/machine-management" element={<MachineManagement />} />
                            <Route path="/system-manager" element={<SystemManagerDashboard />} />
                            <Route path="/feedback" element={<FeedbackPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                        </Routes>
                    </main>
                    <footer className="app-footer">shan art advertising | 2026</footer>
                </div>
            </div>
            <GlobalNotifications />
        </>
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
