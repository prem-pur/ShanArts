const express = require('express');
const router = express.Router();
const notificationController = require('./notificationController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/my', auth, notificationController.getMyNotifications);
router.get('/', auth, roleCheck(['admin', 'staff_system']), notificationController.getAllNotifications);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.delete('/clear-all', auth, notificationController.clearMyNotifications);
router.delete('/:id', auth, notificationController.deleteMyNotification);
router.post('/:id/verify', auth, roleCheck(['admin', 'staff_system']), notificationController.verifyPrediction);

module.exports = router;
