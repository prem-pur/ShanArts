const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const notificationController = require('./notificationController');

router.get('/my', auth, notificationController.getMyNotifications);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.patch('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
