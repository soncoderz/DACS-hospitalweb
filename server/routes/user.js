const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// GET /api/user/profile - Lấy thông tin cá nhân
router.get('/profile', protect, userController.getUserProfile);

// PUT /api/user/profile - Cập nhật thông tin cá nhân
router.put('/profile', protect, userController.updateUserProfile);

// POST /api/user/avatar - Upload ảnh đại diện
router.post('/avatar', protect, upload.single('avatar'), userController.uploadAvatar);

// GET /api/users - Lấy danh sách người dùng (chỉ admin)
router.get('/', protect, authorize('admin'), userController.getAllUsers);

// GET /api/users/:id - Chi tiết người dùng (chỉ admin hoặc chính chủ)
router.get('/:id', protect, userController.getUserById);

// PUT /api/users/:id/status - Khóa/mở khóa tài khoản (chỉ admin)
router.put('/:id/status', protect, authorize('admin'), userController.updateUserStatus);

// DELETE /api/users/:id - Xóa người dùng (chỉ admin)
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router; 