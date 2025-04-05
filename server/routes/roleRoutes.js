const express = require('express');
const router = express.Router();
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roleController');
const { protect, hasRole, hasPermission } = require('../middlewares/authMiddleware');

// Routes chỉ dành cho admin
router.use(protect);
router.use(hasRole('admin'));

// GET /api/roles - Lấy danh sách tất cả vai trò
router.get('/', getAllRoles);

// GET /api/roles/:id - Lấy thông tin chi tiết vai trò
router.get('/:id', getRoleById);

// POST /api/roles - Tạo vai trò mới
router.post('/', hasPermission('manage_roles'), createRole);

// PUT /api/roles/:id - Cập nhật vai trò
router.put('/:id', hasPermission('manage_roles'), updateRole);

// DELETE /api/roles/:id - Xóa vai trò
router.delete('/:id', hasPermission('manage_roles'), deleteRole);

module.exports = router; 