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
				{ recipientId: req.user._id || req.user.id, isRead: false, isDismissed: false },
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

	async deleteMyNotification(req, res, next) {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: 'Invalid notification id' });
			}

			const notification = await Notification.findOneAndUpdate(
				{ _id: id, recipientId: req.user._id || req.user.id, isDismissed: false },
				{ $set: { isDismissed: true } },
				{ new: true }
			);

			if (!notification) {
				return res.status(404).json({ message: 'Notification not found' });
			}

			return res.json({ message: 'Notification deleted', id: notification._id });
		} catch (error) {
			return next(error);
		}
	},

	async clearMyNotifications(req, res, next) {
		try {
			const result = await Notification.updateMany(
				{ recipientId: req.user._id || req.user.id, isDismissed: false },
				{ $set: { isDismissed: true } }
			);

			return res.json({
				message: 'All notifications cleared',
				deletedCount: result.modifiedCount || 0,
			});
		} catch (error) {
			return next(error);
		}
	},

	async verifyPrediction(req, res, next) {
		try {
			const { id } = req.params;
			const { isAccurate, notes } = req.body || {};

			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ message: 'Invalid notification id' });
			}

			if (typeof isAccurate !== 'boolean') {
				return res.status(400).json({ message: 'isAccurate must be true or false' });
			}

			const notification = await Notification.findOne({
				_id: id,
				recipientId: req.user._id || req.user.id,
				isDismissed: false,
			});

			if (!notification) {
				return res.status(404).json({ message: 'Notification not found' });
			}

			if (notification.type !== 'delay_risk') {
				return res.status(400).json({ message: 'Only delay risk notifications can be verified' });
			}

			if (notification.predictionVerification?.status === 'verified') {
				return res.status(409).json({ message: 'This prediction was already verified' });
			}

			notification.predictionVerification = {
				status: 'verified',
				isAccurate,
				notes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : '',
				verifiedBy: req.user._id || req.user.id,
				verifiedAt: new Date(),
			};
			notification.isRead = true;

			await notification.save();

			return res.json(notification.toObject());
		} catch (error) {
			return next(error);
		}
	},
};

module.exports = notificationController;

