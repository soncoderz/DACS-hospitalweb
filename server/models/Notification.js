const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  recipientIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  recipientRole: {
    type: String,
    enum: ['admin', 'user', 'doctor', 'hospital_admin'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'appointment_create', 
      'appointment_update', 
      'appointment_cancel', 
      'appointment_reminder',
      'payment',
      'system'
    ],
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Validate that at least one recipient field is provided
notificationSchema.pre('validate', function(next) {
  if (!this.recipientId && (!this.recipientIds || this.recipientIds.length === 0) && !this.recipientRole) {
    next(new Error('At least one recipient (recipientId, recipientIds, or recipientRole) must be provided'));
  } else {
    next();
  }
});

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Create indexes for better query performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 