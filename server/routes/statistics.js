const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

// GET /api/statistics - Get statistics

router.get('/users', statisticsController.getUserStatistics);
router.get('/doctors', statisticsController.getDoctorStatistics);
router.get('/appointments', statisticsController.getAppointmentStatistics);

module.exports = router; 