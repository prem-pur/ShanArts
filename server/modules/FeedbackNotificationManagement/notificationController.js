const mongoose = require('mongoose');
const Notification = require('./Notification');

const notificationController = {
	async getMyNotifications(req, res, next) {
		try {
			const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
			const notifications = await Notification.find({
				recipientId: req.user._id || req.user.id,
				isDismissed: false,
			})
				.sort({ createdAt: -1 })
				.limit(limit)
				.lean();

			return res.json(notifications);
		} catch (error) {
			return next(error);
		}
	},

	async markAsRead(req, res, next) {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: 'Invalid notification id' });
			}

			const notification = await Notification.findOneAndUpdate(
				{ _id: id, recipientId: req.user._id || req.user.id },
				{ isRead: true },
				{ new: true }
			);

			if (!notification) {
				return res.status(404).json({ message: 'Notification not found' });
			}

			return res.json(notification);
		} catch (error) {
			return next(error);
		}
	},

	async markAllAsRead(req, res, next) {
		try {
			const result = await Notification.updateMany(
				{ recipientId: req.user._id || req.user.id, isRead: false },
				{ $set: { isRead: true } }
			);

			return res.json({
				message: 'All notifications marked as read',
				updatedCount: result.modifiedCount || 0,
			});
		} catch (error) {
			return next(error);
		}
	},
};

module.exports = notificationController;

