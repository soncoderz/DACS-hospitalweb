const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { protect, admin } = require('../middlewares/authMiddleware');
const { uploadToMemory } = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', newsController.getNews);
router.get('/news/:id', newsController.getNewsById);

// Admin routes
router.post('/', protect, admin, uploadToMemory.single('image'), newsController.createNews);
router.put('/:id', protect, admin, uploadToMemory.single('image'), newsController.updateNews);
router.delete('/:id', protect, admin, newsController.deleteNews);

module.exports = router; 