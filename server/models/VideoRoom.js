const mongoose = require('mongoose');

const videoRoomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended', 'cancelled'],
    default: 'waiting'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['doctor', 'patient', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    }
  }],
  recordings: [{
    recordingId: String,
    url: String,
    duration: Number,
    size: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    maxParticipants: {
      type: Number,
      default: 2
    },
    enableRecording: {
      type: Boolean,
      default: false
    },
    enableScreenShare: {
      type: Boolean,
      default: true
    },
    enableChat: {
      type: Boolean,
      default: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
videoRoomSchema.index({ appointmentId: 1 });
videoRoomSchema.index({ doctorId: 1 });
videoRoomSchema.index({ patientId: 1 });
videoRoomSchema.index({ status: 1 });
videoRoomSchema.index({ createdAt: -1 });

// Virtual for room duration calculation
videoRoomSchema.virtual('calculatedDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Methods
videoRoomSchema.methods.isActive = function() {
  return this.status === 'active';
};

videoRoomSchema.methods.canJoin = function(userId) {
  // Check if user is doctor (via doctor.user), patient, or admin
  const isDoctorUser = this.doctorId && this.doctorId.user && this.doctorId.user.equals(userId);
  const isPatient = this.patientId && this.patientId.equals(userId);
  const isAdmin = this.participants.some(p => p.userId.equals(userId) && p.role === 'admin');
  
  return isDoctorUser || isPatient || isAdmin;
};

videoRoomSchema.methods.startRoom = function() {
  this.status = 'active';
  this.startTime = new Date();
  return this.save();
};

videoRoomSchema.methods.endRoom = function() {
  this.status = 'ended';
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return this.save();
};

const VideoRoom = mongoose.model('VideoRoom', videoRoomSchema);

module.exports = VideoRoom;
