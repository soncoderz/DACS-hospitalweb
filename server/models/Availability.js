const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Bác sĩ là bắt buộc']
  },
  date: {
    type: Date,
    required: [true, 'Ngày là bắt buộc']
  },
  timeSlots: {
    type: [String],
    required: [true, 'Các khung giờ là bắt buộc'],
    validate: {
      validator: function(slots) {
        return slots.length > 0;
      },
      message: 'Phải có ít nhất một khung giờ khả dụng'
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: {
    type: [Number], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    default: []
  },
  recurringEndDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh theo bác sĩ và ngày
availabilitySchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Availability', availabilitySchema); 