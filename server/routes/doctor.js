const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET /api/doctors?specialty=... - Lọc bác sĩ theo chuyên khoa (public)
router.get('/', doctorController.getDoctors);

// GET /api/doctors/:id - Chi tiết bác sĩ (public)
router.get('/:id', doctorController.getDoctorById);

// GET /api/doctors/:id/schedule - Lịch làm việc của bác sĩ (public)
router.get('/:id/schedule', doctorController.getDoctorSchedule);

// GET /api/doctors/:id/reviews - Đánh giá của bác sĩ (public)
router.get('/:id/reviews', doctorController.getDoctorReviews);

// Routes bên dưới yêu cầu xác thực
router.use(protect);

// POST /api/doctors/:id/favorite - Thêm bác sĩ vào danh sách yêu thích
router.post('/:id/favorite', doctorController.addToFavorites);

// DELETE /api/doctors/:id/favorite - Xóa bác sĩ khỏi danh sách yêu thích
router.delete('/:id/favorite', doctorController.removeFromFavorites);

// GET /api/doctors/favorites - Danh sách bác sĩ yêu thích của người dùng
router.get('/favorites', doctorController.getFavorites);

// Routes dành cho admin
// POST /api/doctors - Thêm bác sĩ mới
router.post('/', authorize('admin'), doctorController.createDoctor);

// PUT /api/doctors/:id - Cập nhật thông tin bác sĩ
router.put('/:id', authorize('admin'), doctorController.updateDoctor);

// DELETE /api/doctors/:id - Xóa bác sĩ
router.delete('/:id', authorize('admin'), doctorController.deleteDoctor);

module.exports = router; 