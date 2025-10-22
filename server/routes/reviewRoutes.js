const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const adminReviewController = require('../controllers/adminReviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Validation middlewares
const reviewValidationRules = [
  check('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Đánh giá phải có giá trị từ 1 đến 5'),
  check('content')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Nội dung đánh giá phải có từ 3 đến 500 ký tự')
];

const replyValidationRules = [
  check('comment')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Nội dung trả lời phải có từ 3 đến 500 ký tự')
];

// ===== PUBLIC ROUTES - Không yêu cầu đăng nhập =====

// GET /api/reviews - Lấy danh sách đánh giá (có thể lọc theo doctorId hoặc hospitalId)
router.get('/', reviewController.getReviews);
router.get('/all', reviewController.getAllReviews);


// GET /api/reviews/doctor/:id - Lấy đánh giá của một bác sĩ cụ thể
router.get('/doctor/:id', reviewController.getDoctorReviews);

// GET /api/reviews/hospital/:id - Lấy đánh giá của một bệnh viện cụ thể
router.get('/hospital/:id', reviewController.getHospitalReviews);

// GET /api/reviews/:id - Xem chi tiết một đánh giá
router.get('/:id', reviewController.getReviewById);

// ===== PROTECTED ROUTES - Yêu cầu đăng nhập =====
router.use(protect);

// USER ROUTES
// GET /api/reviews/user/me - Xem đánh giá của user hiện tại
router.get('/user/me', reviewController.getUserReviews);

// POST /api/reviews/hospital - Tạo đánh giá cho bệnh viện
router.post('/hospital', authorize('user'), reviewValidationRules, reviewController.createHospitalReview);

// POST /api/reviews - Tạo đánh giá cho bác sĩ
router.post('/doctor', authorize('user'), reviewValidationRules, reviewController.createDoctorReview);

// COMMON ROUTES
// POST /api/reviews/:id/reply - Trả lời đánh giá (cho user, doctor, admin)
router.post('/:id/reply', replyValidationRules, reviewController.replyToReview);

// ADMIN ROUTES
// GET /api/reviews/admin/all - Admin xem tất cả đánh giá trong hệ thống
router.get('/admin/all', authorize('admin'), adminReviewController.getAllReviews);

// GET /api/reviews/admin/stats - Admin xem thống kê đánh giá
router.get('/admin/stats', authorize('admin'), adminReviewController.getReviewStats);

// DELETE /api/reviews/:id - Admin xóa đánh giá
router.delete('/:id', authorize('admin'), reviewController.deleteReview);

// DELETE /api/reviews/:id/replies/:replyId - Admin xóa trả lời đánh giá
router.delete('/:id/replies/:replyId', authorize('admin'), reviewController.deleteReplyFromReview);

module.exports = router; 