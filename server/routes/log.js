const express = require('express');
const router = express.Router();
const logController = require('../controllers/log');
const { authenticate } = require('../middleware/auth');

// All log routes require authentication
router.use(authenticate);

// GET /api/logs - Get all logs with pagination and filtering
router.get('/', logController.getLogs);

// GET /api/logs/stats - Get log statistics
router.get('/stats', logController.getLogStats);

// GET /api/logs/:id - Get a single log by ID
router.get('/:id', logController.getLogById);

// DELETE /api/logs/:id - Delete a log by ID
router.delete('/:id', logController.deleteLog);

// DELETE /api/logs - Clear all logs
router.delete('/', logController.clearAllLogs);

module.exports = router; 