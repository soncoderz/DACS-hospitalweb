const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const hospitalReviewController = require('../controllers/hospitalReviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
// Public hospital routes
router.get('/', hospitalController.getHospitals);
router.get('/:id', hospitalController.getHospitalById);

// Hospital review routes
router.get('/:id/reviews', hospitalReviewController.getHospitalReviews);
router.get('/:id/featured-reviews', hospitalController.getFeaturedReviews);
// Lấy danh sách bác sĩ theo bệnh viện (không lọc chuyên khoa)
router.get('/:hospitalId/doctors', appointmentController.getDoctorsByHospital);
// routes/appointment.js
router.get('/:hospitalId/specialties', appointmentController.getSpecialtiesByHospital);

// Lấy danh sách dịch vụ theo bệnh viện
router.get('/:hospitalId/services', appointmentController.getServicesByHospital);

// Protected review routes - require user authentication
router.post(
  '/:id/reviews', 
  protect, 
  authorize('user'), 
  [
    check('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Đánh giá phải có giá trị từ 1 đến 5'),
    check('comment')
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('Nhận xét phải có từ 3 đến 500 ký tự')
  ],
  hospitalReviewController.createHospitalReview
);

module.exports = router; 