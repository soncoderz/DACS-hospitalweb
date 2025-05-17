const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const { validationResult } = require('express-validator');

// Get all payments with filtering options (Admin only)
exports.getAllPayments = async (req, res) => {
  try {
    const { 
      userId, 
      doctorId, 
      serviceId, 
      status, 
      fromDate, 
      toDate, 
      method,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};

    // Apply filters if provided
    if (userId && userId !== 'all') query.userId = new mongoose.Types.ObjectId(userId);
    if (doctorId && doctorId !== 'all') query.doctorId = new mongoose.Types.ObjectId(doctorId);
    if (serviceId && serviceId !== 'all') query.serviceId = new mongoose.Types.ObjectId(serviceId);
    if (status && status !== 'all') query.paymentStatus = status;
    if (method && method !== 'all') query.paymentMethod = method;
    
    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDateObj;
      }
    }

    // Count total documents for pagination
    const total = await Payment.countDocuments(query);
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const payments = await Payment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: 'userId',
        select: 'fullName email phoneNumber avatarUrl',
      })
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId',
        populate: [
          { path: 'user', select: 'fullName email phoneNumber avatarUrl' },
          { path: 'specialtyId', select: 'name' }
        ]
      })
      .populate('serviceId', 'name price')
      .populate('appointmentId', 'date status bookingCode');
    
    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Get payment details by ID (Admin only)
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format'
      });
    }
    
    const payment = await Payment.findById(id)
      .populate({
        path: 'userId',
        select: 'fullName email phoneNumber'
      })
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId',
        populate: [
          { path: 'user', select: 'fullName email phoneNumber' },
          { path: 'specialtyId', select: 'name' }
        ]
      })
      .populate('serviceId', 'name price description')
      .populate('appointmentId', 'date status notes bookingCode')
      .populate('couponId', 'code discountType discountValue');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật trạng thái thanh toán (Admin only)
 * @route   PUT /api/payments/:id
 * @access  Private (Admin)
 */
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate if the payment ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID format' });
    }

    // If no request body or empty body, automatically set status to "CONFIRM"
    const isEmptyBody = !req.body || Object.keys(req.body).length === 0;
    const { paymentStatus = isEmptyBody ? 'CONFIRM' : undefined, notes, receiptNumber } = req.body || {};

    // Find the payment
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    console.log('Payment found:', payment);
    console.log('Associated appointmentId:', payment.appointmentId);

    // Only cash payments can be updated (unless the user is admin)
    if (payment.paymentMethod !== 'cash' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only cash payments can be updated manually' 
      });
    }

    // Update payment fields
    if (paymentStatus) payment.paymentStatus = paymentStatus;
    if (notes) payment.notes = notes;
    if (receiptNumber) payment.transactionId = receiptNumber;

    // If payment is now COMPLETED or CONFIRM, update timestamp
    if (paymentStatus === 'completed' || paymentStatus === 'confirm') {
      payment.paidAt = Date.now();
    }

    // Save the updated payment
    await payment.save();
    console.log('Payment updated successfully:', payment.paymentStatus);

    // Update the corresponding appointment's payment status
    if (payment.appointmentId) {
      try {
        // Map payment status to appointment paymentStatus format
        let appointmentPaymentStatus = 'pending';
        if (paymentStatus === 'completed' || paymentStatus === 'confirm') {
          appointmentPaymentStatus = 'completed';
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
          appointmentPaymentStatus = 'failed';
        } else if (paymentStatus === 'refunded') {
          appointmentPaymentStatus = 'refunded';
        }

        console.log('Looking for appointment with ID:', payment.appointmentId);
        
        // Prepare update data object
        const updateData = { paymentStatus: appointmentPaymentStatus };
        
        // If payment is completed or confirmed and it needs to be confirmed, update the status
        if (paymentStatus === 'completed' || paymentStatus === 'confirm') {
          updateData.status = 'completed';
        }
        
        // Update the appointment using findByIdAndUpdate for more reliable updates
        const appointment = await Appointment.findByIdAndUpdate(
          payment.appointmentId,
          updateData,
          { new: true }
        );
        
        console.log('Appointment update result:', appointment ? 
          `Updated - Status: ${appointment.status}, PaymentStatus: ${appointment.paymentStatus}` : 
          'Appointment not found');
          
        if (!appointment) {
          console.error('Warning: Associated appointment not found with ID:', payment.appointmentId);
        }
      } catch (appointmentError) {
        console.error('Error updating appointment:', appointmentError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payment', 
      error: error.message 
    });
  }
};

// Create new payment record (typically called by appointment system)
exports.createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      appointmentId,
      userId,
      doctorId,
      serviceId,
      amount,
      originalAmount,
      couponId,
      discount,
      paymentMethod,
      transactionId
    } = req.body;

    // Validate required fields
    if (!appointmentId || !userId || !doctorId || !serviceId || !amount || !originalAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if payment already exists for this appointment
    const existingPayment = await Payment.findOne({ appointmentId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment record already exists for this appointment'
      });
    }

    // Set initial payment status based on payment method
    let initialPaymentStatus = 'pending';
    if (paymentMethod === 'cash') {
      // Cash payments can be automatically marked as completed if needed
      initialPaymentStatus = 'completed';
    }

    // Create new payment record
    const payment = new Payment({
      appointmentId,
      userId,
      doctorId,
      serviceId,
      amount,
      originalAmount,
      discount: discount || 0,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      transactionId,
      couponId: couponId || null,
      paidAt: initialPaymentStatus === 'completed' ? Date.now() : null
    });

    await payment.save();

    // Map payment status to appointment payment status
    let appointmentPaymentStatus = 'pending';
    if (initialPaymentStatus === 'completed') {
      appointmentPaymentStatus = 'paid';
    }

    // Ensure appointment has a booking code
    if (!appointment.bookingCode) {
      // Generate a unique booking code
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      appointment.bookingCode = `BK-${randomCode}-${timestamp}`;
    }

    // Update appointment with payment information
    appointment.paymentStatus = appointmentPaymentStatus;
    appointment.paymentId = payment._id.toString();
    
    // If payment is complete, update appointment status accordingly
    if (initialPaymentStatus === 'completed' && appointment.status === 'pending') {
      appointment.status = 'confirmed';
    }
    
    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment,
      bookingCode: appointment.bookingCode
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

/**
 * @desc    Get payment statistics for admin dashboard
 * @route   GET /api/admin/payments/stats
 * @access  Private (Admin)
 */
exports.getPaymentStats = async (req, res) => {
  try {
    // Get counts for different payment statuses
    const [totalCount, completedCount, pendingCount, failedCount] = await Promise.all([
      Payment.countDocuments({}),
      Payment.countDocuments({ paymentStatus: 'completed' }),
      Payment.countDocuments({ paymentStatus: 'pending' }),
      Payment.countDocuments({ paymentStatus: 'failed' })
    ]);

    // Get total revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Return the statistics
    res.status(200).json({
      success: true,
      stats: {
        total: totalCount,
        completed: completedCount,
        pending: pendingCount,
        failed: failedCount,
        revenue: revenue
      }
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin thanh toán cho người dùng
 * @route   GET /api/payments/user
 * @access  Private (User)
 */
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { userId };
    if (status) query.paymentStatus = status;
    
    // Đếm tổng số thanh toán
    const total = await Payment.countDocuments(query);
    
    // Lấy danh sách thanh toán
    const payments = await Payment.find(query)
      .populate('appointmentId', 'appointmentDate status')
      .populate('doctorId', 'name specialtyId')
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: payments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thanh toán',
      error: error.message
    });
  }
};

// PayPal API - Tạo thanh toán PayPal
exports.createPayPalPayment = async (payment, origin) => {
  try {
    // Kết nối với PayPal API (giả định, cần thêm thư viện và cấu hình PayPal SDK)
    // Trong môi trường thực, bạn sẽ sử dụng PayPal SDK
    // Ví dụ: const paypal = require('@paypal/checkout-server-sdk');
    
    // Đây là phiên bản mô phỏng - trong triển khai thực tế, bạn sẽ tích hợp PayPal SDK
    console.log('Creating PayPal payment for:', payment);
    
    // Trả về URL redirect mô phỏng - trong triển khai thực tế, URL này sẽ từ PayPal
    return `${origin}/checkout/paypal?paymentId=${payment._id}`;
  } catch (error) {
    console.error('PayPal payment creation error:', error);
    throw error;
  }
};

/**
 * @desc    Xác nhận thanh toán PayPal
 * @route   POST /api/payments/paypal/confirmed
 * @access  Private
 */
exports.confirmPayPalPayment = async (req, res) => {
  try {
    const { appointmentId, paymentId, paymentDetails } = req.body;
    
    // Validate required fields
    if (!appointmentId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID cuộc hẹn hoặc ID thanh toán'
      });
    }
    
    // Tìm bản ghi cuộc hẹn
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin cuộc hẹn'
      });
    }
    
    // Kiểm tra nếu đã thanh toán
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cuộc hẹn này đã được thanh toán'
      });
    }
    
    // Tìm bản ghi thanh toán theo appointmentId
    let payment = await Payment.findOne({ appointmentId });
    
    if (!payment) {
      // Nếu không tìm thấy payment, tạo mới
      payment = new Payment({
        appointmentId,
        userId: appointment.patientId,
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
        amount: appointment.fee?.totalAmount || 0,
        originalAmount: appointment.fee?.consultationFee + appointment.fee?.additionalFees || 0,
        discount: appointment.fee?.discount || 0,
        paymentMethod: 'paypal',
        paymentStatus: 'completed',
        transactionId: paymentId,
        paymentDetails: paymentDetails,
        paidAt: new Date()
      });
    } else {
      // Cập nhật bản ghi payment hiện có
      payment.paymentStatus = 'completed';
      payment.transactionId = paymentId;
      payment.paymentDetails = paymentDetails;
      payment.paymentMethod = 'paypal';
      payment.updatedAt = new Date();
      payment.paidAt = new Date();
    }
    
    // Lưu thông tin thanh toán
    await payment.save();
    
    // Cập nhật trạng thái thanh toán trong Appointment
    appointment.paymentStatus = 'paid';  // Đảm bảo là 'paid', không phải 'completed'
    appointment.paymentMethod = 'paypal';
    appointment.paymentId = paymentId;   // Lưu ID giao dịch PayPal vào Appointment
    
    // Nếu cuộc hẹn đang ở trạng thái pending, tự động chuyển sang confirmed
    if (appointment.status === 'pending') {
      appointment.status = 'confirmed';
    }
    
    // Lưu cập nhật cho cuộc hẹn
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: 'Thanh toán PayPal đã được xác nhận thành công',
      data: {
        payment,
        appointment,
        redirectUrl: '/user/appointments' // Chuyển hướng về trang lịch hẹn
      }
    });
  } catch (error) {
    console.error('PayPal confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán PayPal',
      error: error.message
    });
  }
};

/**
 * @desc    Hủy thanh toán PayPal
 * @route   POST /api/payments/paypal/cancel
 * @access  Public
 */
exports.cancelPayPalPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID thanh toán'
      });
    }
    
    // Tìm bản ghi thanh toán
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }
    
    // Kiểm tra phương thức thanh toán
    if (payment.paymentMethod !== 'paypal') {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ'
      });
    }
    
    // Cập nhật trạng thái thanh toán
    payment.paymentStatus = 'cancelled';
    payment.notes = 'Thanh toán PayPal đã bị hủy bởi người dùng';
    payment.updatedAt = new Date();
    
    await payment.save();
    
    // Cập nhật trạng thái thanh toán cho cuộc hẹn hoặc hủy cuộc hẹn
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      // Tùy theo yêu cầu nghiệp vụ, bạn có thể hủy cuộc hẹn hoặc chỉ đặt lại trạng thái thanh toán
      appointment.paymentStatus = 'failed';
      appointment.status = 'cancelled';
      appointment.cancellationReason = 'Thanh toán PayPal bị hủy';
      appointment.cancelledBy = 'patient';
      
      await appointment.save();
      
      // Trả lại slot thời gian
      if (appointment.scheduleId) {
        const Schedule = mongoose.model('Schedule');
        const schedule = await Schedule.findById(appointment.scheduleId);
        if (schedule) {
          const timeSlot = appointment.timeSlot;
          const slotIndex = schedule.timeSlots.findIndex(
            slot => slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
          );
          
          if (slotIndex !== -1) {
            schedule.timeSlots[slotIndex].isBooked = false;
            schedule.timeSlots[slotIndex].appointmentId = null;
            await schedule.save();
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Thanh toán PayPal đã bị hủy',
      data: {
        redirectUrl: '/user/appointment/new' // Chuyển hướng về trang đặt lịch
      }
    });
  } catch (error) {
    console.error('PayPal cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy thanh toán PayPal',
      error: error.message
    });
  }
};

// Add notification to PayPal Success route 
exports.paypalSuccess = async (req, res) => {
  try {
    // ... existing code ...
    
    // ... existing response code ...
  } catch (error) {
    // ... existing error handling ...
  }
};