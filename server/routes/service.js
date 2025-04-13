const express = require('express');
const router = express.Router();

// GET /api/services - Get all services
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API đang được phát triển'
  });
});

module.exports = router; 