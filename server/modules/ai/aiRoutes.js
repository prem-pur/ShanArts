const express = require('express');
const { generateCopy } = require('./aiController');

const router = express.Router();

/** Public: no authentication */
router.post('/generate-copy', generateCopy);

module.exports = router;
