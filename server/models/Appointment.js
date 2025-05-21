const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show', 'rejected'],
    default: 'pending'
  },
  bookingCode: {
    type: String
  },
  appointmentType: {
    type: String,
    enum: ['first-visit', 'follow-up', 'consultation', 'emergency'],
    default: 'first-visit'
  },
  symptoms: {
    type: String,
    trim: true
  },
  medicalHistory: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  prescription: {
    type: String,
    trim: true
  },
  fee: {
    consultationFee: {
      type: Number,
      default: 0
    },
    additionalFees: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'paypal', 'momo'],
    default: 'cash'
  },
  paymentId: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'hospital', 'system'],
    trim: true
  },
  isRescheduled: {
    type: Boolean,
    default: false
  },
  rescheduleCount: {
    type: Number,
    default: 0
  },
  rescheduleHistory: [{
    oldScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule'
    },
    oldTimeSlot: {
      startTime: String,
      endTime: String
    },
    oldAppointmentDate: Date,
    newScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule'
    },
    newTimeSlot: {
      startTime: String,
      endTime: String
    },
    newAppointmentDate: Date,
    rescheduleBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduleAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  isCancelled: {
    type: Boolean,
    default: false
  },
  originalAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date
    }
  },
  medicalRecord: {
    diagnosis: {
      type: String,
      trim: true
    },
    treatment: {
      type: String,
      trim: true
    },
    prescription: [{
      medicine: { type: String, required: true },
      dosage: { type: String },
      usage: { type: String },
      duration: { type: String },
      notes: { type: String }
    }],
    notes: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Tạo bookingCode duy nhất trước khi lưu
appointmentSchema.pre('save', async function(next) {
  try {
    if (!this.bookingCode) {
      // Generate a random 8-character alphanumeric code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let bookingCode;
      let isUnique = false;

      // Keep generating until we find a unique code
      while (!isUnique) {
        bookingCode = 'APT-';
        for (let i = 0; i < 8; i++) {
          bookingCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if the code is unique
        const existingAppointment = await this.constructor.findOne({ bookingCode });
        if (!existingAppointment) {
          isUnique = true;
        }
      }

      this.bookingCode = bookingCode;
    }
    next();
  } catch (error) {
    console.error('Error generating booking code:', error);
    next(error);
  }
});

// Tạo index cho truy vấn hiệu quả
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ hospitalId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ bookingCode: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 