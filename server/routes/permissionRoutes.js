const express = require('express');
const router = express.Router();
const {
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
} = require('../controllers/permissionController');
const { protect, hasRole, hasPermission } = require('../middlewares/authMiddleware');

// Routes chỉ dành cho admin
router.use(protect);
router.use(hasRole('admin'));

// GET /api/permissions - Lấy danh sách tất cả quyền
router.get('/', getAllPermissions);

// GET /api/permissions/category/:category - Lấy danh sách quyền theo danh mục
router.get('/category/:category', getPermissionsByCategory);

// GET /api/permissions/:id - Lấy thông tin chi tiết quyền
router.get('/:id', getPermissionById);

// POST /api/permissions - Tạo quyền mới
router.post('/', hasPermission('manage_permissions'), createPermission);

// PUT /api/permissions/:id - Cập nhật quyền
router.put('/:id', hasPermission('manage_permissions'), updatePermission);

// DELETE /api/permissions/:id - Xóa quyền
router.delete('/:id', hasPermission('manage_permissions'), deletePermission);

module.exports = router; 