const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Tạo index cho truy vấn hiệu quả
scheduleSchema.index({ doctorId: 1, date: 1 });
scheduleSchema.index({ hospitalId: 1, date: 1 });
scheduleSchema.index({ 'timeSlots.roomId': 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule; 