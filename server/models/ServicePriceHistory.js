const mongoose = require('mongoose');

const servicePriceHistorySchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  previousPrice: {
    type: Number,
    required: true
  },
  newPrice: {
    type: Number,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
servicePriceHistorySchema.index({ serviceId: 1 });
servicePriceHistorySchema.index({ serviceId: 1, createdAt: -1 });

module.exports = mongoose.model('ServicePriceHistory', servicePriceHistorySchema);
