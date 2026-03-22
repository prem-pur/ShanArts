const express = require('express');
const router = express.Router();
const authController = require('./authController');
const auth = require('../../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/staff', auth, authController.getStaff);
router.get('/staff/:id/qr', auth, authController.getStaffQR);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateMe);

module.exports = router;
