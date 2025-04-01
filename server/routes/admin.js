const express = require('express');
const router = express.Router();
const { createAdmin, login, getCurrentAdmin, getAllAdmins, updateAdminStatus } = require('../controllers/adminController');
const { protectAdmin, superAdmin, hasPermission } = require('../middlewares/adminMiddleware');
const { 
  getDashboardStats, 
  getUserStats, 
  getAppointmentStats, 
  getRevenueStats 
} = require('../controllers/statsController');
const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');

// Public routes
router.post('/login', login);

// First admin creation (only accessible when no admin exists)
router.post('/setup', async (req, res) => {
  try {
    // Kiểm tra xem đã có admin nào chưa
    const adminCount = await Admin.countDocuments({});
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Hệ thống đã có tài khoản admin. Không thể tạo admin ban đầu nữa.'
      });
    }

    // Validate body
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: name, email, password'
      });
    }

    // Tạo admin đầu tiên (luôn là super_admin)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const admin = new Admin({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: 'super_admin',
      permissions: [
        'manage_users',
        'manage_doctors',
        'manage_hospitals',
        'manage_appointments',
        'manage_services',
        'manage_promotions',
        'manage_admins'
      ],
      isActive: true
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Tài khoản Super Admin ban đầu đã được tạo thành công',
      data: {
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error in setup admin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tài khoản admin ban đầu'
    });
  }
});

// Protected routes
router.get('/me', protectAdmin, getCurrentAdmin);

// Super admin only routes
router.get('/admins', protectAdmin, superAdmin, getAllAdmins);
router.post('/create', protectAdmin, superAdmin, createAdmin);
router.patch('/admins/:id/status', protectAdmin, superAdmin, updateAdminStatus);

// Stats routes
router.get('/stats', protectAdmin, getDashboardStats);
router.get('/stats/users', protectAdmin, getUserStats);
router.get('/stats/appointments', protectAdmin, getAppointmentStats);
router.get('/stats/revenue', protectAdmin, getRevenueStats);

module.exports = router; 