const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadToMemory } = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/all', newsController.getNews);
router.get('/news/:id', newsController.getNewsById);

router.use(protect);

// Admin routes
router.post('/', authorize('admin'), uploadToMemory.single('image'), newsController.createNews);
router.put('/:id', authorize('admin'), uploadToMemory.single('image'), newsController.updateNews);
router.delete('/:id', authorize('admin'), newsController.deleteNews);

module.exports = router; 