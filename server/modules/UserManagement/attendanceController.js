const Attendance = require('./Attendance');
const User = require('./User');
const ApiError = require('../../utils/apiError');

// Helper: get today's date as "YYYY-MM-DD"
const todayString = () => new Date().toISOString().split('T')[0];

// POST /api/attendance/scan  — called when admin scans a staff QR code
exports.scanAttendance = async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData) return next(new ApiError('No QR data provided', 400));

        // QR data is a JSON string: { userId, name, role }
        let parsed;
        try {
            parsed = JSON.parse(qrData);
        } catch {
            return next(new ApiError('Invalid QR code data', 400));
        }

        const { userId } = parsed;
        if (!userId) return next(new ApiError('QR code missing userId', 400));

        const user = await User.findById(userId).select('name role');
        if (!user) return next(new ApiError('Staff member not found', 404));

        const today = todayString();

        // Upsert: mark as present for today
        const attendance = await Attendance.findOneAndUpdate(
            { userId, date: today },
            { status: 'present', scannedAt: new Date() },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: `${user.name} marked as Present`,
            attendance: {
                userId,
                name: user.name,
                role: user.role,
                status: attendance.status,
                date: today,
                scannedAt: attendance.scannedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/attendance/today  — returns all operators with their presence status for today
exports.getTodayAttendance = async (req, res, next) => {
    try {
        const today = todayString();

        // Get all staff (non-customer, non-admin) users
        const staffUsers = await User.find({ role: { $nin: ['customer', 'admin'] } }).select('name email role merchantCode');

        // Get today's attendance records
        const records = await Attendance.find({ date: today });
        const recordMap = {};
        records.forEach(r => { recordMap[r.userId.toString()] = r; });

        const result = staffUsers.map(u => {
            const rec = recordMap[u._id.toString()];
            return {
                userId: u._id,
                name: u.name,
                email: u.email,
                role: u.role,
                merchantCode: u.merchantCode,
                status: rec ? rec.status : 'absent',
                scannedAt: rec ? rec.scannedAt : null,
            };
        });

        res.status(200).json({ date: today, attendance: result });
    } catch (error) {
        next(error);
    }
};

// GET /api/attendance/my  — operator sees their own attendance for today
exports.getMyAttendance = async (req, res, next) => {
    try {
        const today = todayString();
        const record = await Attendance.findOne({ userId: req.user._id, date: today });
        res.status(200).json({
            date: today,
            status: record ? record.status : 'absent',
            scannedAt: record ? record.scannedAt : null,
        });
    } catch (error) {
        next(error);
    }
};
