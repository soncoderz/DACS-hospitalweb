const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile, uploadAvatar, forgotPassword, verifyOtp, resetPassword, verifyEmail, resendVerification, changePassword, socialLoginSuccess, socialLoginFailure, googleTokenVerification, facebookTokenVerification, setSocialPassword, refreshToken } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { upload, uploadToMemory, uploadAvatar: uploadAvatarMiddleware } = require('../middlewares/uploadMiddleware');
const { validateUserRegistration, validateUserUpdate, validatePasswordChange, validateEmail } = require('../middlewares/validationMiddleware');
const passport = require('../config/passport');
const axios = require('axios');

// Register user
router.post('/register', validateUserRegistration, register);

// Login user
router.post('/login', login);

// Get current user
router.get('/me', protect, getCurrentUser);

// Refresh token
router.get('/refresh-token', protect, refreshToken);

// Test token route
router.get('/test-token', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Token hợp lệ',
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        roleType: req.user.roleType,
        role: req.user.role,
      },
      token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : null
    }
  });
});

// Update profile
router.put('/profile', protect, validateUserUpdate, updateProfile);

// Upload avatar
router.post('/avatar', protect, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

// Change password
router.put('/change-password', protect, validatePasswordChange, changePassword);

// Forgot password - request OTP
router.post('/forgot-password', validateEmail, forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset password after OTP verification
router.post('/reset-password', resetPassword);

// Verify email address
router.post('/verify-email', verifyEmail);

// Resend verification email
router.post('/resend-verification', validateEmail, resendVerification);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/social-login-failure',
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
      message: 'Không có mã xác thực'
    });
  }
  
  console.log('Handling root callback with code and scope:', { code, scope });
  
  // Kiểm tra scope để xác định loại xác thực
  if (scope.includes('facebook')) {
    // Chuyển hướng đến Facebook callback handler
    return res.redirect(`/api/auth/facebook/callback?code=${code}&scope=${scope}`);
  } else {
    // Mặc định là Google (hoặc scope chứa google hoặc không xác định)
    return res.redirect(`/api/auth/google/callback?code=${code}&scope=${scope}`);
  }
});

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile']
}));

router.get('/facebook/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: '/api/auth/social-login-failure',
    session: false
  }),
  socialLoginSuccess
);

// Bổ sung route Facebook callback ở root path
router.get('/facebook-root-callback', 
  passport.authenticate('facebook', { 
    failureRedirect: '/api/auth/social-login-failure',
    session: false
  }),
  socialLoginSuccess
);

// Social login failure route
router.get('/social-login-failure', socialLoginFailure);

// Frontend token verification routes
router.post('/google-token', googleTokenVerification);
router.post('/facebook-token', facebookTokenVerification);

// Facebook code exchange
router.post('/facebook-code', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    
    if (!code || !redirectUri) {
      return res.status(400).json({
        success: false,
        message: 'Missing code or redirectUri'
      });
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code: code
      }
    });
    
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      return res.status(400).json({
        success: false,
        message: 'Failed to exchange code for token'
      });
    }
    
    const accessToken = tokenResponse.data.access_token;
    
    // Get user profile with the access token
    const profileResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken
      }
    });
    
    const userData = profileResponse.data;
    
    if (!userData.email) {
      return res.status(400).json({
        success: false,
        message: 'Không thể lấy email từ tài khoản Facebook. Vui lòng cấp quyền truy cập email cho ứng dụng.'
      });
    }
    
    // Find or create user
    const User = require('../models/User');
    let user = await User.findOne({ facebookId: userData.id });
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email: userData.email });
      
      if (user) {
        // Link Facebook account to existing user
        user.facebookId = userData.id;
        user.authProvider = 'facebook';
        user.isVerified = true;
        if (!user.avatarUrl && userData.picture && userData.picture.data && userData.picture.data.url) {
          user.avatarUrl = userData.picture.data.url;
        }
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          facebookId: userData.id,
          email: userData.email,
          fullName: userData.name || 'Facebook User',
          authProvider: 'facebook',
          isVerified: true,
          roleType: 'user',
          phoneNumber: '0000000000', // Placeholder
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other', // Placeholder
          avatarUrl: userData.picture && userData.picture.data ? userData.picture.data.url : null
        });
      }
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const jwtToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );
    
    // Return user data with token
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        roleType: user.roleType,
        avatarUrl: user.avatarUrl,
        avatarData: user.avatarData,
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('Facebook code exchange error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý code Facebook',
      error: error.message
    });
  }
});

// Set password for social login users
router.post('/set-social-password', protect, setSocialPassword);

module.exports = router; 