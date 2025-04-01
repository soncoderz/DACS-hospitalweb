const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID bệnh nhân là bắt buộc']
  },
  patientName: {
    type: String,
    required: [true, 'Tên bệnh nhân là bắt buộc'],
    trim: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'ID bác sĩ là bắt buộc']
  },
  doctorName: {
    type: String,
    required: [true, 'Tên bác sĩ là bắt buộc'],
    trim: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'ID bệnh viện là bắt buộc']
  },
  hospitalName: {
    type: String,
    required: [true, 'Tên bệnh viện là bắt buộc'],
    trim: true
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'ID chuyên khoa là bắt buộc']
  },
  specialtyName: {
    type: String,
    required: [true, 'Tên chuyên khoa là bắt buộc'],
    trim: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'ID dịch vụ là bắt buộc']
  },
  serviceName: {
    type: String,
    required: [true, 'Tên dịch vụ là bắt buộc'],
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Ngày hẹn là bắt buộc']
  },
  startTime: {
    type: String,
    required: [true, 'Thời gian bắt đầu là bắt buộc'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
  },
  endTime: {
    type: String,
    required: [true, 'Thời gian kết thúc là bắt buộc'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  symptoms: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  queueNumber: {
    type: Number,
    min: 1
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancellationDate: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  followUpAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  isRescheduled: {
    type: Boolean,
    default: false
  },
  previousAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo bệnh nhân
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

// Index để tìm kiếm theo bác sĩ
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

// Index để tìm kiếm theo bệnh viện
appointmentSchema.index({ hospitalId: 1, appointmentDate: 1 });

// Phương thức kiểm tra xem lịch hẹn có thể được hủy không
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
  
  // Cho phép hủy trước 24 giờ
  return appointmentDateTime.getTime() - now.getTime() > 24 * 60 * 60 * 1000;
};

// Phương thức kiểm tra xem lịch hẹn có thể được đặt lại không
appointmentSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
  
  // Cho phép đặt lại trước 48 giờ
  return appointmentDateTime.getTime() - now.getTime() > 48 * 60 * 60 * 1000;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 