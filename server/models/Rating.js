const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID bệnh nhân là bắt buộc']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'ID bác sĩ là bắt buộc']
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'ID bệnh viện là bắt buộc']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'ID lịch hẹn là bắt buộc']
  },
  rating: {
    type: Number,
    required: [true, 'Đánh giá là bắt buộc'],
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: [1000, 'Đánh giá không được vượt quá 1000 ký tự']
  },
  date: {
    type: Date,
    default: Date.now
  },
  hospitalResponse: {
    type: String,
    trim: true,
    maxlength: [500, 'Phản hồi không được vượt quá 500 ký tự']
  },
  hospitalResponseDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo bác sĩ
ratingSchema.index({ doctorId: 1, date: -1 });

// Index để tìm kiếm theo bệnh viện
ratingSchema.index({ hospitalId: 1, date: -1 });

// Index để tìm kiếm theo bệnh nhân
ratingSchema.index({ patientId: 1, date: -1 });

// Phương thức kiểm tra xem đánh giá có thể được chỉnh sửa không
ratingSchema.methods.canBeEdited = function() {
  const now = new Date();
  const ratingDate = new Date(this.date);
  return (now - ratingDate) <= 24 * 60 * 60 * 1000; // Trong vòng 24 giờ
};

// Phương thức kiểm tra xem đánh giá có thể được xóa không
ratingSchema.methods.canBeDeleted = function() {
  const now = new Date();
  const ratingDate = new Date(this.date);
  return (now - ratingDate) <= 48 * 60 * 60 * 1000; // Trong vòng 48 giờ
};

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating; 