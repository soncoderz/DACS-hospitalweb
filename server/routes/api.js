const express = require('express');
const router = express.Router();

// Import các routes
const userRoutes = require('./user');  
 
const appointmentRoutes = require('./appointmentRoutes');
const scheduleRoutes = require('./schedule');
const specialtyRoutes = require('./specialty');
const hospitalRoutes = require('./hospital');
const couponRoutes = require('./couponRoutes');
const paymentRoutes = require('./paymentRoutes');
const reviewRoutes = require('./reviewRoutes');
const hospitalReviewRoutes = require('./hospitalReviewRoutes');
const { getProvinces } = require('../controllers/hospitalController');

// Đăng ký các routes
router.use('/auth', userRoutes);  // Thay authRoutes bằng userRoutes

router.use('/appointments', appointmentRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/', hospitalReviewRoutes);
router.use('/', paymentRoutes);

// Thêm route cho provinces
router.get('/provinces', getProvinces);

module.exports = router;