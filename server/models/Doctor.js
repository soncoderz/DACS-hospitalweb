const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workingHoursSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  shifts: [{
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    }
  }]
});

const onlineConsultationHoursSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  times: [{
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
    }
  }]
});

const doctorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  passwordHash: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc']
  },
  fullName: {
    type: String,
    required: [true, 'Họ và tên là bắt buộc'],
    trim: true
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'Chuyên khoa là bắt buộc']
  },
  specialtyName: {
    type: String,
    required: [true, 'Tên chuyên khoa là bắt buộc'],
    trim: true
  },
  hospitalIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  }],
  experience: {
    type: Number,
    required: [true, 'Số năm kinh nghiệm là bắt buộc'],
    min: 0
  },
  biography: {
    type: String,
    trim: true
  },
  education: [{
    type: String,
    trim: true
  }],
  avatarUrl: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  consultationFee: {
    type: Number,
    required: [true, 'Phí tư vấn là bắt buộc'],
    min: 0
  },
  workingHours: [workingHoursSchema],
  onlineConsultationHours: [onlineConsultationHoursSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Phương thức so sánh mật khẩu
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Middleware hash mật khẩu trước khi lưu
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức tính toán đánh giá trung bình
doctorSchema.methods.calculateAverageRating = function(newRating) {
  this.totalRatings += 1;
  this.averageRating = ((this.averageRating * (this.totalRatings - 1)) + newRating) / this.totalRatings;
  return this.averageRating;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 