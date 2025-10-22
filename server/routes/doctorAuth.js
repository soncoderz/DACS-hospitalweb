const express = require('express');
const router = express.Router();
const { loginDoctor, registerDoctor, verifyDoctorEmail } = require('../controllers/doctorAuthController');
const { protect } = require('../middlewares/authMiddleware');

// Đăng ký tài khoản bác sĩ
router.post('/register', registerDoctor);

// Đăng nhập bác sĩ - Được giữ lại để đảm bảo tương thích ngược
// Khuyến khích sử dụng API thống nhất POST /api/auth/login với param role='doctor'
router.post('/login', (req, res, next) => {
  console.log('DEPRECATED: Using legacy doctor login endpoint. Please use /api/auth/login with role="doctor" parameter instead.');
  loginDoctor(req, res, next);
});


// Xác thực email bác sĩ
router.post('/verify-email', verifyDoctorEmail);

module.exports = router; 