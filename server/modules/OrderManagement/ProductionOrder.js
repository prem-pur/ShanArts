const mongoose = require("mongoose");

const ProductionOrderSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerRequest"
        // Not required for manual orders
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String // For manual orders
    },
    // Legacy field - no longer used, kept optional to avoid validation issues
    staffId: {
        type: String,
        required: false,
        default: "system"
    },
    customerId: {
        type: String // For manual orders (optional, user-entered)
    },
    customerPhone: {
        type: String // For manual orders or contact
    },
    shopOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShopOrder"
    },
    printSpecs: {
        designType: String,
        material: String,
        size: {
            width: Number,
            height: Number,
            unit: String
        },
        quantity: Number,
        colorMode: String,
        description: String,
        deadline: Date,
        priority: String,
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String
        },
        deliveryMethod: String,
        preferences: String
    },
    uploadedFiles: [{
        fileName: String,
        filePath: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        // Keep legacy values for existing docs, but use the new values going forward.
        enum: [
            "Draft",
            "Sent to Customer",
            "Approved",
            "Rejected",
            "Completed",
            "Design In Progress",
            "Waiting Approval",
            "Revision Requested",
            "In Progress",
            "Printing",
            "machine_maintenance"
        ],
        default: "Draft"
    },
    currentVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DesignVersion"
    },
    revisionNotes: String,
    assignedMachineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Machine"
    },
    assignedMachineName: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("ProductionOrder", ProductionOrderSchema);
