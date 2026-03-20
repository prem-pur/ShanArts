const express = require('express');
const router = express.Router();
const notificationController = require("./notificationController");
const auth = require('../../middleware/auth');

router.get('/', auth, notificationController.getMyNotifications);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);

module.exports = router;
