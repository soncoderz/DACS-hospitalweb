const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const medicalRecordController = require('../controllers/medicalRecordController');

// Tất cả routes yêu cầu xác thực
router.use(protect);

// GET /api/medical-records/doctors/patients/:id/medical-records - Lấy hồ sơ bệnh án của bệnh nhân (cho cả bác sĩ và người dùng)
router.get('/doctors/patients/:id/medical-records', medicalRecordController.getPatientMedicalRecords);

// GET /api/medical-records/doctors/patients/:id - Lấy thông tin bệnh nhân
router.get('/doctors/patients/:id', medicalRecordController.getPatientInfo);

// Get medical history for the logged-in user
router.get('/history', medicalRecordController.getMedicalHistory);

// Admin only routes - must be before /:id route
router.get(
  '/all',
  authorize('admin'),
  medicalRecordController.getAllMedicalRecords
);

// Doctor and admin routes
router.post(
  '/',
  authorize('doctor', 'admin'),
  medicalRecordController.createMedicalRecord
);

router.put(
  '/:id',
  authorize('doctor', 'admin'),
  medicalRecordController.updateMedicalRecord
);

router.delete(
  '/:id',
  authorize('admin'),
  medicalRecordController.deleteMedicalRecord
);

// Get specific medical record by ID - MUST BE LAST to avoid conflicts
// (accessible by the patient or doctor associated with the record)
router.get('/:id', medicalRecordController.getMedicalRecordById);

module.exports = router; 