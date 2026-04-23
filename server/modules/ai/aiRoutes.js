const express = require('express');
const { generateCopy, printChat } = require('./aiController');

const router = express.Router();

/** Public: no authentication */
router.post('/generate-copy', generateCopy);
router.post('/print-chat', printChat);

module.exports = router;
