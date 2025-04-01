const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect admin routes - middleware to check if the requester is an admin
exports.protectAdmin = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an admin token
      if (!decoded.isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: 'Bạn không có quyền truy cập trang quản trị' 
        });
      }

      // Get admin from token
      const admin = await Admin.findById(decoded.id).select('-passwordHash');

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy quản trị viên với token này'
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản quản trị viên đã bị vô hiệu hóa'
        });
      }

      // Attach admin to request
      req.admin = admin;
      next();
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Không được phép truy cập, token không hợp lệ'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Không được phép truy cập, không có token'
    });
  }
};

// Check for super admin role
exports.superAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không được phép truy cập, chỉ dành cho Super Admin'
    });
  }
};

// Check specific permissions
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập với tư cách quản trị viên'
      });
    }

    // Super admins have all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has the specific permission
    if (req.admin.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này'
    });
  };
};

// Check hospital access permission
exports.canManageHospital = (hospitalIdParam) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập với tư cách quản trị viên'
      });
    }

    // Super admins can manage all hospitals
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Get hospitalId from request params or body
    const hospitalId = req.params[hospitalIdParam] || req.body[hospitalIdParam];

    // If no hospital specified in the request, allow access if admin has a hospital assigned
    if (!hospitalId) {
      if (!req.admin.hospitalId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không được phân công quản lý bệnh viện nào'
        });
      }
      return next();
    }

    // Check if admin is assigned to the specified hospital
    if (req.admin.hospitalId && req.admin.hospitalId.toString() === hospitalId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền quản lý bệnh viện này'
    });
  };
}; 