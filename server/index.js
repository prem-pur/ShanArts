const express = require("express");
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

async function migrateFeedbackIndexes() {
    try {
        const feedbackCollection = mongoose.connection.collection('feedbacks');
        const indexes = await feedbackCollection.indexes();
        const hasLegacyOrderIdIndex = indexes.some((index) => index.name === 'orderId_1');

        if (hasLegacyOrderIdIndex) {
            await feedbackCollection.dropIndex('orderId_1');
            console.log('Dropped legacy feedback index: orderId_1');
        }
    } catch (error) {
        console.warn('Feedback index migration skipped:', error.message);
    }
}

// Connect to MongoDB BEFORE mounting routes
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/orderDB', {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
    .then(async () => {
        console.log("MongoDB Connected");

        // Cleanup stale indexes that conflict with optional feedback order references.
        await migrateFeedbackIndexes();
        const Feedback = require('./modules/FeedbackNotificationManagement/Feedback');
        await Feedback.syncIndexes();
        
        // Now mount routes after connection is established
        const orderRoutes = require("./modules/OrderManagement/orderRoutes");
        const requestRoutes = require("./modules/OrderManagement/requestRoutes");
        const templateRoutes = require("./modules/OrderManagement/templateRoutes");

        // Shop Management Routes
        const authRoutes = require('./modules/UserManagement/auth');
        const shopOrderRoutes = require('./modules/OrderManagement/shop-orders');
        const machineRoutes = require('./modules/InventoryManagement/machines');
        const inventoryRoutes = require('./modules/InventoryManagement/inventory');
        const invoiceRoutes = require('./modules/BillingManagement/invoices');
        const scheduleRoutes = require('./modules/ScheduleManagement/routes');
        const feedbackRoutes = require('./modules/FeedbackNotificationManagement/routes');
        const notificationRoutes = require('./modules/FeedbackNotificationManagement/notifications');

        app.use("/api/orders", orderRoutes);
        app.use("/api/requests", requestRoutes);
        app.use("/api/templates", templateRoutes);

        // Mount Shop Management Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/shop-orders', shopOrderRoutes);
        app.use('/api/machines', machineRoutes);
        app.use('/api/inventory', inventoryRoutes);
        app.use('/api/invoices', invoiceRoutes);
        app.use('/api/schedule', scheduleRoutes);
        app.use('/api/feedback', feedbackRoutes);
        app.use('/api/notifications', notificationRoutes);

        // Global error handler middleware
        app.use((err, req, res, next) => {
            const statusCode = err.status || 500;
            res.status(statusCode).json({
                message: err.message || 'Internal Server Error',
                status: statusCode
            });
        });

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    });
