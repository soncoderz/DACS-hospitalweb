const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: function() {
      return this.type === 'doctor' || !this.type; // Required if it's a doctor review or type is not specified
    }
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function() {
      return this.type === 'hospital'; // Required if it's a hospital review
    }
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: function() {
      return this.type === 'doctor' || !this.type; // Required for doctor reviews
    },
    // Make unique only within the scope of the review type
    // This allows a user to review both a doctor and hospital for the same appointment
    sparse: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  type: {
    type: String,
    enum: ['doctor', 'hospital'],
    default: 'doctor'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  replies: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      comment: {
        type: String,
        required: true,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
reviewSchema.index({ doctorId: 1 });
reviewSchema.index({ hospitalId: 1 });
reviewSchema.index({ type: 1 });
// Create a compound index for appointmentId and type to ensure no duplicate reviews of the same type
reviewSchema.index({ appointmentId: 1, type: 1 }, { unique: true, sparse: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 