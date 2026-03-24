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
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'delayed', 'machine_maintenance'],
        default: 'pending'
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
