/**
 * Schedule Model
 * Defines the schema for job scheduling, including machine and operator assignments.
 */
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionOrder',
        required: true
    },
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine',
        required: true
    },
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    scheduledStart: {
        type: Date,
        required: true
    },
    scheduledEnd: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'delayed'],
        default: 'pending'
    },
    notes: String,
    isRecurring: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
