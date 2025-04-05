const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Họ và tên là bắt buộc'],
    trim: true,
    minlength: [2, 'Họ và tên phải có ít nhất 2 ký tự'],
    maxlength: [100, 'Họ và tên không được vượt quá 100 ký tự']
  },
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
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Ngày sinh là bắt buộc'],
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Ngày sinh không hợp lệ'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Giới tính là bắt buộc']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  roleType: {
    type: String,
    enum: ['admin', 'doctor', 'user'],
    default: 'user'
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
    type: String,  // Store base64 encoded image data
    trim: true
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
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
  }
}, {
  timestamps: true
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Middleware hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
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
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  return resetToken;
};

// Phương thức tạo token xác thực email
userSchema.methods.generateVerificationToken = function() {
  // Vô hiệu hóa token cũ bằng cách tạo token mới
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  // Đặt thời gian hết hạn là 5 phút thay vì 24 giờ
  this.verificationTokenExpires = Date.now() + 5 * 60 * 1000; // 5 phút
  return verificationToken;
};

// Phương thức tạo mã OTP 6 chữ số
userSchema.methods.generateOTP = function() {
  // Tạo OTP ngẫu nhiên 6 chữ số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Lưu OTP và thời gian hết hạn (2 phút)
  this.otpCode = otp;
  this.otpExpires = Date.now() + 2 * 60 * 1000; // 2 phút
  
  return otp;
};

// Indexes for efficient querying (excluding email as it's already indexed by unique: true)
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ verificationToken: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 