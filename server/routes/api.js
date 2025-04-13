const express = require('express');
const router = express.Router();

// Import các routes
const authRoutes = require('./auth');
const userRoutes = require('./user');
const doctorRoutes = require('./doctor');
const appointmentRoutes = require('./appointmentRoutes');
const scheduleRoutes = require('./schedule');
const specialtyRoutes = require('./specialty');
const hospitalRoutes = require('./hospital');
const doctorAuthRoutes = require('./doctorAuth');

// Đăng ký các routes
router.use('/auth', authRoutes);
router.use('/doctor-auth', doctorAuthRoutes);
router.use('/users', userRoutes); 
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/hospitals', hospitalRoutes);

module.exports = router;