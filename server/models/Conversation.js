const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'role',
    required: [true, 'ID người dùng là bắt buộc']
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: [true, 'Vai trò là bắt buộc']
  }
});

const conversationSchema = new mongoose.Schema({
  participants: [participantSchema],
  startDate: {
    type: Date,
    default: Date.now
  },
  lastMessageDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  relatedAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo người tham gia
conversationSchema.index({ 'participants.userId': 1 });

// Index để tìm kiếm theo lịch hẹn
conversationSchema.index({ relatedAppointmentId: 1 });

// Phương thức kiểm tra xem người dùng có phải là người tham gia không
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(participant => 
    participant.userId.toString() === userId.toString()
  );
};

// Phương thức lấy vai trò của người dùng trong cuộc trò chuyện
conversationSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  return participant ? participant.role : null;
};

// Phương thức cập nhật thời gian tin nhắn cuối cùng
conversationSchema.methods.updateLastMessageDate = function() {
  this.lastMessageDate = new Date();
  return this.save();
};

// Phương thức đóng cuộc trò chuyện
conversationSchema.methods.close = function() {
  this.isActive = false;
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation; 