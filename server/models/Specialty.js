const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên chuyên khoa là bắt buộc'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  image: {
    url: String,
    secureUrl: String,
    publicId: String,
    cloudName: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Specialty = mongoose.model('Specialty', specialtySchema);

module.exports = Specialty; 