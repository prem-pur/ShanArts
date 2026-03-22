const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, // "YYYY-MM-DD" — one record per user per day
        required: true,
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'absent',
    },
    scannedAt: {
        type: Date,
    },
});

// Unique constraint: one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
