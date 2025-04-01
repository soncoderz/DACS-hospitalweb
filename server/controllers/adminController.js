const Admin = require('../models/Admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (adminId) => {
  return jwt.sign({ id: adminId, isAdmin: true }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Create a new admin
exports.createAdmin = async (req, res) => {
  try {
    const { 
      email, 
      phoneNumber, 
      password, 
      fullName, 
      role = 'admin',
      permissions = [],
      hospitalId
    } = req.body;

    // Check if admin already exists with same email
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng bởi tài khoản quản trị khác'
      });
    }

    // Check if regular user exists with the same email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng bởi tài khoản người dùng thông thường'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      email,
      phoneNumber,
      passwordHash: password, // Model sẽ tự hash password
      fullName,
      role,
      permissions: permissions.length > 0 ? permissions : undefined,
      hospitalId: hospitalId || null,
      createdBy: req.admin ? req.admin._id : null
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role
      },
      message: 'Tạo tài khoản quản trị viên thành công'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        message: 'Thông tin không hợp lệ'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo tài khoản quản trị viên',
      error: error.message
    });
  }
};

// Admin login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu'
      });
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }
    
    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản quản trị đã bị vô hiệu hóa'
      });
    }
    
    // Check password
    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    // Generate token
    const token = generateToken(admin._id);
    
    return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      message: 'Đăng nhập không thành công',
      error: error.message
    });
  }
};

// Get current admin profile
exports.getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-passwordHash');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin quản trị viên'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin quản trị viên',
      error: error.message
    });
  }
};

// Get all admins (for super_admin only)
exports.getAllAdmins = async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }
    
    const admins = await Admin.find().select('-passwordHash');
    
    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách quản trị viên',
      error: error.message
    });
  }
};

// Update admin status (activate/deactivate)
exports.updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }
    
    if (id === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể thay đổi trạng thái của chính mình'
      });
    }
    
    const admin = await Admin.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quản trị viên'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        isActive: admin.isActive
      },
      message: `Quản trị viên đã ${isActive ? 'được kích hoạt' : 'bị vô hiệu hóa'}`
    });
  } catch (error) {
    console.error('Update admin status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái quản trị viên',
      error: error.message
    });
  }
}; 