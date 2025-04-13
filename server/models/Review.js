const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Bác sĩ là bắt buộc']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bệnh nhân là bắt buộc']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Cuộc hẹn là bắt buộc']
  },
  rating: {
    type: Number,
    required: [true, 'Đánh giá là bắt buộc'],
    min: [1, 'Đánh giá tối thiểu là 1'],
    max: [5, 'Đánh giá tối đa là 5']
  },
  comment: {
    type: String,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Chỉ cho phép một đánh giá cho mỗi cuộc hẹn
reviewSchema.index({ appointmentId: 1 }, { unique: true });

// Index để tìm kiếm nhanh theo bác sĩ
reviewSchema.index({ doctorId: 1 });

// Tính lại đánh giá trung bình của bác sĩ sau khi thêm/cập nhật đánh giá
reviewSchema.post('save', async function() {
  const Doctor = require('./Doctor');
  
  // Tính đánh giá trung bình cho bác sĩ
  const result = await this.constructor.aggregate([
    { $match: { doctorId: this.doctorId, isVisible: true } },
    { $group: {
        _id: '$doctorId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length > 0) {
    await Doctor.findByIdAndUpdate(this.doctorId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân
      totalReviews: result[0].totalReviews
    });
  } else {
    // Không có đánh giá nào, đặt về mặc định
    await Doctor.findByIdAndUpdate(this.doctorId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema); 