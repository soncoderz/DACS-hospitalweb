const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả các routes đều yêu cầu xác thực
router.use(authMiddleware.protect);

// Routes dành cho bệnh nhân
router.get('/my-appointments', appointmentController.getUserAppointments);
router.post('/book', appointmentController.bookAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);
router.post('/:id/review', appointmentController.reviewAppointment);

// Routes dành cho bác sĩ
router.get('/doctor-schedule', authMiddleware.authorize('doctor'), appointmentController.getDoctorSchedule);
router.put('/:id/status', authMiddleware.authorize('doctor'), appointmentController.updateAppointmentStatus);
router.post('/availability', authMiddleware.authorize('doctor'), appointmentController.setAvailability);

// Routes dành cho admin
router.use(authMiddleware.authorize('admin'));
router.get('/all', appointmentController.getAllAppointments);
router.get('/stats', appointmentController.getAppointmentStats);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router; 