const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware bảo vệ route - yêu cầu đăng nhập
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Kiểm tra nếu không có token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập, vui lòng đăng nhập'
      });
    }

    try {
      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Log thông tin decoded token để gỡ lỗi

      // Xác định loại tài khoản dựa vào role trong token
      let user;
      
      if (decoded.role === 'doctor') {
        // Lấy thông tin từ DoctorAccount nếu role là doctor
        const DoctorAccount = require('../models/DoctorAccount');
        user = await DoctorAccount.findById(decoded.id).select('-passwordHash');
      } else {
        // Mặc định lấy từ User
        user = await User.findById(decoded.id).select('-passwordHash');
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }
      
      // Thêm thông tin user vào request và gán role từ token
      req.user = user;
      // Đảm bảo req.user có thuộc tính role từ token để kiểm tra quyền
      req.user.role = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Middleware kiểm tra vai trò (role) của người dùng
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập trước khi kiểm tra quyền'
      });
    }

    // Sử dụng role từ token (được thêm vào req.user ở middleware protect)
    if (!roles.includes(req.user.role)) {
      console.log('Quyền yêu cầu:', roles);
      console.log('Quyền của user:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập vào tài nguyên này'
      });
    }

    next();
  };
};

// Middleware kiểm tra quyền sở hữu tài nguyên
exports.checkOwnership = (model, paramIdField) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `Thiếu tham số ${paramIdField}`
        });
      }

      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài nguyên'
        });
      }

      // Kiểm tra xem user có phải là chủ sở hữu không
      if (resource.user && resource.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập vào tài nguyên này'
        });
      }

      // Lưu tài nguyên vào request để sử dụng ở các middleware tiếp theo
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  };
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
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has the required role
      if (roleCode === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này'
        });
      }

      // For doctor routes, allow both doctors and admins
      if (roleCode === 'doctor' && req.user.role !== 'doctor' && req.user.role !== 'admin') {
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
  if (req.user && req.user.role === 'admin') {
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
  if (req.user && (req.user.role === 'doctor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Không được phép truy cập, chỉ dành cho bác sĩ' 
    });
  }
}; 