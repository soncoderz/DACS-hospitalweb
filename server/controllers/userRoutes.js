const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// Tất cả routes bên dưới yêu cầu xác thực
router.use(authMiddleware.protect);

// Các routes cho thông tin người dùng
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);

// Upload avatar với multer middleware
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

// Route dành cho admin
router.get('/all', authMiddleware.authorize('admin'), userController.getAllUsers);

module.exports = router; 