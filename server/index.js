const express = require("express"); // Restart trigger 3
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

const path = require("path");
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/previews', express.static(path.join(__dirname, 'public/previews')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', mongo: mongoose.connection.readyState }));

const orderRoutes = require("./modules/OrderManagement/orderRoutes");
const requestRoutes = require("./modules/OrderManagement/requestRoutes");
const templateRoutes = require("./modules/OrderManagement/templateRoutes");

// Shop Management Routes
const authRoutes = require('./modules/UserManagement/auth');
const shopOrderRoutes = require('./modules/OrderManagement/shop-orders');
const machineRoutes = require('./modules/InventoryManagement/machines');
const inventoryRoutes = require('./modules/InventoryManagement/inventory');
const invoiceRoutes = require('./modules/BillingManagement/invoices');
const billingRoutes = require('./modules/BillingManagement/billingRoutes');
const scheduleRoutes = require('./modules/ScheduleManagement/routes');
const feedbackRoutes = require('./modules/FeedbackNotificationManagement/routes');
const notificationRoutes = require('./modules/FeedbackNotificationManagement/notifications');
const attendanceRoutes = require('./modules/UserManagement/attendanceRoutes');

app.use("/api/orders", orderRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/templates", templateRoutes);

// Mount Shop Management Routes
app.use('/api/auth', authRoutes);
app.use('/api/shop-orders', shopOrderRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);

// Global error handler middleware
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        status: statusCode
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected");
        // Seed Admin User on startup if it doesn't exist
        try {
            const User = require('./modules/UserManagement/User');
            const adminEmail = 'sachi@gmail.com';
            const existingAdmin = await User.findOne({ email: adminEmail });

            if (!existingAdmin) {
                const admin = new User({
                    name: 'Sachi Admin',
                    email: adminEmail,
                    passwordHash: '12345', // As per current system logic
                    role: 'admin'
                });
                await admin.save();
                console.log('✅ Admin user automatically created on startup!');
            }
        } catch (err) {
            console.error('❌ Error creating initial admin user:', err.message);
        }
    })
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));