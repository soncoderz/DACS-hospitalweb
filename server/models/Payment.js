const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'ID lịch hẹn là bắt buộc']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID bệnh nhân là bắt buộc']
  },
  amount: {
    type: Number,
    required: [true, 'Số tiền là bắt buộc'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['visa', 'vnpay', 'momo'],
    required: [true, 'Phương thức thanh toán là bắt buộc']
  },
  transactionId: {
    type: String,
    required: [true, 'ID giao dịch là bắt buộc'],
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: [true, 'Số hóa đơn là bắt buộc']
  },
  promoCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Index để tìm kiếm theo bệnh nhân
paymentSchema.index({ patientId: 1, paymentDate: -1 });

// Index để tìm kiếm theo lịch hẹn
paymentSchema.index({ appointmentId: 1 });

// Index để tìm kiếm theo trạng thái
paymentSchema.index({ status: 1 });

// Phương thức tính tổng số tiền sau khi trừ giảm giá
paymentSchema.methods.calculateFinalAmount = function() {
  return this.amount - this.discountAmount;
};

// Phương thức kiểm tra xem thanh toán có thể được hoàn tiền không
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'success' && 
         (new Date() - this.paymentDate) <= 7 * 24 * 60 * 60 * 1000; // Trong vòng 7 ngày
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 