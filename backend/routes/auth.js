const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user profile
router.get('/me', protect, getCurrentUser);

module.exports = router; 