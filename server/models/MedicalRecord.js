const mongoose = require('mongoose');

const vitalSignsSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    min: 35,
    max: 42
  },
  bloodPressure: {
    type: String,
    match: [/^\d{2,3}\/\d{2,3}$/, 'Định dạng huyết áp không hợp lệ']
  },
  heartRate: {
    type: Number,
    min: 40,
    max: 200
  }
});

const prescriptionSchema = new mongoose.Schema({
  medicationName: {
    type: String,
    required: [true, 'Tên thuốc là bắt buộc'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Liều lượng là bắt buộc'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Tần suất sử dụng là bắt buộc'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Thời gian sử dụng là bắt buộc'],
    trim: true
  }
});

const labResultSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: [true, 'Tên xét nghiệm là bắt buộc'],
    trim: true
  },
  resultUrl: {
    type: String,
    required: [true, 'URL kết quả là bắt buộc'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Ngày xét nghiệm là bắt buộc']
  },
  notes: {
    type: String,
    trim: true
  }
});

const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'Tên file là bắt buộc'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'URL file là bắt buộc'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'Loại file là bắt buộc'],
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID bệnh nhân là bắt buộc']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'ID lịch hẹn là bắt buộc']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'ID bác sĩ là bắt buộc']
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'ID bệnh viện là bắt buộc']
  },
  date: {
    type: Date,
    required: [true, 'Ngày khám bệnh là bắt buộc']
  },
  diagnosis: {
    type: String,
    required: [true, 'Chẩn đoán là bắt buộc'],
    trim: true
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  vitalSigns: {
    type: vitalSignsSchema
  },
  treatmentPlan: {
    type: String,
    trim: true
  },
  prescriptions: [prescriptionSchema],
  labResults: [labResultSchema],
  attachments: [attachmentSchema],
  notes: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo bệnh nhân
medicalRecordSchema.index({ patientId: 1, date: -1 });

// Index để tìm kiếm theo bác sĩ
medicalRecordSchema.index({ doctorId: 1, date: -1 });

// Index để tìm kiếm theo bệnh viện
medicalRecordSchema.index({ hospitalId: 1, date: -1 });

// Phương thức kiểm tra xem hồ sơ có cần tái khám không
medicalRecordSchema.methods.needsFollowUp = function() {
  return this.followUpDate && this.followUpDate > new Date();
};

// Phương thức lấy thời gian còn lại đến ngày tái khám
medicalRecordSchema.methods.getTimeUntilFollowUp = function() {
  if (!this.followUpDate) return null;
  
  const now = new Date();
  const timeUntilFollowUp = this.followUpDate.getTime() - now.getTime();
  
  if (timeUntilFollowUp <= 0) return null;
  
  const days = Math.floor(timeUntilFollowUp / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeUntilFollowUp % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilFollowUp % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    days,
    hours,
    minutes
  };
};

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord; 