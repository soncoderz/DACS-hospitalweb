const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * @desc    Get notifications for a user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type, isRead } = req.query;
    
    // Build query
    const query = {
      $or: [
        { recipientId: userId },
        { recipientIds: userId },
        { recipientRole: req.user.roleType }
      ]
    };
    
    // Filter by type if provided
    if (type) {
      query.type = type;
    }
    
    // Filter by read status if provided
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      $or: [
        { recipientId: userId, isRead: false },
        { recipientIds: userId, isRead: false },
        { recipientRole: req.user.roleType, isRead: false }
      ]
    });
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      totalCount: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thông báo',
      error: error.message
    });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    // Find the notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Check if user is authorized to mark this notification as read
    const isAuthorized = 
      (notification.recipientId && notification.recipientId.toString() === userId) ||
      (notification.recipientIds && notification.recipientIds.some(rid => rid.toString() === userId)) ||
      (notification.recipientRole && notification.recipientRole === req.user.roleType);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh dấu thông báo này là đã đọc'
      });
    }
    
    // Mark as read
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu thông báo là đã đọc',
      error: error.message
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update all notifications for this user
    const result = await Notification.updateMany(
      {
        $or: [
          { recipientId: userId, isRead: false },
          { recipientIds: userId, isRead: false },
          { recipientRole: req.user.roleType, isRead: false }
        ]
      },
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        } 
      }
    );
    
    return res.status(200).json({
      success: true,
      message: `Đã đánh dấu tất cả ${result.modifiedCount} thông báo là đã đọc`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu tất cả thông báo là đã đọc',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    // Find the notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Check if user is authorized to delete this notification
    const isAuthorized = 
      (notification.recipientId && notification.recipientId.toString() === userId) ||
      (notification.recipientIds && notification.recipientIds.some(rid => rid.toString() === userId)) ||
      (req.user.roleType === 'admin');
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa thông báo này'
      });
    }
    
    // Delete the notification
    await Notification.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo thành công'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thông báo',
      error: error.message
    });
  }
}; 