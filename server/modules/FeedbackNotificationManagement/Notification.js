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
            required: true,
            default: 'general',
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

