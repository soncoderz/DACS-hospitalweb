const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { protect, admin, authorize } = require('../middlewares/authMiddleware');
const paypalController = require('../controllers/paypalController');
const momoController = require('../controllers/momoController');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');

// PUBLIC ROUTES
// Public endpoints for payment callbacks
router.post('/momo/ipn', momoController.momoIPN);
router.get('/momo/result', momoController.momoPaymentResult);

// PROTECTED ROUTES
// User routes - Access only by authenticated users
router.get('/user', protect, paymentController.getUserPayments);

// Payment history route
router.get('/payments/history', protect, paymentController.getPaymentHistory);

// Get payment by ID - Admin only
router.get('/payment/:id', protect, authorize('admin'), paymentController.getPaymentById);

// Get all payments - Admin only
router.get('/', protect, authorize('admin'), paymentController.getAllPayments);

// Statistics route for admin dashboard
router.get(
  '/admin/statistics/payments',
  protect,
  authorize('admin'),
  paymentController.getPaymentStats
);

// Payment update route for admin
router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    check('paymentStatus').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']).withMessage('Trạng thái thanh toán không hợp lệ'),
    check('notes').optional().isString().withMessage('Ghi chú phải là chuỗi'),
    check('receiptNumber').optional().isString().withMessage('Số hóa đơn phải là chuỗi')
  ],
  paymentController.updatePayment
);

// Create payment route - typically called by appointment system
router.post(
  '/',
  protect,
  [
    check('appointmentId').notEmpty().withMessage('ID cuộc hẹn là bắt buộc'),
    check('userId').notEmpty().withMessage('ID người dùng là bắt buộc'),
    check('doctorId').notEmpty().withMessage('ID bác sĩ là bắt buộc'),
    check('serviceId').notEmpty().withMessage('ID dịch vụ là bắt buộc'),
    check('amount').isNumeric().withMessage('Số tiền phải là số'),
    check('originalAmount').isNumeric().withMessage('Số tiền gốc phải là số'),
    check('paymentMethod').isIn([ 'cash', 'paypal', 'momo']).withMessage('Phương thức thanh toán không hợp lệ')
  ],
  paymentController.createPayment
);

// PayPal Payment Routes
router.post('/paypal/create', protect, paypalController.createPaypalPayment);
router.post('/paypal/execute', protect, paypalController.executePaypalPayment);
router.get('/paypal/:paymentId', protect, paypalController.getPaypalPayment);
router.post('/paypal/confirmed', paymentController.confirmPayPalPayment);
router.post('/paypal/confirm', paymentController.confirmPayPalPayment);
router.post('/paypal/cancel', paymentController.cancelPayPalPayment);

// MoMo Payment Routes
router.post('/momo/create', protect, momoController.createMomoPayment);
router.get('/momo/status/:orderId', protect, momoController.checkMomoPaymentStatus);

// Reset payment route
router.delete('/reset/:appointmentId', protect, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    console.log(`Yêu cầu reset thanh toán cho appointmentId: ${appointmentId}`);
    
    // Xóa tất cả thanh toán cho appointment này
    const deleteResult = await Payment.deleteMany({ appointmentId });
    
    // Reset trạng thái thanh toán trong appointment
    await Appointment.findByIdAndUpdate(appointmentId, {
      $set: {
        paymentStatus: 'pending',
        paymentMethod: null
      }
    });
    
    return res.status(200).json({
      success: true,
      message: `Đã reset thanh toán thành công. Đã xóa ${deleteResult.deletedCount} bản ghi thanh toán.`
    });
  } catch (error) {
    console.error('Reset payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi reset thanh toán',
      error: error.message
    });
  }
});

module.exports = router; 