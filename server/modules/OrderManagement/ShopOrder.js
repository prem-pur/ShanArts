const mongoose = require('mongoose');

const shopOrderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        jobType: {
            type: String,
            enum: ['banner', 'flyer', 'business_card', 'brochure', 'poster', 'sticker', 'invitation', 'social_media', 'other'],
            required: true,
        },
        description: String,
        quantity: Number,
        dimensions: {
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'mm', 'inch', 'px'],
            },
        },
        fileUrl: String,
        designFiles: [String], // Multiple design files
        samplePhoto: String,   // User's reference photo
        preferences: String,   // Special instructions
        address: {
            street: String,
            city: String,
            postalCode: String,
            distance: Number, // Mock distance in km
        },
        deliveryMethod: {
            type: String,
            enum: ['pickup', 'delivery', 'pickme'],
            default: 'pickup',
        },
        deadline: Date,
        priority: {
            type: String,
            enum: ['normal', 'urgent'],
            default: 'normal',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'pending_design', 'waiting_approval', 'revision_requested', 'scheduled', 'in_progress', 'printing', 'completed', 'cancelled'],
            default: 'pending',
        },
        revisionNotes: String, // Feedback from customer when rejecting a design
        assignedOperatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedMachineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Machine',
        },
        scheduledStart: Date,
        scheduledEnd: Date,
        estimatedCompletionTime: Number,
        actualCompletionTime: Number,
        delayRiskScore: Number,
        delayRiskLabel: {
            type: String,
            enum: ['on_time', 'at_risk', 'delayed'],
        },
        materialsUsed: [
            {
                materialId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Material',
                },
                quantity: Number,
            },
        ],
        totalPrice: {
            type: Number,
            default: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        customerPhone: String,
        rescheduleReason: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ShopOrder', shopOrderSchema);
