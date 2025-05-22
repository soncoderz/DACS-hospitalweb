const { paypal, convertVndToUsd } = require('../config/paypal');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

/**
 * @desc    Khởi tạo thanh toán PayPal
 * @route   POST /api/payments/paypal/create
 * @access  Private (User)
 */
exports.createPaypalPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID cuộc hẹn không hợp lệ'
      });
    }
    
    // Tìm thông tin cuộc hẹn
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'fullName email')
      .populate('doctorId')
      .populate('serviceId', 'name price');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin cuộc hẹn'
      });
    }
    
    // Kiểm tra nếu đã thanh toán hoàn tất
    if (appointment.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cuộc hẹn này đã được thanh toán'
      });
    }
    
    // Chuẩn bị thông tin thanh toán
    const totalAmount = appointment.fee?.totalAmount || 0;
    
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ (phải lớn hơn 0)'
      });
    }
    
    // Đổi từ VND sang USD
    const usdAmount = convertVndToUsd(totalAmount);
    
    // Cấu hình PayPal
    const createPaymentJson = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/paypal/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/paypal/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: `Lịch khám - ${appointment.serviceId?.name || 'Dịch vụ khám'}`,
            sku: appointmentId.toString(),
            price: usdAmount,
            currency: 'USD',
            quantity: 1
          }]
        },
        amount: {
          currency: 'USD',
          total: usdAmount
        },
        description: `Thanh toán cho lịch hẹn #${appointment.bookingCode || appointmentId.toString()}`
      }]
    };
    
    // Gọi PayPal API để tạo thanh toán
    paypal.payment.create(createPaymentJson, async (error, paypalPayment) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi tạo thanh toán PayPal',
          error: error.message || 'PayPal API Error'
        });
      }
      
      try {
        // Tìm thanh toán hiện tại (nếu có)
        const existingPayment = await Payment.findOne({ appointmentId });
        
        // Nếu đã có thanh toán cũ và không phải trạng thái completed, cập nhật nó
        if (existingPayment && existingPayment.paymentStatus !== 'completed') {
          existingPayment.paymentStatus = 'pending';
          existingPayment.transactionId = paypalPayment.id;
          existingPayment.paymentMethod = 'paypal';
          await existingPayment.save();
        } 
        // Nếu không có thanh toán nào, tạo mới
        else if (!existingPayment) {
          const newPayment = new Payment({
            appointmentId: appointment._id,
            userId: appointment.patientId._id || appointment.patientId,
            doctorId: appointment.doctorId._id || appointment.doctorId,
            serviceId: appointment.serviceId ? (appointment.serviceId._id || appointment.serviceId) : null,
            amount: totalAmount,
            originalAmount: appointment.fee.consultationFee + appointment.fee.additionalFees,
            discount: appointment.fee.discount || 0,
            paymentMethod: 'paypal',
            paymentStatus: 'pending',
            transactionId: paypalPayment.id
          });
          
          await newPayment.save();
        }
        
        // Cập nhật trạng thái cuộc hẹn
        await Appointment.findByIdAndUpdate(
          appointmentId,
          { 
            $set: { 
              paymentStatus: 'pending',
              paymentMethod: 'paypal'
            } 
          }
        );
        
        // Lấy URL chấp thuận thanh toán
        let approvalUrl = '';
        for (let i = 0; i < paypalPayment.links.length; i++) {
          if (paypalPayment.links[i].rel === 'approval_url') {
            approvalUrl = paypalPayment.links[i].href;
            break;
          }
        }
        
        return res.status(200).json({
          success: true,
          data: {
            paymentId: paypalPayment.id,
            approvalUrl: approvalUrl
          },
          message: 'Khởi tạo thanh toán PayPal thành công'
        });
      } catch (dbError) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lưu thông tin thanh toán',
          error: dbError.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý yêu cầu thanh toán',
      error: error.message
    });
  }
};

/**
 * @desc    Execute PayPal payment after user approval
 * @route   POST /api/payments/paypal/execute
 * @access  Private
 */
exports.executePaypalPayment = async (req, res) => {
  try {
    const { paymentId, PayerID } = req.body;
    
    console.log(`Xử lý thanh toán PayPal: ${paymentId} với PayerID: ${PayerID}`);
    
    if (!paymentId || !PayerID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán'
      });
    }
    
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      transactionId: paymentId
    }).populate({
      path: 'appointmentId',
      populate: [
        { path: 'patientId', select: 'fullName' },
        { path: 'doctorId', select: 'user', populate: { path: 'user', select: 'fullName' } },
        { path: 'serviceId', select: 'name' }
      ]
    });
    
    if (!payment) {
      console.error(`Không tìm thấy thanh toán với transactionId: ${paymentId}`);
      
      // Try to get more information about possible payments
      const recentPayments = await Payment.find({}).sort({createdAt: -1}).limit(5);
      console.log('Recent payments:', recentPayments.map(p => ({
        id: p._id,
        transactionId: p.transactionId,
        appointmentId: p.appointmentId,
        status: p.paymentStatus
      })));
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }
    
    console.log(`Tìm thấy thanh toán: ${payment._id}, trạng thái: ${payment.paymentStatus}`);
    
    // Execute the PayPal payment
    const executePaymentJson = {
      payer_id: PayerID
    };
    
    console.log('Gửi yêu cầu xử lý thanh toán đến PayPal');
    
    paypal.payment.execute(paymentId, executePaymentJson, async (error, paypalPayment) => {
      if (error) {
        console.error('PayPal execute payment error:', error);
        
        // Update payment status to FAILED
        payment.paymentStatus = 'failed';
        await payment.save();
        
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi xác nhận thanh toán PayPal',
          error: error.message
        });
      }
      
      console.log(`PayPal kết quả xử lý: ${paypalPayment.state}`);
      
      // Check if payment was completed
      if (paypalPayment.state === 'approved') {
        try {
          // Update payment status to COMPLETED
          payment.paymentStatus = 'completed';
          payment.paidAt = new Date();
          await payment.save();
          console.log(`Đã cập nhật thanh toán thành hoàn tất: ${payment._id}`);
          
          // Update appointment payment status and confirm if pending
          const appointment = await Appointment.findById(payment.appointmentId._id);
          
          if (!appointment) {
            console.error(`Không tìm thấy cuộc hẹn với ID: ${payment.appointmentId._id}`);
            return res.status(404).json({
              success: false,
              message: 'Không tìm thấy thông tin cuộc hẹn'
            });
          }
          
          console.log(`Tìm thấy cuộc hẹn: ${appointment._id}, trạng thái hiện tại: ${appointment.status}, thanh toán: ${appointment.paymentStatus}`);
          
          // Cập nhật trạng thái thanh toán
          appointment.paymentStatus = 'completed';
          appointment.paymentMethod = 'paypal';
          
          // Nếu cuộc hẹn đang ở trạng thái pending, tự động chuyển sang confirmed
          if (appointment.status === 'pending') {
            console.log(`Tự động xác nhận cuộc hẹn do đã thanh toán: ${appointment._id}`);
            appointment.status = 'confirmed';
          }
          
          await appointment.save();
          console.log(`Đã cập nhật cuộc hẹn: ${appointment._id}, trạng thái mới: ${appointment.status}, paymentStatus: ${appointment.paymentStatus}`);
          
          // Extract appointment details for the response
          const appointmentDetails = {
            bookingCode: appointment.bookingCode || payment.appointmentId._id,
            service: payment.appointmentId.serviceId?.name || 'Dịch vụ khám',
            doctor: payment.appointmentId.doctorId?.user?.fullName || 'Bác sĩ',
            date: new Date(payment.appointmentId.appointmentDate).toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: appointment.timeSlot?.startTime 
                   ? `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`
                   : 'Theo lịch hẹn'
          };
          
          return res.status(200).json({
            success: true,
            data: {
              paymentId: paypalPayment.id,
              status: 'approved',
              transactionDetails: paypalPayment.transactions[0],
              appointmentDetails
            },
            message: 'Thanh toán PayPal thành công'
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật dữ liệu',
            error: dbError.message
          });
        }
      } else {
        // Update payment status to FAILED
        payment.paymentStatus = 'failed';
        await payment.save();
        
        return res.status(400).json({
          success: false,
          message: 'Thanh toán PayPal không thành công',
          status: paypalPayment.state
        });
      }
    });
  } catch (error) {
    console.error('Execute PayPal payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán PayPal',
      error: error.message
    });
  }
};

/**
 * @desc    Get PayPal payment details
 * @route   GET /api/payments/paypal/:paymentId
 * @access  Private
 */
exports.getPaypalPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    paypal.payment.get(paymentId, (error, payment) => {
      if (error) {
        console.error('PayPal get payment error:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy thông tin thanh toán PayPal',
          error: error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: payment,
        message: 'Lấy thông tin thanh toán PayPal thành công'
      });
    });
  } catch (error) {
    console.error('Get PayPal payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin thanh toán PayPal',
      error: error.message
    });
  }
};

/**
 * @desc    Refund a PayPal payment
 * @route   POST /api/payments/paypal/refund
 * @access  Private (Admin only)
 */
exports.refundPaypalPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'ID thanh toán là bắt buộc'
      });
    }
    
    // Find the payment in our database
    const payment = await Payment.findById(paymentId).populate('appointmentId');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }
    
    if (payment.paymentMethod !== 'paypal' || payment.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hoàn tiền cho thanh toán PayPal đã hoàn thành'
      });
    }
    
    // Get the PayPal sale ID
    paypal.payment.get(payment.transactionId, (error, paypalPayment) => {
      if (error) {
        console.error('PayPal get payment error:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy thông tin thanh toán PayPal',
          error: error.message
        });
      }
      
      // Get the sale ID from the transactions
      const saleId = paypalPayment.transactions[0].related_resources[0].sale.id;
      
      // Prepare refund data
      const refundData = {
        amount: {
          currency: 'USD',
          total: amount || payment.amount.toFixed(2)
        },
        description: reason || 'Hoàn tiền cho khách hàng'
      };
      
      // Process the refund
      paypal.sale.refund(saleId, refundData, async (refundError, refundDetails) => {
        if (refundError) {
          console.error('PayPal refund error:', refundError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi hoàn tiền PayPal',
            error: refundError.message
          });
        }
        
        // Update payment status to REFUNDED
        payment.paymentStatus = 'refunded';
        payment.refundAmount = amount || payment.amount;
        payment.refundReason = reason || 'Hoàn tiền cho khách hàng';
        payment.refundDate = new Date();
        await payment.save();
        
        // Update appointment status
        await Appointment.findByIdAndUpdate(
          payment.appointmentId._id,
          { 
            $set: { 
              paymentStatus: 'refunded',
              status: 'cancelled',
              cancellationReason: reason || 'Hoàn tiền thanh toán',
              cancelledBy: 'admin'
            } 
          }
        );
        
        res.status(200).json({
          success: true,
          data: {
            refundId: refundDetails.id,
            status: refundDetails.state
          },
          message: 'Hoàn tiền PayPal thành công'
        });
      });
    });
  } catch (error) {
    console.error('Refund PayPal payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hoàn tiền PayPal',
      error: error.message
    });
  }
}; 