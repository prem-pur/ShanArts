const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        nic: {
            type: String,
            sparse: true, // NIC is only for staff, allow multiple nulls
        },
        address: {
            type: String,
        },
        merchantCode: {
            type: String,
            sparse: true, // merchantCode is only for staff
        },
        qrCode: {
            type: String, // base64 data URL of the QR image
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to hash password
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) {
        return;
    }

    // Only hash if it's not already hashed (to support legacy plaintext check during transition)
    // In a fresh system, this check isn't strictly necessary if all passwords are newly set.
    // However, if we're migrating, we'd want to be careful.
    // Let's assume for now any modification to passwordHash should result in a hash.
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Check for old plaintext passwords vs hashed passwords
    if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) {
        return await bcrypt.compare(enteredPassword, this.passwordHash);
    }
    // Fallback for plaintext (legacy)
    return enteredPassword === this.passwordHash;
};

module.exports = mongoose.model('User', userSchema);
