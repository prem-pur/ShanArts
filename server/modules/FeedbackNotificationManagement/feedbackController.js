const Feedback = require('./Feedback');
const notificationService = require('../../services/notificationService');

const feedbackController = {
    async submitFeedback(req, res, next) {
        try {
            const { orderId, orderNumber, rating, comment, category } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }

            const feedback = new Feedback({
                userId: req.user._id,
                orderId: orderId || null,
                orderNumber: orderNumber || null,
                rating,
                comment: comment || '',
                category: category || 'service',
                status: 'submitted',
            });

            await feedback.save();

            // Feedback should still be accepted even if notification delivery fails.
            try {
                await notificationService.notifyAdmins(
                    'customer_feedback',
                    `New Customer Feedback - ${rating}⭐`,
                    `${comment ? `"${comment.substring(0, 50)}..."` : 'New feedback received'} ${orderNumber ? `for order #${orderNumber}` : ''}`,
                    feedback._id,
                    'Feedback'
                );
            } catch (notifyError) {
                console.error('Failed to notify admins about feedback:', notifyError.message);
            }

            return res.status(201).json({
                message: 'Thank you for your feedback!',
                feedback,
            });
        } catch (error) {
            return next(error);
        }
    },

    async getMyFeedback(req, res, next) {
        try {
            const feedback = await Feedback.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .lean();

            return res.json(feedback);
        } catch (error) {
            return next(error);
        }
    },

    async getAllFeedback(req, res, next) {
        try {
            const { status, category, limit = 50, sort = '-createdAt' } = req.query;
            const filters = {};

            if (status) filters.status = status;
            if (category) filters.category = category;

            const feedback = await Feedback.find(filters)
                .populate('userId', 'name email')
                .sort(sort)
                .limit(parseInt(limit, 10))
                .lean();

            return res.json(feedback);
        } catch (error) {
            return next(error);
        }
    },

    async respondToFeedback(req, res, next) {
        try {
            const { id } = req.params;
            const { response } = req.body;

            if (!response || response.trim() === '') {
                return res.status(400).json({ message: 'Response message is required' });
            }

            const feedback = await Feedback.findByIdAndUpdate(
                id,
                {
                    response: response.trim(),
                    status: 'resolved',
                    respondedBy: req.user._id,
                    respondedAt: new Date(),
                },
                { new: true }
            );

            if (!feedback) {
                return res.status(404).json({ message: 'Feedback not found' });
            }

            // Response should be saved even if notification delivery fails.
            if (feedback.userId) {
                try {
                    await notificationService.notifyUser(
                        feedback.userId,
                        'feedback_response',
                        'We Replied to Your Feedback',
                        `Thank you for your feedback. We've reviewed it and have a response.`,
                        feedback._id,
                        'Feedback'
                    );
                } catch (notifyError) {
                    console.error('Failed to notify customer about feedback response:', notifyError.message);
                }
            }

            return res.json({
                message: 'Response added successfully',
                feedback,
            });
        } catch (error) {
            return next(error);
        }
    },

    async getFeedbackStats(req, res, next) {
        try {
            const total = await Feedback.countDocuments();
            const submitted = await Feedback.countDocuments({ status: 'submitted' });
            const resolved = await Feedback.countDocuments({ status: 'resolved' });
            const avgRating = await Feedback.aggregate([
                { $group: { _id: null, average: { $avg: '$rating' } } },
            ]);

            return res.json({
                total,
                submitted,
                resolved,
                averageRating: avgRating[0]?.average || 0,
            });
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = feedbackController;