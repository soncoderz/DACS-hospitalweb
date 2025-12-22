const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
// const paymentController = require('../controllers/paymentController'); // removed from active routes
const { protect, admin, authorize } = require('../middlewares/authMiddleware');
const paypalController = require('../controllers/paypalController');
const momoController = require('../controllers/momoController');
// const Payment = require('../models/Payment');
// const Appointment = require('../models/Appointment');
const billingController = require('../controllers/billingController');

// PUBLIC ROUTES
// Public endpoints for payment callbacks
router.post('/momo/ipn', momoController.momoIPN);
router.get('/momo/result', momoController.momoPaymentResult);

// Mobile-specific redirect endpoint - process payment then redirect back to app
router.get('/momo/result/mobile', momoController.momoPaymentResultMobile);

// PROTECTED ROUTES: Lịch sử thanh toán dựa vào BillPayment trong billingController
router.get('/payments/history', protect, billingController.getPaymentHistory);

// PayPal Payment Routes
router.get('/paypal/client-id', (req, res) => {
  // Public endpoint to get PayPal client ID for SDK
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || 'Aetwa0pQjsQVVGxb_NqE5wue5IKBePqpHlGsLwSQ1mmr6uGMGPqs6MtrK-La4SCaRkS0Q0j1Ep-dwkkd'
  });
});
router.post('/paypal/create', protect, paypalController.createPaypalPayment);
router.post('/paypal/execute', protect, paypalController.executePaypalPayment);
router.get('/paypal/:paymentId', protect, paypalController.getPaypalPayment);

// MoMo Payment Routes
router.post('/momo/create', protect, momoController.createMomoPayment);
router.get('/momo/status/:orderId', protect, momoController.checkMomoPaymentStatus);

// Reset payment route
router.delete('/reset/:appointmentId', protect, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const Bill = require('../models/Bill');
    const BillPayment = require('../models/BillPayment');
    const Appointment = require('../models/Appointment');

    console.log(`Yêu cầu reset thanh toán cho appointmentId: ${appointmentId}`);

    // Xóa tất cả BillPayment records cho appointment này
    const deletePaymentsResult = await BillPayment.deleteMany({ appointmentId });

    // Reset Bill consultationBill status
    const bill = await Bill.findOne({ appointmentId });
    if (bill) {
      bill.consultationBill.status = 'pending';
      bill.consultationBill.paymentMethod = null;
      bill.consultationBill.paymentDate = null;
      bill.consultationBill.transactionId = null;
      await bill.save();
    }

    // Reset trạng thái thanh toán trong appointment
    await Appointment.findByIdAndUpdate(appointmentId, {
      $set: {
        paymentStatus: 'pending',
        paymentMethod: null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Đã reset thanh toán thành công. Đã xóa ${deletePaymentsResult.deletedCount} bản ghi thanh toán.`
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
