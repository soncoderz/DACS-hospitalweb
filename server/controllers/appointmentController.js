const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const mongoose = require('mongoose');
const { sendAppointmentConfirmationEmail, sendAppointmentReminderEmail, sendAppointmentRescheduleEmail, sendDoctorAppointmentNotificationEmail } = require('../services/emailService');
const { catchAsync } = require('../utils/errorHandler');
const AppError = require('../utils/appError');
const Room = require('../models/Room');
const Service = require('../models/Service');
const Specialty = require('../models/Specialty');
const Coupon = require('../models/Coupon');
const MedicalRecord = require('../models/MedicalRecord');
// Add notification service
const { 
  appointmentCreatedNotification, 
  appointmentUpdatedNotification, 
  appointmentCanceledNotification,
  appointmentReminderNotification
} = require('../services/notificationService');
// Import socket functions for time slot locking and real-time updates
const { 
  isTimeSlotLocked, 
  getTimeSlotLocker, 
  unlockTimeSlot,
  broadcastTimeSlotUpdate
} = require('../config/socketConfig');

/**
 * @desc    Get all services for a specific hospital
 * @route   GET /api/hospitals/:hospitalId/services
 * @access  Public
 */
exports.getServicesByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    // Validate hospital ID
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }

    // Check if hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }

    // Get all services associated with this hospital
    let services = [];
    
    // If hospital has specialties, get services for each specialty
    if (hospital.specialties && hospital.specialties.length > 0) {
      // Get all services for the hospital's specialties
      services = await Service.find({
        specialtyId: { $in: hospital.specialties },
        isActive: true
      }).populate('specialtyId', 'name');
    }

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error getting hospital services:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách dịch vụ',
      error: error.message
    });
  }
};

// POST /api/appointments – Đặt lịch khám
exports.createAppointment = async (req, res) => {
  try {
    // Log thông tin người dùng để gỡ lỗi
    console.log('User creating appointment:', {
      userId: req.user.id,
      role: req.user.role,
      roleType: req.user.roleType
    });
    
    // Log request body for debugging
    console.log('Appointment request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      doctorId, 
      hospitalId, 
      specialtyId,
      serviceId,
      scheduleId, 
      timeSlot, 
      appointmentDate, 
      roomId,
      appointmentType,
      symptoms,
      medicalHistory,
      notes,
      patientName,
      patientContact,
      couponCode,
      paymentMethod // Thêm phương thức thanh toán
    } = req.body;
    
    // Enhanced validation for timeSlot
    if (!timeSlot || typeof timeSlot !== 'object' || !timeSlot.startTime || !timeSlot.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin khung giờ hoặc định dạng không hợp lệ. Vui lòng chọn lại khung giờ.'
      });
    }
    
    // Check if the time slot is currently locked by another user
    if (isTimeSlotLocked(scheduleId, timeSlot.startTime)) {
      const lockerUserId = getTimeSlotLocker(scheduleId, timeSlot.startTime);
      
      // If locked by another user, reject the request
      if (lockerUserId !== req.user.id.toString()) {
        return res.status(409).json({
          success: false,
          message: 'Khung giờ này đang được người khác đặt. Vui lòng chọn khung giờ khác hoặc thử lại sau.'
        });
      }
    }
    
    // Validate required fields theo luồng Bệnh viện → chuyên khoa → dịch vụ → bác sĩ → phòng khám → lịch trống → phương thức thanh toán
    if (!hospitalId || !doctorId || !scheduleId || !appointmentDate || !paymentMethod || !serviceId || !specialtyId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch hẹn và phương thức thanh toán'
      });
    }
    
    // Validate payment method
    const validPaymentMethods = ['cash', 'paypal'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ'
      });
    }
    
    // Validate required fields theo luồng Bệnh viện → chuyên khoa → dịch vụ → bác sĩ → phòng khám → lịch trống
    if (!hospitalId || !specialtyId || !doctorId || !scheduleId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch hẹn'
      });
    }
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(hospitalId) || 
        !mongoose.Types.ObjectId.isValid(specialtyId) || 
        !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }
    
    // Kiểm tra bệnh viện
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Kiểm tra chuyên khoa và xem bệnh viện có hỗ trợ chuyên khoa này không
    const Specialty = require('../models/Specialty');
    const specialty = await Specialty.findById(specialtyId);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }
    
    // Kiểm tra xem bệnh viện có hỗ trợ chuyên khoa này không
    if (hospital.specialties && hospital.specialties.length > 0) {
      const hasSpecialty = hospital.specialties.some(id => id.toString() === specialtyId.toString());
      if (!hasSpecialty) {
        return res.status(400).json({
          success: false,
          message: 'Bệnh viện này không hỗ trợ chuyên khoa đã chọn'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Bệnh viện này chưa có chuyên khoa nào'
      });
    }
    
    // Kiểm tra dịch vụ nếu có
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      const Service = require('../models/Service');
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ'
        });
      }
      
      // Kiểm tra xem dịch vụ có thuộc chuyên khoa không
      if (service.specialtyId.toString() !== specialtyId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ không thuộc chuyên khoa đã chọn'
        });
      }
    }
    
    // Kiểm tra bác sĩ
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Kiểm tra xem bác sĩ có thuộc bệnh viện và chuyên khoa đã chọn không
    if (doctor.hospitalId.toString() !== hospitalId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ không làm việc tại bệnh viện đã chọn'
      });
    }
    
    if (doctor.specialtyId.toString() !== specialtyId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ không thuộc chuyên khoa đã chọn'
      });
    }
    
    // Kiểm tra xem bác sĩ có cung cấp dịch vụ này không (nếu có chọn dịch vụ)
    if (serviceId && doctor.services && doctor.services.length > 0) {
      const providesService = doctor.services.some(id => id.toString() === serviceId.toString());
      if (!providesService) {
        return res.status(400).json({
          success: false,
          message: 'Bác sĩ không cung cấp dịch vụ đã chọn'
        });
      }
    }
    
    // Validate that schedule exists and time slot is available
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khám'
      });
    }
    
    // Kiểm tra xem lịch khám có phải của bác sĩ đã chọn không
    if (schedule.doctorId.toString() !== doctorId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Lịch khám không thuộc về bác sĩ đã chọn'
      });
    }
    
    // Kiểm tra ngày trong lịch có trùng với ngày đặt lịch hay không
    const scheduleDate = new Date(schedule.date);
    const requestDate = new Date(appointmentDate);

    // Chuyển đổi sang định dạng chuỗi YYYY-MM-DD để tránh vấn đề múi giờ
    const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
    const requestDateStr = requestDate.toISOString().split('T')[0];
    
    // So sánh chuỗi ngày thay vì các thành phần riêng lẻ
    if (scheduleDateStr !== requestDateStr) {
      return res.status(400).json({
        success: false,
        message: 'Ngày đặt lịch không khớp với lịch của bác sĩ. Vui lòng chọn lại.'
      });
    }
    
    // Check if the time slot is available - modified to support multiple bookings
    const timeSlotIndex = schedule.timeSlots.findIndex(
      slot => slot.startTime === timeSlot.startTime && 
              slot.endTime === timeSlot.endTime
    );
    
    if (timeSlotIndex === -1) {
      // Unlock the time slot in case it was locked by this user
      unlockTimeSlot(scheduleId, timeSlot.startTime, req.user.id);
      
      return res.status(400).json({
        success: false,
        message: 'Khung giờ không tồn tại trong lịch này'
      });
    }
    
    const availableSlot = schedule.timeSlots[timeSlotIndex];
    
    // Check if the slot is already at maximum capacity
    if (availableSlot.isBooked || (availableSlot.bookedCount >= (availableSlot.maxBookings || 3))) {
      // Unlock the time slot in case it was locked by this user
      unlockTimeSlot(scheduleId, timeSlot.startTime, req.user.id);
      
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã đầy. Vui lòng chọn khung giờ khác.'
      });
    }
    
    // Kiểm tra và xác thực phòng khám
    let room;
    
    // Ưu tiên sử dụng roomId từ availableSlot nếu có
    if (availableSlot.roomId && mongoose.Types.ObjectId.isValid(availableSlot.roomId)) {
      console.log(`Using roomId from schedule timeSlot: ${availableSlot.roomId}`);
      
      room = await Room.findById(availableSlot.roomId);
      if (room && room.status === 'active' && room.isActive) {
        console.log(`Found room from timeSlot: ${room.name} (${room.number})`);
        
        // Đếm số lịch hẹn hiện tại trong phòng và khung giờ đã chọn
        const roomBookings = await Appointment.countDocuments({
          roomId: room._id,
          appointmentDate: new Date(appointmentDate),
          status: { $nin: ['cancelled', 'rejected', 'completed'] },
          'timeSlot.startTime': timeSlot.startTime,
          'timeSlot.endTime': timeSlot.endTime
        });
        
        console.log(`Room ${room.name} (${room.number}) has ${roomBookings} bookings for time slot ${timeSlot.startTime}-${timeSlot.endTime}`);
        
        // Không kiểm tra phòng bận hay không - cho phép nhiều lịch hẹn (tối đa 3) trong cùng phòng và khung giờ
      } else {
        console.log(`Room from timeSlot not found or inactive, will search for another room`);
        room = null; // Đặt lại room để tìm phòng khác
      }
    }
    
    // Nếu đã cung cấp roomId trong request và chưa tìm được phòng từ timeSlot
    if (!room && roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: 'ID phòng khám không hợp lệ'
        });
      }
      
      room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng khám'
        });
      }
      
      // Verify room belongs to hospital
      if (room.hospitalId.toString() !== hospitalId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Phòng không thuộc bệnh viện đã chọn'
        });
      }
      
      // Kiểm tra xem phòng có phù hợp với chuyên khoa không
      if (room.specialtyId && room.specialtyId.toString() !== specialtyId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Phòng không phù hợp với chuyên khoa đã chọn'
        });
      }
      
      // Check if doctor is assigned to this room
      if (room.assignedDoctors && room.assignedDoctors.length > 0 && 
          !room.assignedDoctors.some(docId => docId.toString() === doctorId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Bác sĩ không được phân công vào phòng này'
        });
      }
      
      // Không kiểm tra phòng bận hay không - cho phép nhiều lịch hẹn (tối đa 3) trong cùng phòng và cùng khung giờ
      // Đếm số lịch hẹn hiện tại trong phòng và khung giờ này
      const roomBookings = await Appointment.countDocuments({
        roomId: room._id,
        appointmentDate: new Date(appointmentDate),
        status: { $nin: ['cancelled', 'rejected', 'completed'] },
        'timeSlot.startTime': timeSlot.startTime,
        'timeSlot.endTime': timeSlot.endTime
      });
      
      // Ghi log số lượng lịch hẹn hiện tại trong phòng
      console.log(`Room ${room.name} (${room.number}) has ${roomBookings} bookings for time slot ${timeSlot.startTime}-${timeSlot.endTime}`);
      
      // Không báo lỗi ngay cả khi phòng đã có lịch hẹn - cho phép nhiều bệnh nhân dùng cùng một phòng
    } else if (!room) {
      // Tự động tìm phòng phù hợp khi không có roomId
      console.log('Finding suitable room for appointment...');
      
      // 1. Ưu tiên tìm phòng có bác sĩ được phân công và chưa có lịch trong khung giờ này
      const doctorRooms = await Room.find({
        hospitalId: hospitalId,
        specialtyId: specialtyId,
        status: 'active',
        isActive: true,
        assignedDoctors: { $in: [doctorId] }
      });
      
      if (doctorRooms.length > 0) {
        console.log(`Found ${doctorRooms.length} rooms with doctor assigned`);
        
        // Kiểm tra phòng nào có thể sử dụng (cho phép mỗi phòng có tối đa 3 lịch hẹn trong cùng khung giờ)
        const selectedRooms = [];
        
        for (const candidateRoom of doctorRooms) {
          // Đếm số lịch hẹn hiện có trong phòng ứng viên
          const roomBookingCount = await Appointment.countDocuments({
            roomId: candidateRoom._id,
            appointmentDate: new Date(appointmentDate),
            status: { $nin: ['cancelled', 'rejected', 'completed'] },
            'timeSlot.startTime': timeSlot.startTime,
            'timeSlot.endTime': timeSlot.endTime
          });
          
          // Thêm vào danh sách phòng có thể dùng, với thông tin số lịch đã đặt
          selectedRooms.push({
            room: candidateRoom,
            bookingCount: roomBookingCount
          });
        }
        
        // Sắp xếp phòng theo số lịch đã đặt, ưu tiên phòng có ít lịch hơn
        selectedRooms.sort((a, b) => a.bookingCount - b.bookingCount);
        
        // Lấy phòng đầu tiên (phòng có ít lịch nhất)
        if (selectedRooms.length > 0) {
          room = selectedRooms[0].room;
          console.log(`Selected room: ${room.name} (${room.number}) with ${selectedRooms[0].bookingCount} existing bookings`);
        }
      }
      
      // 2. Nếu không tìm được phòng có bác sĩ, tìm bất kỳ phòng nào phù hợp với chuyên khoa và còn trống
      if (!room) {
        console.log('No room with assigned doctor available, searching by specialty');
        
        const specialtyRooms = await Room.find({
          hospitalId: hospitalId,
          specialtyId: specialtyId,
          status: 'active',
          isActive: true
        });
        
        if (specialtyRooms.length > 0) {
          console.log(`Found ${specialtyRooms.length} rooms for this specialty`);
          
          // Kiểm tra phòng nào có thể sử dụng (ưu tiên phòng có ít lịch hẹn)
          const selectedRooms = [];
          
          for (const candidateRoom of specialtyRooms) {
            // Đếm số lịch hẹn hiện có trong phòng ứng viên
            const roomBookingCount = await Appointment.countDocuments({
              roomId: candidateRoom._id,
              appointmentDate: new Date(appointmentDate),
              status: { $nin: ['cancelled', 'rejected', 'completed'] },
              'timeSlot.startTime': timeSlot.startTime,
              'timeSlot.endTime': timeSlot.endTime
            });
            
            // Thêm vào danh sách phòng có thể dùng, với thông tin số lịch đã đặt
            selectedRooms.push({
              room: candidateRoom,
              bookingCount: roomBookingCount
            });
          }
          
          // Sắp xếp phòng theo số lịch đã đặt, ưu tiên phòng có ít lịch hơn
          selectedRooms.sort((a, b) => a.bookingCount - b.bookingCount);
          
          // Lấy phòng đầu tiên (phòng có ít lịch nhất)
          if (selectedRooms.length > 0) {
            room = selectedRooms[0].room;
            console.log(`Selected room: ${room.name} (${room.number}) with ${selectedRooms[0].bookingCount} existing bookings`);
          }
        }
      }
      
      // 3. Nếu vẫn không tìm được phòng, tìm bất kỳ phòng nào còn trống
      if (!room) {
        console.log('No specialty room available, searching for any available room');
        
        const anyRooms = await Room.find({
          hospitalId: hospitalId,
          status: 'active',
          isActive: true
        });
        
        if (anyRooms.length > 0) {
          // Kiểm tra tất cả phòng và chọn phòng ít lịch hẹn nhất
          const selectedRooms = [];
          
          for (const candidateRoom of anyRooms) {
            // Đếm số lịch hẹn hiện có trong phòng ứng viên
            const roomBookingCount = await Appointment.countDocuments({
              roomId: candidateRoom._id,
              appointmentDate: new Date(appointmentDate),
              status: { $nin: ['cancelled', 'rejected', 'completed'] },
              'timeSlot.startTime': timeSlot.startTime,
              'timeSlot.endTime': timeSlot.endTime
            });
            
            // Thêm vào danh sách phòng có thể dùng, với thông tin số lịch đã đặt
            selectedRooms.push({
              room: candidateRoom,
              bookingCount: roomBookingCount
            });
          }
          
          // Sắp xếp phòng theo số lịch đã đặt, ưu tiên phòng có ít lịch hơn
          selectedRooms.sort((a, b) => a.bookingCount - b.bookingCount);
          
          // Lấy phòng đầu tiên (phòng có ít lịch nhất)
          if (selectedRooms.length > 0) {
            room = selectedRooms[0].room;
            console.log(`Selected room (any available): ${room.name} (${room.number}) with ${selectedRooms[0].bookingCount} existing bookings`);
          }
        }
      }
      
      // Nếu không tìm được phòng nào, thông báo cho người dùng
      if (!room) {
        console.log('No available rooms found for this time slot');
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy phòng khám phù hợp cho chuyên khoa và bác sĩ đã chọn. Vui lòng chọn khung giờ khác hoặc liên hệ bệnh viện.'
        });
      }
    }
    
    // Calculate fees
    let consultationFee = doctor.consultationFee || 0;
    let additionalFees = 0;
    
    // Tính thêm phí dịch vụ nếu có
    if (serviceId) {
      const Service = require('../models/Service');
      const service = await Service.findById(serviceId);
      if (service) {
        additionalFees += service.price || 0;
      }
    }
    
    let discount = 0;
    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase().trim()
      });
      
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá không tồn tại'
        });
      }
      
      // Check if coupon is valid using the virtual property
      if (!coupon.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã hết hạn hoặc không còn hiệu lực'
        });
      }
      
      // Check minimum purchase amount
      if (coupon.minPurchase && (consultationFee + additionalFees) < coupon.minPurchase) {
        return res.status(400).json({
          success: false,
          message: `Yêu cầu mức chi tối thiểu ${coupon.minPurchase}đ để sử dụng mã giảm giá này`
        });
      }
      
      // Check if coupon is applicable to this service or specialty
      let isCouponApplicable = true;
      
      if (coupon.applicableServices && coupon.applicableServices.length > 0) {
        isCouponApplicable = serviceId && coupon.applicableServices.some(id => id.toString() === serviceId.toString());
      } else if (coupon.applicableSpecialties && coupon.applicableSpecialties.length > 0) {
        isCouponApplicable = coupon.applicableSpecialties.some(id => id.toString() === specialtyId.toString());
      }

      if (!isCouponApplicable) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá này không áp dụng cho dịch vụ đã chọn'
        });
      }
      
      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discount = ((consultationFee + additionalFees) * coupon.discountValue) / 100;
        // Cap discount at maxDiscount if specified
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else { // fixed discount
        discount = coupon.discountValue;
        // Make sure discount doesn't exceed total
        if (discount > (consultationFee + additionalFees)) {
          discount = consultationFee + additionalFees;
        }
      }
      
      // Update coupon usage count
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    }
    
    const totalAmount = consultationFee + additionalFees - discount;
    
    // Create new appointment
    const appointmentData = {
      patientId: req.user.id,
      doctorId,
      hospitalId,
      specialtyId,
      scheduleId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      appointmentType: appointmentType || 'first-visit',
      symptoms: symptoms || '',
      medicalHistory: medicalHistory || '',
      notes: notes || '',
      fee: {
        consultationFee,
        additionalFees,
        discount,
        totalAmount
      },
      paymentStatus: 'pending',
      paymentMethod: paymentMethod
    };
    
    // Add coupon code to appointment data if applied
    if (couponCode) {
      appointmentData.couponCode = couponCode.toUpperCase();
    }
    
    // Thêm serviceId nếu có
    if (serviceId) {
      appointmentData.serviceId = serviceId;
    }
    
    // Thêm roomId nếu có
    if (room) {
      appointmentData.roomId = room._id;
    }
    
    // Kiểm tra số lượng cuộc hẹn tối đa của bác sĩ trong ngày
    const appointmentDate00 = new Date(appointmentDate);
    appointmentDate00.setHours(0, 0, 0, 0);
    
    const appointmentDate24 = new Date(appointmentDate);
    appointmentDate24.setHours(23, 59, 59, 999);
    
    const doctorDailyAppointments = await Appointment.countDocuments({
      doctorId,
      appointmentDate: {
        $gte: appointmentDate00,
        $lte: appointmentDate24
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    
    // Bác sĩ có thể có tối đa 20 cuộc hẹn một ngày (có thể thay đổi theo cấu hình)
    const maxDailyAppointments = 20;
    if (doctorDailyAppointments >= maxDailyAppointments) {
      return res.status(400).json({
        success: false,
        message: `Bác sĩ đã có ${maxDailyAppointments} cuộc hẹn trong ngày này. Vui lòng chọn ngày khác.`
      });
    }
    
    // Kiểm tra số lượng cuộc hẹn tối đa của bệnh nhân trong ngày
    const patientDailyAppointments = await Appointment.countDocuments({
      patientId: req.user.id,
      appointmentDate: {
        $gte: appointmentDate00,
        $lte: appointmentDate24
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });
    
    // Bệnh nhân có thể có tối đa 3 cuộc hẹn một ngày
    const maxPatientDailyAppointments = 3;
    if (patientDailyAppointments >= maxPatientDailyAppointments) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã có ${maxPatientDailyAppointments} cuộc hẹn trong ngày này. Vui lòng chọn ngày khác.`
      });
    }
    
    // Tạo mã đặt lịch ngẫu nhiên và duy nhất
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingCode = `BK${randomCode}${Date.now().toString().substring(9)}`;
    appointmentData.bookingCode = bookingCode;
    
    const appointment = await Appointment.create(appointmentData);
    
    // Update the schedule to mark the time slot as booked - modified for multiple bookings
    const slotIndex = schedule.timeSlots.findIndex(
      slot => slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
    );
    
    if (slotIndex !== -1) {
      // Increment bookedCount
      const currentCount = schedule.timeSlots[slotIndex].bookedCount || 0;
      const maxBookings = schedule.timeSlots[slotIndex].maxBookings || 3;
      
      schedule.timeSlots[slotIndex].bookedCount = currentCount + 1;
      
      // Add appointment ID to the list
      if (!schedule.timeSlots[slotIndex].appointmentIds) {
        schedule.timeSlots[slotIndex].appointmentIds = [];
      }
      schedule.timeSlots[slotIndex].appointmentIds.push(appointment._id);
      
      // Mark as fully booked if we've reached the maximum
      if (currentCount + 1 >= maxBookings) {
        schedule.timeSlots[slotIndex].isBooked = true;
      }
      
      // Add room to time slot if available
      if (room) {
        schedule.timeSlots[slotIndex].roomId = room._id;
      }
      
      await schedule.save();
      
      // Broadcast the updated time slot info to all users viewing this doctor's schedule
      const timeSlotInfo = {
        _id: schedule.timeSlots[slotIndex]._id,
        startTime: schedule.timeSlots[slotIndex].startTime,
        endTime: schedule.timeSlots[slotIndex].endTime,
        isBooked: schedule.timeSlots[slotIndex].isBooked,
        bookedCount: schedule.timeSlots[slotIndex].bookedCount,
        maxBookings: schedule.timeSlots[slotIndex].maxBookings || 3
      };
      
      // Get the doctor's details to extract the date for the socket room
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        // Format date as YYYY-MM-DD for the socket room
        const formattedDate = new Date(appointmentDate).toISOString().split('T')[0];
        // Broadcast update to all clients viewing this doctor's schedule
        broadcastTimeSlotUpdate(scheduleId, timeSlotInfo, doctorId, formattedDate);
        console.log(`Broadcasting time slot update for ${schedule.timeSlots[slotIndex].startTime}-${schedule.timeSlots[slotIndex].endTime}`);
      }
    }
    
    // Unlock the time slot after it has been successfully booked
    unlockTimeSlot(scheduleId, timeSlot.startTime, req.user.id);
    
    // Tạo bản ghi thanh toán tương ứng
    let payment;
    let redirectUrl = null;
    
    if (paymentMethod === 'cash') {
      // Tạo bản ghi thanh toán tiền mặt
      const Payment = require('../models/Payment');
      payment = new Payment({
        appointmentId: appointment._id,
        userId: req.user.id,
        doctorId,
        serviceId: serviceId || null,
        amount: totalAmount,
        originalAmount: consultationFee + additionalFees,
        discount: discount || 0,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        notes: 'Thanh toán tiền mặt khi đến khám'
      });
      
      await payment.save();
      
      // Cập nhật ID thanh toán vào cuộc hẹn
      await Appointment.findByIdAndUpdate(
        appointment._id,
        { $set: { paymentId: payment._id } }
      );
    } else if (paymentMethod === 'paypal') {
      // Tạo bản ghi thanh toán PayPal
      const Payment = require('../models/Payment');
      payment = new Payment({
        appointmentId: appointment._id,
        userId: req.user.id,
        doctorId,
        serviceId: serviceId || null,
        amount: totalAmount,
        originalAmount: consultationFee + additionalFees,
        discount: discount || 0,
        paymentMethod: 'paypal',
        paymentStatus: 'pending',
        notes: 'Thanh toán qua PayPal'
      });
      
      await payment.save();
      
      // Cập nhật ID thanh toán vào cuộc hẹn
      await Appointment.findByIdAndUpdate(
        appointment._id,
        { $set: { paymentId: payment._id } }
      );
      
      // Tạo URL redirect đến PayPal
      const PaymentController = require('./paymentController');
      redirectUrl = await PaymentController.createPayPalPayment(payment, req.headers.origin);
    }
    
    // Send confirmation email to patient
    try {
      const patient = await User.findById(req.user.id);
      console.log('Sending appointment confirmation email to:', patient.email);
      
      // Get full doctor information
      const doctorInfo = await Doctor.findById(doctorId).populate('user');
      
      // Get full hospital information
      const hospitalInfo = await Hospital.findById(hospitalId);
      
      // Get specialty information if available
      let specialtyName = '';
      if (specialtyId) {
        const specialty = await Specialty.findById(specialtyId);
        if (specialty) {
          specialtyName = specialty.name;
        }
      }
      
      // Get service information if available
      let serviceName = '';
      if (serviceId) {
        const service = await Service.findById(serviceId);
        if (service) {
          serviceName = service.name;
        }
      }
      
      // Create appointment info object for email
      const appointmentInfo = {
        bookingCode: appointment.bookingCode,
        doctorName: doctorInfo.user.fullName,
        hospitalName: hospitalInfo.name,
        appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        roomName: room ? `${room.name} (Phòng ${room.number})` : 'Sẽ thông báo sau',
        specialtyName: specialtyName,
        serviceName: serviceName,
        totalAmount: totalAmount ? totalAmount.toLocaleString('vi-VN') + 'đ' : 'Chưa tính',
        appointmentType: appointmentType,
        symptoms: symptoms || '',
        medicalHistory: medicalHistory || '',
        notes: notes || ''
      };
      
      console.log('Appointment info for email:', appointmentInfo);
      
      // Send email to patient
      await sendAppointmentConfirmationEmail(
        patient.email,
        patient.fullName,
        appointmentInfo
      );
      console.log('Appointment confirmation email sent successfully to patient');
      
      // Send email to doctor
      if (doctorInfo && doctorInfo.user && doctorInfo.user.email) {
        // Calculate patient age if birthdate is available
        let patientAge = '';
        if (patient.dateOfBirth) {
          const birthDate = new Date(patient.dateOfBirth);
          const today = new Date();
          patientAge = today.getFullYear() - birthDate.getFullYear();
          
          // Adjust age if birthday hasn't occurred yet this year
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            patientAge--;
          }
        }
        
        // Create patient info object for doctor notification
        const patientInfo = {
          patientName: patient.fullName,
          patientGender: patient.gender,
          patientAge: patientAge ? `${patientAge} tuổi` : '',
          patientPhone: patient.phoneNumber,
          patientEmail: patient.email
        };
        
        try {
          await sendDoctorAppointmentNotificationEmail(
            doctorInfo.user.email,
            doctorInfo.user.fullName,
            appointmentInfo,
            patientInfo
          );
          console.log('Appointment notification email sent successfully to doctor:', doctorInfo.user.email);
        } catch (doctorEmailError) {
          console.error('Error sending email to doctor:', doctorEmailError);
          // Don't fail if doctor email fails
        }
      } else {
        console.log('Doctor email not available, skipping notification');
      }
    } catch (emailError) {
      console.error('Lỗi gửi email xác nhận:', emailError);
      // Không trả lỗi, chỉ log lại
    }
    
    // Return response based on payment method
    if (paymentMethod === 'paypal' && redirectUrl) {
      res.status(201).json({
        success: true,
        message: 'Đặt lịch thành công. Vui lòng thanh toán qua PayPal',
        data: {
          appointment,
          payment,
          room: room ? {
            name: room.name,
            number: room.number,
            floor: room.floor,
            block: room.block
          } : null,
          redirectUrl
        }
      });
    } else {
      res.status(201).json({
        success: true,
        message: room 
          ? `Đặt lịch thành công. Bạn đã được phân công vào phòng ${room.name} (${room.number}).` 
          : 'Đặt lịch thành công',
        data: {
          appointment,
          payment,
          room: room ? {
            name: room.name,
            number: room.number,
            floor: room.floor,
            block: room.block
          } : null,
          instructions: paymentMethod === 'cash' ? 'Vui lòng thanh toán tại quầy khi đến khám' : null
        }
      });
    }
    
    // Send real-time notification
    try {
      await appointmentCreatedNotification(appointment);
    } catch (notificationError) {
      console.error('Error sending appointment creation notification:', notificationError);
      // Continue execution - don't fail the appointment creation if notification fails
    }
    
  } catch (error) {
    console.error('Create appointment error:', error);
    
    // Ensure time slot is unlocked if the operation fails
    if (req.body.scheduleId && req.body.timeSlot && req.body.timeSlot.startTime) {
      unlockTimeSlot(req.body.scheduleId, req.body.timeSlot.startTime, req.user.id);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lịch khám',
      error: error.message
    });
  }
};




// GET /api/appointments/:id – Chi tiết lịch khám
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }
    
    // Lấy thông tin lịch hẹn và populate các field liên quan với nhiều thông tin hơn
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'fullName email phoneNumber dateOfBirth gender address avatarUrl')
      .populate({
        path: 'doctorId',
        populate: [
          {
            path: 'user',
            select: 'fullName email title avatarUrl phoneNumber'
          },
          {
            path: 'specialtyId',
            select: 'name description'
          }
        ]
      })
      .populate('hospitalId', 'name address contactInfo email website logo imageUrl image')
      .populate('specialtyId', 'name description')
      .populate('serviceId', 'name price description')
      .populate('scheduleId')
      .populate('roomId', 'name number floor block');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (
      req.user.roleType !== 'admin' && 
      appointment.patientId._id.toString() !== req.user.id &&
      req.user.roleType === 'doctor' && appointment.doctorId.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập lịch hẹn này'
      });
    }

    // Tìm hồ sơ y tế liên quan đến lịch hẹn nếu có
    if (appointment.status === 'completed') {
      const medicalRecord = await MedicalRecord.findOne({ appointmentId: id })
        .populate({
          path: 'doctorId',
          select: 'user title',
          populate: {
            path: 'user',
            select: 'fullName avatarUrl'
          }
        });

      if (medicalRecord) {
        // Thêm thông tin MedicalRecord vào kết quả trả về
        const result = appointment.toObject();
        result.medicalRecord = medicalRecord;
        
        // Trả về dữ liệu đầy đủ
        return res.status(200).json({
          success: true,
          data: result
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      data: appointment
    });
    
  } catch (error) {
    console.error('Get appointment detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết lịch hẹn',
      error: error.message
    });
  }
};

// DELETE /api/appointments/:id – Hủy lịch khám
exports.cancelAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const appointment = await Appointment.findOne({ _id: id, patientId: userId })
    .populate('scheduleId');
  
  if (!appointment) {
    return next(new AppError('Không tìm thấy lịch hẹn hoặc bạn không có quyền hủy', 404));
  }

  // Cập nhật trạng thái lịch hẹn
  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body.cancellationReason || 'Người dùng hủy';
  await appointment.save();

  // Giải phóng khung giờ trong lịch và cập nhật số lượng đặt chỗ
  const scheduleId = appointment.scheduleId._id || appointment.scheduleId;
  console.log(`Updating schedule with ID: ${scheduleId}`);
  
  const schedule = await Schedule.findById(scheduleId);
  if (schedule) {
    // Tìm time slot cần cập nhật
    const timeSlotIndex = schedule.timeSlots.findIndex(
      slot => slot.startTime === appointment.timeSlot.startTime && 
              slot.endTime === appointment.timeSlot.endTime
    );
    
    if (timeSlotIndex !== -1) {
      // Lấy dữ liệu time slot hiện tại
      const timeSlot = schedule.timeSlots[timeSlotIndex];
      
      // Giảm bookedCount nếu có
      if (timeSlot.bookedCount && timeSlot.bookedCount > 0) {
        schedule.timeSlots[timeSlotIndex].bookedCount -= 1;
        
        // Xóa appointment ID khỏi danh sách nếu có
        if (Array.isArray(timeSlot.appointmentIds)) {
          schedule.timeSlots[timeSlotIndex].appointmentIds = timeSlot.appointmentIds.filter(
            apptId => apptId.toString() !== appointment._id.toString()
          );
        }
        
        // Đánh dấu là chưa đặt đầy nếu bookedCount < maxBookings
        if (schedule.timeSlots[timeSlotIndex].bookedCount < (timeSlot.maxBookings || 3)) {
          schedule.timeSlots[timeSlotIndex].isBooked = false;
        }
        
        // Xóa thông tin cũ nếu không còn booking nào
        if (schedule.timeSlots[timeSlotIndex].bookedCount === 0) {
          schedule.timeSlots[timeSlotIndex].appointmentId = null;
        }
        
        console.log(`Slot updated: bookedCount=${schedule.timeSlots[timeSlotIndex].bookedCount}, isBooked=${schedule.timeSlots[timeSlotIndex].isBooked}`);
      } else {
        // Trường hợp cũ không có bookedCount - chỉ đánh dấu là chưa đặt
        schedule.timeSlots[timeSlotIndex].isBooked = false;
        schedule.timeSlots[timeSlotIndex].appointmentId = null;
        
        console.log(`Legacy slot marked as not booked`);
      }
      
      await schedule.save();
      
      // Broadcast the updated time slot status to all users viewing this schedule
      if (timeSlotIndex !== -1) {
        const timeSlotInfo = {
          _id: schedule.timeSlots[timeSlotIndex]._id,
          startTime: schedule.timeSlots[timeSlotIndex].startTime,
          endTime: schedule.timeSlots[timeSlotIndex].endTime,
          isBooked: schedule.timeSlots[timeSlotIndex].isBooked,
          bookedCount: schedule.timeSlots[timeSlotIndex].bookedCount,
          maxBookings: schedule.timeSlots[timeSlotIndex].maxBookings || 3
        };
        
        // Format date as YYYY-MM-DD for the socket room
        const formattedDate = new Date(appointment.appointmentDate).toISOString().split('T')[0];
        
        // Broadcast update to all clients viewing this doctor's schedule
        broadcastTimeSlotUpdate(
          scheduleId, 
          timeSlotInfo, 
          appointment.doctorId._id || appointment.doctorId, 
          formattedDate
        );
        
        console.log(`Broadcasting time slot cancellation update for ${timeSlotInfo.startTime}-${timeSlotInfo.endTime}`);
      }
    }
  }

  // If the slot was being locked by this user, unlock it
  if (appointment.timeSlot && appointment.timeSlot.startTime) {
    unlockTimeSlot(scheduleId, appointment.timeSlot.startTime, userId);
  }

  // Log the successful cancellation with details
  console.log(`Appointment ${id} cancelled successfully. Schedule slot updated to decrease booking count.`);
  
  res.status(200).json({
    status: 'success',
    message: 'Lịch hẹn đã được hủy thành công'
  });

  // Send real-time notification
  try {
    await appointmentCanceledNotification(appointment, req.user.id, appointment.cancellationReason);
  } catch (notificationError) {
    console.error('Error sending appointment cancellation notification:', notificationError);
    // Continue execution
  }
});

// PUT /api/appointments/:id/reschedule – Đổi giờ khám
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      scheduleId, 
      timeSlot, 
      appointmentDate, 
      roomId,
      notes 
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }
    
    if (!scheduleId || !timeSlot || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch hẹn mới'
      });
    }
    
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'fullName email')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'user',
          select: 'fullName'
        }
      })
      .populate('hospitalId', 'name address imageUrl image')
      .populate('specialtyId', 'name')
      .populate('serviceId', 'name price')
      .populate('scheduleId')
      .populate('roomId', 'name number floor');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    // Kiểm tra quyền đổi lịch hẹn
    if (
      req.user.roleType !== 'admin' && 
      appointment.patientId._id.toString() !== req.user.id &&
      req.user.roleType === 'doctor' && appointment.doctorId.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền đổi lịch hẹn này'
      });
    }
    
    // Kiểm tra xem lịch hẹn đã hoàn thành hoặc đã hủy chưa
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể đổi lịch hẹn đã ${appointment.status === 'completed' ? 'hoàn thành' : 'bị hủy'}`
      });
    }
    
    // Kiểm tra giới hạn số lần đổi lịch (tối đa 2 lần)
    if (!appointment.rescheduleCount) {
      appointment.rescheduleCount = 0;
    }
    
    if (appointment.rescheduleCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đổi lịch hẹn này quá 2 lần, vui lòng liên hệ trực tiếp với bệnh viện'
      });
    }
    
    // THÊM: Kiểm tra không cho phép đổi lịch quá gần thời gian hẹn
    const now = new Date();
    const originalAppointmentDate = new Date(appointment.appointmentDate);
    const hoursBeforeAppointment = Math.round((originalAppointmentDate - now) / (60 * 60 * 1000));
    
    const minimumHoursForReschedule = 4; // Ít nhất 4 giờ trước khi hẹn
    if (hoursBeforeAppointment < minimumHoursForReschedule) {
      return res.status(400).json({
        success: false,
        message: `Không thể đổi lịch hẹn khi còn ít hơn ${minimumHoursForReschedule} giờ trước thời gian hẹn. Vui lòng liên hệ trực tiếp với bệnh viện.`
      });
    }
    
    // THÊM: Kiểm tra ngày đổi lịch không được trong quá khứ
    const newRequestDate = new Date(appointmentDate);
    if (newRequestDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đổi lịch hẹn về thời gian đã qua'
      });
    }
    
    // THÊM: Giới hạn đổi lịch tối đa 30 ngày trong tương lai
    const maxDaysInFuture = 30;
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + maxDaysInFuture);
    
    if (newRequestDate > maxFutureDate) {
      return res.status(400).json({
        success: false,
        message: `Không thể đổi lịch hẹn xa quá ${maxDaysInFuture} ngày kể từ hôm nay`
      });
    }
    
    // THÊM: Kiểm tra số lượng lịch hẹn của bệnh nhân trong ngày mới
    const appointmentDate_start = new Date(appointmentDate);
    appointmentDate_start.setHours(0, 0, 0, 0);
    
    const appointmentDate_end = new Date(appointmentDate);
    appointmentDate_end.setHours(23, 59, 59, 999);
    
    const patientDailyAppointments = await Appointment.countDocuments({
      patientId: appointment.patientId._id,
      appointmentDate: {
        $gte: appointmentDate_start,
        $lte: appointmentDate_end
      },
      _id: { $ne: appointment._id }, // Không tính lịch hẹn hiện tại
      status: { $nin: ['cancelled', 'rejected'] } // Không tính các lịch hẹn đã hủy hoặc bị từ chối
    });
    
    // Bệnh nhân có thể có tối đa 3 cuộc hẹn một ngày
    const maxPatientDailyAppointments = 3;
    if (patientDailyAppointments >= maxPatientDailyAppointments) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã có ${maxPatientDailyAppointments} cuộc hẹn khác trong ngày này. Vui lòng chọn ngày khác.`
      });
    }
    
    // Kiểm tra schedule mới có tồn tại không
    const Schedule = require('../models/Schedule');
    const newSchedule = await Schedule.findById(scheduleId);
    if (!newSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khám mới'
      });
    }
    
    // Kiểm tra xem lịch mới có phải của cùng một bác sĩ không
    if (newSchedule.doctorId.toString() !== appointment.doctorId._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Lịch khám mới phải của cùng bác sĩ với lịch hẹn ban đầu'
      });
    }
    
    // Kiểm tra ngày trong newSchedule có khớp với appointmentDate không
    const scheduleDate = new Date(newSchedule.date);
    const requestDate = new Date(appointmentDate);
    
    // Chuyển đổi cả hai ngày về định dạng YYYY-MM-DD để so sánh
    const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
    const requestDateStr = requestDate.toISOString().split('T')[0];
    
    if (scheduleDateStr !== requestDateStr) {
      return res.status(400).json({
        success: false,
        message: 'Ngày trong lịch khám không khớp với ngày yêu cầu đổi lịch',
        scheduleDateStr,
        requestDateStr
      });
    }
    
    // THÊM: Kiểm tra nếu đổi lịch trong cùng một ngày, buộc phải chọn khung giờ khác
    const originalAppointmentDateStr = originalAppointmentDate.toISOString().split('T')[0];
    if (originalAppointmentDateStr === requestDateStr &&
        appointment.timeSlot.startTime === timeSlot.startTime && 
        appointment.timeSlot.endTime === timeSlot.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Khi đổi lịch trong cùng một ngày, bạn phải chọn khung giờ khác với lịch hẹn cũ'
      });
    }
    
    // Kiểm tra time slot mới có available không - modified for multiple bookings
    const timeSlotIndex = newSchedule.timeSlots.findIndex(
      slot => slot.startTime === timeSlot.startTime && 
              slot.endTime === timeSlot.endTime
    );
    
    if (timeSlotIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ không tồn tại trong lịch khám này'
      });
    }
    
    const selectedSlot = newSchedule.timeSlots[timeSlotIndex];
    
    // Check if the slot is already at maximum capacity
    if (selectedSlot.isBooked || (selectedSlot.bookedCount >= (selectedSlot.maxBookings || 3))) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã đầy. Vui lòng chọn khung giờ khác.'
      });
    }
    
    // Kiểm tra phòng khám mới (nếu có chỉ định)
    let room = appointment.roomId;
    
    if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
      const Room = require('../models/Room');
      const newRoom = await Room.findById(roomId);
      
      if (!newRoom) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng khám mới'
        });
      }
      
      // Kiểm tra phòng có thuộc bệnh viện không
      if (newRoom.hospitalId.toString() !== appointment.hospitalId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Phòng khám mới không thuộc bệnh viện đã chọn'
        });
      }
      
      // Kiểm tra phòng có phù hợp với chuyên khoa không
      if (newRoom.specialtyId && appointment.specialtyId && 
          newRoom.specialtyId.toString() !== appointment.specialtyId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Phòng khám mới không phù hợp với chuyên khoa'
        });
      }
      
      room = newRoom;
    }
    
    // Lưu thông tin lịch hẹn cũ trước khi cập nhật
    const oldScheduleId = appointment.scheduleId._id;
    const oldTimeSlot = { ...appointment.timeSlot };
    const oldAppointmentDate = appointment.appointmentDate;
    const oldRoomId = appointment.roomId ? appointment.roomId._id : null;
    
    // Cập nhật thông tin lịch hẹn
    appointment.isRescheduled = true;
    appointment.scheduleId = scheduleId;
    appointment.timeSlot = timeSlot;
    appointment.appointmentDate = new Date(appointmentDate);
    appointment.status = 'rescheduled';
    
    // Cập nhật roomId nếu có thay đổi
    if (room && room._id) {
      appointment.roomId = room._id;
    }
    
    // Cập nhật số lần đổi lịch và thêm lịch sử đổi lịch
    appointment.rescheduleCount = (appointment.rescheduleCount || 0) + 1;
    
    // Lưu lịch sử đổi lịch
    if (!appointment.rescheduleHistory) {
      appointment.rescheduleHistory = [];
    }
    
    appointment.rescheduleHistory.push({
      oldScheduleId: oldScheduleId,
      oldTimeSlot: oldTimeSlot,
      oldAppointmentDate: oldAppointmentDate,
      oldRoomId: oldRoomId,
      newScheduleId: scheduleId,
      newTimeSlot: timeSlot,
      newAppointmentDate: new Date(appointmentDate),
      newRoomId: room ? room._id : null,
      rescheduleBy: req.user.id,
      rescheduleAt: new Date(),
      notes: notes || 'Đổi lịch hẹn'
    });
    
    // Lưu lịch hẹn đã cập nhật
    await appointment.save();
    
    // Cập nhật lại trạng thái của time slot cũ (đánh dấu là trống hoặc giảm số lượng đặt)
    try {
      // Tìm vị trí của time slot cũ 
      const oldSchedule = await Schedule.findById(oldScheduleId);
      if (oldSchedule) {
        const oldSlotIndex = oldSchedule.timeSlots.findIndex(
          slot => 
            slot.startTime === oldTimeSlot.startTime && 
            slot.endTime === oldTimeSlot.endTime
        );
        
        if (oldSlotIndex !== -1) {
          console.log(`Updating old schedule ${oldScheduleId}, slot index ${oldSlotIndex}`);
          
          // Sử dụng findOneAndUpdate để tránh xung đột phiên bản
          await Schedule.findOneAndUpdate(
            { 
              _id: oldScheduleId,
              [`timeSlots.${oldSlotIndex}.startTime`]: oldTimeSlot.startTime,
              [`timeSlots.${oldSlotIndex}.endTime`]: oldTimeSlot.endTime
            },
            { 
              $inc: { [`timeSlots.${oldSlotIndex}.bookedCount`]: -1 },
              $pull: { [`timeSlots.${oldSlotIndex}.appointmentIds`]: appointment._id },
              $set: {
                [`timeSlots.${oldSlotIndex}.isBooked`]: false,
                [`timeSlots.${oldSlotIndex}.appointmentId`]: null,
                [`timeSlots.${oldSlotIndex}.roomId`]: null
              }
            },
            { 
              new: true,
              runValidators: false
            }
          );
          
          console.log(`Old schedule slot updated successfully`);
        }
      }
    } catch (updateError) {
      console.error('Error updating old schedule:', updateError);
      // Tiếp tục xử lý mặc dù có lỗi khi cập nhật lịch cũ
    }
    
    // Cập nhật lại trạng thái của time slot mới (tăng số lượng đặt)
    try {
      const newSlotIndex = newSchedule.timeSlots.findIndex(
        slot => slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
      );
      
      if (newSlotIndex !== -1) {
        console.log(`Updating new schedule ${scheduleId}, slot index ${newSlotIndex}`);
        
        // Lấy thông tin hiện tại của slot
        const currentCount = newSchedule.timeSlots[newSlotIndex].bookedCount || 0;
        const maxBookings = newSchedule.timeSlots[newSlotIndex].maxBookings || 3;
        
        // Xác định xem slot sẽ đầy sau khi thêm booking này không
        const willBeFull = (currentCount + 1) >= maxBookings;
        
        // Cập nhật slot bằng findOneAndUpdate để tránh xung đột phiên bản
        const updateFields = {
          $inc: { [`timeSlots.${newSlotIndex}.bookedCount`]: 1 },
          $addToSet: { [`timeSlots.${newSlotIndex}.appointmentIds`]: appointment._id },
          $set: {
            [`timeSlots.${newSlotIndex}.appointmentId`]: appointment._id
          }
        };
        
        // Chỉ cập nhật isBooked nếu slot sẽ đầy
        if (willBeFull) {
          updateFields.$set[`timeSlots.${newSlotIndex}.isBooked`] = true;
        }
        
        // Cập nhật roomId nếu có
        if (room && room._id) {
          updateFields.$set[`timeSlots.${newSlotIndex}.roomId`] = room._id;
        }
        
        await Schedule.findOneAndUpdate(
          { 
            _id: scheduleId,
            [`timeSlots.${newSlotIndex}.startTime`]: timeSlot.startTime,
            [`timeSlots.${newSlotIndex}.endTime`]: timeSlot.endTime
          },
          updateFields,
          { 
            new: true,
            runValidators: false
          }
        );
        
        console.log(`New schedule slot updated successfully`);
        
        // Fetch the updated schedule to broadcast changes
        const updatedSchedule = await Schedule.findById(scheduleId);
        if (updatedSchedule && updatedSchedule.timeSlots[newSlotIndex]) {
          // Create time slot info object for broadcasting
          const timeSlotInfo = {
            _id: updatedSchedule.timeSlots[newSlotIndex]._id,
            startTime: updatedSchedule.timeSlots[newSlotIndex].startTime,
            endTime: updatedSchedule.timeSlots[newSlotIndex].endTime,
            isBooked: updatedSchedule.timeSlots[newSlotIndex].isBooked,
            bookedCount: updatedSchedule.timeSlots[newSlotIndex].bookedCount,
            maxBookings: updatedSchedule.timeSlots[newSlotIndex].maxBookings || 3
          };
          
          // Format date as YYYY-MM-DD for the socket room
          const formattedDate = new Date(appointmentDate).toISOString().split('T')[0];
          
          // Broadcast update to all clients viewing this doctor's schedule
          broadcastTimeSlotUpdate(
            scheduleId, 
            timeSlotInfo, 
            appointment.doctorId._id || appointment.doctorId, 
            formattedDate
          );
          
          console.log(`Broadcasting reschedule time slot update for ${timeSlotInfo.startTime}-${timeSlotInfo.endTime}`);
        }
      }
    } catch (updateError) {
      console.error('Error updating new schedule:', updateError);
      // Tiếp tục xử lý dù có lỗi khi cập nhật lịch mới
    }
    
    // Gửi email thông báo đổi lịch cho bệnh nhân
    try {
      // Thực hiện gửi email thông báo đổi lịch
      if (typeof sendAppointmentRescheduleEmail === 'function') {
        // Lấy thông tin bệnh viện
        const hospital = await Hospital.findById(appointment.hospitalId);
        
        // Chuẩn bị dữ liệu cho email
        const emailData = {
          bookingCode: appointment.bookingCode || appointment._id.toString().substring(0, 8).toUpperCase(),
          doctorName: appointment.doctorId.user.fullName,
          hospitalName: hospital.name,
          appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          roomName: room ? `${room.name} (Phòng ${room.number})` : 'Sẽ thông báo sau',
          specialtyName: appointment.specialtyId ? appointment.specialtyId.name : '',
          serviceName: appointment.serviceId ? appointment.serviceId.name : ''
        };
        
        // Thông tin lịch hẹn cũ
        const oldAppointmentData = {
          appointmentDate: new Date(oldAppointmentDate).toLocaleDateString('vi-VN'),
          startTime: oldTimeSlot.startTime,
          endTime: oldTimeSlot.endTime,
          roomName: oldRoomId ? 'Phòng cũ' : 'Không có phòng',
        };
        
        await sendAppointmentRescheduleEmail(
          appointment.patientId.email,
          appointment.patientId.fullName,
          emailData,
          oldAppointmentData
        );
        console.log('Đã gửi email thông báo đổi lịch thành công');
      } else {
        console.log('Bỏ qua gửi email vì hàm sendAppointmentRescheduleEmail chưa được triển khai');
      }
    } catch (emailError) {
      console.error('Error sending reschedule email:', emailError);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Đổi lịch hẹn thành công',
      data: appointment
    });
    
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    
    // Xử lý các loại lỗi cụ thể và cung cấp thông báo phù hợp
    let errorMessage = 'Lỗi khi đổi lịch hẹn';
    
    if (error.name === 'VersionError') {
      errorMessage = 'Có một người dùng khác đang đặt lịch cùng lúc với bạn. Vui lòng thử lại sau.';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Dữ liệu không hợp lệ: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'ID không hợp lệ hoặc không đúng định dạng';
    } else if (error.code === 11000) {  // Duplicate key error
      errorMessage = 'Dữ liệu bị trùng lặp, vui lòng thử lại';
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      errorType: error.name
    });
  }
};

// Đặt lịch hẹn
exports.bookAppointment = catchAsync(async (req, res, next) => {
  const { doctorId, date, time, reason } = req.body;
  const userId = req.user.id;

  // Kiểm tra bác sĩ tồn tại
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new AppError('Không tìm thấy bác sĩ', 404));
  }

  // Kiểm tra lịch làm việc của bác sĩ
  const schedule = await Schedule.findOne({
    doctorId,
    date,
    availableSlots: { $elemMatch: { time, isBooked: false } }
  });

  if (!schedule) {
    return next(new AppError('Khung giờ không có sẵn', 400));
  }

  // Tạo cuộc hẹn mới
  const appointment = await Appointment.create({
    doctorId,
    userId,
    date,
    time,
    reason,
    status: 'pending'
  });

  // Cập nhật trạng thái khung giờ
  await Schedule.updateOne(
    { _id: schedule._id, 'availableSlots.time': time },
    { $set: { 'availableSlots.$.isBooked': true } }
  );

  res.status(201).json({
    status: 'success',
    data: {
      appointment
    }
  });
});

// Lấy danh sách lịch hẹn của người dùng
exports.getUserAppointments = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const appointments = await Appointment.find({ userId })
    .populate({
      path: 'doctorId',
      select: 'name specialty avatarUrl'
    })
    .sort({ date: -1, time: -1 });

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: {
      appointments
    }
  });
});

// Đánh giá sau cuộc hẹn
exports.reviewAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const appointment = await Appointment.findOne({ _id: id, userId });
  
  if (!appointment) {
    return next(new AppError('Không tìm thấy lịch hẹn', 404));
  }

  if (appointment.status !== 'completed') {
    return next(new AppError('Chỉ có thể đánh giá cho cuộc hẹn đã hoàn thành', 400));
  }

  if (appointment.isReviewed) {
    return next(new AppError('Bạn đã đánh giá cuộc hẹn này rồi', 400));
  }

  // Cập nhật thông tin đánh giá
  appointment.rating = rating;
  appointment.review = comment;
  appointment.isReviewed = true;
  await appointment.save();

  // Cập nhật rating của bác sĩ
  const doctor = await Doctor.findById(appointment.doctorId);
  const allRatings = await Appointment.find({ 
    doctorId: appointment.doctorId,
    isReviewed: true,
    rating: { $exists: true }
  });
  
  const avgRating = allRatings.reduce((sum, item) => sum + item.rating, 0) / allRatings.length;
  
  doctor.rating = avgRating;
  doctor.ratingCount = allRatings.length;
  await doctor.save();

  res.status(200).json({
    status: 'success',
    message: 'Đánh giá thành công'
  });
});

// Lấy lịch làm việc của bác sĩ
exports.getDoctorSchedule = catchAsync(async (req, res, next) => {
  const doctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;
  const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
  
  // Tính ngày kết thúc (7 ngày từ ngày bắt đầu)
  const endDateObj = new Date(startDate);
  endDateObj.setDate(endDateObj.getDate() + 6);
  const endDate = endDateObj.toISOString().split('T')[0];

  const schedule = await Schedule.find({
    doctorId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  res.status(200).json({
    status: 'success',
    data: {
      schedule
    }
  });
});

// Cập nhật trạng thái cuộc hẹn (cho bác sĩ)
exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const doctorId = req.user.id;

  const appointment = await Appointment.findOne({ _id: id, doctorId });
  
  if (!appointment) {
    return next(new AppError('Không tìm thấy lịch hẹn hoặc bạn không phải bác sĩ của lịch hẹn này', 404));
  }

  const validStatuses = ['confirmed', 'completed', 'no-show'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Trạng thái không hợp lệ', 400));
  }

  appointment.status = status;
  if (notes) appointment.doctorNotes = notes;
  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment
    }
  });
});

// Thiết lập khung giờ làm việc (cho bác sĩ)
exports.setAvailability = catchAsync(async (req, res, next) => {
  const { date, slots } = req.body;
  const doctorId = req.user.id;

  // Validate input
  if (!date || !slots || !Array.isArray(slots)) {
    return next(new AppError('Vui lòng cung cấp ngày và danh sách khung giờ', 400));
  }

  // Format slots thành định dạng chuẩn
  const availableSlots = slots.map(slot => ({
    time: slot,
    isBooked: false
  }));

  // Tìm và cập nhật hoặc tạo mới lịch
  let schedule = await Schedule.findOne({ doctorId, date });
  
  if (schedule) {
    schedule.availableSlots = availableSlots;
    await schedule.save();
  } else {
    schedule = await Schedule.create({
      doctorId,
      date,
      availableSlots
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      schedule
    }
  });
});

// Lấy tất cả cuộc hẹn (cho admin)
exports.getAllAppointments = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { 
      doctorId, 
      patientId, 
      hospitalId,
      serviceId,
      specialtyId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Xây dựng query
    const query = {};

    // Lọc theo bác sĩ
    if (doctorId && doctorId !== 'all' && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.doctorId = doctorId;
    }

    // Lọc theo bệnh nhân
    if (patientId && patientId !== 'all' && mongoose.Types.ObjectId.isValid(patientId)) {
      query.patientId = patientId;
    }

    // Lọc theo bệnh viện
    if (hospitalId && hospitalId !== 'all' && mongoose.Types.ObjectId.isValid(hospitalId)) {
      query.hospitalId = hospitalId;
    }

    // Lọc theo dịch vụ
    if (serviceId && serviceId !== 'all' && mongoose.Types.ObjectId.isValid(serviceId)) {
      query.serviceId = serviceId;
    }

    // Lọc theo chuyên khoa
    if (specialtyId && specialtyId !== 'all' && mongoose.Types.ObjectId.isValid(specialtyId)) {
      // Tìm tất cả bác sĩ của chuyên khoa
      const Doctor = require('../models/Doctor');
      const doctors = await Doctor.find({ specialtyId }).select('_id');
      
      if (doctors.length > 0) {
        query.doctorId = { $in: doctors.map(doc => doc._id) };
      } else {
        // Không có bác sĩ nào thuộc chuyên khoa này
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          data: []
        });
      }
    }

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      query.status = status;
    }

    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      query.appointmentDate = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          query.appointmentDate.$gte = start;
        }
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999); // Đặt thời gian là cuối ngày
          query.appointmentDate.$lte = end;
        }
      }
    }

    // Sắp xếp
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Thực hiện truy vấn với phân trang
    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName phoneNumber email avatarUrl')
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId',
        populate: [
          { path: 'user', select: 'fullName email phoneNumber avatarUrl' },
          { path: 'specialtyId', select: 'name' }
        ]
      })
      .populate('hospitalId', 'name address imageUrl image')
      .populate('serviceId', 'name price duration')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số bản ghi phù hợp
    const total = await Appointment.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: appointments
    });
    
  } catch (error) {
    console.error('Get all appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch hẹn',
      error: error.message
    });
  }
};

// Lấy thống kê cuộc hẹn (cho admin)
exports.getAppointmentStats = catchAsync(async (req, res, next) => {
  // Thống kê theo trạng thái
  const statusStats = await Appointment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Thống kê theo ngày
  const dailyStats = await Appointment.aggregate([
    {
      $group: {
        _id: '$date',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 7 }
  ]);

  // Thống kê theo bác sĩ
  const doctorStats = await Appointment.aggregate([
    {
      $group: {
        _id: '$doctorId',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: '_id',
        foreignField: '_id',
        as: 'doctorInfo'
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        doctorName: { $arrayElemAt: ['$doctorInfo.name', 0] }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      statusStats,
      dailyStats,
      doctorStats
    }
  });
});

// Xóa cuộc hẹn (cho admin)
exports.deleteAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const appointment = await Appointment.findById(id);
  
  if (!appointment) {
    return next(new AppError('Không tìm thấy lịch hẹn', 404));
  }

  // Giải phóng khung giờ trong lịch bác sĩ
  await Schedule.updateOne(
    { doctorId: appointment.doctorId, date: appointment.date, 'availableSlots.time': appointment.time },
    { $set: { 'availableSlots.$.isBooked': false } }
  );

  await Appointment.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Lịch hẹn đã được xóa thành công'
  });
});

// Lấy danh sách chuyên khoa theo bệnh viện
exports.getSpecialtiesByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    // Lấy thông tin bệnh viện
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Nếu bệnh viện không có chuyên khoa
    if (!hospital.specialties || hospital.specialties.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Bệnh viện này chưa có chuyên khoa nào'
      });
    }
    
    // Lấy danh sách chuyên khoa của bệnh viện
    const Specialty = require('../models/Specialty');
    const specialties = await Specialty.find({
      _id: { $in: hospital.specialties },
      isActive: true
    });
    
    return res.status(200).json({
      success: true,
      count: specialties.length,
      data: specialties
    });
    
  } catch (error) {
    console.error('Get specialties by hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chuyên khoa theo bệnh viện',
      error: error.message
    });
  }
};

// Lấy danh sách dịch vụ theo chuyên khoa
exports.getServicesBySpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }
    
    // Kiểm tra chuyên khoa tồn tại
    const Specialty = require('../models/Specialty');
    const specialty = await Specialty.findById(specialtyId);
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }
    
    // Lấy danh sách dịch vụ theo chuyên khoa
    const Service = require('../models/Service');
    const services = await Service.find({ 
      specialtyId,
      isActive: true
    });
    
    return res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
    
  } catch (error) {
    console.error('Get services by specialty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách dịch vụ theo chuyên khoa',
      error: error.message
    });
  }
};
// Lấy danh sách bác sĩ theo chuyên khoa
exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }

    const Specialty = require('../models/Specialty');
    const specialty = await Specialty.findById(specialtyId);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }

    // Lọc user có vai trò doctor và active
    const activeUserIds = await User.find({
      roleType: 'doctor',
      isLocked: { $ne: true }
    }).select('_id');

    const doctors = await Doctor.find({
      specialtyId,
      isAvailable: true,
      user: { $in: activeUserIds.map(u => u._id) }
    })
    .populate('user', 'fullName email phoneNumber avatarUrl')
    .populate('hospitalId', 'name address imageUrl image')
    .populate('services', 'name price');

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });

  } catch (error) {
    console.error('Get doctors by specialty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ theo chuyên khoa',
      error: error.message
    });
  }
};

// Lấy danh sách bác sĩ theo bệnh viện và chuyên khoa
exports.getDoctorsByHospitalAndSpecialty = async (req, res) => {
  try {
    const { hospitalId, specialtyId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(specialtyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện hoặc chuyên khoa không hợp lệ'
      });
    }
    
    // Kiểm tra bệnh viện tồn tại
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Kiểm tra chuyên khoa tồn tại
    const Specialty = require('../models/Specialty');
    const specialty = await Specialty.findById(specialtyId);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }
    
    // Kiểm tra bệnh viện có hỗ trợ chuyên khoa này không
    if (hospital.specialties && hospital.specialties.length > 0) {
      const hasSpecialty = hospital.specialties.some(id => id.toString() === specialtyId.toString());
      if (!hasSpecialty) {
        return res.status(400).json({
          success: false,
          message: 'Bệnh viện này không hỗ trợ chuyên khoa đã chọn'
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Bệnh viện này chưa có chuyên khoa nào'
      });
    }
    
    // Tìm danh sách bác sĩ theo bệnh viện và chuyên khoa
    // Chỉ lấy bác sĩ có tài khoản active (không bị khóa)
    const activeUserIds = await User.find({ 
      roleType: 'doctor',
      isLocked: { $ne: true } 
    }).select('_id');
    
    const doctors = await Doctor.find({
      hospitalId,
      specialtyId,
      isAvailable: true,
      user: { $in: activeUserIds.map(u => u._id) }
    })
    .populate('user', 'fullName email phoneNumber avatarUrl')
    .populate('specialtyId', 'name')
    .populate('services', 'name price');
    
    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
    
  } catch (error) {
    console.error('Get doctors by hospital and specialty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ theo bệnh viện và chuyên khoa',
      error: error.message
    });
  }
};
exports.getDoctorsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }

    const activeUserIds = await User.find({
      roleType: 'doctor',
      isLocked: { $ne: true }
    }).select('_id');

    const doctors = await Doctor.find({
      hospitalId,
      isAvailable: true,
      user: { $in: activeUserIds.map(u => u._id) }
    })
    .populate('user', 'fullName email phoneNumber avatarUrl')
    .populate('specialtyId', 'name')
    .populate('services', 'name price');

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });

  } catch (error) {
    console.error('Get doctors by hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ theo bệnh viện',
      error: error.message
    });
  }
};

// Lấy danh sách bác sĩ theo dịch vụ
exports.getDoctorsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'ID dịch vụ không hợp lệ'
      });
    }
    
    // Kiểm tra dịch vụ tồn tại
    const Service = require('../models/Service');
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }
    
    // Tìm các bác sĩ cung cấp dịch vụ này
    const activeUserIds = await User.find({ 
      roleType: 'doctor',
      isLocked: { $ne: true } 
    }).select('_id');
    
    const doctors = await Doctor.find({
      services: serviceId,
      isAvailable: true,
      user: { $in: activeUserIds.map(u => u._id) }
    })
    .populate('user', 'fullName email phoneNumber avatarUrl')
    .populate('specialtyId', 'name')
    .populate('hospitalId', 'name address imageUrl image')
    .populate('services', 'name price');
    
    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
    
  } catch (error) {
    console.error('Get doctors by service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ theo dịch vụ',
      error: error.message
    });
  }
};

// Lấy danh sách phòng khám theo bệnh viện, chuyên khoa và bác sĩ
exports.getRoomsByFilters = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { specialtyId, doctorId, appointmentDate, timeSlot } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    // Kiểm tra bệnh viện tồn tại
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Xây dựng query filter
    const filter = { hospitalId };
    
    if (specialtyId && mongoose.Types.ObjectId.isValid(specialtyId)) {
      filter.specialtyId = specialtyId;
    }
    
    // Lấy danh sách phòng theo filter
    let rooms = await Room.find(filter)
      .populate('specialtyId', 'name')
      .lean();
    
    // Nếu có ngày và time slot, kiểm tra phòng nào đã có lịch hẹn
    if (appointmentDate && timeSlot) {
      const parsedTimeSlot = typeof timeSlot === 'string' ? JSON.parse(timeSlot) : timeSlot;
      const { startTime, endTime } = parsedTimeSlot;
      
      if (startTime && endTime) {
        // Tìm các cuộc hẹn trùng thời gian
        const bookedAppointments = await Appointment.find({
          appointmentDate,
          'timeSlot.startTime': startTime,
          'timeSlot.endTime': endTime,
          status: { $nin: ['cancelled', 'rejected'] }
        }).select('roomId');
        
        // Lấy danh sách ID phòng đã được đặt
        const bookedRoomIds = bookedAppointments.map(appt => 
          appt.roomId ? appt.roomId.toString() : null
        ).filter(id => id !== null);
        
        // Đánh dấu phòng nào đã được đặt
        rooms = rooms.map(room => ({
          ...room,
          isAvailable: !bookedRoomIds.includes(room._id.toString())
        }));
      }
    }
    
    return res.status(200).json({
      success: true,
      data: rooms,
      message: 'Lấy danh sách phòng thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách phòng',
      error: error.message
    });
  }
};

// Lấy lịch làm việc của bác sĩ
exports.getDoctorSchedules = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  // Validate doctor ID
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('ID bác sĩ không hợp lệ', 400));
  }

  // Build query conditions
  const query = { doctorId };
  
  // Add date filter if provided
  if (date) {
    // Create a date range for the specified date (entire day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    query.date = { $gte: startDate, $lte: endDate };
  } else {
    // If no specific date, only get present and future dates
    const now = new Date();
    query.date = { $gte: now };
  }

  // Find schedules for the doctor
  let schedules = await Schedule.find(query)
    .sort({ date: 1 })
    .populate('doctorId', 'user specialtyId hospitalId')
    .lean();

  // Return information about all time slots, including both available and booked ones
  schedules = schedules.map(schedule => {
    const timeSlots = schedule.timeSlots.map(slot => ({
      ...slot,
      isBooked: slot.isBooked || (slot.appointmentId !== null),
      // Don't expose the appointmentId to the client for security
      appointmentId: slot.isBooked || (slot.appointmentId !== null) ? true : null
    }));

    return {
      ...schedule,
      timeSlots
    };
  });

  res.status(200).json({
    status: 'success',
    results: schedules.length,
    data: schedules
  });
});

// Thống kê theo chuyên khoa
exports.getSpecialtyStatistics = async (req, res) => {
  try {
    // Thống kê số lượng bác sĩ theo từng chuyên khoa
    const doctorsBySpecialty = await Doctor.aggregate([
      {
        $group: {
          _id: '$specialtyId',
          doctorCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'specialties',
          localField: '_id',
          foreignField: '_id',
          as: 'specialty'
        }
      },
      {
        $unwind: '$specialty'
      },
      {
        $project: {
          _id: 1,
          doctorCount: 1,
          specialtyName: '$specialty.name'
        }
      },
      {
        $sort: { doctorCount: -1 }
      }
    ]);
    
    // Thống kê số lượng lịch hẹn theo từng chuyên khoa
    const appointmentsBySpecialty = await Appointment.aggregate([
      {
        $group: {
          _id: '$specialtyId',
          appointmentCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'specialties',
          localField: '_id',
          foreignField: '_id',
          as: 'specialty'
        }
      },
      {
        $unwind: '$specialty'
      },
      {
        $project: {
          _id: 1,
          appointmentCount: 1,
          completedCount: 1,
          cancelledCount: 1,
          specialtyName: '$specialty.name'
        }
      },
      {
        $sort: { appointmentCount: -1 }
      }
    ]);
    
    // Kết hợp kết quả
    const specialtyStats = [];
    
    // Thêm thông tin từ doctorsBySpecialty
    doctorsBySpecialty.forEach(item => {
      specialtyStats.push({
        specialtyId: item._id,
        specialtyName: item.specialtyName,
        doctorCount: item.doctorCount,
        appointmentCount: 0,
        completedCount: 0,
        cancelledCount: 0
      });
    });
    
    // Cập nhật từ appointmentsBySpecialty
    appointmentsBySpecialty.forEach(item => {
      const index = specialtyStats.findIndex(s => s.specialtyId.toString() === item._id.toString());
      
      if (index !== -1) {
        specialtyStats[index].appointmentCount = item.appointmentCount;
        specialtyStats[index].completedCount = item.completedCount;
        specialtyStats[index].cancelledCount = item.cancelledCount;
      } else {
        specialtyStats.push({
          specialtyId: item._id,
          specialtyName: item.specialtyName,
          doctorCount: 0,
          appointmentCount: item.appointmentCount,
          completedCount: item.completedCount,
          cancelledCount: item.cancelledCount
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      count: specialtyStats.length,
      data: specialtyStats
    });
    
  } catch (error) {
    console.error('Get specialty statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê theo chuyên khoa',
      error: error.message
    });
  }
};

// Thống kê theo dịch vụ
exports.getServiceStatistics = async (req, res) => {
  try {
    // Thống kê số lượng lịch hẹn theo từng dịch vụ
    const appointmentsByService = await Appointment.aggregate([
      {
        $match: {
          serviceId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$serviceId',
          appointmentCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$fee.totalAmount',
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: '$service'
      },
      {
        $project: {
          _id: 1,
          appointmentCount: 1,
          completedCount: 1,
          totalRevenue: 1,
          serviceName: '$service.name',
          servicePrice: '$service.price',
          specialtyId: '$service.specialtyId'
        }
      },
      {
        $lookup: {
          from: 'specialties',
          localField: 'specialtyId',
          foreignField: '_id',
          as: 'specialty'
        }
      },
      {
        $unwind: '$specialty'
      },
      {
        $project: {
          _id: 1,
          appointmentCount: 1,
          completedCount: 1,
          totalRevenue: 1,
          serviceName: 1,
          servicePrice: 1,
          specialtyId: 1,
          specialtyName: '$specialty.name'
        }
      },
      {
        $sort: { appointmentCount: -1 }
      }
    ]);
    
    return res.status(200).json({
      success: true,
      count: appointmentsByService.length,
      data: appointmentsByService
    });
    
  } catch (error) {
    console.error('Get service statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê theo dịch vụ',
      error: error.message
    });
  }
};

/**
 * @desc    Admin xem chi tiết lịch hẹn
 * @route   GET /api/admin/appointments/:id
 * @access  Private (Admin)
 */
exports.getAppointmentDetailAdmin = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }

    // Tìm lịch hẹn với thông tin chi tiết
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'fullName phoneNumber email avatarUrl address dateOfBirth gender')
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId hospitalId experience education consultationFee',
        populate: [
          { path: 'user', select: 'fullName email phoneNumber avatarUrl' },
          { path: 'specialtyId', select: 'name description' },
          { path: 'hospitalId', select: 'name address contactInfo workingHours imageUrl image' }
        ]
      })
      .populate('hospitalId', 'name address contactInfo workingHours imageUrl image')
      .populate('serviceId', 'name price description')
      .populate('roomId', 'name number floor')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Lấy thông tin thanh toán nếu có
    const Payment = require('../models/Payment');
    const payment = await Payment.findOne({ appointmentId: id });
    
    // Thêm thông tin thanh toán vào response
    appointment._doc.payment = payment;

    // Lấy lịch sử thay đổi trạng thái
    appointment._doc.statusHistory = appointment.statusHistory || [];

    return res.status(200).json({
      success: true,
      data: appointment
    });
    
  } catch (error) {
    console.error('Get appointment detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết lịch hẹn',
      error: error.message
    });
  }
};

/**
 * @desc    Admin cập nhật lịch hẹn
 * @route   PUT /api/admin/appointments/:id
 * @access  Private (Admin)
 */
exports.updateAppointmentAdmin = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { id } = req.params;
    const { 
      status, 
      appointmentDate, 
      timeSlot, 
      roomId,
      doctorId,
      hospitalId,
      serviceId,
      notes 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }

    // Tìm lịch hẹn cần cập nhật
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Kiểm tra trạng thái
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled', 'rejected', 'no-show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      // Lưu lịch sử thay đổi trạng thái
      if (status !== appointment.status) {
        appointment.statusHistory = appointment.statusHistory || [];
        appointment.statusHistory.push({
          from: appointment.status,
          to: status,
          changedBy: req.user.id,
          changedAt: new Date()
        });
      }
    }

    // Xác thực dữ liệu đầu vào nếu thay đổi lịch hẹn
    if (doctorId || hospitalId || serviceId || appointmentDate || timeSlot) {
      // Kiểm tra bác sĩ mới nếu có
      if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy bác sĩ'
          });
        }
      }

      // Kiểm tra bệnh viện mới nếu có
      if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
        const Hospital = require('../models/Hospital');
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy bệnh viện'
          });
        }
      }

      // Kiểm tra dịch vụ mới nếu có
      if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
        const Service = require('../models/Service');
        const service = await Service.findById(serviceId);
        if (!service) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy dịch vụ'
          });
        }
      }

      // Kiểm tra phòng mới nếu có
      if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
        const Room = require('../models/Room');
        const room = await Room.findById(roomId);
        if (!room) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy phòng'
          });
        }
      }

      // Kiểm tra định dạng ngày và thời gian nếu cập nhật
      if (appointmentDate) {
        const date = new Date(appointmentDate);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng ngày không hợp lệ'
          });
        }

        // Kiểm tra ngày trong quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          return res.status(400).json({
            success: false,
            message: 'Không thể đặt lịch hẹn cho ngày trong quá khứ'
          });
        }
      }

      if (timeSlot) {
        // Kiểm tra định dạng thời gian (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(timeSlot)) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng thời gian không hợp lệ (HH:MM)'
          });
        }
      }
    }

    // Cập nhật lịch hẹn
    const updateData = {};
    if (status) updateData.status = status;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (roomId) updateData.roomId = roomId;
    if (doctorId) updateData.doctorId = doctorId;
    if (hospitalId) updateData.hospitalId = hospitalId;
    if (serviceId) updateData.serviceId = serviceId;
    if (notes) updateData.notes = notes;
    updateData.updatedBy = req.user.id;
    updateData.updatedAt = new Date();

    if (status === 'rescheduled') {
      updateData.rescheduledBy = req.user.id;
      updateData.rescheduledAt = new Date();
    }

    // Cập nhật statusHistory
    if (appointment.statusHistory) {
      updateData.statusHistory = appointment.statusHistory;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('patientId', 'fullName phoneNumber email')
    .populate({
      path: 'doctorId',
      select: 'user title',
      populate: { path: 'user', select: 'fullName email phoneNumber' }
    })
    .populate('hospitalId', 'name address imageUrl image')
    .populate('serviceId', 'name price');

    // Send real-time notification if there were meaningful changes
    if (Object.keys(updateData).length > 0) {
      try {
        await appointmentUpdatedNotification(updatedAppointment, req.user.id, updateData);
      } catch (notificationError) {
        console.error('Error sending appointment update notification:', notificationError);
        // Continue execution
      }
    }

    return res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: 'Cập nhật lịch hẹn thành công'
    });
    
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch hẹn',
      error: error.message
    });
  }
}; 


// GET /api/appointments/doctor/today - Lấy danh sách lịch hẹn hôm nay của bác sĩ
exports.getDoctorTodayAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tìm doctor record dựa vào user id
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Lấy ngày hiện tại (theo múi giờ địa phương)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Xây dựng query
    const query = {
      doctorId: doctor._id,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    // Lấy danh sách lịch hẹn hôm nay
    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName phoneNumber email gender dateOfBirth avatarUrl')
      .populate('hospitalId', 'name address imageUrl image')
      .populate('specialtyId', 'name')
      .populate('serviceId', 'name price')
      .sort({ appointmentTime: 1 });
    
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor today appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch hẹn hôm nay',
      error: error.message
    });
  }
};

// PUT /api/appointments/:id/confirm - Bác sĩ xác nhận lịch hẹn
exports.confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validate appointmentId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }
    
    // Tìm doctor record dựa vào user id
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Tìm lịch hẹn
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    // Kiểm tra lịch hẹn có phải của bác sĩ này không
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác nhận lịch hẹn này'
      });
    }
    
    // Kiểm tra trạng thái hiện tại của lịch hẹn
    if (appointment.status !== 'pending' && appointment.status !== 'rescheduled' ) {
      return res.status(400).json({
        success: false,
        message: `Không thể xác nhận lịch hẹn vì trạng thái hiện tại là ${appointment.status}`
      });
    }
    
    // Cập nhật trạng thái lịch hẹn
    appointment.status = 'confirmed';
    appointment.confirmationDate = new Date();
    
    await appointment.save();
    
    // Gửi email thông báo cho bệnh nhân (nếu có)
    try {
      const patient = await User.findById(appointment.patientId);
      if (patient && patient.email) {
        // Tạo đối tượng thông tin lịch hẹn cho email
        const doctorUser = await User.findById(doctor.user);
        const hospitalData = await Hospital.findById(appointment.hospitalId);

        // Kiểm tra và định dạng giờ từ khung giờ
        let startTime = '';
        let endTime = '';

        // Kiểm tra nếu có timeSlot từ appointment
        if (appointment.timeSlot && appointment.timeSlot.startTime && appointment.timeSlot.endTime) {
          startTime = appointment.timeSlot.startTime;
          endTime = appointment.timeSlot.endTime;
        } 
        // Nếu có appointmentTime, thử tách
        else if (appointment.appointmentTime && typeof appointment.appointmentTime === 'string') {
          const timeParts = appointment.appointmentTime.split('-');
          if (timeParts.length === 2) {
            startTime = timeParts[0].trim();
            endTime = timeParts[1].trim();
          }
        }

        const appointmentInfo = {
          bookingCode: appointment.bookingCode || appointment.appointmentCode,
          doctorName: doctor.title + ' ' + doctorUser.fullName,
          hospitalName: hospitalData.name,
          appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('vi-VN'),
          startTime: startTime,
          endTime: endTime,
          roomName: appointment.roomName || 'Chưa xác định',
          specialtyName: (await Specialty.findById(doctor.specialtyId))?.name || '',
          serviceName: appointment.serviceId ? await getServiceName(appointment.serviceId) : ''
        };
        
        await sendAppointmentConfirmationEmail(
          patient.email,
          patient.fullName,
          appointmentInfo
        );
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }
    
    return res.status(200).json({
      success: true,
      data: appointment,
      message: 'Xác nhận lịch hẹn thành công'
    });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận lịch hẹn',
      error: error.message
    });
  }
};

// PUT /api/appointments/:id/reject - Bác sĩ từ chối lịch hẹn
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    // Yêu cầu lý do từ chối
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do từ chối lịch hẹn'
      });
    }
    
    // Validate appointmentId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }
    
    // Tìm doctor record dựa vào user id
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Tìm lịch hẹn
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    // Kiểm tra lịch hẹn có phải của bác sĩ này không
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền từ chối lịch hẹn này'
      });
    }
    
    // Kiểm tra trạng thái hiện tại của lịch hẹn
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể từ chối lịch hẹn vì trạng thái hiện tại là ${appointment.status}`
      });
    }
    
    // Cập nhật trạng thái lịch hẹn
    appointment.status = 'rejected';
    appointment.rejectionReason = reason;
    appointment.rejectionDate = new Date();
    
    await appointment.save();
    
    // Cập nhật trạng thái của timeSlot trong schedule
    try {
      if (appointment.scheduleId && appointment.timeSlotId) {
        const schedule = await Schedule.findById(appointment.scheduleId);
        if (schedule) {
          const timeSlot = schedule.timeSlots.id(appointment.timeSlotId);
          if (timeSlot) {
            timeSlot.isBooked = false;
            timeSlot.appointmentId = null;
            await schedule.save();
          }
        }
      }
    } catch (scheduleError) {
      console.error('Error updating schedule time slot:', scheduleError);
    }
    
    // Gửi email thông báo cho bệnh nhân (nếu có)
    try {
      const patient = await User.findById(appointment.patientId);
      if (patient && patient.email) {
        // Gửi email thông báo từ chối lịch hẹn
        // TODO: Thêm hàm gửi email từ chối lịch hẹn
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }
    
    return res.status(200).json({
      success: true,
      data: appointment,
      message: 'Từ chối lịch hẹn thành công'
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối lịch hẹn',
      error: error.message
    });
  }
};

// PUT /api/appointments/:id/complete - Bác sĩ hoàn thành lịch hẹn
exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, prescription, notes } = req.body;
    const userId = req.user.id;
    
    // Validate appointmentId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ'
      });
    }
    
    // Xác thực prescription là mảng nếu được cung cấp
    if (prescription && !Array.isArray(prescription)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn thuốc phải là một mảng các loại thuốc'
      });
    }
    
    // Validate dữ liệu đơn thuốc
    if (prescription && Array.isArray(prescription)) {
      for (const med of prescription) {
        if (!med.medicine) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi thuốc trong đơn thuốc phải có tên thuốc'
          });
        }
      }
    }
    
    // Tìm doctor record dựa vào user id
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Tìm lịch hẹn
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    // Kiểm tra lịch hẹn có phải của bác sĩ này không
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hoàn thành lịch hẹn này'
      });
    }
    
    // Kiểm tra trạng thái hiện tại của lịch hẹn
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Không thể hoàn thành lịch hẹn vì trạng thái hiện tại là ${appointment.status}`
      });
    }
    
    // Cập nhật trạng thái lịch hẹn
    appointment.status = 'completed';
    appointment.completionDate = new Date();
    
    // Cập nhật thông tin y tế
    appointment.medicalRecord = {
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      prescription: prescription || [],
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await appointment.save();
    
    // Tạo hoặc cập nhật hồ sơ bệnh án
    const MedicalRecord = require('../models/MedicalRecord');
    
    // Kiểm tra nếu đã có hồ sơ từ lịch hẹn này
    let medicalRecord = await MedicalRecord.findOne({ appointmentId: id });
    
    if (medicalRecord) {
      // Cập nhật hồ sơ hiện có
      medicalRecord.diagnosis = diagnosis || medicalRecord.diagnosis;
      medicalRecord.treatment = treatment || medicalRecord.treatment;
      if (prescription) medicalRecord.prescription = prescription;
      medicalRecord.notes = notes || medicalRecord.notes;
      await medicalRecord.save();
    } else {
      // Tạo hồ sơ mới
      medicalRecord = new MedicalRecord({
        patientId: appointment.patientId,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        diagnosis: diagnosis || '',
        treatment: treatment || '',
        prescription: prescription || [],
        notes: notes || ''
      });
      await medicalRecord.save();
    }
    
    return res.status(200).json({
      success: true,
      data: {
        appointment,
        medicalRecord
      },
      message: 'Hoàn thành lịch hẹn và cập nhật hồ sơ bệnh án thành công'
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hoàn thành lịch hẹn',
      error: error.message
    });
  }
}; 

// Add coupon validation endpoint
exports.validateCoupon = async (req, res) => {
  try {
    const { code, serviceId, specialtyId } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giảm giá'
      });
    }
    
    // Find coupon by code
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim()
    });
    
    if (!coupon) {
      return res.status(200).json({
        success: false,
        message: 'Mã giảm giá không tồn tại'
      });
    }
    
    // Check if coupon is valid
    if (!coupon.isValid) {
      return res.status(200).json({
        success: false,
        message: 'Mã giảm giá đã hết hạn hoặc không còn hiệu lực'
      });
    }
    
    // Check if coupon is applicable to this service or specialty
    let isCouponApplicable = true;
    
    if (coupon.applicableServices && coupon.applicableServices.length > 0) {
      isCouponApplicable = serviceId && coupon.applicableServices.some(id => id.toString() === serviceId.toString());
      
      if (!isCouponApplicable) {
        return res.status(200).json({
          success: false,
          message: 'Mã giảm giá này không áp dụng cho dịch vụ đã chọn'
        });
      }
    } else if (coupon.applicableSpecialties && coupon.applicableSpecialties.length > 0) {
      isCouponApplicable = specialtyId && coupon.applicableSpecialties.some(id => id.toString() === specialtyId.toString());
      
      if (!isCouponApplicable) {
        return res.status(200).json({
          success: false,
          message: 'Mã giảm giá này không áp dụng cho chuyên khoa đã chọn'
        });
      }
    }
    
    // Return coupon details if valid
    return res.status(200).json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount || 0,
        minPurchase: coupon.minPurchase || 0,
        expiryDate: coupon.expiryDate,
        isValid: coupon.isValid
      }
    });
    
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra mã giảm giá',
      error: error.message
    });
  }
};

/**
 * @desc    Get appointment counts by status for doctor
 * @route   GET /api/appointments/doctor/counts
 * @access  Private (doctor)
 */
exports.getDoctorAppointmentCounts = async (req, res) => {
  try {
    // First find the doctor ID associated with the logged-in user
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Ensure we have a proper ObjectId for the aggregation
    const doctorObjectId = new mongoose.Types.ObjectId(doctor._id);
    
    // Aggregate appointments by status
    const counts = await Appointment.aggregate([
      { $match: { doctorId: doctorObjectId } },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    // Initialize all status counts to zero
    const countsByStatus = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
      rescheduled: 0,
      'no-show': 0
    };
    
    // Update counts for statuses that have appointments
    let total = 0;
    for (const item of counts) {
      if (item._id && countsByStatus.hasOwnProperty(item._id)) {
        countsByStatus[item._id] = item.count;
      }
      total += item.count;
    }
    
    countsByStatus.total = total;
    
    // Log the counts for debugging
    console.log('Appointment counts by status:', countsByStatus);
    
    return res.status(200).json({
      success: true,
      data: countsByStatus
    });
  } catch (error) {
    console.error('Error getting appointment counts:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy số lượng lịch hẹn theo trạng thái',
      error: error.message
    });
  }
};

// Add a new endpoint to check slot availability and lock status
exports.checkTimeSlotAvailability = async (req, res) => {
  try {
    const { scheduleId, timeSlotId } = req.params;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }
    
    // Find schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    
    // Find time slot
    const timeSlot = schedule.timeSlots.find(slot => 
      slot.startTime === timeSlotId || slot._id.toString() === timeSlotId
    );
    
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ'
      });
    }
    
    // Check if slot is booked
    if (timeSlot.isBooked) {
      return res.status(200).json({
        success: true,
        isAvailable: false,
        isLocked: false,
        message: 'Khung giờ đã được đặt'
      });
    }
    
    // Check if slot is locked by another user
    const isLocked = isTimeSlotLocked(scheduleId, timeSlot.startTime);
    const lockerUserId = isLocked ? getTimeSlotLocker(scheduleId, timeSlot.startTime) : null;
    const isLockedByCurrentUser = isLocked && lockerUserId === req.user.id.toString();
    
    return res.status(200).json({
      success: true,
      isAvailable: !isLocked || isLockedByCurrentUser,
      isLocked: isLocked && !isLockedByCurrentUser,
      message: isLocked && !isLockedByCurrentUser 
        ? 'Khung giờ đang được người khác xử lý' 
        : 'Khung giờ có sẵn'
    });
    
  } catch (error) {
    console.error('Check time slot availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra khung giờ',
      error: error.message
    });
  }
};

/**
 * @desc    Get all appointments for logged-in doctor
 * @route   GET /api/appointments/doctor
 * @access  Private (doctor)
 */
exports.getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tìm doctor record dựa vào user id
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Lấy query parameters cho phân trang và lọc
    const { page = 1, limit = 10, status, fromDate, toDate, search } = req.query;
    
    // Xây dựng query
    const query = {
      doctorId: doctor._id
    };
    
    // Thêm bộ lọc trạng thái nếu có
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Thêm bộ lọc theo khoảng thời gian nếu có
    if (fromDate || toDate) {
      query.appointmentDate = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = endDate;
      }
    }
    
    // Tìm kiếm theo tên bệnh nhân hoặc mã đặt lịch nếu có
    if (search) {
      // Tìm danh sách user IDs khớp với từ khóa tìm kiếm
      const users = await User.find({
        fullName: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      // Mở rộng query để tìm kiếm theo ID bệnh nhân hoặc mã đặt lịch
      query.$or = [
        { patientId: { $in: userIds } },
        { bookingCode: { $regex: search, $options: 'i' } },
        { appointmentCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Doctor appointments query:', JSON.stringify(query));
    
    // Tính toán skip cho phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Đếm tổng số lịch hẹn thỏa mãn điều kiện
    const total = await Appointment.countDocuments(query);
    
    // Lấy danh sách lịch hẹn
    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName phoneNumber email gender dateOfBirth avatarUrl')
      .populate('hospitalId', 'name address imageUrl image')
      .populate('specialtyId', 'name')
      .populate('serviceId', 'name price')
      .sort({ appointmentDate: -1, 'timeSlot.startTime': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log(`Found ${appointments.length} appointments for doctor, including statuses:`, 
               appointments.map(a => a.status));
    
    return res.status(200).json({
      success: true,
      count: appointments.length,
      total: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch hẹn',
      error: error.message
    });
  }
};

/**
 * @desc    Get all appointments for logged-in patient
 * @route   GET /api/appointments/user/patient
 * @access  Private (patient)
 */
exports.getPatientAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Lấy query parameters cho phân trang và lọc
    const { page = 1, limit = 10, status, fromDate, toDate } = req.query;
    
    console.log('Original query params:', { page, limit, status, fromDate, toDate });
    
    // Xây dựng query
    const query = {
      patientId: userId
    };
    
    // Only apply status filter if specifically requested and not 'all'
    if (status && status !== 'all' && status !== '') {
      query.status = status;
    }
    // Don't add any default status filtering - this allows all statuses to be shown
    
    console.log('Final MongoDB query:', JSON.stringify(query));
    
    // Tính toán skip cho phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Đếm tổng số lịch hẹn thỏa mãn điều kiện
    const total = await Appointment.countDocuments(query);
    
    // Lấy danh sách lịch hẹn
    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctorId',
        populate: {
          path: 'user',
          select: 'fullName avatarUrl'
        }
      })
      .populate('hospitalId', 'name address imageUrl image')
      .populate('specialtyId', 'name')
      .populate('serviceId', 'name price')
      .sort({ appointmentDate: -1, 'timeSlot.startTime': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add debug logging to verify the fix
    console.log(`Found ${appointments.length} appointments with these statuses:`, 
                appointments.map(a => a.status).join(', '));
    
    return res.status(200).json({
      success: true,
      count: appointments.length,
      total: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: appointments
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch hẹn',
      error: error.message
    });
  }
};

/**
 * @desc    Mark appointment as no-show
 * @route   PUT /api/appointments/:id/no-show
 * @access  Private (doctor)
 */
exports.markAsNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the doctor associated with the logged-in user
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Find the appointment
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    // Verify the appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện'
      });
    }
    
    // Check the current status of the appointment
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Không thể đánh dấu không đến khám vì trạng thái hiện tại là ${appointment.status}`
      });
    }
    
    // Update the appointment status
    appointment.status = 'no-show';
    appointment.noShowDate = new Date();
    
    await appointment.save();
    
    return res.status(200).json({
      success: true,
      data: appointment,
      message: 'Đã đánh dấu bệnh nhân không đến khám'
    });
  } catch (error) {
    console.error('Mark as no-show error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu bệnh nhân không đến khám',
      error: error.message
    });
  }
};