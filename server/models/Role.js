const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên vai trò là bắt buộc'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Mã vai trò là bắt buộc'],
    unique: true,
    enum: ['admin', 'doctor', 'user'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes only if they aren't already defined by unique:true
// Comment out these lines to avoid duplicate index warnings
// roleSchema.index({ code: 1 });
// roleSchema.index({ name: 1 });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 