const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const doctorAccountSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  passwordHash: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String,
    trim: true
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  title: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  certifications: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  verificationMethod: {
    type: String,
    enum: ['phone', 'email'],
    default: 'email'
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  avatarData: {
    type: String,
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  otpCode: String,
  otpExpires: Date,
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  }
}, {
  timestamps: true
});

// Phương thức so sánh mật khẩu
doctorAccountSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Middleware hash mật khẩu trước khi lưu
doctorAccountSchema.pre('save', async function(next) {
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

// Phương thức tạo token đặt lại mật khẩu
doctorAccountSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  return resetToken;
};

// Phương thức tạo token xác thực email
doctorAccountSchema.methods.generateVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token trước khi lưu vào database
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.verificationToken = hashedToken;
  
  // Đặt thời gian hết hạn là 5 phút
  this.verificationTokenExpires = Date.now() + 5 * 60 * 1000; // 5 phút
  
  // Trả về token gốc (chưa hash) để gửi qua email
  return verificationToken;
};

// Phương thức tạo mã OTP 6 chữ số
doctorAccountSchema.methods.generateOTP = function() {
  // Tạo OTP ngẫu nhiên 6 chữ số
  const otpNumber = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Tạo JWT token chứa OTP
  const otpToken = jwt.sign(
    { otp: otpNumber, userId: this._id.toString() },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '2m' } // 2 phút
  );
  
  // Lưu JWT token và thời gian hết hạn
  this.otpCode = otpToken;
  this.otpExpires = Date.now() + 2 * 60 * 1000; // 2 phút
  
  return otpNumber; // Vẫn trả về OTP số để gửi qua email
};

// Indexes for efficient querying
doctorAccountSchema.index({ email: 1 });
doctorAccountSchema.index({ phoneNumber: 1 });
doctorAccountSchema.index({ specialtyId: 1 });
doctorAccountSchema.index({ hospitalId: 1 });

const DoctorAccount = mongoose.model('DoctorAccount', doctorAccountSchema);

module.exports = DoctorAccount; 