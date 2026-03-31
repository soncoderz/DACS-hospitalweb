const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middlewares/authMiddleware');

const AI_CONFIG_ERROR_PATTERN = /OPENAI_API_KEY|GEMINI_API_KEY|Missing credentials|apiKey|API key/i;

// Load AI controller only when an AI endpoint is actually called.
// This keeps the server bootable in CI when AI keys are intentionally omitted.
const lazyAiHandler = (exportName) => async (req, res, next) => {
  try {
    const controller = require('../controllers/aiController');
    const handler = controller[exportName];

    if (typeof handler !== 'function') {
      throw new Error(`AI controller export "${exportName}" does not exist`);
    }

    return await handler(req, res, next);
  } catch (error) {
    const message = error?.message || '';

    if (AI_CONFIG_ERROR_PATTERN.test(message)) {
      console.warn(`[AI Routes] AI is unavailable for ${req.method} ${req.originalUrl}: ${message}`);
      return res.status(503).json({
        success: false,
        message: 'Tinh nang AI hien chua duoc cau hinh tren moi truong nay.',
      });
    }

    return next(error);
  }
};

router.post('/gemini-chat', optionalAuth, lazyAiHandler('geminiChat'));
router.get('/chat-history', optionalAuth, lazyAiHandler('getChatHistory'));

module.exports = router;
