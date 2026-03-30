const express = require("express");
const router = express.Router();
const ProductionOrder = require("./ProductionOrder");
const CustomerRequest = require("./CustomerRequest");
const DesignTemplate = require("./DesignTemplate");
const DesignVersion = require("./DesignVersion");
const Machine = require("../InventoryManagement/Machine");
const User = require("../UserManagement/User");
const Schedule = require("../ScheduleManagement/model");
const mongoose = require("mongoose");
const { generateDesign } = require("../../utils/designGenerator");
const notificationService = require("../../services/notificationService");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// CREATE Order from Request
router.post("/create-from-request", async (req, res) => {
    try {
        const { requestId } = req.body;

        // Check if request exists
        const request = await CustomerRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        // Update Request Status
        request.status = "Approved"; // or "Processing"
        await request.save();

        // Create Order
        const newOrder = new ProductionOrder({
            requestId,
            customerId: request.customerId,
            orderId: `ORD-${Date.now()}`, // Simple ID generation
            printSpecs: {
                designType: request.productType,
                size: request.size,
                quantity: 1
            },
            customerPhone: request.customerPhone || "—", // Default if missing
            staffId: "system",
            status: "Draft"
        });
        await newOrder.save();

        res.json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET All Orders
router.get("/", async (req, res) => {
    try {
        const orders = await ProductionOrder.find()
            .populate("requestId")
            .populate("currentVersionId")
            .populate("shopOrderId")
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Single Order
router.get("/:id", async (req, res) => {
    try {
        const order = await ProductionOrder.findById(req.params.id)
            .populate("requestId")
            .populate("currentVersionId")
            .populate("shopOrderId");
        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GENERATE DESIGN (New Version)
router.post("/generate", async (req, res) => {
    try {
        const { orderId, templateId, customData } = req.body;

        const order = await ProductionOrder.findById(orderId).populate("requestId");
        if (!order) return res.status(404).json({ error: "Order not found" });

        const template = await DesignTemplate.findById(templateId);
        if (!template) return res.status(404).json({ error: "Template not found" });

        // Merge Data: Request Data + Custom Overrides
        const mergedData = {
            ...order.requestId.toObject(), // textContent, productType, etc
            ...customData // override color, specific text, etc
        };

        // Generate PNG
        const pngPath = await generateDesign(template, mergedData);

        // Calculate Version Number
        const lastVersion = await DesignVersion.findOne({ orderId }).sort({ versionNumber: -1 });
        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        // Save Version
        const newVersion = new DesignVersion({
            orderId,
            templateId,
            versionNumber,
            pngFilePath: pngPath,
            designData: mergedData,
            createdBy: "system_auto" // Default as staffId is removed
        });
        await newVersion.save();

        // Update Order with Current Version
        order.currentVersionId = newVersion._id;
        // Map to new status naming
        order.status = "Sent to Customer";
        await order.save();

        res.json(newVersion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SAVE CLIENT-SIDE GENERATED VERSION
router.post("/save-version", async (req, res) => {
    try {
        const { orderId, templateId, imageBase64, designData, nextStatus } = req.body;

        // 1. Save Base64 Image
        const fs = require('fs');
        const path = require('path');
        const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `design-client-${uniqueSuffix}.png`;
        const uploadDir = path.join(__dirname, '../../public/previews');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const pngPath = `/previews/${fileName}`;

        // 2. Get Order & Version Number
        const lastVersion = await DesignVersion.findOne({ orderId }).sort({ versionNumber: -1 });
        const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        // 3. Save Version
        const newVersion = new DesignVersion({
            orderId,
            templateId: isValidObjectId(templateId) ? templateId : undefined,
            versionNumber,
            pngFilePath: pngPath,
            designData, // Capture fabric JSON or similar for re-editing
            createdBy: "client_editor"
        });
        await newVersion.save();

        // 4. Update Order
        const update = { currentVersionId: newVersion._id };
        if (typeof nextStatus === "string" && nextStatus.trim()) {
            update.status = nextStatus;
        }
        await ProductionOrder.findByIdAndUpdate(orderId, update);

        res.json(newVersion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Multer Setup for File Uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// CREATE MANUAL ORDER
router.post("/create-manual", async (req, res) => {
    try {
        const { customerName, customerId, customerPhone, printSpecs } = req.body;
        const newOrder = new ProductionOrder({
            customerName,
            customerId,
            customerPhone,
            orderId: `ORD-${Date.now()}`, // Simple ID generation
            printSpecs: printSpecs || {},
            staffId: "system",
            status: "Draft"
        });
        await newOrder.save();
        res.json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD FILE to Order
router.post("/:id/upload", upload.single('file'), async (req, res) => {
    try {
        const order = await ProductionOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        order.uploadedFiles.push({
            fileName: req.file.originalname,
            filePath: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype
        });
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE SPECS
router.put("/:id/specs", async (req, res) => {
    try {
        const { printSpecs } = req.body;
        const order = await ProductionOrder.findByIdAndUpdate(
            req.params.id,
            { printSpecs },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE ORDER
router.delete("/:id", async (req, res) => {
    try {
        const order = await ProductionOrder.findByIdAndDelete(req.params.id);
        if (order && order.assignedMachineId) {
            await Machine.findByIdAndUpdate(order.assignedMachineId, {
                status: 'Available',
                currentOrderId: null,
                currentJobId: null,
                operatorId: null,
                startTime: null,
                estimatedEndTime: null
            });
            await Schedule.updateMany(
                { orderId: req.params.id },
                { status: 'cancelled' }
            );
        }
        res.json({ message: "Order deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APPROVE DESIGN
router.post("/:id/approve", async (req, res) => {
    try {
        const order = await ProductionOrder.findByIdAndUpdate(
            req.params.id,
            { status: "Approved" },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE STATUS
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const order = await ProductionOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ASSIGN MACHINE TO ORDER
router.patch("/:id/assign-machine", async (req, res) => {
    try {
        const { machineId, status } = req.body;

        // Validate order exists
        const order = await ProductionOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Validate machine exists
        const machineData = await Machine.findById(machineId);
        if (!machineData) {
            return res.status(404).json({ error: "Machine not found" });
        }

        // Update order status and machine assignment
        const updatedOrder = await ProductionOrder.findByIdAndUpdate(
            req.params.id,
            {
                status: status || 'In Progress',
                assignedMachineId: machineId,
                assignedMachineName: machineData.name
            },
            { new: true }
        ).populate('assignedMachineId', 'name type status');

        // Update machine status to busy
        await Machine.findByIdAndUpdate(
            machineId,
            {
                status: 'In Use',
                currentJobId: req.params.id,
                currentOrderId: req.params.id,
                startTime: new Date()
            }
        );

        // Create schedule entry
        const scheduleEntry = new Schedule({
            orderId: req.params.id,
            machineId: machineId,
            operatorId: machineData.operatorId || null, // Use assigned operator if available
            scheduledStart: new Date(),
            status: 'in_progress'
        });
        await scheduleEntry.save();

        // Notify all operators about the new assignment
        try {
            const operators = await User.find({ role: 'staff_operator', isActive: true });
            await Promise.all(
                operators.map(operator =>
                    notificationService.notifyUser(
                        operator._id,
                        'machine_assignment',
                        `New Machine Assignment: ${machineData.name}`,
                        `Order ${updatedOrder.orderId} (${updatedOrder.printSpecs?.designType}) has been assigned to ${machineData.name}.`,
                        updatedOrder._id,
                        'ProductionOrder'
                    )
                )
            );
        } catch (notificationError) {
            console.error('Failed to send notifications:', notificationError);
            // Don't fail the assignment if notification fails
        }

        res.json({
            success: true,
            message: 'Machine assigned successfully',
            data: updatedOrder,
            scheduleId: scheduleEntry._id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DEBUG: Test operator filtering
router.get("/debug/operator-tasks", async (req, res) => {
    try {
        const allOrders = await ProductionOrder.find({});
        const filteredOrders = allOrders.filter(order =>
            (order.status === 'In Progress' || order.status === 'Printing') && order.assignedMachineId
        );

        res.json({
            totalOrders: allOrders.length,
            filteredOrders: filteredOrders.length,
            allOrders: allOrders.map(o => ({
                orderId: o.orderId,
                status: o.status,
                hasAssignedMachine: !!o.assignedMachineId,
                assignedMachineName: o.assignedMachineName
            })),
            filteredOrders: filteredOrders.map(o => ({
                orderId: o.orderId,
                status: o.status,
                assignedMachineName: o.assignedMachineName
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// QUICK TEST: Assign operator to machine (for testing only)
router.post("/debug/assign-operator", async (req, res) => {
    try {
        const { machineId, operatorId } = req.body;

        await Machine.findByIdAndUpdate(
            machineId,
            { operatorId }
        );

        res.json({
            success: true,
            message: 'Operator assigned to machine successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// QUICK TEST: Assign operator to machine by name (for testing only)
router.post("/debug/assign-operator-by-name", async (req, res) => {
    try {
        const { machineId, operatorName } = req.body;

        // Find user by name (any role)
        const User = require('../UserManagement/User');
        const operator = await User.findOne({ name: operatorName });

        if (!operator) {
            return res.status(404).json({ error: 'Operator not found' });
        }

        // Update machine with operator
        await Machine.findByIdAndUpdate(
            machineId,
            { operatorId: operator._id }
        );

        // Update any existing schedule entries for this machine
        await Schedule.updateMany(
            { machineId: machineId },
            { operatorId: operator._id }
        );

        res.json({
            success: true,
            message: `Operator ${operatorName} assigned to machine successfully`,
            operatorId: operator._id,
            operatorRole: operator.role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
