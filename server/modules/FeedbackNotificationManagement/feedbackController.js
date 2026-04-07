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
            const {
                status,
                category,
                limit = 50,
                sort = '-createdAt',
                search,
                minRating,
                maxRating,
                startDate,
                endDate,
                userId,
                resolved
            } = req.query;
            const filters = {};

            // Status filter
            if (status) filters.status = status;

            // Category filter
            if (category) filters.category = category;

            // Rating range filter
            if (minRating || maxRating) {
                filters.rating = {};
                if (minRating) filters.rating.$gte = parseInt(minRating, 10);
                if (maxRating) filters.rating.$lte = parseInt(maxRating, 10);
            }

            // Date range filter
            if (startDate || endDate) {
                filters.createdAt = {};
                if (startDate) filters.createdAt.$gte = new Date(startDate);
                if (endDate) filters.createdAt.$lte = new Date(endDate);
            }

            // User filter
            if (userId) filters.userId = userId;

            // Resolved filter (true = resolved, false = unresolved)
            if (resolved !== undefined) {
                filters.status = resolved === 'true' ? 'resolved' : { $ne: 'resolved' };
            }

            // Search in comment text
            if (search) {
                filters.$or = [
                    { comment: { $regex: search, $options: 'i' } },
                    { response: { $regex: search, $options: 'i' } },
                    { orderNumber: { $regex: search, $options: 'i' } }
                ];
            }

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

    async deleteFeedback(req, res, next) {
        try {
            const { id } = req.params;

            const feedback = await Feedback.findByIdAndDelete(id);

            if (!feedback) {
                return res.status(404).json({ message: 'Feedback not found' });
            }

            return res.json({
                message: 'Feedback deleted successfully',
                feedbackId: feedback._id,
            });
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = feedbackController;