const copywritingService = require('../../services/copywritingService');
const { printKnowledgeReply } = require('../../services/printKnowledgeChatService');
const ApiError = require('../../utils/apiError');

const CONTENT_TYPES = ['Flyer', 'Business Card', 'Poster', 'Social Media Caption', 'Banner'];
const TONES = ['Professional', 'Friendly', 'Luxury', 'Modern', 'Promotional'];

const MAX_PROMPT = 5000;
const MAX_PRINT_CHAT = 2000;
const MAX_HISTORY_TURNS = 8;

/**
 * POST /api/ai/generate-copy
 * Public — no auth. Body: { prompt, contentType, tone }
 */
async function generateCopy(req, res, next) {
    try {
        const prompt = typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
        const contentType = typeof req.body.contentType === 'string' ? req.body.contentType.trim() : '';
        const tone = typeof req.body.tone === 'string' ? req.body.tone.trim() : '';

        if (!prompt) {
            throw new ApiError('Please enter a short description of what you need (prompt cannot be empty).', 400);
        }
        if (prompt.length > MAX_PROMPT) {
            throw new ApiError(`Prompt is too long (max ${MAX_PROMPT} characters).`, 400);
        }
        if (!contentType || !CONTENT_TYPES.includes(contentType)) {
            throw new ApiError(
                `contentType must be one of: ${CONTENT_TYPES.join(', ')}`,
                400
            );
        }
        if (!tone || !TONES.includes(tone)) {
            throw new ApiError(`tone must be one of: ${TONES.join(', ')}`, 400);
        }

        const copy = await copywritingService.generateMarketingCopy({ prompt, contentType, tone });
        const config = require('../../config/env');

        res.status(200).json({
            success: true,
            copy,
            contentType,
            tone,
            model: config.OLLAMA_TEXT_MODEL,
        });
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.status).json({ message: err.message, status: err.status });
        }
        if (err.status === 503 || err.status === 502) {
            return res.status(err.status).json({ message: err.message, status: err.status });
        }
        next(err);
    }
}

/**
 * POST /api/ai/print-chat
 * Public. Body: { message: string, history?: { role, content }[] }
 */
async function printChat(req, res, next) {
    try {
        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
        if (!message) {
            throw new ApiError('Message cannot be empty.', 400);
        }
        if (message.length > MAX_PRINT_CHAT) {
            throw new ApiError(`Message is too long (max ${MAX_PRINT_CHAT} characters).`, 400);
        }

        let history = req.body.history;
        if (history == null) {
            history = [];
        } else if (!Array.isArray(history)) {
            throw new ApiError('history must be an array of { role, content } when provided.', 400);
        } else {
            history = history
                .slice(-MAX_HISTORY_TURNS)
                .map((h) => {
                    if (!h || (h.role !== 'user' && h.role !== 'assistant')) {
                        return null;
                    }
                    const c = typeof h.content === 'string' ? h.content : '';
                    return { role: h.role, content: c };
                })
                .filter(Boolean);
        }

        const reply = await printKnowledgeReply({ userMessage: message, history });
        const config = require('../../config/env');
        res.status(200).json({
            success: true,
            reply,
            model: config.OLLAMA_TEXT_MODEL,
        });
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.status).json({ message: err.message, status: err.status });
        }
        if (err.status === 503 || err.status === 502) {
            return res.status(err.status).json({ message: err.message, status: err.status });
        }
        next(err);
    }
}

module.exports = { generateCopy, printChat, CONTENT_TYPES, TONES };
