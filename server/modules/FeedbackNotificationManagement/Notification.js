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
            enum: ['order_update', 'delay_risk', 'low_stock', 'stock_removal', 'payment_due', 'job_assigned', 'feedback_received', 'general_announcement'],
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
