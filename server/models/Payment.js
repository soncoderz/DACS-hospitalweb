const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: [ 'cash', 'paypal', 'momo']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled', 'paid'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentDetails: {
    type: Object
  },
  notes: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
paymentSchema.index({ userId: 1 });
paymentSchema.index({ doctorId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 