const crypto = require('crypto');
const https = require('https');
// Payment model removed from flow; rely on Bill/BillPayment
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// Build origin string from incoming request (used to avoid localhost redirects on mobile)
const getRequestOrigin = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return host ? `${protocol}://${host}` : '';
};

// Resolve redirect and IPN URLs so they work on real devices (no localhost)
const resolveMomoUrls = (req) => {
  const origin = getRequestOrigin(req);
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const envRedirect = (process.env.MOMO_REDIRECT_URL || '').trim();
  const envIpn = (process.env.MOMO_IPN_URL || '').trim();
  const envBase = (process.env.BASE_URL || '').replace(/\/$/, '');
  const shouldSwapBase =
    envBase.includes('localhost') &&
    origin &&
    !origin.includes('localhost');
  const baseApiUrl = (shouldSwapBase ? origin : envBase || origin).replace(/\/$/, '');

  // Priority: client override -> env -> frontend -> API fallback
  let redirectUrl =
    (req.body?.redirectUrl || '').trim() ||
    envRedirect ||
    (frontendUrl ? `${frontendUrl}/payment/result` : '') ||
    (baseApiUrl ? `${baseApiUrl}/api/payments/momo/result` : '');

  let ipnUrl =
    (req.body?.ipnUrl || '').trim() ||
    envIpn ||
    (baseApiUrl ? `${baseApiUrl}/api/payments/momo/ipn` : '');

  // If redirect points to localhost but request comes from another host (mobile), swap host
  if (redirectUrl && redirectUrl.includes('localhost') && origin && !origin.includes('localhost')) {
    try {
      const redirect = new URL(redirectUrl);
      const currentOrigin = new URL(origin);
      redirect.hostname = currentOrigin.hostname;
      // Keep explicit port if provided on redirect URL, otherwise reuse API port
      if (!redirect.port && currentOrigin.port) {
        redirect.port = currentOrigin.port;
      }
      redirectUrl = redirect.toString();
    } catch (e) {
      console.warn('Failed to normalize MoMo redirect URL:', e.message);
    }
  }

  return { redirectUrl, ipnUrl };
};

// MoMo API configuration
const momoConfig = {
  // Use environment variables in production
  accessKey: process.env.MOMO_ACCESS_KEY ,
  secretKey: process.env.MOMO_SECRET_KEY ,
  partnerCode: process.env.MOMO_PARTNER_CODE ,
  endpoint: process.env.MOMO_ENDPOINT ,
  redirectUrl: process.env.MOMO_REDIRECT_URL ,
  ipnUrl: process.env.MOMO_IPN_URL ,
};

const decodeMomoExtraData = (rawExtraData) => {
  if (!rawExtraData) return null;
  if (typeof rawExtraData === 'object') return rawExtraData;
  try {
    const decoded = Buffer.from(rawExtraData, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode MoMo extraData:', error.message);
    return null;
  }
};

// Shared handler: finalize a MoMo payment (update Bill/BillPayment/Appointment) and return status data
const processMomoPaymentResultCore = async (query) => {
  const { orderId, resultCode } = query;
  if (!orderId) {
    return { error: { status: 400, message: 'Missing orderId in MoMo response' } };
  }

  const BillPayment = require('../models/BillPayment');

  let payment = await BillPayment.findOne({
    $or: [
      { 'paymentDetails.orderId': orderId },
      { transactionId: orderId },
      { 'paymentDetails.momoResponse.orderId': orderId }
    ]
  }).populate('appointmentId billId');

  if (!payment) {
    payment = await BillPayment.findOne({ transactionId: orderId }).populate('appointmentId billId');
    if (!payment) {
      return { error: { status: 404, message: 'Khong tim thay thanh toan' } };
    }
  }

  const extraData =
    decodeMomoExtraData(query.extraData) ||
    decodeMomoExtraData(payment.paymentDetails?.extraData) ||
    decodeMomoExtraData(payment.paymentDetails?.momoResponse?.extraData);
  const resolvedBillType = extraData?.billType || payment.billType;
  const resolvedAppointmentId = extraData?.appointmentId || (payment.appointmentId?._id || payment.appointmentId);
  const resolvedPrescriptionId = extraData?.prescriptionId;
  const transactionId = query.transId || payment.transactionId || orderId;

  // Ensure downstream Bill + Appointment are consistent (idempotent)
  const ensureBillAndAppointmentUpdated = async () => {
    try {
      const Bill = require('../models/Bill');
      let bill = payment.billId ? await Bill.findById(payment.billId) : null;
      if (!bill && resolvedAppointmentId) {
        bill = await Bill.findOne({ appointmentId: resolvedAppointmentId });
      }

      if (bill && resolvedBillType) {
        if (resolvedBillType === 'consultation' && bill.consultationBill?.amount > 0) {
          if (bill.consultationBill.status !== 'paid') {
            bill.consultationBill.status = 'paid';
            bill.consultationBill.paymentMethod = 'momo';
            bill.consultationBill.paymentDate = bill.consultationBill.paymentDate || new Date();
            bill.consultationBill.transactionId = transactionId;
            bill.consultationBill.paymentDetails =
              bill.consultationBill.paymentDetails || payment.paymentDetails || query;
          }
        } else if (resolvedBillType === 'medication') {
          if (resolvedPrescriptionId) {
            if (bill.medicationBill?.amount > 0 && bill.medicationBill.status !== 'paid') {
              bill.medicationBill.status = 'paid';
              bill.medicationBill.paymentMethod = 'momo';
              bill.medicationBill.paymentDate = bill.medicationBill.paymentDate || new Date();
              bill.medicationBill.transactionId = transactionId;
            }
          } else if (bill.medicationBill?.amount > 0 && bill.medicationBill.status !== 'paid') {
            bill.medicationBill.status = 'paid';
            bill.medicationBill.paymentMethod = 'momo';
            bill.medicationBill.paymentDate = bill.medicationBill.paymentDate || new Date();
            bill.medicationBill.transactionId = transactionId;
          }
        } else if (resolvedBillType === 'hospitalization' && bill.hospitalizationBill?.amount > 0) {
          if (bill.hospitalizationBill.status !== 'paid') {
            bill.hospitalizationBill.status = 'paid';
            bill.hospitalizationBill.paymentMethod = 'momo';
            bill.hospitalizationBill.paymentDate = bill.hospitalizationBill.paymentDate || new Date();
            bill.hospitalizationBill.transactionId = transactionId;
          }
        }
        await bill.save();
      }

      const appointmentId = payment.appointmentId?._id || payment.appointmentId || resolvedAppointmentId;
      if (appointmentId) {
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
          appointment.paymentStatus = 'completed';
          appointment.paymentMethod = appointment.paymentMethod || 'momo';
          if (appointment.status === 'pending' || appointment.status === 'pending_payment') {
            appointment.status = 'confirmed';
          }
          await appointment.save();
        }
      }
    } catch (e) {
      console.error('ensureBillAndAppointmentUpdated error (shared MoMo handler):', e);
    }
  };

  if (payment.paymentStatus === 'pending') {
    if (resultCode === '0' || resultCode === 0) {
      payment.paymentStatus = 'completed';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        ...query,
        processedAt: new Date().toISOString()
      };

      try {
        const Bill = require('../models/Bill');
        let bill = payment.billId ? await Bill.findById(payment.billId) : null;
        if (!bill && resolvedAppointmentId) {
          bill = await Bill.findOne({ appointmentId: resolvedAppointmentId });
        }

        if (bill && resolvedBillType) {
          if (resolvedBillType === 'consultation' && bill.consultationBill?.amount > 0) {
            if (bill.consultationBill.status !== 'paid') {
              bill.consultationBill.status = 'paid';
              bill.consultationBill.paymentMethod = 'momo';
              bill.consultationBill.paymentDate = new Date();
              bill.consultationBill.transactionId = transactionId;
              bill.consultationBill.paymentDetails = {
                ...bill.consultationBill.paymentDetails,
                ...payment.paymentDetails,
                resultCode: resultCode,
                processedAt: new Date().toISOString()
              };
            }
          } else if (resolvedBillType === 'medication') {
            if (resolvedPrescriptionId) {
              const billingController = require('./billingController');
              const patientId =
                (payment.patientId && payment.patientId._id) ? payment.patientId._id : payment.patientId;
              try {
                await billingController.payPrescription({
                  body: {
                    prescriptionId: resolvedPrescriptionId,
                    paymentMethod: 'momo',
                    transactionId,
                    paymentDetails: payment.paymentDetails
                  },
                  user: { id: patientId || bill.patientId }
                }, {
                  json: () => {},
                  status: () => ({ json: () => {} })
                });
              } catch (prescriptionPayError) {
                console.error('Error paying prescription via shared MoMo result:', prescriptionPayError);
                if (bill.medicationBill?.amount > 0) {
                  bill.medicationBill.status = 'paid';
                  bill.medicationBill.paymentMethod = 'momo';
                  bill.medicationBill.paymentDate = new Date();
                  bill.medicationBill.transactionId = transactionId;
                  bill.medicationBill.paymentDetails = payment.paymentDetails;
                }
              }
            } else if (bill.medicationBill?.amount > 0) {
              bill.medicationBill.status = 'paid';
              bill.medicationBill.paymentMethod = 'momo';
              bill.medicationBill.paymentDate = new Date();
              bill.medicationBill.transactionId = transactionId;
              bill.medicationBill.paymentDetails = payment.paymentDetails;
            }
          } else if (resolvedBillType === 'hospitalization' && bill.hospitalizationBill?.amount > 0) {
            bill.hospitalizationBill.status = 'paid';
            bill.hospitalizationBill.paymentMethod = 'momo';
            bill.hospitalizationBill.paymentDate = new Date();
            bill.hospitalizationBill.transactionId = transactionId;
            bill.hospitalizationBill.paymentDetails = payment.paymentDetails;
          }

          await bill.save();
        }

        const appointmentId = payment.appointmentId?._id || payment.appointmentId;
        if (appointmentId) {
          const appointment = await Appointment.findById(appointmentId);
          if (appointment) {
            appointment.paymentStatus = 'completed';
            appointment.paymentMethod = 'momo';
            if (appointment.status === 'pending' || appointment.status === 'pending_payment') {
              appointment.status = 'confirmed';
            }
            await appointment.save();
          }
        }
      } catch (updateError) {
        console.error('Error updating entities from MoMo result (shared):', updateError);
      }

      await payment.save();
    } else {
      payment.paymentStatus = 'failed';
      payment.paymentDetails = { ...payment.paymentDetails, ...query };
      await payment.save();
    }
  } else {
    console.log('Payment already processed, status:', payment.paymentStatus);
  }

  if (payment.paymentStatus === 'completed') {
    await ensureBillAndAppointmentUpdated();
  }

  const responseData = {
    success: true,
    paymentStatus: payment.paymentStatus,
    appointmentId: payment.appointmentId?._id || payment.appointmentId,
    message: (resultCode === '0' || resultCode === 0) ? 'Thanh toan thanh cong' : 'Thanh toan that bai',
    orderId: orderId
  };

  if (payment.paymentStatus === 'completed' && payment.billId) {
    const Bill = require('../models/Bill');
    const bill = await Bill.findById(payment.billId);
    if (bill) {
      responseData.bill = {
        _id: bill._id,
        billNumber: bill.billNumber,
        overallStatus: bill.overallStatus
      };
    }
  }

  return { payment, responseData };
};

/**
 * Create MoMo payment request
 * @route POST /api/payments/momo/create
 * @access Private
 */
exports.createMomoPayment = async (req, res) => {
  try {
    console.log('MoMo payment request received:', req.body);
    
    const { appointmentId, amount, billType = 'consultation', prescriptionId, orderInfo = 'Thanh toán dịch vụ khám bệnh' } = req.body;

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

    // Create request body - use dynamic URLs or fallback to request origin/env
    const { redirectUrl, ipnUrl } = resolveMomoUrls(req);

    if (!redirectUrl || !ipnUrl) {
      console.error('Missing MoMo redirect or IPN URL', { redirectUrl, ipnUrl });
      return res.status(500).json({
        success: false,
        message: 'Thiếu cấu hình URL cho MoMo (redirect hoặc IPN)'
      });
    }
    
    console.log('Using URLs:', { redirectUrl, ipnUrl });
    
    // Generate raw signature
    const extraDataObj = { appointmentId, billType };
    if (prescriptionId) {
      extraDataObj.prescriptionId = prescriptionId;
    }
    const extraDataB64 = Buffer.from(JSON.stringify(extraDataObj)).toString('base64');
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraDataB64}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;
    
    console.log('Raw signature:', rawSignature);
    
    // Create HMAC SHA256 signature
    const signature = crypto.createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');
      
    console.log('Generated signature:', signature);

    // Do not persist temporary Payment; rely on IPN to update Bill/BillPayment

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
      extraData: extraDataB64,
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
        // Create BillPayment record with pending status to track the payment
        try {
          const Bill = require('../models/Bill');
          const BillPayment = require('../models/BillPayment');
          
          // Get or create Bill
          let bill = await Bill.findOne({ appointmentId });
          if (!bill) {
            bill = await Bill.create({
              appointmentId,
              patientId: userId,
              doctorId,
              serviceId,
              consultationBill: {
                amount: amount,
                originalAmount: amount,
                status: 'pending',
                paymentMethod: 'momo'
              }
            });
          } else {
            // Update consultationBill if billType is consultation
            if (billType === 'consultation') {
              if (bill.consultationBill.status !== 'paid') {
                bill.consultationBill.amount = amount;
                bill.consultationBill.originalAmount = amount;
                bill.consultationBill.status = 'pending';
                bill.consultationBill.paymentMethod = 'momo';
              }
            }
            if (!bill.doctorId) bill.doctorId = doctorId;
            if (!bill.serviceId) bill.serviceId = serviceId;
            await bill.save();
          }
          
          // Create BillPayment record with pending status
          await BillPayment.create({
            billId: bill._id,
            appointmentId,
            patientId: userId,
            billType: billType,
            amount: amount,
            paymentMethod: 'momo',
            paymentStatus: 'pending',
            transactionId: orderId, // Use orderId as transactionId temporarily
            paymentDetails: {
              orderId: orderId,
              requestId: requestId,
              extraData: extraDataB64,
              momoResponse: momoResponse
            }
          });
          
          console.log(`Created pending BillPayment for orderId: ${orderId}`);
        } catch (billError) {
          console.error('Error creating BillPayment for MoMo payment:', billError);
          // Don't fail the request, payment can still proceed
        }
        
        // Return success with payment URL
        return res.status(200).json({
          success: true,
          message: 'Tạo thanh toán MoMo thành công',
          orderId: orderId,
          payUrl: momoResponse.payUrl,
          deeplink: momoResponse.deeplink || momoResponse.deepLink || momoResponse.deeplinkWebInApp || '',
          qrCodeUrl: momoResponse.qrCodeUrl || momoResponse.qrCode || ''
        });
      } else {
        // Handle failed MoMo payment creation
        console.error('MoMo API returned error:', momoResponse);
        return res.status(400).json({
          success: false,
          message: `Không thể tạo thanh toán MoMo: ${momoResponse.message || 'Lỗi không xác định'}`,
          error: momoResponse
        });
      }
    } catch (apiError) {
      console.error('Error communicating with MoMo API:', apiError);
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
    
    // Validate signature (important for security)
    // TODO: Implement proper signature validation
    
    // Update payment status based on resultCode
    if (resultCode === 0) {
      // Payment successful - update Bill/BillPayment
    } else {
      // Payment failed - do nothing
    }
    // Update Bill and BillPayment for partial billType payments
    try {
      const extraData = decodeMomoExtraData(req.body.extraData);
      const billType = extraData?.billType;
      const appointmentId = extraData?.appointmentId;
      const prescriptionId = extraData?.prescriptionId;
      
      if (billType && resultCode === 0 && appointmentId) {
        const Bill = require('../models/Bill');
        const BillPayment = require('../models/BillPayment');
        const bill = await Bill.findOne({ appointmentId });
        if (bill) {
          const amount = Number(req.body.amount) || 0;
          
          // Find existing pending BillPayment by orderId
          let billPayment = await BillPayment.findOne({
            $or: [
              { 'paymentDetails.orderId': req.body.orderId },
              { transactionId: req.body.orderId }
            ],
            billId: bill._id,
            billType: billType,
            paymentStatus: 'pending'
          });
          
          if (billType === 'consultation' && bill.consultationBill?.amount > 0) {
            bill.consultationBill.status = 'paid';
            bill.consultationBill.paymentMethod = 'momo';
            bill.consultationBill.paymentDate = new Date();
            bill.consultationBill.transactionId = req.body.transId || req.body.orderId;
            bill.consultationBill.paymentDetails = req.body;
          } else if (billType === 'medication') {
            // If prescriptionId is provided, pay individual prescription
            if (prescriptionId) {
              const billingController = require('./billingController');
              try {
                await billingController.payPrescription({
                  body: {
                    prescriptionId: prescriptionId,
                    paymentMethod: 'momo',
                    transactionId: req.body.transId,
                    paymentDetails: req.body
                  },
                  user: { id: bill.patientId } // Use patient as user for IPN
                }, {
                  json: (data) => {},
                  status: () => ({ json: () => {} })
                });
              } catch (prescriptionPayError) {
                console.error('Error paying prescription via MoMo IPN:', prescriptionPayError);
                // Fallback to old medication bill payment
                if (bill.medicationBill?.amount > 0) {
                  bill.medicationBill.status = 'paid';
                  bill.medicationBill.paymentMethod = 'momo';
                  bill.medicationBill.paymentDate = new Date();
                  bill.medicationBill.transactionId = req.body.transId;
                }
              }
            } else if (bill.medicationBill?.amount > 0) {
              // Legacy: pay entire medication bill
              bill.medicationBill.status = 'paid';
              bill.medicationBill.paymentMethod = 'momo';
              bill.medicationBill.paymentDate = new Date();
              bill.medicationBill.transactionId = req.body.transId;
            }
          } else if (billType === 'hospitalization' && bill.hospitalizationBill?.amount > 0) {
            bill.hospitalizationBill.status = 'paid';
            bill.hospitalizationBill.paymentMethod = 'momo';
            bill.hospitalizationBill.paymentDate = new Date();
            bill.hospitalizationBill.transactionId = req.body.transId;
          }
          await bill.save();

          // Update existing BillPayment or create new one
          if (billPayment) {
            // Update existing pending payment
            billPayment.paymentStatus = 'completed';
            billPayment.transactionId = req.body.transId || req.body.orderId;
            billPayment.paymentDetails = {
              ...billPayment.paymentDetails,
              ...req.body,
              ipnReceived: true,
              ipnReceivedAt: new Date().toISOString()
            };
            await billPayment.save();
            console.log(`Updated BillPayment ${billPayment._id} to completed via IPN`);
          } else {
            // Create new BillPayment if not found (shouldn't happen, but just in case)
            await BillPayment.create({
              paymentNumber: undefined, // auto-generated by pre-validate
              billId: bill._id,
              appointmentId: bill.appointmentId,
              patientId: bill.patientId,
              billType,
              amount: amount,
              paymentMethod: 'momo',
              paymentStatus: 'completed',
              transactionId: req.body.transId || req.body.orderId,
              paymentDetails: {
                ...req.body,
                ipnReceived: true,
                ipnReceivedAt: new Date().toISOString()
              }
            });
            console.log(`Created new BillPayment via IPN for orderId: ${req.body.orderId}`);
          }

          // Keep appointment in sync with successful payment
          try {
            const appointment = await Appointment.findById(appointmentId);
            if (appointment) {
              appointment.paymentStatus = 'completed';
              appointment.paymentMethod = appointment.paymentMethod || 'momo';
              if (appointment.status === 'pending' || appointment.status === 'pending_payment') {
                appointment.status = 'confirmed';
              }
              await appointment.save();
            }
          } catch (appointmentSyncError) {
            console.error('Error updating appointment from MoMo IPN:', appointmentSyncError);
          }
        }
      }
    } catch (e) {
      console.error('Failed to update Bill from MoMo IPN:', e);
    }
    
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
    
    console.log('MoMo result received:', {
      orderId,
      resultCode,
      resultCodeType: typeof resultCode,
      allParams: req.query
    });

    const result = await processMomoPaymentResultCore(req.query);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
        orderId
      });
    }

    const { payment, responseData } = result;

    // If MoMo opens this URL directly in a browser (common on mobile), show a friendly page with a link back to the app
    const acceptHeader = (req.get('accept') || '').toLowerCase();
    const wantsHtml = acceptHeader.includes('text/html');
    if (wantsHtml && !req.xhr) {
      const statusText = responseData.paymentStatus === 'completed' ? 'Thanh toan thanh cong' : 'Thanh toan that bai';
      const appScheme = process.env.MOBILE_APP_SCHEME || 'hospitalapp';
      const androidPackage = process.env.MOBILE_ANDROID_PACKAGE || 'com.example.hospital_mobile_app';
      const appLink = `${appScheme}://payment-result?orderId=${encodeURIComponent(orderId || '')}&resultCode=${encodeURIComponent(resultCode || '')}&status=${responseData.paymentStatus}`;
      const intentLink = `intent://payment-result?orderId=${encodeURIComponent(orderId || '')}&resultCode=${encodeURIComponent(resultCode || '')}#Intent;scheme=${appScheme};package=${androidPackage};end`;
      const safeMessage = responseData.message || statusText;

      const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${statusText}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f7fb; margin: 0; padding: 16px; color: #1f2937; }
    .card { max-width: 420px; margin: 24px auto; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .status { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .badge { padding: 6px 12px; border-radius: 999px; font-weight: 600; font-size: 13px; }
    .success { color: #0f5132; background: #d1e7dd; }
    .failed { color: #842029; background: #f8d7da; }
    .order { font-size: 14px; color: #4b5563; margin: 6px 0; word-break: break-all; }
    .btn { display: inline-block; margin-top: 14px; padding: 12px 16px; border-radius: 10px; text-decoration: none; font-weight: 700; text-align: center; width: 100%; box-sizing: border-box; }
    .btn-primary { background: #7c3aed; color: #fff; }
    .btn-secondary { background: #e5e7eb; color: #111827; }
    .hint { font-size: 13px; color: #6b7280; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status">
      <span class="badge ${responseData.paymentStatus === 'completed' ? 'success' : 'failed'}">${statusText}</span>
    </div>
    <div class="order"><strong>Don hang:</strong> ${orderId || 'N/A'}</div>
    <div class="order"><strong>Ma giao dich:</strong> ${payment.transactionId || 'N/A'}</div>
    <div class="order"><strong>Thong bao:</strong> ${safeMessage}</div>
    <a class="btn btn-primary" href="${intentLink}">Mo ung dung</a>
    <a class="btn btn-secondary" href="${appLink}">Thu mo bang link</a>
    <div class="hint">Neu ung dung khong tu mo, ban co the nhan vao nut o tren.</div>
  </div>
  <script>
    setTimeout(function() { window.location.href = '${appLink}'; }, 50);
    setTimeout(function() { window.location.href = '${intentLink}'; }, 800);
  </script>
</body>
</html>`;

      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('MoMo payment result processing error:', error);
    return res.status(500).json({
      success: false,
      message: '??A? x???y ra l??-i khi x??- lA? k???t qu??? thanh toA?n',
      error: error.message
    });
  }
};
/**
 * Process MoMo payment result for mobile deep link
 * @route GET /api/payments/momo/result/mobile
 * @access Public
 */
exports.momoPaymentResultMobile = async (req, res) => {
  try {
    const { orderId, resultCode } = req.query;
    const appScheme = process.env.MOBILE_APP_SCHEME || 'hospitalapp';
    const androidPackage = process.env.MOBILE_ANDROID_PACKAGE || 'com.example.hospital_mobile_app';

    console.log('MoMo mobile redirect received:', { orderId, resultCode });

    const result = await processMomoPaymentResultCore(req.query);
    if (result.error) {
      const params = new URLSearchParams();
      if (orderId) params.set('orderId', orderId);
      if (resultCode !== undefined) params.set('resultCode', String(resultCode));
      params.set('status', 'failed');
      params.set('message', result.error.message || 'MoMo payment not found');
      const deepLink = `${appScheme}://payment/result?${params.toString()}`;
      return res.redirect(deepLink);
    }

    const { payment, responseData } = result;

    const buildDeepLink = () => {
      const params = new URLSearchParams();
      if (orderId) params.set('orderId', orderId);
      if (resultCode !== undefined) params.set('resultCode', String(resultCode));
      params.set('status', responseData.paymentStatus || payment.paymentStatus || 'unknown');
      if (req.query.message || responseData.message) {
        params.set('message', req.query.message || responseData.message);
      }
      if (req.query.transId || payment.transactionId) {
        params.set('transId', req.query.transId || payment.transactionId);
      }
      if (req.query.extraData) params.set('extraData', req.query.extraData);
      return `${appScheme}://payment/result?${params.toString()}`;
    };

    const deepLink = buildDeepLink();
    const intentLink = `intent://payment-result?orderId=${encodeURIComponent(orderId || '')}&resultCode=${encodeURIComponent(resultCode || '')}#Intent;scheme=${appScheme};package=${androidPackage};end`;

    console.log('Redirecting to deep link:', deepLink);

    const acceptHeader = (req.get('accept') || '').toLowerCase();
    const wantsHtml = acceptHeader.includes('text/html');
    if (wantsHtml && !req.xhr) {
      const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta http-equiv="refresh" content="0;url=${deepLink}" /></head>
<body style="font-family: Arial, sans-serif; padding: 16px;">
  <p>Redirecting back to the app...</p>
  <p><a href="${deepLink}">Open app</a></p>
  <script>
    setTimeout(function(){ window.location.href='${deepLink}'; }, 50);
    setTimeout(function(){ window.location.href='${intentLink}'; }, 800);
  </script>
</body></html>`;
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    return res.redirect(deepLink);
  } catch (error) {
    console.error('MoMo mobile result processing error:', error);
    const appScheme = process.env.MOBILE_APP_SCHEME || 'hospitalapp';
    const fallback = `${appScheme}://payment/result?resultCode=-1&status=failed&message=${encodeURIComponent(error.message || 'error')}`;
    return res.redirect(fallback);
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
    
    // Find payment in database (BillPayment)
    const BillPayment = require('../models/BillPayment');
    const payment = await BillPayment.findOne({ 'paymentDetails.orderId': orderId }).populate('appointmentId billId');
    
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
