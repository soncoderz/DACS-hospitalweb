const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    trim: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Tên phòng khám là bắt buộc'],
    trim: true
  },
  number: {
    type: String,
    required: [true, 'Số phòng là bắt buộc'],
    trim: true
  },
  floor: {
    type: String,
    trim: true
  },
  roomFloor: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['examination', 'procedure', 'surgery', 'consultation', 'other'],
    default: 'examination'
  },
  capacity: {
    type: Number,
    default: 1
  },
  description: {
    type: String,
    trim: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Bệnh viện là bắt buộc']
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  },
  equipment: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  assignedDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    url: String,
    secureUrl: String,
    publicId: String,
    cloudName: String
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to auto-generate roomId and roomFloor
roomSchema.pre('save', async function(next) {
  // Only generate if roomId doesn't exist
  if (!this.roomId) {
    // Generate roomId based on specialty abbreviation (if available) + number + floor
    let prefix = 'R'; // Default prefix
    
    if (this.specialtyId) {
      try {
        const Specialty = mongoose.model('Specialty');
        const specialty = await Specialty.findById(this.specialtyId);
        if (specialty) {
          // Get first letters of each word in specialty name
          prefix = specialty.name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('');
        }
      } catch (error) {
        console.error('Error generating room prefix:', error);
      }
    }
    
    this.roomId = `${prefix}-${this.number}-${this.floor || '0'}`;
  }
  
  // Generate roomFloor (combined field)
  this.roomFloor = `${this.number} - Tầng ${this.floor || '1'}`;
  
  next();
});

// Index for faster queries
roomSchema.index({ hospitalId: 1, number: 1 }, { unique: true });
roomSchema.index({ hospitalId: 1, specialtyId: 1 });
roomSchema.index({ hospitalId: 1, status: 1 });
roomSchema.index({ assignedDoctors: 1 });

module.exports = mongoose.model('Room', roomSchema); 