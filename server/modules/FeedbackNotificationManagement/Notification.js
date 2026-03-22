const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['order_update', 'delay_risk', 'low_stock', 'payment_due', 'job_assigned', 'feedback_received'],
            required: true,
        },
        title: String,
        message: String,
        relatedEntityId: mongoose.Schema.Types.ObjectId,
        relatedEntityType: String,
        isRead: {
            type: Boolean,
            default: false,
        },
        isDismissed: {
            type: Boolean,
            default: false,
        },
        isResolved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
