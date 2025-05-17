const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề tin tức là bắt buộc'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Nội dung tin tức là bắt buộc']
  },
  summary: {
    type: String,
    required: [true, 'Tóm tắt tin tức là bắt buộc'],
    trim: true
  },
  image: {
    url: String,
    secureUrl: String,
    publicId: String,
    cloudName: String
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    enum: ['general', 'medical', 'hospital', 'doctor', 'service'],
    default: 'general'
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Tạo index cho tìm kiếm
newsSchema.index({ title: 'text', content: 'text', summary: 'text', tags: 'text' });

const News = mongoose.model('News', newsSchema);

module.exports = News; 