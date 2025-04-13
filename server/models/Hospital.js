const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên bệnh viện là bắt buộc'],
    unique: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Địa chỉ đường là bắt buộc'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Thành phố là bắt buộc'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'Quận/huyện là bắt buộc'],
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Việt Nam',
      trim: true
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Số điện thoại liên hệ là bắt buộc'],
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  workingHours: {
    monday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    tuesday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    wednesday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    thursday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    friday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    saturday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: true }
    },
    sunday: {
      open: String,
      close: String,
      isOpen: { type: Boolean, default: false }
    }
  },
  specialties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  }],
  facilities: [{
    type: String,
    trim: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isMainBranch: {
    type: Boolean,
    default: false
  },
  parentHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Tạo index cho vị trí địa lý
hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital; 