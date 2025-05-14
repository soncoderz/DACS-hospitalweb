const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.get('/categories', medicationController.getMedicationCategories);
router.get('/medications', medicationController.getMedications);

// Routes for authenticated users
router.get('/:id', protect, medicationController.getMedicationById);
router.post('/reduce-stock', protect, authorize('doctor', 'admin'), medicationController.reduceStock);

// Admin-only routes
router.post('/', protect, authorize('admin'), medicationController.createMedication);
router.put('/:id', protect, authorize('admin'), medicationController.updateMedication);
router.delete('/:id', protect, authorize('admin'), medicationController.deleteMedication);

module.exports = router; 