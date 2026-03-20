import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import OrderWorkspace from "./pages/OrderManagement/OrderWorkspace";
import Machines from "./pages/InventoryManagement/Machines";
import Inventory from "./pages/InventoryManagement/Inventory";
import Invoices from "./pages/BillingManagement/Invoices";
import Schedule from "./pages/ScheduleManagement/Schedule";
import ShopOrders from "./pages/OrderManagement/ShopOrders";
import CustomerDashboard from "./pages/UserManagement/CustomerDashboard";
import StaffLogin from "./pages/UserManagement/StaffLogin";
import CustomerHome from "./pages/UserManagement/CustomerHome";
import AdminDashboard from "./pages/UserManagement/AdminDashboard";
import ScheduleDashboard from "./pages/ScheduleManagement/ScheduleDashboard";
import OperatorWorkspace from "./pages/InventoryManagement/OperatorWorkspace";
import SimpleOperatorWorkspace from "./pages/InventoryManagement/SimpleOperatorWorkspace";
import SystemManagerDashboard from "./pages/FeedbackNotificationManagement/SystemManagerDashboard";
import MachineManagement from "./pages/InventoryManagement/MachineManagement";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === '/';
  const isCustomerDashboard = location.pathname === '/customer-dashboard';
  const isStaffLogin = location.pathname === '/staff-login';
  const isCustomerHome = location.pathname === '/customer-home';
  const isAdminDashboard = location.pathname === '/admin-dashboard';
  const isOrdersPage = location.pathname === '/orders';

  // These pages get a clean full-screen layout
  if (isHomePage || isCustomerHome || isCustomerDashboard || isStaffLogin) {
    return (
      <div className="App" style={{ height: '100vh', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer-home" element={<CustomerHome />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/staff-login" element={<StaffLogin />} />
        </Routes>
        {isHomePage && <footer className="app-footer">shan art advertising | 2026</footer>}
      </div>
    );
  }

  // Staff/Internal Management Pages
  return (
    <div className="App" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!isOrdersPage && <Sidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!isOrdersPage && (
          <header style={{
            padding: "0 40px",
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#111827"
          }}>
            <h1
              onClick={() => navigate('/')}
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "900",
                letterSpacing: "-0.5px",
                color: "var(--accent-color)",
                textTransform: "uppercase",
                cursor: "pointer"
              }}>
              SYSTEM MANAGEMENT
            </h1>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>
              SHAN ART ADVERTISING • 2026
            </div>
          </header>
        )}

        <main style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-color)' }}>
          <Routes>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/orders" element={<OrderWorkspace />} />
            <Route path="/shop-orders" element={<ShopOrders />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/schedule" element={<ScheduleDashboard />} />
            <Route path="/operator" element={<OperatorWorkspace />} />
            <Route path="/operator-simple" element={<SimpleOperatorWorkspace />} />
            <Route path="/machine-management" element={<MachineManagement />} />
            <Route path="/system-manager" element={<SystemManagerDashboard />} />
          </Routes>
        </main>
        <footer className="app-footer">shan art advertising | 2026</footer>
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
