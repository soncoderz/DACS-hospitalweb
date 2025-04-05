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
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo tên chuyên khoa
specialtySchema.index({ name: 'text', description: 'text' });

const Specialty = mongoose.model('Specialty', specialtySchema);

module.exports = Specialty; 