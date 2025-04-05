const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'Tên file là bắt buộc']
  },
  fileUrl: {
    type: String,
    required: [true, 'URL file là bắt buộc']
  },
  fileType: {
    type: String,
    required: [true, 'Loại file là bắt buộc']
  }
});

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'ID cuộc trò chuyện là bắt buộc']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderRole',
    required: [true, 'ID người gửi là bắt buộc']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderRole',
    required: [true, 'ID người nhận là bắt buộc']
  },
  senderRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: [true, 'Vai trò người gửi là bắt buộc']
  },
  message: {
    type: String,
    required: [true, 'Nội dung tin nhắn là bắt buộc'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readTimestamp: Date,
  attachments: [attachmentSchema]
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, timestamp: -1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readTimestamp = new Date();
  return this.save();
};

// Method to check if message can be deleted (within 24 hours)
messageSchema.methods.canBeDeleted = function() {
  const hoursSinceCreation = (Date.now() - this.timestamp) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 