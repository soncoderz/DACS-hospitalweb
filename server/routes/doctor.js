const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize, doctor } = require('../middlewares/authMiddleware');
const { uploadToMemory } = require('../middlewares/uploadMiddleware');

// === PUBLIC ROUTES ===

// GET /api/doctors?specialty=... - Lọc bác sĩ theo chuyên khoa (public)
router.get('/', doctorController.getDoctors);

// GET /api/doctors/:id - Chi tiết bác sĩ (public)
router.get('/doctors/:id', doctorController.getDoctorById);

// === AUTHENTICATED ROUTES ===
router.use(protect);

// === ROUTES DÀNH CHO NGƯỜI DÙNG ===

// GET /api/doctors/favorites - Danh sách bác sĩ yêu thích của người dùng
router.get('/favorites', doctorController.getFavorites);

// === ROUTES DÀNH CHO BÁC SĨ ===

// GET /api/doctors/profile - Lấy thông tin hồ sơ bác sĩ đăng nhập
router.get('/profile', doctor, doctorController.getDoctorProfile);

// PUT /api/doctors/profile - Cập nhật thông tin hồ sơ bác sĩ
router.put('/profile', doctor, doctorController.updateDoctorProfile);

// POST /api/doctors/avatar - Tải lên ảnh đại diện bác sĩ
router.post('/avatar', doctor, uploadToMemory.single('avatar'), doctorController.uploadDoctorAvatar);

// GET /api/doctors/dashboard/stats - Lấy thống kê cho dashboard bác sĩ
router.get('/dashboard/stats', doctor, doctorController.getDoctorDashboardStats);

// GET /api/doctors/reviews - Lấy đánh giá về bác sĩ đăng nhập
router.get('/reviews', doctor, doctorController.getDoctorReviews);

// POST /api/doctors/reviews/:reviewId/reply - Phản hồi đánh giá
router.post('/reviews/:reviewId/reply', doctor, doctorController.replyToReview);

// GET /api/doctors/patients - Lấy danh sách bệnh nhân đã khám
router.get('/patients', doctor, doctorController.getDoctorPatients);

// === DYNAMIC ID ROUTES (these must be after all specific routes) ===

// GET /api/doctors/:id/schedule - Lịch làm việc của bác sĩ (public)
router.get('/:id/schedule', doctorController.getDoctorSchedule);

// GET /api/doctors/:id/services - Dịch vụ của bác sĩ (public)
router.get('/:id/services', doctorController.getDoctorServices);

// GET /api/doctors/:id/favorite - Kiểm tra bác sĩ có trong danh sách yêu thích không
router.get('/:id/favorite', doctorController.checkFavorite);

// POST /api/doctors/:id/favorite - Thêm bác sĩ vào danh sách yêu thích
router.post('/:id/favorite', doctorController.addToFavorites);

// DELETE /api/doctors/:id/favorite - Xóa bác sĩ khỏi danh sách yêu thích
router.delete('/:id/favorite', doctorController.removeFromFavorites);

module.exports = router; 