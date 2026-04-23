const express = require('express');
const router = express.Router();
const authController = require('./authController');
const auth = require('../../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/staff', auth, authController.getStaff);
router.get('/staff/:id/qr', auth, authController.getStaffQR);
router.get('/staff/:id/details', auth, authController.getStaffDetails);
router.get('/merchant/:merchantCode/qr', auth, authController.getQrByMerchantCode);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateMe);
router.put('/staff/:id', auth, authController.updateStaff);
router.delete('/staff/:id', auth, authController.deleteStaff);
router.post('/forgot-password', authController.forgotPassword);
router.get('/customers', auth, authController.getCustomers);
module.exports = router;
