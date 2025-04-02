const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên quyền là bắt buộc'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Mã quyền là bắt buộc'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes only if they aren't already defined by unique:true
// Comment out these lines to avoid duplicate index warnings
// permissionSchema.index({ code: 1 });
// permissionSchema.index({ name: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission; 