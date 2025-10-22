const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Tất cả routes yêu cầu xác thực
router.use(protect);

// GET /api/patients/:id/medical-records - Lấy hồ sơ bệnh án của bệnh nhân (cho cả bác sĩ và người dùng)
router.get('/doctors/patients/:id/medical-records', medicalRecordController.getPatientMedicalRecords);

// GET /api/doctors/patients/:id - Lấy thông tin bệnh nhân
router.get('/doctors/patients/:id', medicalRecordController.getPatientInfo);

// POST /api/doctors/medical-records - Tạo hồ sơ bệnh án mới (chỉ dành cho bác sĩ)
router.post('/doctors/medical-records', authorize('doctor', 'admin'), medicalRecordController.createMedicalRecord);

// PUT /api/doctors/medical-records/:id - Cập nhật hồ sơ bệnh án (chỉ dành cho bác sĩ)
router.put('/doctors/medical-records/:id', authorize('doctor', 'admin'), medicalRecordController.updateMedicalRecord);

module.exports = router; 