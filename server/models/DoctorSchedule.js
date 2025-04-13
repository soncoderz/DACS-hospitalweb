const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Bác sĩ là bắt buộc']
  },
  date: {
    type: Date,
    required: [true, 'Ngày là bắt buộc']
  },
  timeSlots: [{
    startTime: {
      type: String,
      required: [true, 'Thời gian bắt đầu là bắt buộc']
    },
    endTime: {
      type: String,
      required: [true, 'Thời gian kết thúc là bắt buộc']
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    }
  }],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh theo bác sĩ và ngày
doctorScheduleSchema.index({ doctorId: 1, date: 1 });

// Phương thức kiểm tra khung giờ có khả dụng không
doctorScheduleSchema.methods.isTimeSlotAvailable = function(startTime, endTime) {
  const slot = this.timeSlots.find(
    slot => slot.startTime === startTime && slot.endTime === endTime
  );
  return slot && !slot.isBooked;
};

// Phương thức đánh dấu khung giờ đã được đặt
doctorScheduleSchema.methods.bookTimeSlot = function(startTime, endTime, appointmentId) {
  const slotIndex = this.timeSlots.findIndex(
    slot => slot.startTime === startTime && slot.endTime === endTime
  );
  
  if (slotIndex !== -1 && !this.timeSlots[slotIndex].isBooked) {
    this.timeSlots[slotIndex].isBooked = true;
    this.timeSlots[slotIndex].appointmentId = appointmentId;
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema); 