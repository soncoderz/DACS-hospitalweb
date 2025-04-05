const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID người dùng là bắt buộc']
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: [true, 'Vai trò người dùng là bắt buộc']
  },
  type: {
    type: String,
    enum: [
      'appointment_reminder',
      'appointment_confirmation',
      'appointment_cancellation',
      'new_message',
      'prescription_ready',
      'medical_record_update',
      'payment_confirmation',
      'system_update',
      'promotion'
    ],
    required: [true, 'Loại thông báo là bắt buộc']
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề thông báo là bắt buộc'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Nội dung thông báo là bắt buộc'],
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Appointment', 'Conversation', 'MedicalRecord', 'Promotion', 'Payment'],
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  sentVia: {
    type: [String],
    enum: ['app', 'email', 'sms'],
    default: ['app']
  },
  link: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo người dùng
notificationSchema.index({ userId: 1 });

// Index để tìm kiếm theo ngày tạo (để hiển thị thông báo gần đây)
notificationSchema.index({ createdAt: -1 });

// Index để tìm kiếm thông báo chưa đọc
notificationSchema.index({ userId: 1, isRead: 1 });

// Phương thức đánh dấu thông báo đã đọc
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Phương thức tĩnh để đánh dấu tất cả thông báo đã đọc cho một người dùng
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
};

// Phương thức tĩnh để lấy số lượng thông báo chưa đọc
notificationSchema.statics.countUnread = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Phương thức tĩnh để lấy thông báo theo trang
notificationSchema.statics.paginate = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 