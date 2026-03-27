const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['order_update', 'delay_risk', 'low_stock', 'stock_removal', 'payment_due', 'job_assigned', 'feedback_received', 'customer_feedback', 'feedback_response', 'general_announcement'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        relatedEntityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        relatedEntityType: {
            type: String,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        predictionVerification: {
            status: {
                type: String,
                enum: ['pending', 'verified'],
                default: 'pending',
            },
            isAccurate: {
                type: Boolean,
                default: null,
            },
            notes: {
                type: String,
                default: '',
                trim: true,
            },
            verifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
            verifiedAt: {
                type: Date,
                default: null,
            },
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        isDismissed: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
