const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// === PUBLIC ROUTES ===

// Lấy danh sách chuyên khoa theo bệnh viện 
router.get('/hospitals/:hospitalId/specialties', appointmentController.getSpecialtiesByHospital);


// Lấy danh sách dịch vụ theo chuyên khoa
router.get('/specialties/:specialtyId/services', appointmentController.getServicesBySpecialty);

// Lấy danh sách bác sĩ theo bệnh viện và chuyên khoa
router.get('/hospitals/:hospitalId/specialties/:specialtyId/doctors', appointmentController.getDoctorsByHospitalAndSpecialty);

// Lấy danh sách bác sĩ theo chuyên khoa
router.get('/specialties/:specialtyId/doctors', appointmentController.getDoctorsBySpecialty);


// Lấy danh sách bác sĩ theo dịch vụ
router.get('/services/:serviceId/doctors', appointmentController.getDoctorsByService);

// Lấy danh sách phòng khám theo bệnh viện, chuyên khoa và bác sĩ
router.get('/hospitals/:hospitalId/rooms', appointmentController.getRoomsByFilters);

// Lấy lịch làm việc của bác sĩ
router.get('/doctors/:doctorId/schedules', appointmentController.getDoctorSchedules);

// Kiểm tra mã giảm giá
router.get('/coupons/validate', appointmentController.validateCoupon);

// === AUTHENTICATED ROUTES ===
router.use(protect);

// === ROUTES DÀNH CHO BỆNH NHÂN ===

// POST /api/appointments – Đặt lịch khám
router.post('/', appointmentController.createAppointment);

// GET /api/appointments – Lấy danh sách lịch hẹn của người dùng đăng nhập
router.get('/', appointmentController.getAppointments);

// GET /api/appointments/:id – Chi tiết lịch khám
router.get('/:id', appointmentController.getAppointmentById);

// DELETE /api/appointments/:id – Hủy lịch khám
router.delete('/:id', appointmentController.cancelAppointment);

// PUT /api/appointments/:id/reschedule – Đổi giờ khám
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);

// POST /api/appointments/:id/review – Đánh giá sau khám
router.post('/:id/review', appointmentController.reviewAppointment);

// === ROUTES DÀNH CHO BÁC SĨ ===

// GET /api/appointments/doctor/counts - Lấy số lượng lịch hẹn theo trạng thái
router.get('/doctor/counts', authorize('doctor'), appointmentController.getDoctorAppointmentCounts);

// GET /api/appointments/doctor/today – Lấy lịch hẹn hôm nay của bác sĩ
router.get('/doctor/today', authorize('doctor'), appointmentController.getDoctorTodayAppointments);

// PUT /api/appointments/:id/confirmed – Bác sĩ xác nhận lịch hẹn
router.put('/:id/confirmed', authorize('doctor'), appointmentController.confirmAppointment);

// PUT /api/appointments/:id/reject – Bác sĩ từ chối lịch hẹn
router.put('/:id/reject', authorize('doctor'), appointmentController.rejectAppointment);

// PUT /api/appointments/:id/complete – Bác sĩ hoàn thành lịch hẹn
router.put('/:id/complete', authorize('doctor'), appointmentController.completeAppointment);


module.exports = router; 