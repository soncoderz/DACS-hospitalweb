const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
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
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  permissions: {
    type: [String],
    enum: [
      'manage_users',
      'manage_doctors',
      'manage_hospitals',
      'manage_appointments',
      'manage_services',
      'manage_promotions',
      'view_reports',
      'manage_admins',
      'system_settings'
    ],
    default: ['manage_users', 'manage_appointments', 'view_reports']
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  avatarUrl: {
    type: String,
    trim: true,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo email
adminSchema.index({ email: 1 });

// Index để tìm kiếm theo hospital
adminSchema.index({ hospitalId: 1 });

// Middleware hash mật khẩu trước khi lưu
adminSchema.pre('save', async function(next) {
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

// Phương thức so sánh mật khẩu
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Phương thức cập nhật thời gian đăng nhập cuối
adminSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Phương thức kiểm tra quyền
adminSchema.methods.hasPermission = function(permission) {
  // Super admin có tất cả quyền
  if (this.role === 'super_admin') {
    return true;
  }
  
  return this.permissions.includes(permission);
};

// Phương thức kiểm tra quyền quản lý bệnh viện
adminSchema.methods.canManageHospital = function(hospitalId) {
  // Super admin có thể quản lý tất cả bệnh viện
  if (this.role === 'super_admin') {
    return true;
  }
  
  // Admin chỉ quản lý bệnh viện được gán
  if (!this.hospitalId) {
    return false;
  }
  
  return this.hospitalId.toString() === hospitalId.toString();
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin; 