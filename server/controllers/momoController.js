const crypto = require('crypto');
const https = require('https');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// MoMo API configuration
const momoConfig = {
  // Use environment variables in production
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/payment/result',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payments/momo/ipn',
};

/**
 * Create MoMo payment request
 * @route POST /api/payments/momo/create
 * @access Private
 */
exports.createMomoPayment = async (req, res) => {
  try {
    console.log('MoMo payment request received:', req.body);
    
    const { appointmentId, amount, orderInfo = 'Thanh toán dịch vụ khám bệnh' } = req.body;

    if (!appointmentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán cần thiết'
      });
    }

    // Find appointment to verify it exists
    console.log('Finding appointment with ID:', appointmentId);
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    console.log('Appointment found:', {
      id: appointment._id,
      status: appointment.status
    });
    
    // Safely access related IDs with proper error handling
    let doctorId, serviceId, userId;
    
    try {
      // Handle potential different data structures
      doctorId = appointment.doctorId;
      serviceId = appointment.serviceId;
      userId = req.user._id;
      
      // Log the actual data structure for debugging
      console.log('Data structure check:', {
        appointmentData: {
          doctorId: appointment.doctorId,
          serviceId: appointment.serviceId,
          doctorIdType: typeof appointment.doctorId
        },
        userId: userId
      });
      
      // Convert to string if it's an object with _id
      if (doctorId && typeof doctorId === 'object' && doctorId._id) {
        doctorId = doctorId._id;
      }
      
      if (serviceId && typeof serviceId === 'object' && serviceId._id) {
        serviceId = serviceId._id;
      }
      
      // Verify IDs exist
      if (!doctorId || !serviceId || !userId) {
        console.error('Missing required IDs:', { doctorId, serviceId, userId });
        throw new Error('Thiếu thông tin bắt buộc (doctorId, serviceId hoặc userId)');
      }
    } catch (error) {
      console.error('Error processing appointment data:', error);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu lịch hẹn không hợp lệ',
        error: error.message
      });
    }

    // Generate unique order ID
    const orderId = `HOSWEB${Date.now()}`;
    const requestId = orderId;

    // Create request body - use dynamic URLs or fallback to config
    const redirectUrl = req.body.redirectUrl || momoConfig.redirectUrl;
    const ipnUrl = momoConfig.ipnUrl;
    
    console.log('Using URLs:', { redirectUrl, ipnUrl });
    
    // Generate raw signature
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;
    
    console.log('Raw signature:', rawSignature);
    
    // Create HMAC SHA256 signature
    const signature = crypto.createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');
      
    console.log('Generated signature:', signature);

    // Create payment record in database with pending status
    const existingPayment = await Payment.findOne({ appointmentId: appointmentId });

    if (existingPayment) {
      // Update existing payment
      existingPayment.amount = amount;
      existingPayment.originalAmount = amount;
      existingPayment.paymentMethod = 'momo';
      existingPayment.paymentStatus = 'pending';
      existingPayment.transactionId = orderId;
      existingPayment.paymentDetails = {
        orderId: orderId,
        requestId: requestId
      };
      
      await existingPayment.save();
    } else {
      // Create new payment
      const payment = new Payment({
        userId: userId,
        appointmentId: appointmentId,
        doctorId: doctorId,
        serviceId: serviceId,
        amount: amount,
        originalAmount: amount,
        paymentMethod: 'momo',
        paymentStatus: 'pending',
        transactionId: orderId,
        paymentDetails: {
          orderId: orderId,
          requestId: requestId
        }
      });

      await payment.save();
      console.log('Payment record created with ID:', payment._id);

      // Update appointment payment status
      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentMethod: 'momo',
        paymentStatus: 'pending'
      });
      
      console.log('Appointment payment status updated');
    }

    // Prepare request body
    const requestBody = JSON.stringify({
      partnerCode: momoConfig.partnerCode,
      partnerName: "Hospital Web",
      storeId: "HOSWEB",
      requestId: requestId,
      amount: parseInt(amount), // Ensure amount is an integer
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: "vi",
      requestType: "payWithMethod",
      autoCapture: true,
      extraData: '',
      orderGroupId: '',
      signature: signature
    });
    
    console.log('MoMo request payload (sanitized):', {
      ...JSON.parse(requestBody),
      signature: '***' // Hide signature in logs
    });

    // Make request to MoMo API
    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    // Create promise for HTTP request
    try {
      const momoResponse = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              console.log('MoMo API response:', jsonData);
              resolve(jsonData);
            } catch (error) {
              console.error('Error parsing MoMo response:', error, data);
              reject(error);
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('HTTPS request error:', error);
          reject(error);
        });
        
        req.write(requestBody);
        req.end();
      });

      // Check MoMo response
      if (momoResponse.resultCode === 0) {
        // Return success with payment URL
        return res.status(200).json({
          success: true,
          message: 'Tạo thanh toán MoMo thành công',
          orderId: orderId,
          payUrl: momoResponse.payUrl
        });
      } else {
        // Handle failed MoMo payment creation
        console.error('MoMo API returned error:', momoResponse);
        
        await Payment.findOneAndUpdate(
          { transactionId: orderId },
          { paymentStatus: 'failed', paymentDetails: momoResponse }
        );
        
        return res.status(400).json({
          success: false,
          message: `Không thể tạo thanh toán MoMo: ${momoResponse.message || 'Lỗi không xác định'}`,
          error: momoResponse
        });
      }
    } catch (apiError) {
      console.error('Error communicating with MoMo API:', apiError);
      
      // Update payment record to failed
      await Payment.findOneAndUpdate(
        { 'paymentDetails.orderId': orderId },
        { paymentStatus: 'failed', paymentDetails: { error: apiError.message }}
      );
      
      return res.status(500).json({
        success: false,
        message: 'Lỗi kết nối đến cổng thanh toán MoMo',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('MoMo payment creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán MoMo',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Handle MoMo IPN (Instant Payment Notification)
 * @route POST /api/payments/momo/ipn
 * @access Public
 */
exports.momoIPN = async (req, res) => {
  try {
    const { orderId, resultCode, message, transId, amount } = req.body;
    
    // Log the IPN data
    console.log('MoMo IPN received:', req.body);
    
    // Find payment in database
    const payment = await Payment.findOne({ 'paymentDetails.orderId': orderId });
    
    if (!payment) {
      console.error('Payment not found for order:', orderId);
      return res.status(200).json({ message: 'OK, but payment not found' });
    }
    
    // Validate signature (important for security)
    // TODO: Implement proper signature validation
    
    // Update payment status based on resultCode
    if (resultCode === 0) {
      // Payment successful
      payment.paymentStatus = 'paid';
      payment.paidAt = Date.now();
      payment.transactionId = transId;
      payment.paymentDetails = { ...payment.paymentDetails, ...req.body };
      
      // Update appointment status
      const appointment = await Appointment.findById(payment.appointmentId);
      if (appointment) {
        appointment.paymentStatus = 'paid';
        appointment.paymentMethod = 'momo';
        
        // Automatically confirm appointment if it's pending, like PayPal
        if (appointment.status === 'pending') {
          appointment.status = 'confirmed';
        }
        
        await appointment.save();
      } else {
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
          paymentStatus: 'paid',
          paymentMethod: 'momo'
        });
      }
    } else {
      // Payment failed
      payment.paymentStatus = 'failed';
      payment.paymentDetails = { ...payment.paymentDetails, ...req.body };
    }
    
    await payment.save();
    
    // Always return 200 for IPN
    return res.status(200).json({ message: 'IPN received successfully' });
  } catch (error) {
    console.error('MoMo IPN processing error:', error);
    // Always return 200 for IPN even if there's an error
    return res.status(200).json({ message: 'IPN received, but encountered an error' });
  }
};

/**
 * Process MoMo payment result
 * @route GET /api/payments/momo/result
 * @access Public
 */
exports.momoPaymentResult = async (req, res) => {
  try {
    const { orderId, resultCode } = req.query;
    
    // Log the incoming data for debugging
    console.log('MoMo result received:', { 
      orderId, 
      resultCode, 
      resultCodeType: typeof resultCode,
      allParams: req.query 
    });
    
    // Find payment in database
    const payment = await Payment.findOne({ 'paymentDetails.orderId': orderId });
    
    if (!payment) {
      console.error('Payment not found for orderId:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }

    console.log('Found payment:', { 
      id: payment._id, 
      status: payment.paymentStatus,
      appointmentId: payment.appointmentId
    });
    
    // Update payment status if not already updated by IPN
    if (payment.paymentStatus === 'pending') {
      // Check resultCode as string or number (MoMo returns as string in URL param)
      if (resultCode === '0' || resultCode === 0) {
        payment.paymentStatus = 'paid';
        payment.paidAt = Date.now();
        payment.paymentDetails = { 
          ...payment.paymentDetails, 
          ...req.query,
          processedAt: new Date().toISOString() 
        };
        
        try {
          // Save payment first
          await payment.save();
          console.log('Payment updated successfully');
          
          // Find appointment
          const appointmentId = payment.appointmentId;
          console.log('Looking for appointment with ID:', appointmentId);
          
          // Update appointment status - with better error handling
          try {
            const appointment = await Appointment.findById(appointmentId);
            
            if (appointment) {
              console.log('Found appointment:', { 
                id: appointment._id, 
                status: appointment.status,
                paymentStatus: appointment.paymentStatus
              });
              
              appointment.paymentStatus = 'paid';
              appointment.paymentMethod = 'momo';
              
              // Automatically confirm appointment if it's pending, like PayPal
              if (appointment.status === 'pending') {
                appointment.status = 'confirmed';
              }
              
              await appointment.save();
              console.log('Appointment updated successfully');
            } else {
              console.error('Appointment not found for ID:', appointmentId);
            }
          } catch (appointmentError) {
            console.error('Error updating appointment:', appointmentError);
            // Continue execution even if appointment update fails
          }
        } catch (saveError) {
          console.error('Error saving payment:', saveError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái thanh toán',
            error: saveError.message
          });
        }
      } else {
        payment.paymentStatus = 'failed';
        payment.paymentDetails = { ...payment.paymentDetails, ...req.query };
        
        try {
          await payment.save();
          console.log('Payment marked as failed');
        } catch (saveError) {
          console.error('Error saving failed payment:', saveError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái thanh toán thất bại',
            error: saveError.message
          });
        }
      }
    } else {
      console.log('Payment already processed, status:', payment.paymentStatus);
    }
    
    // Return payment status
    return res.status(200).json({
      success: true,
      paymentStatus: payment.paymentStatus,
      appointmentId: payment.appointmentId,
      message: (resultCode === '0' || resultCode === 0) ? 'Thanh toán thành công' : 'Thanh toán thất bại'
    });
  } catch (error) {
    console.error('MoMo payment result processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý kết quả thanh toán',
      error: error.message
    });
  }
};

/**
 * Verify MoMo payment status
 * @route GET /api/payments/momo/status/:orderId
 * @access Private
 */
exports.checkMomoPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find payment in database
    const payment = await Payment.findOne({ 'paymentDetails.orderId': orderId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }
    
    return res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.paymentStatus,
        amount: payment.amount,
        appointmentId: payment.appointmentId,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt
      }
    });
  } catch (error) {
    console.error('Check MoMo payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán',
      error: error.message
    });
  }
}; 