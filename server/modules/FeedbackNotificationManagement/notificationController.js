const Notification = require("./Notification");
const ApiError = require('../../utils/apiError');

// Get notifications for current user
exports.getMyNotifications = async (req, res, next) => {
    try {
        const userId = req.user ? req.user._id : req.query.userId;
        if (!userId) {
            return next(new ApiError('User ID is required', 400));
        }

        const { limit = 50, type } = req.query;
        const filter = { recipientId: userId, isDismissed: false };

        if (type) filter.type = type;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10));

        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            isRead: false,
            isDismissed: false,
        });

        res.status(200).json({
            success: true,
            unreadCount,
            count: notifications.length,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
};

// Mark as read
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return next(new ApiError('Notification not found', 404));
        }

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user ? req.user._id : req.body.userId;
        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        next(error);
    }
};
