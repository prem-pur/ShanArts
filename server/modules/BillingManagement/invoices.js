const express = require('express');
const router = express.Router();
const invoiceController = require("./invoiceController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck(['admin', 'staff_finance', 'staff_system']), invoiceController.getAllInvoices);
router.get('/my', auth, invoiceController.getMyInvoices);
router.get('/outstanding', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getOutstandingInvoices);
router.get('/:id', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getInvoiceById);
router.get('/:id/payments', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getPaymentHistory);
router.get('/pending-billing', auth, roleCheck(['admin', 'staff_finance']), invoiceController.getPendingBillingOrders);
router.post('/', auth, roleCheck(['admin', 'staff_finance']), invoiceController.generateInvoice);
router.put('/:id', auth, roleCheck(['admin', 'staff_finance']), invoiceController.updateInvoice);
router.post('/:id/payments', auth, roleCheck(['admin', 'staff_finance']), invoiceController.recordPayment);
router.delete('/:id', auth, roleCheck(['admin', 'staff_finance']), invoiceController.deleteInvoice);

module.exports = router;
