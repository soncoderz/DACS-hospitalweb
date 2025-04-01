const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile, uploadAvatar, forgotPassword, verifyOtp, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user profile
router.get('/me', protect, getCurrentUser);

// Update user profile
router.put('/profile', protect, updateProfile);

// Upload avatar
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

// Forgot password - request OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset password after OTP verification
router.post('/reset-password', resetPassword);

// Verify email address
router.get('/verify-email/:token', verifyEmail);

// Resend verification email
router.post('/resend-verification', resendVerification);

module.exports = router; 