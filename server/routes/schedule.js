const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET /api/schedules?doctorId=...&date=... - Lấy lịch trống của bác sĩ
// Route này có thể được truy cập công khai (không cần đăng nhập)
router.get('/', scheduleController.getAvailableSchedules);

// Routes bên dưới yêu cầu xác thực
router.use(protect);

// Routes cho bác sĩ
// GET /api/schedules/doctor - Lấy lịch làm việc của bác sĩ đăng nhập
router.get('/doctor', authorize('doctor'), scheduleController.getDoctorSchedules);

// POST /api/schedules/doctor - Bác sĩ tạo lịch làm việc mới
router.post('/doctor', authorize('doctor'), scheduleController.createDoctorSchedule);

// PUT /api/schedules/:id/doctor - Bác sĩ cập nhật lịch làm việc
router.put('/:id/doctor', authorize('doctor'), scheduleController.updateDoctorSchedule);

// DELETE /api/schedules/:id/doctor - Bác sĩ xóa lịch làm việc
router.delete('/:id/doctor', authorize('doctor'), scheduleController.deleteDoctorSchedule);


// Public routes for rooms
router.get('/rooms/hospital/:hospitalId', scheduleController.getRoomsByHospital);
router.get('/rooms/doctor/:doctorId', scheduleController.getRoomsByDoctor);

module.exports = router; 