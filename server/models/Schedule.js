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
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    maxBookings: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    appointmentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }],
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