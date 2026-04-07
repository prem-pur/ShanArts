const express = require('express');
const router = express.Router();
const billingController = require('./billingController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

// Billing summary / reports (admin + finance staff only)
router.get('/summary', auth, roleCheck(['admin', 'staff_finance']), billingController.getBillingSummary);

module.exports = router;
