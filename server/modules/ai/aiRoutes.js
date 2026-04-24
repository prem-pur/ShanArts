const express = require('express');
const { generateCopy, printChat, generateDesignMessage } = require('./aiController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

const router = express.Router();

/** Public: no authentication */
router.post('/generate-copy', generateCopy);
router.post('/print-chat', printChat);

/** Staff: message shown to customer when sharing a design (Ollama + fallback) */
router.post(
    '/generate-design-message',
    auth,
    roleCheck(['admin', 'staff_designer']),
    generateDesignMessage
);

module.exports = router;
