const express = require('express');
const router = express.Router();
const feedbackController = require('./feedbackController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

// Customer feedback submission
router.post('/', auth, feedbackController.submitFeedback);

// Get current user's feedback
router.get('/my', auth, feedbackController.getMyFeedback);

// Get all feedback (admin only)
router.get('/', auth, roleCheck(['admin', 'staff_system']), feedbackController.getAllFeedback);

// Respond to feedback (admin only)
router.patch('/:id/respond', auth, roleCheck(['admin', 'staff_system']), feedbackController.respondToFeedback);

// Get feedback statistics (admin only)
router.get('/stats', auth, roleCheck(['admin', 'staff_system']), feedbackController.getFeedbackStats);

module.exports = router;
