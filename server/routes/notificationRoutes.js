const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// GET /api/notifications - Get all notifications for current user
router.get('/', protect, notificationController.getNotifications);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', protect, notificationController.markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', protect, notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router; 