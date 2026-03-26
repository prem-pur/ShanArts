const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
        orderNumber: {
            type: String,
            default: null,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        comment: {
            type: String,
            trim: true,
            default: '',
        },
        category: {
            type: String,
            enum: ['quality', 'service', 'delivery', 'pricing', 'communication', 'other'],
            default: 'service',
        },
        status: {
            type: String,
            enum: ['submitted', 'read', 'resolved'],
            default: 'submitted',
        },
        response: {
            type: String,
            default: null,
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        respondedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Feedback', feedbackSchema);

