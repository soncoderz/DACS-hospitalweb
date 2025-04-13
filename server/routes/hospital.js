const express = require('express');
const router = express.Router();

// GET /api/hospitals - Get all hospitals
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API đang được phát triển'
  });
});

module.exports = router; 