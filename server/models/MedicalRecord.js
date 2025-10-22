const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const medicalRecordSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  },
  specialtyName: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  symptoms: {
    type: String,
    trim: true
  },
  treatment: {
    type: String,
    trim: true
  },
  prescription: [{
    medicine: { type: String, required: true },      // Tên thuốc
    dosage: { type: String },                        // Liều lượng
    usage: { type: String },                         // Cách dùng
    duration: { type: String },                      // Thời gian dùng
    notes: { type: String },                         // Ghi chú (nếu có)
    quantity: { type: Number, default: 1 },          // Số lượng
    medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' }, // ID thuốc
    frequency: { type: String }                      // Tần suất
  }],
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followUpDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'completed'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Tạo indexes cho truy vấn
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ specialty: 1 });
medicalRecordSchema.index({ status: 1 });
medicalRecordSchema.index({ createdAt: 1 });

// Add pagination plugin
medicalRecordSchema.plugin(mongoosePaginate);

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;