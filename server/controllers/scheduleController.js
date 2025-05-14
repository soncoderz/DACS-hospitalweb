const Schedule = require('../models/Schedule');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const Hospital = require('../models/Hospital');

/**
 * Chuyển đổi chuỗi thời gian "HH:MM" thành số phút từ 00:00
 * @param {string} timeString Chuỗi thời gian định dạng "HH:MM"
 * @returns {number} Số phút từ 00:00
 */
const convertTimeStringToMinutes = (timeString) => {
  if (!timeString) return 0;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// GET /api/schedules?doctorId=...&date=... – Lấy lịch trống của bác sĩ
exports.getAvailableSchedules = async (req, res) => {
  try {
    const { doctorId, date, hospitalId } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID của bác sĩ'
      });
    }
    
    // Validate doctorId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Build query
    const query = { doctorId };
    
    // Add date filter if provided
    if (date) {
      // Chuyển đổi chuỗi ngày thành đối tượng Date
      const queryDate = new Date(date);
      
      // Lấy chuỗi YYYY-MM-DD để so sánh, bỏ qua thời gian và múi giờ
      const queryDateStr = queryDate.toISOString().split('T')[0];
      
      // Tìm tất cả lịch và sau đó lọc theo ngày để giải quyết vấn đề múi giờ
      query.$expr = {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          queryDateStr
        ]
      };
    }
    
    // Add hospital filter if provided
    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: 'ID bệnh viện không hợp lệ'
        });
      }
      query.hospitalId = hospitalId;
    }
    
    console.log('Query for schedules:', JSON.stringify(query, null, 2));
    
    // Get schedules
    const schedules = await Schedule.find(query)
      .populate({
        path: 'doctorId',
        select: 'title consultationFee',
        populate: {
          path: 'user',
          select: 'fullName avatarUrl'
        }
      })
      .populate('hospitalId', 'name address')
      .sort({ date: 1 });
    
    console.log(`Found ${schedules.length} schedules for date: ${date}`);
    
    // Transform the results to include available slots only
    const availableSchedules = schedules.map(schedule => {
      const availableTimeSlots = schedule.timeSlots.filter(slot => !slot.isBooked);
      return {
        ...schedule.toObject(),
        timeSlots: availableTimeSlots,
        totalAvailableSlots: availableTimeSlots.length
      };
    });
    
    return res.status(200).json({
      success: true,
      count: availableSchedules.length,
      data: availableSchedules
    });
    
  } catch (error) {
    console.error('Get available schedules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch làm việc của bác sĩ',
      error: error.message
    });
  }
};

/**
 * Kiểm tra trùng lịch và trả về thông tin chi tiết
 */
const checkTimeSlotConflicts = async (doctorId, date, timeSlots, existingScheduleId = null) => {
  const scheduleDateStart = new Date(date);
  scheduleDateStart.setHours(0, 0, 0, 0);

  const scheduleDateEnd = new Date(date);
  scheduleDateEnd.setHours(23, 59, 59, 999);

  // Format date for error messages
  const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  // Lấy tất cả lịch của ngày này
  const allSchedulesOnDate = await Schedule.find({
    date: {
      $gte: scheduleDateStart,
      $lt: scheduleDateEnd
    },
    _id: { $ne: existingScheduleId } // Loại trừ lịch đang cập nhật
  })
  .populate({
    path: 'doctorId',
    select: 'user',
    populate: {
      path: 'user',
      select: 'fullName'
    }
  })
  .populate('hospitalId', 'name')
  .lean();

  const conflicts = [];

  // Lấy thông tin phòng
  const allRoomIds = [...new Set(
    timeSlots
      .filter(slot => slot.roomId)
      .map(slot => slot.roomId.toString())
  )];
  
  const roomsInfo = {};
  if (allRoomIds.length > 0) {
    const rooms = await Room.find({ _id: { $in: allRoomIds } }).select('name number floor').lean();
    rooms.forEach(room => {
      roomsInfo[room._id.toString()] = room;
    });
  }

  // Lấy thông tin bác sĩ hiện tại
  const doctor = await Doctor.findById(doctorId).populate('user', 'fullName').lean();
  const doctorName = doctor?.user?.fullName || 'Bác sĩ không xác định';

  // Kiểm tra từng timeSlot mới
  for (const [slotIndex, newSlot] of timeSlots.entries()) {
    const newStartTime = convertTimeStringToMinutes(newSlot.startTime);
    const newEndTime = convertTimeStringToMinutes(newSlot.endTime);
    const roomId = newSlot.roomId ? newSlot.roomId.toString() : null;

    if (!roomId) continue; // Bỏ qua nếu không có phòng

    // Thông tin phòng của slot hiện tại
    const roomInfo = roomsInfo[roomId] || { name: 'Không xác định', number: '', floor: '' };
    const roomDisplay = roomInfo.name || `Phòng ${roomInfo.number}, Tầng ${roomInfo.floor}`;

    // Kiểm tra với tất cả lịch hiện có
    for (const schedule of allSchedulesOnDate) {
      // Thông tin bác sĩ của lịch hiện có
      const existingDoctorName = schedule.doctorId?.user?.fullName || 'Bác sĩ không xác định';
      const hospitalName = schedule.hospitalId?.name || 'Bệnh viện không xác định';
      
      for (const [existingIndex, existingSlot] of schedule.timeSlots.entries()) {
        const existingStartTime = convertTimeStringToMinutes(existingSlot.startTime);
        const existingEndTime = convertTimeStringToMinutes(existingSlot.endTime);
        const existingRoomId = existingSlot.roomId ? existingSlot.roomId.toString() : null;

        // Lấy thông tin phòng của lịch hiện có
        const existingRoomInfo = existingRoomId ? (roomsInfo[existingRoomId] || {}) : {};
        const existingRoomDisplay = existingRoomInfo.name || 
          (existingRoomInfo.number ? `Phòng ${existingRoomInfo.number}, Tầng ${existingRoomInfo.floor}` : 'Phòng không xác định');

        // Điều kiện trùng thời gian
        const timeOverlap = (
          (newStartTime < existingEndTime && newEndTime > existingStartTime)
        );

        // Kiểm tra trùng phòng
        if (timeOverlap && roomId && existingRoomId && roomId === existingRoomId) {
          conflicts.push({
            type: 'room_conflict',
            slotIndex: slotIndex,
            message: `Phòng ${roomDisplay} đã được sử dụng bởi ${existingDoctorName} từ ${existingSlot.startTime} đến ${existingSlot.endTime} (${hospitalName})`,
            details: {
              conflictType: 'room',
              timeSlot: {
                start: newSlot.startTime,
                end: newSlot.endTime
              },
              room: {
                id: roomId,
                name: roomDisplay
              },
              existingSchedule: {
                doctor: existingDoctorName,
                hospital: hospitalName,
                time: `${existingSlot.startTime} - ${existingSlot.endTime}`,
                date: formattedDate
              }
            }
          });
        }

        // Kiểm tra trùng bác sĩ
        if (timeOverlap && schedule.doctorId && doctorId.toString() === schedule.doctorId._id.toString()) {
          conflicts.push({
            type: 'doctor_conflict',
            slotIndex: slotIndex,
            message: `Bác sĩ ${doctorName} đã có lịch làm việc tại ${existingRoomDisplay} từ ${existingSlot.startTime} đến ${existingSlot.endTime} (${hospitalName})`,
            details: {
              conflictType: 'doctor',
              timeSlot: {
                start: newSlot.startTime,
                end: newSlot.endTime
              },
              doctor: {
                id: doctorId.toString(),
                name: doctorName
              },
              existingSchedule: {
                room: existingRoomDisplay,
                hospital: hospitalName,
                time: `${existingSlot.startTime} - ${existingSlot.endTime}`,
                date: formattedDate
              }
            }
          });
        }
      }
    }
  }

  return conflicts;
};

/**
 * @desc    Admin tạo lịch làm việc cho bác sĩ
 * @route   POST /api/admin/schedules
 * @access  Private (Admin)
 */
exports.createSchedule = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { doctorId, hospitalId, date, timeSlots, recurring, endDate, roomId } = req.body;

    // Validate required fields
    if (!doctorId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch làm việc'
      });
    }
    
    // Kiểm tra hospitalId
    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bệnh viện'
      });
    }
    
    // Kiểm tra định dạng hospitalId
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    // Kiểm tra bệnh viện có tồn tại không
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }

    // Kiểm tra doctorId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }

    // Kiểm tra bác sĩ có tồn tại
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Kiểm tra hospitalId có khớp với bệnh viện của bác sĩ không
    if (doctor.hospitalId.toString() !== hospitalId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ không thuộc bệnh viện này'
      });
    }

    // Xác thực định dạng ngày
    const scheduleDate = new Date(date);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      });
    }

    // Kiểm tra ngày trong quá khứ
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (scheduleDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo lịch làm việc cho ngày trong quá khứ'
      });
    }

    // Kiểm tra roomId ở cấp root (nếu có)
    let globalRoomId = null;
    if (roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: 'ID phòng không hợp lệ'
        });
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy phòng với ID: ${roomId}`
        });
      }

      // Kiểm tra phòng có thuộc bệnh viện của bác sĩ không
      if (room.hospitalId.toString() !== doctor.hospitalId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Phòng khám không thuộc bệnh viện của bác sĩ'
        });
      }
      
      globalRoomId = roomId;
    }

    // Xác thực các time slots và áp dụng roomId toàn cục nếu có
    const formattedTimeSlots = [];
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu và kết thúc là bắt buộc cho mỗi khung giờ'
        });
      }

      // Kiểm tra định dạng thời gian (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng thời gian không hợp lệ (HH:MM)'
        });
      }

      // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
      const startTime = new Date(`1970-01-01T${slot.startTime}:00`);
      const endTime = new Date(`1970-01-01T${slot.endTime}:00`);
      
      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }

      // Sử dụng roomId từ slot hoặc roomId toàn cục
      const slotRoomId = slot.roomId || globalRoomId;
      
      // Kiểm tra roomId - Bắt buộc phải có
      if (!slotRoomId) {
        return res.status(400).json({
          success: false,
          message: 'Phòng khám là bắt buộc cho mỗi khung giờ. Vui lòng cung cấp roomId trong mỗi timeSlot hoặc roomId chung.'
        });
      }
      
      if (!mongoose.Types.ObjectId.isValid(slotRoomId)) {
        return res.status(400).json({
          success: false,
          message: 'ID phòng không hợp lệ'
        });
      }

      // Nếu roomId từ slot khác với roomId toàn cục đã được kiểm tra, cần kiểm tra lại
      if (!globalRoomId || (slot.roomId && slot.roomId !== globalRoomId)) {
        const room = await Room.findById(slotRoomId);
        if (!room) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy phòng với ID: ${slotRoomId}`
          });
        }

        // Kiểm tra phòng có thuộc bệnh viện của bác sĩ không
        if (room.hospitalId.toString() !== doctor.hospitalId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Phòng khám không thuộc bệnh viện của bác sĩ'
          });
        }
      }
      
      // Thêm vào danh sách khung giờ hợp lệ
      formattedTimeSlots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
        roomId: slotRoomId
      });
    }

    // Kiểm tra trùng lặp lịch theo khung giờ
    const conflicts = await checkTimeSlotConflicts(doctorId, scheduleDate, formattedTimeSlots);
    
    if (conflicts.length > 0) {
      // Tổng hợp thông tin các xung đột theo loại
      const roomConflicts = conflicts.filter(c => c.type === 'room_conflict');
      const doctorConflicts = conflicts.filter(c => c.type === 'doctor_conflict');
      
      // Tạo mô tả chi tiết hơn cho lỗi
      let errorDescription = 'Không thể tạo lịch làm việc do các xung đột sau:';
      
      if (doctorConflicts.length > 0) {
        errorDescription += `\n- Bác sĩ đã có ${doctorConflicts.length} lịch làm việc khác trong cùng thời gian`;
      }
      
      if (roomConflicts.length > 0) {
        errorDescription += `\n- Phòng khám đã được sử dụng bởi ${roomConflicts.length} lịch làm việc khác`;
      }
      
      const formattedDate = scheduleDate.toLocaleDateString('vi-VN', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      
      return res.status(409).json({
        success: false,
        error: 'schedule_conflict',
        message: 'Phát hiện trùng lịch làm việc',
        conflicts: conflicts,
        errorDetails: {
          title: 'Không thể tạo lịch làm việc do trùng lịch',
          description: errorDescription,
          conflicts: conflicts,
          date: formattedDate,
          totalConflicts: conflicts.length,
          doctorConflictsCount: doctorConflicts.length,
          roomConflictsCount: roomConflicts.length,
          summary: {
            hasRoomConflicts: roomConflicts.length > 0,
            hasDoctorConflicts: doctorConflicts.length > 0,
            affectedTime: conflicts.map(c => `${c.details?.timeSlot?.start} - ${c.details?.timeSlot?.end}`).join(', ')
          }
        }
      });
    }

    // Kiểm tra trùng lặp lịch làm việc
    const scheduleDateStart = new Date(scheduleDate);
    scheduleDateStart.setHours(0, 0, 0, 0);

    const scheduleDateEnd = new Date(scheduleDate);
    scheduleDateEnd.setHours(23, 59, 59, 999);

    const existingSchedule = await Schedule.findOne({
      doctorId,
      date: {
        $gte: scheduleDateStart,
        $lt: scheduleDateEnd
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ đã có lịch làm việc cho ngày này',
        existingScheduleId: existingSchedule._id
      });
    }

    // Tạo lịch làm việc mới
    const newSchedule = await Schedule.create({
      doctorId,
      hospitalId,
      date: scheduleDate,
      timeSlots: formattedTimeSlots,
      createdBy: req.user.id
    });

    // Nếu là lịch lặp lại, tạo các lịch cho các ngày tiếp theo
    if (recurring && endDate) {
      const recEndDate = new Date(endDate);
      if (isNaN(recEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng ngày kết thúc không hợp lệ'
        });
      }

      if (recEndDate <= scheduleDate) {
        return res.status(400).json({
          success: false,
          message: 'Ngày kết thúc phải sau ngày bắt đầu'
        });
      }

      const recurringSchedules = [];
      const nextDate = new Date(scheduleDate);
      
      // Lặp qua các ngày từ startDate đến endDate
      while (nextDate < recEndDate) {
        // Tăng 1 ngày
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Kiểm tra đã có lịch cho ngày này chưa
        const existsForDate = await Schedule.findOne({
          doctorId,
          date: { $eq: nextDate }
        });

        if (!existsForDate) {
          // Tạo lịch mới
          const recSchedule = await Schedule.create({
            doctorId,
            hospitalId,
            date: new Date(nextDate),
            timeSlots: formattedTimeSlots,
            createdBy: req.user.id
          });
          
          recurringSchedules.push(recSchedule);
        }
      }

      // Trả về lịch đầu tiên và số lượng lịch lặp lại đã tạo
      return res.status(201).json({
        success: true,
        data: {
          mainSchedule: newSchedule,
          recurringCount: recurringSchedules.length
        },
        message: `Đã tạo lịch làm việc cho bác sĩ và ${recurringSchedules.length} lịch lặp lại`
      });
    }

    // Nếu không lặp lại, chỉ trả về lịch mới tạo
    return res.status(201).json({
      success: true,
      data: newSchedule,
      message: 'Tạo lịch làm việc thành công'
    });
    
  } catch (error) {
    console.error('Create schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch làm việc',
      error: error.message
    });
  }
};

/**
 * @desc    Admin cập nhật lịch làm việc cho bác sĩ
 * @route   PUT /api/admin/schedules/:id
 * @access  Private (Admin)
 */
exports.updateSchedule = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { id } = req.params;
    const { timeSlots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch làm việc không hợp lệ'
      });
    }

    // Tìm lịch làm việc
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }

    // Kiểm tra xem lịch đã qua chưa
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (schedule.date < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật lịch làm việc đã qua'
      });
    }

    // Kiểm tra xem đã có lịch hẹn nào cho lịch làm việc này chưa
    const Appointment = require('../models/Appointment');
    const hasAppointments = await Appointment.findOne({
      doctorId: schedule.doctorId,
      appointmentDate: schedule.date,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (hasAppointments) {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật lịch làm việc đã có lịch hẹn'
      });
    }

    // Xác thực các time slots nếu được cung cấp
    if (timeSlots && Array.isArray(timeSlots)) {
      // Tìm thông tin bác sĩ
      const doctor = await Doctor.findById(schedule.doctorId);
      
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: 'Thời gian bắt đầu và kết thúc là bắt buộc cho mỗi khung giờ'
          });
        }

        // Kiểm tra định dạng thời gian (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng thời gian không hợp lệ (HH:MM)'
          });
        }

        // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
        const startTime = new Date(`1970-01-01T${slot.startTime}:00`);
        const endTime = new Date(`1970-01-01T${slot.endTime}:00`);
        
        if (endTime <= startTime) {
          return res.status(400).json({
            success: false,
            message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
          });
        }

        // Kiểm tra roomId nếu có
        if (slot.roomId) {
          if (!mongoose.Types.ObjectId.isValid(slot.roomId)) {
            return res.status(400).json({
              success: false,
              message: 'ID phòng không hợp lệ'
            });
          }

          const room = await Room.findById(slot.roomId);
          if (!room) {
            return res.status(404).json({
              success: false,
              message: `Không tìm thấy phòng với ID: ${slot.roomId}`
            });
          }

          // Kiểm tra phòng có thuộc bệnh viện của bác sĩ không
          if (room.hospitalId.toString() !== doctor.hospitalId.toString()) {
            return res.status(400).json({
              success: false,
              message: 'Phòng khám không thuộc bệnh viện của bác sĩ'
            });
          }
        }
      }
    }

    // Cập nhật lịch làm việc
    const updateData = {};
    if (timeSlots) updateData.timeSlots = timeSlots;
    if (req.body.status) updateData.status = req.body.status;
    updateData.updatedBy = req.user.id;

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedSchedule,
      message: 'Cập nhật lịch làm việc thành công'
    });
    
  } catch (error) {
    console.error('Update schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch làm việc',
      error: error.message
    });
  }
};

/**
 * @desc    Admin xóa lịch làm việc của bác sĩ
 * @route   DELETE /api/admin/schedules/:id
 * @access  Private (Admin)
 */
exports.deleteSchedule = async (req, res) => {
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
        message: 'ID lịch làm việc không hợp lệ'
      });
    }

    // Tìm lịch làm việc
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }

    // Kiểm tra xem lịch đã qua chưa
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (schedule.date < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch làm việc đã qua'
      });
    }

    // Kiểm tra xem đã có lịch hẹn nào cho lịch làm việc này chưa
    const Appointment = require('../models/Appointment');
    const hasAppointments = await Appointment.findOne({
      doctorId: schedule.doctorId,
      appointmentDate: schedule.date,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (hasAppointments) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch làm việc đã có lịch hẹn. Hãy hủy các lịch hẹn trước.'
      });
    }

    // Xóa lịch làm việc
    await Schedule.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Xóa lịch làm việc thành công'
    });
    
  } catch (error) {
    console.error('Delete schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch làm việc',
      error: error.message
    });
  }
};

/**
 * @desc    Admin lấy danh sách lịch làm việc của bác sĩ
 * @route   GET /api/admin/schedules
 * @access  Private (Admin)
 */
exports.getSchedules = async (req, res) => {
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
      hospitalId,
      roomId,
      startDate, 
      endDate, 
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Xây dựng truy vấn
    const query = {};

    // Lọc theo bác sĩ
    if (doctorId && doctorId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({
          success: false,
          message: 'ID bác sĩ không hợp lệ'
        });
      }
      query.doctorId = doctorId;
    }

    // Lọc theo bệnh viện
    if (hospitalId && hospitalId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: 'ID bệnh viện không hợp lệ'
        });
      }
      query.hospitalId = hospitalId;
    }
    
    // Lọc theo phòng khám (trong timeSlots)
    if (roomId && roomId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: 'ID phòng khám không hợp lệ'
        });
      }
      query['timeSlots'] = {
        $elemMatch: {
          roomId: roomId
        }
      };
    }

    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          query.date.$gte = start;
        }
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          query.date.$lte = end;
        }
      }
    }

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      query.status = status;
    }

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Thực hiện truy vấn với phân trang
    const schedules = await Schedule.find(query)
      .populate({
        path: 'doctorId',
        select: 'user title',
        populate: {
          path: 'user',
          select: 'fullName email phoneNumber avatarUrl'
        }
      })
      .populate('hospitalId', 'name address')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số bản ghi phù hợp
    const total = await Schedule.countDocuments(query);
    
    // Tìm và thêm thông tin phòng
    const populatedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const scheduleObj = schedule.toObject();
      
      // Lấy danh sách roomId từ các timeSlots
      const roomIds = [];
      if (scheduleObj.timeSlots && scheduleObj.timeSlots.length > 0) {
        scheduleObj.timeSlots.forEach(slot => {
          if (slot.roomId && !roomIds.includes(slot.roomId.toString())) {
            roomIds.push(slot.roomId.toString());
          }
        });
      }
      
      // Nếu có roomId, lấy thông tin phòng
      if (roomIds.length > 0) {
        try {
          const rooms = await Room.find({
            _id: { $in: roomIds }
          }).select('_id name number floor');
          
          const roomMap = {};
          rooms.forEach(room => {
            roomMap[room._id.toString()] = room;
          });
          
          // Thêm thông tin phòng vào mỗi timeSlot
          scheduleObj.timeSlots = scheduleObj.timeSlots.map(slot => {
            if (slot.roomId && roomMap[slot.roomId.toString()]) {
              slot.roomInfo = roomMap[slot.roomId.toString()];
            }
            return slot;
          });
          
          // Thêm thông tin phòng vào cấp cao nhất của schedule để dễ truy cập
          if (Object.keys(roomMap).length > 0) {
            scheduleObj.rooms = roomMap;
          }
        } catch (error) {
          console.error('Error fetching room details:', error);
        }
      }
      
      return scheduleObj;
    }));

    return res.status(200).json({
      success: true,
      count: populatedSchedules.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: populatedSchedules
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch làm việc',
      error: error.message
    });
  }
};

/**
 * @desc    Admin xem chi tiết lịch làm việc của bác sĩ
 * @route   GET /api/admin/schedules/:id
 * @access  Private (Admin)
 */
exports.getScheduleById = async (req, res) => {
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
        message: 'ID lịch làm việc không hợp lệ'
      });
    }

    // Tìm lịch làm việc với các thông tin liên quan
    const schedule = await Schedule.findById(id)
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId hospitalId',
        populate: [
          { path: 'user', select: 'fullName email phoneNumber avatarUrl' },
          { path: 'specialtyId', select: 'name' },
          { path: 'hospitalId', select: 'name address' }
        ]
      })
      .populate('hospitalId', 'name address');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }

    // Bổ sung thông tin về phòng khám
    if (schedule.timeSlots && schedule.timeSlots.length > 0) {
      const roomIds = schedule.timeSlots
        .filter(slot => slot.roomId)
        .map(slot => slot.roomId);
      
      if (roomIds.length > 0) {
        const rooms = await Room.find({ _id: { $in: roomIds } })
          .select('name number floor');
        
        const roomMap = {};
        rooms.forEach(room => {
          roomMap[room._id] = room;
        });
        
        // Thêm thông tin phòng vào response
        schedule._doc.rooms = roomMap;
      }
    }

    // Kiểm tra xem có lịch hẹn nào không
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({
      doctorId: schedule.doctorId,
      appointmentDate: schedule.date
    }).populate('patientId', 'fullName phoneNumber');

    // Thêm thông tin lịch hẹn vào response
    schedule._doc.appointments = appointments;

    return res.status(200).json({
      success: true,
      data: schedule
    });
    
  } catch (error) {
    console.error('Get schedule detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết lịch làm việc',
      error: error.message
    });
  }
};

/**
 * @desc    Get rooms by hospital
 * @route   GET /api/schedules/rooms/hospital/:hospitalId
 * @access  Public
 */
exports.getRoomsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    const rooms = await Room.find({ 
      hospitalId, 
      status: 'active',
      isActive: true
    })
      .populate('specialtyId', 'name')
      .sort({ floor: 1, number: 1 });
    
    if (!rooms || rooms.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Không tìm thấy phòng khám nào cho bệnh viện này'
      });
    }
    
    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng khám theo bệnh viện',
      error: error.message
    });
  }
};

/**
 * @desc    Get rooms by doctor
 * @route   GET /api/schedules/rooms/doctor/:doctorId
 * @access  Public
 */
exports.getRoomsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    const rooms = await Room.find({ 
      assignedDoctors: doctorId,
      status: 'active',
      isActive: true
    })
      .populate('hospitalId', 'name')
      .populate('specialtyId', 'name')
      .sort({ 'hospitalId.name': 1, floor: 1, number: 1 });
    
    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng khám theo bác sĩ',
      error: error.message
    });
  }
}; 

// GET /api/schedules/doctor - Lấy lịch làm việc của bác sĩ đăng nhập
exports.getDoctorSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status } = req.query;
    
    // Tìm doctor record dựa vào user id
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Xây dựng query
    const query = { doctorId: doctor._id };
    
    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Lọc theo trạng thái
    if (status === 'available') {
      query.isActive = true;
    } else if (status === 'unavailable') {
      query.isActive = false;
    }
    
    console.log('Fetching doctor schedules with query:', JSON.stringify(query));
    
    // Lấy lịch làm việc của bác sĩ
    const schedules = await Schedule.find(query)
      .populate('hospitalId', 'name address')
      .populate({
        path: 'timeSlots.roomId',
        select: 'name number floor'
      })
      .sort({ date: 1 });
    
    console.log(`Found ${schedules.length} schedules for doctor`);
    
    // Verify that room data is properly populated in the response
    const schedulesWithRoomInfo = schedules.map(schedule => {
      // Convert to plain object
      const plainSchedule = schedule.toObject();
      
      // Check if timeSlots have properly populated roomId
      if (plainSchedule.timeSlots) {
        plainSchedule.timeSlots.forEach(slot => {
          if (slot.roomId && typeof slot.roomId === 'string') {
            console.log(`Warning: roomId is still a string: ${slot.roomId}`);
          }
        });
      }
      
      return plainSchedule;
    });
    
    return res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedulesWithRoomInfo
    });
  } catch (error) {
    console.error('Get doctor schedules error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch làm việc',
      error: error.message
    });
  }
};

// POST /api/schedules/doctor - Bác sĩ tạo lịch làm việc mới
exports.createDoctorSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hospitalId, date, timeSlots, roomId } = req.body;
    
    // Validate dữ liệu đầu vào
    if (!hospitalId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch làm việc'
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
    
    // Kiểm tra bệnh viện có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    // Kiểm tra bệnh viện có tồn tại không
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Kiểm tra bác sĩ có thuộc bệnh viện này không
    if (doctor.hospitalId.toString() !== hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ không thuộc bệnh viện này'
      });
    }
    
    // Kiểm tra ngày hợp lệ
    const scheduleDate = new Date(date);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      });
    }
    
    // Kiểm tra ngày trong quá khứ
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (scheduleDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo lịch làm việc cho ngày trong quá khứ'
      });
    }
    
    // Kiểm tra xem đã có lịch làm việc cho ngày này chưa
    const scheduleDateStart = new Date(scheduleDate);
    scheduleDateStart.setHours(0, 0, 0, 0);

    const scheduleDateEnd = new Date(scheduleDate);
    scheduleDateEnd.setHours(23, 59, 59, 999);

    const existingSchedule = await Schedule.findOne({
      doctorId: doctor._id,
      date: {
        $gte: scheduleDateStart,
        $lt: scheduleDateEnd
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Đã có lịch làm việc cho ngày này. Vui lòng cập nhật lịch hiện có hoặc chọn ngày khác.',
        existingScheduleId: existingSchedule._id
      });
    }
    
    // Xác thực các khung giờ
    const formattedTimeSlots = [];
    
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu và kết thúc là bắt buộc cho mỗi khung giờ'
        });
      }
      
      // Định dạng giờ hợp lệ HH:MM
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng thời gian không hợp lệ (HH:MM)'
        });
      }
      
      // Kiểm tra thời gian kết thúc sau thời gian bắt đầu
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (endMinutes <= startMinutes) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }
      
      // Thêm vào danh sách khung giờ hợp lệ
      formattedTimeSlots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false
      });
    }
    
    // Kiểm tra phòng khám nếu có
    if (roomId) {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: 'ID phòng khám không hợp lệ'
        });
      }
      
      const Room = require('../models/Room');
      const room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng khám'
        });
      }
      
      if (room.hospitalId.toString() !== hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'Phòng khám không thuộc bệnh viện này'
        });
      }
      
      // Gán roomId vào từng timeSlot
      formattedTimeSlots.forEach(slot => {
        slot.roomId = roomId;
      });
    }
    
    // Tạo lịch làm việc mới
    const newSchedule = new Schedule({
      doctorId: doctor._id,
      hospitalId,
      date: scheduleDate,
      timeSlots: formattedTimeSlots,
      isActive: true
    });
    
    await newSchedule.save();
    
    return res.status(201).json({
      success: true,
      data: newSchedule,
      message: 'Tạo lịch làm việc thành công'
    });
  } catch (error) {
    console.error('Create doctor schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch làm việc',
      error: error.message
    });
  }
};

// PUT /api/schedules/:id/doctor - Bác sĩ cập nhật lịch làm việc
exports.updateDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { timeSlots, isActive } = req.body;
    
    // Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch làm việc không hợp lệ'
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
    
    // Tìm lịch làm việc
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }
    
    // Kiểm tra lịch làm việc có phải của bác sĩ này không
    if (schedule.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lịch làm việc này'
      });
    }
    
    // Kiểm tra ngày trong quá khứ
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const scheduleDate = new Date(schedule.date);
    if (scheduleDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật lịch làm việc cho ngày trong quá khứ'
      });
    }
    
    // Cập nhật trạng thái nếu có
    if (isActive !== undefined) {
      schedule.isActive = isActive;
    }
    
    // Cập nhật các khung giờ nếu có
    if (timeSlots && Array.isArray(timeSlots)) {
      // Chỉ cho phép cập nhật các khung giờ chưa được đặt
      const updatedTimeSlots = [];
      
      // Giữ lại các khung giờ đã đặt
      const bookedSlots = schedule.timeSlots.filter(slot => slot.isBooked);
      
      // Xác thực các khung giờ mới
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: 'Thời gian bắt đầu và kết thúc là bắt buộc cho mỗi khung giờ'
          });
        }
        
        // Định dạng giờ hợp lệ HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng thời gian không hợp lệ (HH:MM)'
          });
        }
        
        // Kiểm tra thời gian kết thúc sau thời gian bắt đầu
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        if (endMinutes <= startMinutes) {
          return res.status(400).json({
            success: false,
            message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
          });
        }
        
        // Thêm vào danh sách khung giờ hợp lệ
        updatedTimeSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
          roomId: slot.roomId || schedule.timeSlots[0]?.roomId
        });
      }
      
      // Kết hợp khung giờ đã đặt và khung giờ mới
      schedule.timeSlots = [...bookedSlots, ...updatedTimeSlots];
    }
    
    await schedule.save();
    
    return res.status(200).json({
      success: true,
      data: schedule,
      message: 'Cập nhật lịch làm việc thành công'
    });
  } catch (error) {
    console.error('Update doctor schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch làm việc',
      error: error.message
    });
  }
};

// DELETE /api/schedules/:id/doctor - Bác sĩ xóa lịch làm việc
exports.deleteDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch làm việc không hợp lệ'
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
    
    // Tìm lịch làm việc
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }
    
    // Kiểm tra lịch làm việc có phải của bác sĩ này không
    if (schedule.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa lịch làm việc này'
      });
    }
    
    // Kiểm tra ngày trong quá khứ
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const scheduleDate = new Date(schedule.date);
    if (scheduleDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch làm việc cho ngày trong quá khứ'
      });
    }
    
    // Kiểm tra xem có lịch hẹn nào đã đặt không
    const hasBookedAppointments = schedule.timeSlots.some(slot => slot.isBooked);
    if (hasBookedAppointments) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch làm việc đã có lịch hẹn. Vui lòng cập nhật trạng thái thành không hoạt động.'
      });
    }
    
    // Xóa lịch làm việc
    await Schedule.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Xóa lịch làm việc thành công'
    });
  } catch (error) {
    console.error('Delete doctor schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch làm việc',
      error: error.message
    });
  }
}; 