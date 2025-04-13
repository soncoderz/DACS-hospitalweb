const express = require('express');
const router = express.Router();
const { loginDoctor, registerDoctor, getCurrentDoctor, verifyDoctorEmail } = require('../controllers/doctorAuthController');
const { protect } = require('../middlewares/authMiddleware');

// Đăng ký tài khoản bác sĩ
router.post('/register', registerDoctor);

// Đăng nhập bác sĩ
router.post('/login', loginDoctor);

// Lấy thông tin bác sĩ hiện tại
router.get('/me', protect, getCurrentDoctor);

// Xác thực email bác sĩ
router.post('/verify-email', verifyDoctorEmail);

module.exports = router; 