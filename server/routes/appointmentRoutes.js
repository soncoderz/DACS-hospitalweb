const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Bảo vệ tất cả các routes
router.use(protect);

// 1. POST /api/appointments – Đặt lịch khám
router.post('/', appointmentController.createAppointment);

// 2. GET /api/appointments?userId= – Lấy danh sách lịch sử khám
router.get('/', appointmentController.getAppointments);

// 3. GET /api/appointments/:id – Chi tiết lịch khám
router.get('/:id', appointmentController.getAppointmentById);

// 4. DELETE /api/appointments/:id – Hủy lịch khám
router.delete('/:id', appointmentController.cancelAppointment);

// 5. PUT /api/appointments/:id/reschedule – Đổi giờ khám
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);

// Routes dành cho cả bệnh nhân và bác sĩ
router.post('/:id/review', appointmentController.reviewAppointment);

// Routes dành cho bác sĩ
router.get('/doctor-schedule', authorize('doctor'), appointmentController.getDoctorSchedule);
router.put('/:id/status', authorize('doctor'), appointmentController.updateAppointmentStatus);
router.post('/availability', authorize('doctor'), appointmentController.setAvailability);

// Routes dành cho admin
router.get('/all', authorize('admin'), appointmentController.getAllAppointments);
router.get('/stats', authorize('admin'), appointmentController.getAppointmentStats);

module.exports = router; 