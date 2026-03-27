const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const notificationController = require('./notificationController');

router.get('/my', auth, notificationController.getMyNotifications);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.delete('/clear-all', auth, notificationController.clearMyNotifications);
router.delete('/:id', auth, notificationController.deleteMyNotification);
router.post('/:id/verify', auth, roleCheck(['admin']), notificationController.verifyPrediction);

module.exports = router;
