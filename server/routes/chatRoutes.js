const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Apply authentication middleware to all routes
router.use(protect);

// Get conversation list
// GET /api/chat/conversations
router.get('/conversations', chatController.getConversations);

// Get messages for a conversation
// GET /api/chat/conversations/:conversationId/messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);

// Send message in a conversation
// POST /api/chat/conversations/:conversationId/messages
router.post(
  '/conversations/:conversationId/messages',
  [
    check('content')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Nội dung tin nhắn không được để trống')
  ],
  chatController.sendMessage
);

// Delete a message
// DELETE /api/chat/messages/:messageId
router.delete('/messages/:messageId', chatController.deleteMessage);

// Create a new conversation
// POST /api/chat/conversations
router.post(
  '/conversations',
  [
    check('participantId')
      .isMongoId()
      .withMessage('ID người tham gia không hợp lệ'),
    check('initialMessage')
      .optional()
      .trim(),
    check('appointmentId')
      .optional()
      .isMongoId()
      .withMessage('ID cuộc hẹn không hợp lệ')
  ],
  chatController.createConversation
);

// Delete/Archive a conversation
// DELETE /api/chat/conversations/:conversationId
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Get unread messages count
// GET /api/chat/unread-count
router.get('/unread-count', chatController.getUnreadCount);

// Get available doctors for chat (patient only)
// GET /api/chat/available-doctors
router.get(
  '/available-doctors', 
  authorize('user'),
  chatController.getAvailableDoctors
);

// Get available patients for chat (doctor only)
// GET /api/chat/available-patients
router.get(
  '/available-patients', 
  authorize('doctor'), 
  chatController.getAvailablePatients
);

module.exports = router; 