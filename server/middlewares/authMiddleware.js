const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc người dùng không tồn tại'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản chưa được xác thực'
      });
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Check user role
exports.hasRole = (roleCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Bạn cần đăng nhập để truy cập'
        });
      }

      // Admin can access all resources
      if (req.user.roleType === 'admin') {
        return next();
      }

      // Check if user has the required role
      if (roleCode === 'admin' && req.user.roleType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này'
        });
      }

      // For doctor routes, allow both doctors and admins
      if (roleCode === 'doctor' && req.user.roleType !== 'doctor' && req.user.roleType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này'
        });
      }

      // Regular user routes are accessible by all authenticated users
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  };
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.roleType === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Không được phép truy cập, chỉ dành cho quản trị viên' 
    });
  }
};

// Doctor middleware
exports.doctor = (req, res, next) => {
  if (req.user && (req.user.roleType === 'doctor' || req.user.roleType === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Không được phép truy cập, chỉ dành cho bác sĩ' 
    });
  }
}; 