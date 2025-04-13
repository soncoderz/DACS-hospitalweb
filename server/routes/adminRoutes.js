const express = require('express');
const router = express.Router();
const { 
  login, 
  getCurrentAdmin, 
  createAdmin,
  seedFirstAdmin
} = require('../controllers/adminController');
const { protectAdmin, checkPermission } = require('../middlewares/adminMiddleware');

// Public routes
router.post('/login', login);
router.post('/seed-first-admin', seedFirstAdmin); // Chỉ dùng lần đầu

// Protected routes
router.get('/me', protectAdmin, getCurrentAdmin);
router.post('/create', protectAdmin, checkPermission('manage_admins'), createAdmin);

module.exports = router; 