const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET /api/schedules?doctorId=...&date=... - Lấy lịch trống của bác sĩ
// Route này có thể được truy cập công khai (không cần đăng nhập)
router.get('/', scheduleController.getAvailableSchedules);

// Routes bên dưới yêu cầu xác thực
router.use(protect);

// POST /api/schedules - Tạo lịch làm việc mới (chỉ bác sĩ và admin)
router.post('/', authorize('doctor', 'admin'), scheduleController.createSchedule);

// PUT /api/schedules/:id - Cập nhật lịch làm việc (chỉ bác sĩ và admin)
router.put('/:id', authorize('doctor', 'admin'), scheduleController.updateSchedule);

// DELETE /api/schedules/:id - Xóa lịch làm việc (chỉ admin)
router.delete('/:id', authorize('admin'), scheduleController.deleteSchedule);

module.exports = router; 