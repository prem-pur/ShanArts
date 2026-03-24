const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'staff_inventory', 'staff_finance', 'staff_operator', 'staff_schedule', 'staff_system', 'staff_designer', 'customer'],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        phone: {
            type: String,
        },
        qrCode: {
            type: String, // base64 data URL of the QR image
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);
