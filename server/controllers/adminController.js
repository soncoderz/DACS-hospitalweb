const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Admin login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu'
      });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Check if password is correct
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
        hospitalId: admin.hospitalId,
        avatarUrl: admin.avatarUrl,
        token
      },
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Get current admin
exports.getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin'
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
      message: 'Lấy thông tin admin thành công'
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Create a new admin (super_admin only)
exports.createAdmin = async (req, res) => {
  try {
    const { email, phoneNumber, password, fullName, role, permissions, hospitalId } = req.body;

    // Check if current admin is super_admin
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo admin mới'
      });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      email,
      phoneNumber,
      passwordHash: password,
      fullName,
      role: role || 'admin',
      permissions: permissions || undefined,
      hospitalId: hospitalId || null,
      createdBy: req.admin.id
    });

    res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions
      },
      message: 'Tạo admin mới thành công'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Seed First Admin - Chỉ chạy khi cần tạo admin đầu tiên
exports.seedFirstAdmin = async (req, res) => {
  try {
    // Kiểm tra xem đã có admin nào chưa
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin đã tồn tại trong hệ thống'
      });
    }

    // Tạo admin đầu tiên với quyền super_admin
    const adminPassword = 'admin123456';
    const admin = new Admin({
      email: 'admin@hospital.com',
      phoneNumber: '0123456789',
      passwordHash: adminPassword, // Model sẽ tự hash password khi lưu
      fullName: 'Super Admin',
      role: 'super_admin',
      permissions: [
        'manage_users',
        'manage_doctors',
        'manage_hospitals',
        'manage_appointments',
        'manage_services',
        'manage_promotions',
        'view_reports',
        'manage_admins',
        'system_settings'
      ]
    });
    
    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Tạo admin đầu tiên thành công',
      data: {
        email: admin.email,
        password: adminPassword // Chỉ hiển thị khi seed
      }
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
}; 