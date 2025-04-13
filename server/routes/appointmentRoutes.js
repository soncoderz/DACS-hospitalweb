const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const Doctor = require('../models/User');
const { validateAppointment } = require('../validation/appointmentValidation');

// Lấy danh sách lịch khám của user
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate('doctorId', 'fullName specialty')
      .sort({ appointmentDate: -1, timeSlot: -1 });
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lịch khám'
    });
  }
});

// Lấy danh sách bác sĩ theo chuyên khoa
router.get('/doctors/:department', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find({
      roleType: 'doctor',
      specialty: req.params.department,
      isActive: true
    }).select('fullName specialty avatar rating experience');

    res.json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ'
    });
  }
});

// Kiểm tra khung giờ trống
router.get('/available-slots', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bác sĩ hoặc ngày khám'
      });
    }

    // Lấy các slot đã được đặt
    const bookedSlots = await Appointment.find({
      doctorId,
      appointmentDate: date,
      status: { $ne: 'cancelled' }
    }).select('timeSlot -_id');

    const bookedSlotsArray = bookedSlots.map(slot => slot.timeSlot);

    // Danh sách tất cả các khung giờ có thể đặt
    const allTimeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00',
      '10:30', '14:00', '14:30', '15:00', '15:30'
    ];

    // Lọc ra các khung giờ còn trống
    const availableSlots = allTimeSlots.filter(
      slot => !bookedSlotsArray.includes(slot)
    );

    res.json({
      success: true,
      availableSlots
    });
  } catch (error) {
    console.error('Error checking available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra khung giờ trống'
    });
  }
});

// Tạo lịch khám mới
router.post('/', auth, async (req, res) => {
  try {
    const { error } = validateAppointment(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Kiểm tra xem khung giờ đã được đặt chưa
    const existingAppointment = await Appointment.findOne({
      doctorId: req.body.doctorId,
      appointmentDate: req.body.appointmentDate,
      timeSlot: req.body.timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.'
      });
    }

    // Tạo lịch khám mới
    const appointment = new Appointment({
      ...req.body,
      userId: req.user._id,
      status: 'pending'
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Đặt lịch khám thành công',
      appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lịch khám'
    });
  }
});

// Hủy lịch khám
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch khám'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Lịch khám đã được hủy trước đó'
      });
    }

    // Kiểm tra thời gian hủy (chỉ cho phép hủy trước 24h)
    const appointmentTime = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursDiff = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy lịch khám trong vòng 24 giờ trước giờ hẹn'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = req.body.reason;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user._id;

    await appointment.save();

    res.json({
      success: true,
      message: 'Hủy lịch khám thành công',
      appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy lịch khám'
    });
  }
});

module.exports = router; 