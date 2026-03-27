const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: String,
        unit: String,
        currentStock: {
            type: Number,
            default: 0,
        },
        reorderThreshold: Number,
        costPerUnit: Number,
        supplier: String,
        barcode: {
            type: String,
            unique: true,
            sparse: true, // Allows null values for existing materials
        },
        qrCode: {
            type: String,
            unique: true,
            sparse: true, // Allows null values for existing materials
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        deletionRequested: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Material', materialSchema);
