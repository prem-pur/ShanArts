const express = require('express');
const router = express.Router();
const invoiceController = require("./invoiceController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const upload = require('../../middleware/uploadMiddleware');

router.get('/', auth, roleCheck(['admin', 'staff_finance', 'staff_system']), invoiceController.getAllInvoices);
router.get('/my', auth, invoiceController.getMyInvoices);
router.get('/outstanding', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getOutstandingInvoices);
router.get('/pending-billing', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getPendingBillingOrders);
router.post('/', auth, roleCheck(['admin', 'staff_finance']), invoiceController.generateInvoice);
router.put('/:id', auth, roleCheck(['admin', 'staff_finance']), invoiceController.updateInvoice);
router.get('/:id', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getInvoiceById);
router.get('/:id/payments', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getPaymentHistory);
router.post('/:id/payments', auth, upload.single('slip'), invoiceController.recordPayment);
router.post('/:id/payments/:paymentId/approve', auth, roleCheck(['admin', 'staff_finance']), invoiceController.approvePayment);

module.exports = router;
