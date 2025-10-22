const VideoRoom = require('../models/VideoRoom');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const livekitService = require('../services/livekitService');
const asyncHandler = require('../middlewares/async');

// Create a video room for an appointment
exports.createVideoRoom = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  const userId = req.user.id;

  // Check if appointment exists
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId')
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        model: 'User'
      }
    });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Lịch hẹn không tồn tại'
    });
  }

  // Check if user is authorized (doctor, patient, or admin)
  const doctorUserId = appointment.doctorId && appointment.doctorId.user ?
    (appointment.doctorId.user._id || appointment.doctorId.user) : null;
  const patientId = appointment.patientId ? (appointment.patientId._id || appointment.patientId) : null;

  const isDoctor = doctorUserId && doctorUserId.toString() === userId;
  const isPatient = patientId && patientId.toString() === userId;
  const isAdmin = req.user.role === 'admin' || req.user.roleType === 'admin';

  if (!isDoctor && !isPatient && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền tạo phòng cho lịch hẹn này'
    });
  }

  // Check if room already exists for this appointment
  let videoRoom = await VideoRoom.findOne({
    appointmentId,
    status: { $in: ['waiting', 'active'] }
  });

  if (videoRoom) {
    return res.status(200).json({
      success: true,
      message: 'Phòng đã tồn tại',
      data: videoRoom
    });
  }

  // Check total number of rooms created for this appointment (limit: 3)
  const totalRoomsCount = await VideoRoom.countDocuments({ appointmentId });

  if (totalRoomsCount >= 3) {
    return res.status(400).json({
      success: false,
      message: 'Đã đạt giới hạn tối đa 3 phòng video cho lịch hẹn này. Không thể tạo thêm phòng mới.',
      limit: 3,
      current: totalRoomsCount
    });
  }

  // Generate unique room name
  const roomName = `appointment_${appointmentId}_${Date.now()}`;

  try {
    // Create room in LiveKit
    await livekitService.createRoom(roomName, {
      maxParticipants: 3, // Doctor, Patient, and potentially an Admin
      emptyTimeout: 1800, // 30 minutes
      metadata: {
        appointmentId: appointmentId.toString(),
        doctorId: appointment.doctorId ? appointment.doctorId._id.toString() : null,
        patientId: patientId ? patientId.toString() : null
      }
    });

    // Create room in database
    videoRoom = await VideoRoom.create({
      roomName,
      appointmentId,
      doctorId: appointment.doctorId ? appointment.doctorId._id : null,
      patientId: patientId,
      createdBy: userId,
      status: 'waiting',
      metadata: {
        maxParticipants: 3,
        enableRecording: false,
        enableScreenShare: true,
        enableChat: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phòng video thành công',
      data: videoRoom
    });
  } catch (error) {
    console.error('Error creating video room:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo phòng video',
      error: error.message
    });
  }
});

// Join a video room
exports.joinVideoRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  // Find the video room
  const videoRoom = await VideoRoom.findById(roomId)
    .populate('appointmentId')
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
    .populate('patientId');

  if (!videoRoom) {
    return res.status(404).json({
      success: false,
      message: 'Phòng video không tồn tại'
    });
  }

  // Check if room is active or waiting
  if (!['waiting', 'active'].includes(videoRoom.status)) {
    return res.status(400).json({
      success: false,
      message: 'Phòng video đã kết thúc hoặc bị hủy'
    });
  }

  // Determine user role
  let role = 'viewer';
  let participantName = req.user.fullName || 'Unknown';
  
  // Handle both populated and non-populated fields
  const doctorUserId = videoRoom.doctorId && videoRoom.doctorId.user ? 
    (videoRoom.doctorId.user._id || videoRoom.doctorId.user) : null;
  const patientIdStr = videoRoom.patientId ? 
    (videoRoom.patientId._id ? videoRoom.patientId._id.toString() : videoRoom.patientId.toString()) : null;
  
  // Debug logging
  // console.log('=== JOIN ROOM DEBUG ===');
  // console.log('Current userId:', userId);
  // console.log('User role:', req.user.role, 'roleType:', req.user.roleType);
  // console.log('VideoRoom doctorId:', videoRoom.doctorId);
  // console.log('VideoRoom patientId:', videoRoom.patientId);
  // console.log('Extracted doctorUserId:', doctorUserId);
  // console.log('Extracted patientIdStr:', patientIdStr);
  // console.log('======================');
  
  if (doctorUserId && doctorUserId.toString() === userId) {
    role = 'doctor';
    participantName = `Bác sĩ ${req.user.fullName}`;
  } else if (patientIdStr && patientIdStr === userId) {
    role = 'patient';
    participantName = `Bệnh nhân ${req.user.fullName}`;
  } else if (req.user.role === 'admin' || req.user.roleType === 'admin') {
    role = 'admin';
    participantName = `Admin ${req.user.fullName}`;
  } else {
    // console.log('ACCESS DENIED - No matching role found');
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền tham gia phòng này',
      debug: {
        userId,
        userRole: req.user.role,
        userRoleType: req.user.roleType,
        doctorUserId,
        patientIdStr
      }
    });
  }

  // Generate access token - use admin token for admins
  let token;
  if (role === 'admin') {
    token = await livekitService.generateAdminToken(
      videoRoom.roomName,
      {
        id: userId,
        name: participantName,
        metadata: {
          appointmentId: videoRoom.appointmentId ?
            (videoRoom.appointmentId._id ? videoRoom.appointmentId._id.toString() : videoRoom.appointmentId.toString()) : null,
          userId,
          role: 'admin'
        }
      }
    );
  } else {
    token = await livekitService.generateToken(
      videoRoom.roomName,
      participantName,
      userId,
      {
        role,
        appointmentId: videoRoom.appointmentId ?
          (videoRoom.appointmentId._id ? videoRoom.appointmentId._id.toString() : videoRoom.appointmentId.toString()) : null,
        userId
      }
    );
  }

  // console.log('=== TOKEN DEBUG ===');
  // console.log('Generated token type:', typeof token);
  // console.log('Token length:', token ? token.length : 'null');
  // console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'null');
  // console.log('Room name:', videoRoom.roomName);
  // console.log('Participant name:', participantName);
  // console.log('WS URL:', process.env.LIVEKIT_WS_URL);
  // console.log('==================');

  // Update room status if first participant
  if (videoRoom.status === 'waiting') {
    videoRoom.status = 'active';
    videoRoom.startTime = new Date();
    
    // Add participant to the list
    videoRoom.participants.push({
      userId,
      role,
      joinedAt: new Date()
    });
    
    await videoRoom.save();
  } else {
    // Check if participant already exists
    const existingParticipant = videoRoom.participants.find(
      p => p.userId.toString() === userId
    );
    
    if (!existingParticipant) {
      videoRoom.participants.push({
        userId,
        role,
        joinedAt: new Date()
      });
      await videoRoom.save();
    }
  }

  res.json({
    success: true,
    data: {
      token,
      wsUrl: process.env.LIVEKIT_WS_URL,
      roomName: videoRoom.roomName,
      role,
      roomId: videoRoom._id,
      appointmentInfo: {
        id: videoRoom.appointmentId ? 
          (videoRoom.appointmentId._id || videoRoom.appointmentId) : null,
        patientName: videoRoom.patientId ? 
          (videoRoom.patientId.fullName || 'N/A') : 'N/A',
        doctorName: videoRoom.doctorId && videoRoom.doctorId.user ? 
          (videoRoom.doctorId.user.fullName || 'N/A') : 'N/A',
        date: videoRoom.appointmentId ? 
          videoRoom.appointmentId.appointmentDate : null
      }
    }
  });
});

// End a video room
exports.endVideoRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const videoRoom = await VideoRoom.findById(roomId);

  if (!videoRoom) {
    return res.status(404).json({
      success: false,
      message: 'Phòng video không tồn tại'
    });
  }

  // Check authorization - handle possible null values
  const isAuthorized = 
    (videoRoom.doctorId && videoRoom.doctorId.toString() === userId) ||
    (videoRoom.createdBy && videoRoom.createdBy.toString() === userId) ||
    req.user.role === 'admin' ||
    req.user.roleType === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền kết thúc phòng này'
    });
  }

  try {
    // Delete room from LiveKit
    await livekitService.deleteRoom(videoRoom.roomName);

    // Update room status in database
    videoRoom.status = 'ended';
    videoRoom.endTime = new Date();
    
    if (videoRoom.startTime) {
      videoRoom.duration = Math.round(
        (videoRoom.endTime - videoRoom.startTime) / (1000 * 60)
      );
    }

    // Update participants' left time
    videoRoom.participants.forEach(participant => {
      if (!participant.leftAt) {
        participant.leftAt = new Date();
      }
    });

    await videoRoom.save();

    res.json({
      success: true,
      message: 'Kết thúc phòng video thành công',
      data: {
        roomId: videoRoom._id,
        duration: videoRoom.duration
      }
    });
  } catch (error) {
    console.error('Error ending video room:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kết thúc phòng video',
      error: error.message
    });
  }
});

// Get video room details
exports.getVideoRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const videoRoom = await VideoRoom.findById(roomId)
    .populate('appointmentId')
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        select: 'fullName email phoneNumber'
      }
    })
    .populate('patientId', 'fullName email phoneNumber')
    .populate('participants.userId', 'fullName role');

  if (!videoRoom) {
    return res.status(404).json({
      success: false,
      message: 'Phòng video không tồn tại'
    });
  }

  // Check authorization - handle both populated and non-populated fields
  const doctorUserId = videoRoom.doctorId && videoRoom.doctorId.user ? 
    (videoRoom.doctorId.user._id || videoRoom.doctorId.user) : null;
  const patientIdStr = videoRoom.patientId ? 
    (videoRoom.patientId._id ? videoRoom.patientId._id.toString() : videoRoom.patientId.toString()) : null;
  
  const isAuthorized = 
    (doctorUserId && doctorUserId.toString() === userId) ||
    (patientIdStr && patientIdStr === userId) ||
    req.user.role === 'admin' ||
    req.user.roleType === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền xem thông tin phòng này'
    });
  }

  res.json({
    success: true,
    data: videoRoom
  });
});

// List video rooms (for admin)
exports.listVideoRooms = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  let query = {};

  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  // If not admin, only show rooms where user is doctor or patient
  if (userRole !== 'admin') {
    query.$or = [
      { doctorId: userId },
      { patientId: userId }
    ];
  }

  const skip = (page - 1) * limit;

  const videoRooms = await VideoRoom.find(query)
    .populate('appointmentId', 'appointmentDate bookingCode')
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        select: 'fullName email'
      }
    })
    .populate('patientId', 'fullName email')
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip(skip);

  const total = await VideoRoom.countDocuments(query);

  res.json({
    success: true,
    data: videoRooms,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// Helper function to convert BigInt to string for JSON serialization
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }

  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertBigIntToString(obj[key]);
      }
    }
    return converted;
  }

  return obj;
};

// Get active rooms from LiveKit (for admin)
exports.getActiveLiveKitRooms = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền xem danh sách phòng hoạt động'
    });
  }

  try {
    const rooms = await livekitService.listRooms();

    // Get participants for each room
    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const participants = await livekitService.listParticipants(room.name);
        return {
          ...room,
          participants
        };
      })
    );

    // Convert BigInt values to strings for JSON serialization
    const serializedRooms = convertBigIntToString(roomsWithParticipants);

    res.json({
      success: true,
      data: serializedRooms
    });
  } catch (error) {
    console.error('Error getting active rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách phòng hoạt động',
      error: error.message
    });
  }
});

// Remove participant from room (admin only)
exports.removeParticipantFromRoom = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền xóa người tham gia'
    });
  }

  const { roomName, participantIdentity } = req.body;

  try {
    await livekitService.removeParticipant(roomName, participantIdentity);
    
    res.json({
      success: true,
      message: 'Đã xóa người tham gia khỏi phòng'
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa người tham gia',
      error: error.message
    });
  }
});

// Get room by appointment ID
exports.getRoomByAppointmentId = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;

  // Check if appointment exists
  const appointment = await Appointment.findById(appointmentId)
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        model: 'User'
      }
    });
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Lịch hẹn không tồn tại'
    });
  }

  // Find active or waiting room for this appointment
  const videoRoom = await VideoRoom.findOne({
    appointmentId,
    status: { $in: ['waiting', 'active'] }
  }).populate({
    path: 'doctorId',
    populate: {
      path: 'user',
      select: 'fullName email'
    }
  }).populate('patientId', 'fullName email');

  if (!videoRoom) {
    return res.json({
      success: true,
      data: null,
      message: 'Không có phòng video hoạt động cho lịch hẹn này'
    });
  }

  // Check authorization - handle possible null values
  const doctorUserId = appointment.doctorId && appointment.doctorId.user ? 
    (appointment.doctorId.user._id || appointment.doctorId.user) : null;
  
  const isAuthorized = 
    (doctorUserId && doctorUserId.toString() === userId) ||
    (appointment.patientId && appointment.patientId.toString() === userId) ||
    req.user.role === 'admin' ||
    req.user.roleType === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền xem thông tin phòng này'
    });
  }

  res.json({
    success: true,
    data: videoRoom
  });
});

// Get video call history with role-based access control
exports.getVideoCallHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  let query = {};

  // Filter by status if provided (only show ended calls by default for history)
  if (status) {
    query.status = status;
  } else {
    query.status = 'ended'; // Default to only ended calls for history
  }

  // Role-based filtering
  if (userRole === 'admin') {
    // Admin can see all video call history
    // No additional filtering needed
  } else if (userRole === 'doctor') {
    // Doctor can only see their own video calls
    // Need to find doctor record first
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    query.doctorId = doctor._id;
  } else {
    // Patient (user role) can only see their own video calls
    query.patientId = userId;
  }

  const skip = (page - 1) * limit;

  const videoRooms = await VideoRoom.find(query)
    .populate('appointmentId', 'appointmentDate bookingCode')
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        select: 'fullName email'
      }
    })
    .populate('patientId', 'fullName email')
    .populate('participants.userId', 'fullName role')
    .sort({ endTime: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip(skip);

  const total = await VideoRoom.countDocuments(query);

  // Format the response data
  const formattedData = videoRooms.map(room => ({
    _id: room._id,
    roomName: room.roomName,
    appointmentId: room.appointmentId,
    doctor: room.doctorId ? {
      _id: room.doctorId._id,
      fullName: room.doctorId.user?.fullName || 'N/A',
      email: room.doctorId.user?.email || 'N/A'
    } : null,
    patient: room.patientId ? {
      _id: room.patientId._id,
      fullName: room.patientId.fullName,
      email: room.patientId.email
    } : null,
    status: room.status,
    startTime: room.startTime,
    endTime: room.endTime,
    duration: room.duration,
    participants: room.participants,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  }));

  res.json({
    success: true,
    data: formattedData,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

// Get detailed video call history for a specific room
exports.getVideoCallHistoryDetail = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const videoRoom = await VideoRoom.findById(roomId)
    .populate('appointmentId')
    .populate({
      path: 'doctorId',
      populate: [
        {
          path: 'user',
          select: 'fullName email phoneNumber'
        },
        {
          path: 'specialtyId',
          select: 'name description'
        }
      ]
    })
    .populate('patientId', 'fullName email phoneNumber')
    .populate('participants.userId', 'fullName role email')
    .populate('createdBy', 'fullName email');

  if (!videoRoom) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy phòng video'
    });
  }

  // Check authorization
  let isAuthorized = false;

  if (userRole === 'admin') {
    isAuthorized = true;
  } else if (userRole === 'doctor') {
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: userId });
    isAuthorized = doctor && videoRoom.doctorId && videoRoom.doctorId._id.equals(doctor._id);
  } else {
    // Patient
    isAuthorized = videoRoom.patientId && videoRoom.patientId._id.equals(userId);
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền xem thông tin phòng này'
    });
  }

  // Format the response
  const formattedData = {
    _id: videoRoom._id,
    roomName: videoRoom.roomName,
    appointmentId: videoRoom.appointmentId,
    doctor: videoRoom.doctorId ? {
      _id: videoRoom.doctorId._id,
      fullName: videoRoom.doctorId.user?.fullName || 'N/A',
      email: videoRoom.doctorId.user?.email || 'N/A',
      phoneNumber: videoRoom.doctorId.user?.phoneNumber || 'N/A',
      specialty: videoRoom.doctorId.specialtyId ? {
        _id: videoRoom.doctorId.specialtyId._id,
        name: videoRoom.doctorId.specialtyId.name,
        description: videoRoom.doctorId.specialtyId.description
      } : null,
      title: videoRoom.doctorId.title || 'N/A'
    } : null,
    patient: videoRoom.patientId ? {
      _id: videoRoom.patientId._id,
      fullName: videoRoom.patientId.fullName,
      email: videoRoom.patientId.email,
      phoneNumber: videoRoom.patientId.phoneNumber
    } : null,
    status: videoRoom.status,
    startTime: videoRoom.startTime,
    endTime: videoRoom.endTime,
    duration: videoRoom.duration,
    participants: videoRoom.participants,
    recordings: videoRoom.recordings,
    metadata: videoRoom.metadata,
    createdBy: videoRoom.createdBy,
    createdAt: videoRoom.createdAt,
    updatedAt: videoRoom.updatedAt
  };

  res.json({
    success: true,
    data: formattedData
  });
});
