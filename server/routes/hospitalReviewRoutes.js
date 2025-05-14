const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const hospitalReviewController = require('../controllers/hospitalReviewController');
const { check } = require('express-validator');

// Validation rules
const reviewValidation = [
  check('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Đánh giá phải có giá trị từ 1 đến 5'),
  check('comment')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Nhận xét phải có từ 3 đến 500 ký tự')
];

const replyValidation = [
  check('comment')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Trả lời phải có từ 3 đến 500 ký tự')
];

// Public routes
router.get('/hospitals/:id/reviews', hospitalReviewController.getHospitalReviews);

// Protected routes - require user authentication
router.post(
  '/hospitals/:id/reviews', 
  protect, 
  authorize('user'), 
  reviewValidation,
  hospitalReviewController.createHospitalReview
);

// Reply to a review - admin only
router.post(
  '/hospitals/reviews/:id/reply',
  protect,
  authorize('admin'),
  replyValidation,
  hospitalReviewController.replyToReview
);

// Admin routes


router.delete(
  '/admin/hospitals/reviews/:id',
  protect,
  authorize('admin'),
  hospitalReviewController.deleteReview
);



module.exports = router; 