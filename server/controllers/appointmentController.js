const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const mongoose = require('mongoose');
const { sendAppointmentConfirmationEmail, sendAppointmentReminderEmail } = require('../services/emailService');
const DoctorSchedule = require('../models/DoctorSchedule');
const { catchAsync } = require('../utils/errorHandler');
const AppError = require('../utils/appError');

// POST /api/appointments – Đặt lịch khám
exports.createAppointment = async (req, res) => {
  try {
    // Log thông tin người dùng để gỡ lỗi
    console.log('User creating appointment:', {
      userId: req.user.id,
      role: req.user.role,
      roleType: req.user.roleType
    });
    
    const { 
      doctorId, 
      hospitalId, 
      scheduleId, 
      timeSlot, 
      appointmentDate, 
      appointmentType,
      symptoms,
      medicalHistory,
      notes
    } = req.body;
    
    // Validate required fields
    if (!doctorId || !hospitalId || !scheduleId || !timeSlot || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch hẹn'
      });
    }
    
    // Validate that doctor exists
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Validate that hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Validate that schedule exists and time slot is available
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khám'
      });
    }
    
    // Check if the time slot is available
    const availableSlot = schedule.timeSlots.find(
      slot => slot.startTime === timeSlot.startTime && 
              slot.endTime === timeSlot.endTime && 
              !slot.isBooked
    );
    
    if (!availableSlot) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt hoặc không tồn tại'
      });
    }
    
    // Calculate fees
    const consultationFee = doctor.consultationFee || 0;
    const additionalFees = 0; // Can be calculated based on services if needed
    const discount = 0; // Can be calculated based on promotions if needed
    const totalAmount = consultationFee + additionalFees - discount;
    
    // Create new appointment
    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      hospitalId,
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
      }
    });
    
    // Update the schedule to mark the time slot as booked
    const slotIndex = schedule.timeSlots.findIndex(
      slot => slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
    );
    
    if (slotIndex !== -1) {
      schedule.timeSlots[slotIndex].isBooked = true;
      schedule.timeSlots[slotIndex].appointmentId = appointment._id;
      await schedule.save();
    }
    
    // Send confirmation email to patient
    try {
      const patient = await User.findById(req.user.id);
      // Kiểm tra hàm tồn tại trước khi gọi
      if (typeof sendAppointmentConfirmationEmail === 'function') {
        await sendAppointmentConfirmationEmail(
          patient.email,
          patient.fullName,
          {
            bookingCode: appointment.bookingCode,
            doctorName: doctor.user.fullName,
            hospitalName: hospital.name,
            appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
          }
        );
      } else {
        console.log('Bỏ qua gửi email vì hàm sendAppointmentConfirmationEmail chưa được triển khai');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with the process even if email fails
    }
    
    // Return the created appointment
    return res.status(201).json({
      success: true,
      data: appointment,
      message: 'Đặt lịch khám thành công'
    });
    
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lịch khám',
      error: error.message
    });
  }
};

// GET /api/appointments?userId= – Lấy danh sách lịch sử khám
exports.getAppointments = async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 10 } = req.query;
    
    // Xác định người dùng để lấy lịch hẹn
    const targetUserId = userId || req.user.id;
    
    // Kiểm tra quyền truy cập
    if (targetUserId !== req.user.id && req.user.roleType !== 'admin' && req.user.roleType !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập lịch hẹn của người dùng khác'
      });
    }
    
    // Tạo điều kiện truy vấn
    const query = {};
    
    // Nếu là bệnh nhân, chỉ xem lịch hẹn của mình
    if (req.user.roleType === 'user') {
      query.patientId = req.user.id;
    } 
    // Nếu là bác sĩ, chỉ xem lịch hẹn của mình
    else if (req.user.roleType === 'doctor') {
      // Tìm doctorId dựa trên userId
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ'
        });
      }
      query.doctorId = doctorProfile._id;
    } 
    // Nếu là quản trị viên, có thể xem tất cả hoặc lọc theo userId
    else if (req.user.roleType === 'admin') {
      if (userId) {
        // Kiểm tra xem userId là của bệnh nhân hay bác sĩ
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy người dùng'
          });
        }
        
        if (user.roleType === 'doctor') {
          const doctorProfile = await Doctor.findOne({ user: userId });
          if (doctorProfile) {
            query.doctorId = doctorProfile._id;
          }
        } else {
          query.patientId = userId;
        }
      }
    }
    
    // Lọc theo trạng thái nếu được cung cấp
    if (status) {
      query.status = status;
    }
    
    // Tính toán pagination
    const skip = (page - 1) * limit;
    
    // Thực hiện truy vấn với pagination
    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName email phoneNumber')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'user',
          select: 'fullName email'
        }
      })
      .populate('hospitalId', 'name address.city')
      .sort({ appointmentDate: -1, 'timeSlot.startTime': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Đếm tổng số lịch hẹn thỏa mãn điều kiện
    const total = await Appointment.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: appointments
    });
    
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch hẹn',
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
    
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'fullName email phoneNumber dateOfBirth gender address')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'user specialtyId',
          select: 'fullName email title'
        }
      })
      .populate('hospitalId', 'name address contactInfo')
      .populate('scheduleId');
    
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

  const appointment = await Appointment.findOne({ _id: id, patientId: userId });
  
  if (!appointment) {
    return next(new AppError('Không tìm thấy lịch hẹn hoặc bạn không có quyền hủy', 404));
  }

  // // Kiểm tra xem có thể hủy không (ví dụ: chỉ hủy trước 24h)
  // let appointmentDateTime;
  
  // // Đảm bảo lấy đúng thời gian cuộc hẹn
  // if (appointment.timeSlot && appointment.timeSlot.startTime) {
  //   // Nếu có timeSlot.startTime (format: HH:mm)
  //   const [hours, minutes] = appointment.timeSlot.startTime.split(':').map(Number);
  //   appointmentDateTime = new Date(appointment.appointmentDate);
  //   appointmentDateTime.setHours(hours, minutes, 0, 0);
  // } else {
  //   // Nếu chỉ có ngày
  //   appointmentDateTime = new Date(appointment.appointmentDate);
  //   appointmentDateTime.setHours(0, 0, 0, 0);  // Mặc định đầu ngày
  // }
  
  // const now = new Date();
  
  // // Log để debug
  // console.log('Thời gian hiện tại:', now);
  // console.log('Thời gian cuộc hẹn:', appointmentDateTime);
  
  // const diffHours = (appointmentDateTime - now) / (1000 * 60 * 60);
  // console.log('Số giờ chênh lệch:', diffHours);
  
  // // Sửa lại điều kiện, chỉ áp dụng cho cuộc hẹn trong tương lai
  // if (diffHours < 24 && diffHours > 0) {
  //   return next(new AppError('Không thể hủy lịch hẹn trước 24 giờ', 400));
  // }

  // Cập nhật trạng thái lịch hẹn
  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body.cancellationReason || 'Người dùng hủy';
  await appointment.save();

  // Giải phóng khung giờ trong lịch
  await Schedule.updateOne(
    { _id: appointment.scheduleId, 'timeSlots.startTime': appointment.timeSlot.startTime, 'timeSlots.endTime': appointment.timeSlot.endTime },
    { $set: { 'timeSlots.$.isBooked': false, 'timeSlots.$.appointmentId': null } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Lịch hẹn đã được hủy thành công'
  });
});

// PUT /api/appointments/:id/reschedule – Đổi giờ khám
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleId, timeSlot, appointmentDate } = req.body;
    
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
      .populate('scheduleId');
    
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
    
    // Kiểm tra giới hạn số lần đổi lịch (tối đa 3 lần)
    if (!appointment.rescheduleCount) {
      appointment.rescheduleCount = 0;
    }
    
    if (appointment.rescheduleCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đổi lịch hẹn này quá 3 lần, vui lòng liên hệ trực tiếp với bệnh viện'
      });
    }
    
    // Kiểm tra schedule mới có tồn tại không
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
    
    // Kiểm tra time slot mới có available không
    const availableSlot = newSchedule.timeSlots.find(
      slot => slot.startTime === timeSlot.startTime && 
              slot.endTime === timeSlot.endTime && 
              !slot.isBooked
    );
    
    if (!availableSlot) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt hoặc không tồn tại'
      });
    }
    
    // Lưu thông tin lịch hẹn cũ trước khi cập nhật
    const oldScheduleId = appointment.scheduleId._id;
    const oldTimeSlot = { ...appointment.timeSlot };
    const oldAppointmentDate = appointment.appointmentDate;
    
    // Cập nhật thông tin lịch hẹn
    appointment.isRescheduled = true;
    appointment.scheduleId = scheduleId;
    appointment.timeSlot = timeSlot;
    appointment.appointmentDate = new Date(appointmentDate);
    appointment.status = 'rescheduled';
    
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
      newScheduleId: scheduleId,
      newTimeSlot: timeSlot,
      newAppointmentDate: new Date(appointmentDate),
      rescheduleBy: req.user.id,
      rescheduleAt: new Date(),
      notes: req.body.notes || 'Đổi lịch hẹn'
    });
    
    // Lưu lịch hẹn đã cập nhật
    await appointment.save();
    
    // Cập nhật lại trạng thái của time slot cũ (đánh dấu là trống)
    const oldSchedule = await Schedule.findById(oldScheduleId);
    if (oldSchedule) {
      const oldSlotIndex = oldSchedule.timeSlots.findIndex(
        slot => 
          slot.startTime === oldTimeSlot.startTime && 
          slot.endTime === oldTimeSlot.endTime
      );
      
      if (oldSlotIndex !== -1) {
        oldSchedule.timeSlots[oldSlotIndex].isBooked = false;
        oldSchedule.timeSlots[oldSlotIndex].appointmentId = null;
        await oldSchedule.save();
      }
    }
    
    // Cập nhật lại trạng thái của time slot mới (đánh dấu là đã đặt)
    const newSlotIndex = newSchedule.timeSlots.findIndex(
      slot => slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
    );
    
    if (newSlotIndex !== -1) {
      newSchedule.timeSlots[newSlotIndex].isBooked = true;
      newSchedule.timeSlots[newSlotIndex].appointmentId = appointment._id;
      await newSchedule.save();
    }
    
    // Gửi email thông báo đổi lịch cho bệnh nhân
    try {
      // Thực hiện gửi email thông báo đổi lịch
      if (typeof sendAppointmentConfirmationEmail === 'function') {
        await sendAppointmentConfirmationEmail(
          appointment.patientId.email,
          appointment.patientId.fullName,
          {
            bookingCode: appointment.bookingCode || appointment._id.toString().substring(0, 8).toUpperCase(),
            doctorName: appointment.doctorId.user.fullName,
            hospitalName: (await Hospital.findById(appointment.hospitalId)).name,
            appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
          }
        );
        console.log('Đã gửi email xác nhận đổi lịch thành công');
      } else {
        console.log('Bỏ qua gửi email vì hàm sendAppointmentConfirmationEmail chưa được triển khai');
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
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi lịch hẹn',
      error: error.message
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
  const schedule = await DoctorSchedule.findOne({
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
  await DoctorSchedule.updateOne(
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

  const schedule = await DoctorSchedule.find({
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
  let schedule = await DoctorSchedule.findOne({ doctorId, date });
  
  if (schedule) {
    schedule.availableSlots = availableSlots;
    await schedule.save();
  } else {
    schedule = await DoctorSchedule.create({
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
exports.getAllAppointments = catchAsync(async (req, res, next) => {
  const { status, doctorId, startDate, endDate } = req.query;
  
  // Xây dựng query
  const query = {};
  if (status) query.status = status;
  if (doctorId) query.doctorId = doctorId;
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query.date = { $gte: startDate };
  } else if (endDate) {
    query.date = { $lte: endDate };
  }

  const appointments = await Appointment.find(query)
    .populate({
      path: 'doctorId',
      select: 'name specialty'
    })
    .populate({
      path: 'userId',
      select: 'name email phone'
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
  await DoctorSchedule.updateOne(
    { doctorId: appointment.doctorId, date: appointment.date, 'availableSlots.time': appointment.time },
    { $set: { 'availableSlots.$.isBooked': false } }
  );

  await Appointment.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Lịch hẹn đã được xóa thành công'
  });
}); 