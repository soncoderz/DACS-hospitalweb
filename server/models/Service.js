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
  shortDescription: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Giá dịch vụ là bắt buộc'],
    min: 0
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'Chuyên khoa là bắt buộc']
  },
  duration: {
    type: Number,
    default: 30, // Thời gian mặc định: 30 phút
    min: 10
  },
  type: {
    type: String,
    enum: ['examination', 'diagnostic', 'treatment', 'procedure', 'surgery', 'consultation'],
    default: 'examination'
  },
  preparationGuide: {
    type: String,
    trim: true
  },
  aftercareInstructions: {
    type: String,
    trim: true
  },
  requiredTests: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    url: String,
    secureUrl: String,
    publicId: String,
    cloudName: String
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
serviceSchema.index({ name: 1 });
serviceSchema.index({ specialtyId: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ type: 1 });

module.exports = mongoose.model('Service', serviceSchema); 