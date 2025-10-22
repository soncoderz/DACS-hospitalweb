const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// GET /api/logs - Get all logs
router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API đang được phát triển'
  });
});

module.exports = router; 