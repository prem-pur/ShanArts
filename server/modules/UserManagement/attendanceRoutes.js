const express = require('express');
const router = express.Router();
const attendanceController = require('./attendanceController');
const auth = require('../../middleware/auth');

// Admin scans a QR code to mark attendance
router.post('/scan', auth, attendanceController.scanAttendance);

// Admin views today's attendance for all staff
router.get('/today', auth, attendanceController.getTodayAttendance);

// Operator views their own attendance
router.get('/my', auth, attendanceController.getMyAttendance);

module.exports = router;
