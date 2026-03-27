const Notification = require('../modules/FeedbackNotificationManagement/Notification');
const User = require('../modules/UserManagement/User');

const notificationService = {
    async createNotification(recipientId, type, title, message, relatedEntityId = null, relatedEntityType = null, metadata = null) {
        try {
            const notification = new Notification({
                recipientId,
                type,
                title,
                message,
                relatedEntityId,
                relatedEntityType,
                metadata,
            });
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    async getNotificationsByUser(userId) {
        try {
            return await Notification.find({ recipientId: userId })
                .sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    async markAsRead(notificationId) {
        try {
            return await Notification.findByIdAndUpdate(
                notificationId,
                { isRead: true },
                { new: true }
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    async dismissNotification(notificationId) {
        try {
            return await Notification.findByIdAndUpdate(
                notificationId,
                { isDismissed: true },
                { new: true }
            );
        } catch (error) {
            console.error('Error dismissing notification:', error);
            throw error;
        }
    },

    async notifyAdmins(type, title, message, relatedEntityId = null, relatedEntityType = null, metadata = null) {
        try {
            const admins = await User.find({ role: 'admin', isActive: true });

            return await Promise.all(
                admins.map(admin =>
                    this.createNotification(admin._id, type, title, message, relatedEntityId, relatedEntityType, metadata)
                )
            );
        } catch (error) {
            console.error('Error notifying admins:', error);
            throw error;
        }
    },

    async notifyUser(userId, type, title, message, relatedEntityId = null, relatedEntityType = null, metadata = null) {
        try {
            return await this.createNotification(userId, type, title, message, relatedEntityId, relatedEntityType, metadata);
        } catch (error) {
            console.error('Error notifying user:', error);
            throw error;
        }
    },
};

module.exports = notificationService;
