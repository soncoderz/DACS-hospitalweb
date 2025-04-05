const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên dịch vụ là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'Chuyên khoa là bắt buộc']
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Bệnh viện là bắt buộc']
  },
  price: {
    type: Number,
    required: [true, 'Giá dịch vụ là bắt buộc'],
    min: 0
  },
  duration: {
    type: Number,
    required: [true, 'Thời gian thực hiện là bắt buộc'],
    min: 1,
    max: 480 // Tối đa 8 tiếng
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo tên dịch vụ và chuyên khoa
serviceSchema.index({ name: 'text', description: 'text' });

// Index để tìm kiếm theo bệnh viện và chuyên khoa
serviceSchema.index({ hospitalId: 1, specialtyId: 1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 