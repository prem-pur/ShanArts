const express = require('express');
const router = express.Router();
const scheduleController = require("./scheduleController");
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck(['admin', 'staff_schedule']), scheduleController.getSchedule);
router.post('/', auth, roleCheck(['admin']), scheduleController.createSchedule);
router.put('/:id', auth, roleCheck(['admin']), scheduleController.updateSchedule);
router.patch('/:id/status', auth, roleCheck(['admin', 'staff_operator', 'staff_schedule']), scheduleController.updateJobStatus);

module.exports = router;
