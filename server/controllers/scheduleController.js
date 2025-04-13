const Schedule = require('../models/Schedule');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

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
      // Create date range for the entire day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
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

// POST /api/schedules - Tạo lịch làm việc mới (chỉ bác sĩ và admin)
exports.createSchedule = async (req, res) => {
  try {
    const { hospitalId, date, timeSlots } = req.body;
    let { doctorId } = req.body;
    
    // Nếu người dùng là bác sĩ, tự động điền doctorId
    if (req.user.roleType === 'doctor') {
      // Tìm thông tin bác sĩ dựa trên userId
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ với tài khoản này'
        });
      }
      doctorId = doctor._id;
    } else if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID của bác sĩ'
      });
    }
    
    if (!hospitalId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin lịch làm việc'
      });
    }
    
    // Kiểm tra xem đã có lịch trong ngày này chưa
    const existingSchedule = await Schedule.findOne({
      doctorId,
      hospitalId,
      date: new Date(date)
    });
    
    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ đã có lịch làm việc trong ngày này tại bệnh viện này'
      });
    }
    
    // Tạo lịch làm việc mới
    const formattedTimeSlots = timeSlots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: false
    }));
    
    const schedule = await Schedule.create({
      doctorId,
      hospitalId,
      date: new Date(date),
      timeSlots: formattedTimeSlots
    });
    
    return res.status(201).json({
      success: true,
      message: 'Đã tạo lịch làm việc mới thành công',
      data: schedule
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

// PUT /api/schedules/:id - Cập nhật lịch làm việc (chỉ bác sĩ và admin)
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeSlots } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }
    
    if (!timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách khung giờ'
      });
    }
    
    // Tìm lịch cần cập nhật
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }
    
    // Kiểm tra quyền cập nhật (chỉ bác sĩ của lịch đó hoặc admin)
    if (req.user.roleType === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || doctor._id.toString() !== schedule.doctorId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật lịch này'
        });
      }
    }
    
    // Giữ lại những slot đã được đặt, chỉ cập nhật những slot chưa đặt
    const bookedSlots = schedule.timeSlots.filter(slot => slot.isBooked);
    
    // Cập nhật lịch với các slot mới và giữ nguyên các slot đã đặt
    const newTimeSlots = [
      ...bookedSlots,
      ...timeSlots
        .filter(newSlot => 
          !bookedSlots.some(bookedSlot => 
            bookedSlot.startTime === newSlot.startTime && 
            bookedSlot.endTime === newSlot.endTime
          )
        )
        .map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false
        }))
    ];
    
    schedule.timeSlots = newTimeSlots;
    await schedule.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật lịch làm việc thành công',
      data: schedule
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

// DELETE /api/schedules/:id - Xóa lịch làm việc (chỉ admin)
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }
    
    // Kiểm tra xem lịch tồn tại không
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch làm việc'
      });
    }
    
    // Kiểm tra xem lịch đã có cuộc hẹn nào chưa
    const hasBookings = schedule.timeSlots.some(slot => slot.isBooked);
    
    if (hasBookings) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch có cuộc hẹn đã đặt'
      });
    }
    
    // Xóa lịch
    await Schedule.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Đã xóa lịch làm việc thành công'
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