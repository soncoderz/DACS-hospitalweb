const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes công khai cho người dùng
router.get('/list', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/reviews', doctorController.getDoctorReviews);
router.get('/specialties', doctorController.getAllSpecialties);

// Routes yêu cầu xác thực
router.use(authMiddleware.protect);

// Routes để đánh giá bác sĩ - chỉ dành cho bệnh nhân
router.post('/:id/reviews', authMiddleware.authorize('patient'), doctorController.createReview);

// Routes dành cho admin
router.use(authMiddleware.authorize('admin'));
router.post('/create', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router; 