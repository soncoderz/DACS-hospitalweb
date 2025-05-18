const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const medicalRecordController = require('../controllers/medicalRecordController');

// Tất cả routes yêu cầu xác thực
router.use(protect);

// GET /api/patients/:id/medical-records - Lấy hồ sơ bệnh án của bệnh nhân (cho cả bác sĩ và người dùng)
router.get('/doctors/patients/:id/medical-records', medicalRecordController.getPatientMedicalRecords);

// GET /api/doctors/patients/:id - Lấy thông tin bệnh nhân
router.get('/doctors/patients/:id', medicalRecordController.getPatientInfo);

// Get medical history for the logged-in user
router.get('/history', protect, medicalRecordController.getMedicalHistory);

// Get specific medical record by ID (accessible by the patient or doctor associated with the record)
router.get('/:id', protect, medicalRecordController.getMedicalRecordById);

// Doctor and admin routes
router.post(
  '/', 
  protect, 
  authorize('doctor', 'admin'), 
  medicalRecordController.createMedicalRecord
);

router.put(
  '/:id', 
  protect, 
  authorize('doctor', 'admin'), 
  medicalRecordController.updateMedicalRecord
);

// Admin only routes
router.get(
  '/all', 
  protect, 
  authorize('admin'), 
  medicalRecordController.getAllMedicalRecords
);

router.delete(
  '/:id', 
  protect, 
  authorize('admin'), 
  medicalRecordController.deleteMedicalRecord
);

module.exports = router; 