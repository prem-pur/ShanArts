const express = require('express');
const router = express.Router();
const feedbackController = require("./feedbackController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck(['admin', 'staff_system']), feedbackController.getAllFeedback);
router.get('/summary', auth, roleCheck(['admin', 'staff_system']), feedbackController.getFeedbackSummary);
router.get('/my', auth, feedbackController.getMyFeedback);
router.post('/', auth, feedbackController.submitFeedback);

module.exports = router;
