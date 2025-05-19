const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const passport = require('passport');
const { 
  register, 
  login, 
  getCurrentUser, 
  updateProfile, 
  uploadAvatar,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  socialLoginSuccess,
  socialLoginFailure,
  googleTokenVerification,
  facebookTokenVerification,
  refreshToken
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validateUserRegistration, validateUserUpdate, validatePasswordChange } = require('../middlewares/validationMiddleware');
const { uploadToMemory } = require('../middlewares/uploadMiddleware');
const doctorController = require('../controllers/doctorController');
// GET /api/doctors/:id - Chi tiết bác sĩ (public)
//router.get('/doctors/:id', doctorController.getDoctorById);

// ===== Authentication Routes ===== (PUBLIC ROUTES)
// POST /api/auth/register - Register a new user
router.post('/register', validateUserRegistration, register);

// POST /api/auth/login - Login with email/password
router.post('/login', login);

// ===== Protected User Profile Routes ===== (PROTECTED ROUTES - USER ACCESS)
// GET /api/auth/profile - Get current user profile
router.get('/profile', protect, userController.getUserProfile);

// PUT /api/auth/profile - Update user profile
router.put('/profile', protect, userController.updateUserProfile);

// PUT /api/auth/profile/password - Change password
router.put('/profile/password', protect, validatePasswordChange, changePassword);

// POST /api/auth/profile/avatar - Upload user avatar
router.post('/profile/avatar', protect, uploadToMemory.single('avatar'), userController.uploadAvatar);

// GET /api/auth/:id/avatar - Get user avatar
router.get('/:id/avatar', protect, userController.getUserAvatar);

// POST /api/auth/refresh-token - Refresh authentication token
router.post('/refresh-token', protect, refreshToken);

// ===== Password Reset Routes ===== (PUBLIC ROUTES)
// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-otp - Verify OTP for password reset
router.post('/verify-otp', verifyOtp);

// POST /api/auth/reset-password - Reset password with valid OTP
router.post('/reset-password', resetPassword);

// ===== Email Verification Routes ===== (PUBLIC ROUTES)
// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', verifyEmail);

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', resendVerification);

// ===== Social Login Routes ===== (PUBLIC ROUTES)
// Social login callback routes
router.get('/google/success', socialLoginSuccess);
router.get('/google/failure', socialLoginFailure);
router.post('/google/token', googleTokenVerification);

router.get('/facebook/success', socialLoginSuccess);
router.get('/facebook/failure', socialLoginFailure);
router.post('/facebook/token', facebookTokenVerification);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false
  }),
  socialLoginSuccess
);

// Handle root callback from Google
router.get('/handle-root-callback', (req, res) => {
  const code = req.query.code;
  const scope = req.query.scope || '';
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Missing authentication code'
    });
  }
  
  console.log('Handling root callback with code and scope:', { code, scope });
  
  // Check scope to determine authentication type
  if (scope.includes('facebook')) {
    // Redirect to Facebook callback handler
    return res.redirect(`/api/auth/facebook/callback?code=${code}&scope=${scope}`);
  } else {
    // Default is Google (or scope contains google or is undefined)
    return res.redirect(`/api/auth/google/callback?code=${code}&scope=${scope}`);
  }
});

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile']
}));

router.get('/facebook/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: '/api/auth/facebook/failure',
    session: false
  }),
  socialLoginSuccess
);

// Additional Facebook callback route for root path
router.get('/facebook-root-callback', 
  passport.authenticate('facebook', { 
    failureRedirect: '/api/auth/facebook/failure',
    session: false
  }),
  socialLoginSuccess
);
router.post('/set-social-password', protect, authController.setSocialPassword);
// ===== Admin User Management Routes ===== (ADMIN ONLY ROUTES)
// GET /api/auth - Get all users
router.get('/', protect, authorize('admin'), userController.getAllUsers);

// GET /api/auth/:id - Get user by ID
router.get('/:id', protect, userController.getUserById);

// PUT /api/auth/:id/status - Lock/unlock user account
router.put('/:id/status', protect, authorize('admin'), userController.updateUserStatus);

// DELETE /api/auth/:id - Delete user
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router; 