const Feedback = require("./model");
const ShopOrder = require('../OrderManagement/ShopOrder');
const ApiError = require('../../utils/apiError');

// Submit feedback
exports.submitFeedback = async (req, res, next) => {
    try {
        const { orderId, rating, comment } = req.body;
        const customerId = req.user ? req.user._id : req.body.customerId;

        if (!orderId || !rating) {
            return next(new ApiError('Order ID and rating are required', 400));
        }

        // Check if order exists and is completed
        const order = await ShopOrder.findById(orderId);
        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        if (order.status !== 'completed') {
            return next(new ApiError('Can only leave feedback for completed orders', 400));
        }

        const feedback = new Feedback({
            orderId,
            customerId,
            rating,
            comment,
        });

        await feedback.save();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback,
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new ApiError('Feedback already submitted for this order', 409));
        }
        next(error);
    }
};

// Get all feedback (admin)
exports.getAllFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({ isDeleted: false })
            .populate('orderId', 'orderNumber jobType')
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: feedback.length,
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};

// Get feedback summary metrics
exports.getFeedbackSummary = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find({ isDeleted: false });
        const total = feedbacks.length;

        if (total === 0) {
            return res.status(200).json({
                success: true,
                data: { averageRating: 0, total: 0 },
            });
        }

        const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / total;

        res.status(200).json({
            success: true,
            data: {
                averageRating: parseFloat(averageRating.toFixed(1)),
                total,
            },
        });
    } catch (error) {
        next(error);
    }
};
// Get current customer's feedback
exports.getMyFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({
            customerId: req.user._id,
            isDeleted: false
        })
            .populate('orderId', 'orderNumber jobType')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: feedback.length,
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};
