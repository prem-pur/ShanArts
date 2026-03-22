const express = require('express');
const router = express.Router();
const orderController = require("./orderController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

const upload = require('../../middleware/uploadMiddleware');

router.get('/', auth, orderController.getAllOrders);
router.get('/my', auth, orderController.getMyOrders);
router.get('/:id', auth, orderController.getOrderById);
router.post('/', auth, upload.fields([
    { name: 'samplePhoto', maxCount: 1 },
    { name: 'designFiles', maxCount: 10 }
]), orderController.createOrder);
router.put('/:id', auth, orderController.updateOrder);
router.patch('/:id/status', auth, roleCheck(['admin', 'staff_operator']), orderController.updateOrderStatus);
router.post('/:id/submit-design', auth, roleCheck(['admin', 'staff_designer']), orderController.submitToCustomer);
router.post('/:id/feedback', auth, roleCheck(['customer']), orderController.processCustomerFeedback);
router.post('/:id/cancel', auth, orderController.cancelOrder);
router.patch('/:id/assign', auth, roleCheck(['admin', 'staff_schedule']), orderController.assignOrder);
router.delete('/:id', auth, roleCheck(['admin', 'staff_schedule']), orderController.deleteOrder);

module.exports = router;
