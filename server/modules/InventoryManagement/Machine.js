const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
    {
        // 1️⃣ Basic Machine Information
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['Digital Printer', 'Offset Printer', 'Cutter', 'Laminator', 'Large Format Printer', 'Folding Machine', 'Embossing Machine', 'Other']
        },
        
        // 2️⃣ Machine Status Field (Very Important)
        status: {
            type: String,
            enum: ["Available", "In Use", "Scheduled", "Under Maintenance", "Out of Order"],
            default: "Available"
        },
        
        // 3️⃣ Production Tracking Fields
        currentOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductionOrder',
        },
        startTime: {
            type: Date,
        },
        estimatedEndTime: {
            type: Date,
        },
        lastMaintenanceDate: {
            type: Date,
        },
        nextMaintenanceDate: {
            type: Date,
        },
        
        // Existing fields (keeping for backward compatibility)
        currentJobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductionOrder',
        },
        operatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        
        // Additional fields for better tracking
        location: {
            type: String,
            default: 'Main Production Floor'
        },
        specifications: {
            type: String,
            default: ''
        },
        notes: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Machine', machineSchema);
