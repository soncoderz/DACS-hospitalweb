const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
// GET /api/specialties - Get all specialties
router.get('/', specialtyController.getSpecialties);
router.get('/:id', specialtyController.getSpecialtyById);

module.exports = router; 