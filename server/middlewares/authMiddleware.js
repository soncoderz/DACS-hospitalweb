const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - middleware to check if user is authenticated
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token - JWT_SECRET được đảm bảo tồn tại vì đã kiểm tra trong server.js
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'Không tìm thấy người dùng với token này' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Không được phép truy cập, token không hợp lệ' });
    }
  } else if (!token) {
    return res.status(401).json({ message: 'Không được phép truy cập, không có token' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép truy cập, chỉ dành cho quản trị viên' });
  }
};

// Doctor middleware
exports.doctor = (req, res, next) => {
  if (req.user && (req.user.role === 'doctor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép truy cập, chỉ dành cho bác sĩ' });
  }
}; 