const express = require('express');
const router = express.Router();
const { 
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCoupons,
  getCouponById,
  validateCoupon
} = require('../controllers/couponController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getCouponInfo } = require('../controllers/couponController');

// Validate coupon route - accessible by all authenticated users
router.post('/validate', protect, validateCoupon);
router.get('/validate', protect, getCouponInfo);

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(protect);

// Tất cả routes bên dưới yêu cầu quyền admin
router.use(authorize('admin'));

// Routes
router
  .route('/')
  .get(getCoupons)
  .post(createCoupon);

router
  .route('/:id')
  .get(getCouponById)
  .put(updateCoupon)
  .delete(deleteCoupon);

module.exports = router; 