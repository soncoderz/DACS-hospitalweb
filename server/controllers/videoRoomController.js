const VideoRoom = require('../models/VideoRoom');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const livekitService = require('../services/livekitService');
const asyncHandler = require('../middlewares/async');
const { createVideoCallMessage } = require('../utils/chatHelpers');

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (value.toString) return value.toString();
  return null;
};

const resolveParticipantRole = (videoRoom, user) => {
  if (!videoRoom || !user) return null;

  const currentUserId = normalizeId(user.id || user._id);
  if (!currentUserId) return null;

  const doctorUserId = normalizeId(
    videoRoom.doctorId && videoRoom.doctorId.user
      ? videoRoom.doctorId.user
      : null
  );
  const patientUserId = normalizeId(videoRoom.patientId);

  if (doctorUserId && doctorUserId === currentUserId) {
    return 'doctor';
  }

  if (patientUserId && patientUserId === currentUserId) {
    return 'patient';
  }

  if (user.role === 'admin' || user.roleType === 'admin') {
    return 'admin';
  }

  if (user.role === 'doctor' || user.roleType === 'doctor') {
    return 'doctor';
  }

  if (user.role === 'user' || user.roleType === 'user') {
    return 'patient';
  }

  return null;
};

const getVideoRoomParticipantIds = async (videoRoom) => {
  if (!videoRoom) return { doctorUserId: null, patientUserId: null };

  let doctorUserId = null;
  if (videoRoom.doctorId && videoRoom.doctorId.user) {
    doctorUserId = normalizeId(videoRoom.doctorId.user);
  } else if (videoRoom.doctorId) {
    const doctorDoc = await Doctor.findById(videoRoom.doctorId).select('user');
    doctorUserId = normalizeId(doctorDoc?.user);
  }

  const patientUserId = normalizeId(videoRoom.patientId);

  return { doctorUserId, patientUserId };
};

const sanitizeRoomPayload = (videoRoom) => ({
  _id: videoRoom?._id,
  appointmentId: normalizeId(videoRoom?.appointmentId),
  roomName: videoRoom?.roomName,
  status: videoRoom?.status,
  startTime: videoRoom?.startTime,
  endTime: videoRoom?.endTime,
  duration: videoRoom?.duration,
  createdAt: videoRoom?.createdAt,
  updatedAt: videoRoom?.updatedAt
});

const emitVideoRoomUpdate = async (videoRoom) => {
  if (!global.io || !videoRoom) return;
  const { doctorUserId, patientUserId } = await getVideoRoomParticipantIds(videoRoom);
  const recipients = [doctorUserId, patientUserId].filter(Boolean);
  if (!recipients.length) return;

  const payload = {
    appointmentId: normalizeId(videoRoom.appointmentId),
    room: sanitizeRoomPayload(videoRoom)
  };

  recipients.forEach((userId) => {
    global.io.to(userId).emit('video_room_updated', payload);
  });
};

const finalizeVideoRoom = async (videoRoom) => {
  if (!videoRoom || videoRoom.status === 'ended') {
    return videoRoom;
  }

  // Mark as ended immediately to prevent race conditions
  videoRoom.status = 'ended';
  videoRoom.endTime = new Date();

  if (videoRoom.startTime) {
    videoRoom.duration = Math.round(
      (videoRoom.endTime - videoRoom.startTime) / (1000 * 60)
    );
  }

  videoRoom.participants.forEach((participant) => {
    if (!participant.leftAt) {
      participant.leftAt = new Date();
    }
  });

  await videoRoom.save();

  // Try to delete LiveKit room (non-blocking)
  try {
    await livekitService.deleteRoom(videoRoom.roomName);
  } catch (error) {
    console.error('Error deleting LiveKit room:', error?.message || error);
  }

  // Create video call end message (only once)
  if (videoRoom.doctorId && videoRoom.patientId) {
    try {
      let doctorUserId = null;

      if (videoRoom.doctorId.user) {
        doctorUserId = videoRoom.doctorId.user._id || videoRoom.doctorId.user;
      } else {
        const doctorRecord = await Doctor.findById(videoRoom.doctorId).select('user');
        doctorUserId = doctorRecord?.user?._id || doctorRecord?.user || null;
      }

      const patientUserId = videoRoom.patientId._id || videoRoom.patientId;

      if (doctorUserId && patientUserId) {
        await createVideoCallMessage({
          doctorUserId: doctorUserId.toString(),
          patientUserId: patientUserId.toString(),
          type: 'video_call_end',
          videoCallData: {
            roomId: videoRoom._id,
            roomName: videoRoom.roomName,
            duration: videoRoom.duration,
            startTime: videoRoom.startTime,
            endTime: videoRoom.endTime
          }
        });
      }
    } catch (chatError) {
      console.error('Error creating video call message:', chatError);
    }
  }

  await emitVideoRoomUpdate(videoRoom);

  return videoRoom;
};

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
      message: 'Đã đạt giới hạn tạo đa 3 phòng video cho lịch hẹn này. Không thể tạo thêm phòng mới.Vui lòng liên hệ holine',
      limit: 3,
      current: totalRoomsCount
    });
  }

  // Generate unique room name
  const roomName = `appointment_${appointmentId}_${Date.now()}`;
  videoRoom = null;

  try {
    videoRoom = await VideoRoom.create({
      roomName,
      appointmentId,
      doctorId: appointment.doctorId ? appointment.doctorId._id : null,
      patientId: patientId,
      createdBy: userId,
      status: 'waiting',
      meetingType: 'appointment',
      isPublic: true, // Allow joining by room code
      metadata: {
        maxParticipants: 30,
        enableRecording: false,
        enableScreenShare: true,
        enableChat: true
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existingRoom = await VideoRoom.findOne({
        appointmentId,
        status: { $in: ['waiting', 'active'] }
      });

      if (existingRoom) {
        return res.status(200).json({
          success: true,
          message: 'Phòng đã tồn tại',
          data: existingRoom
        });
      }
    }

    console.error('Error creating video room:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo phòng video',
      error: error.message
    });
  }

  try {
    await livekitService.createRoom(roomName, {
      maxParticipants: 10, // Multiple participants allowed
      emptyTimeout: 1800, // 30 minutes
      metadata: {
        appointmentId: appointmentId.toString(),
        doctorId: appointment.doctorId ? appointment.doctorId._id.toString() : null,
        patientId: patientId ? patientId.toString() : null,
        roomCode: videoRoom.roomCode
      }
    });
  } catch (livekitError) {
    await VideoRoom.findByIdAndDelete(videoRoom._id).catch(() => { });
    console.error('Error creating video room in LiveKit:', livekitError);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo phòng video',
      error: livekitError.message
    });
  }

  await emitVideoRoomUpdate(videoRoom);

  // Send incoming call notification to the receiver via Socket.io
  if (global.io) {
    // Determine caller and receiver
    const callerUserId = userId;
    const callerName = req.user.fullName || 'Người dùng';
    const callerRole = isDoctor ? 'doctor' : isPatient ? 'patient' : 'admin';

    let receiverUserId = null;
    if (isDoctor && patientId) {
      receiverUserId = patientId.toString();
    } else if (isPatient && doctorUserId) {
      receiverUserId = doctorUserId.toString();
    }

    if (receiverUserId && receiverUserId !== callerUserId) {
      console.log(`[Video Call] Sending notification from ${callerName} (${callerRole}) to user ${receiverUserId}`);

      global.io.to(receiverUserId).emit('incoming_video_call', {
        roomId: videoRoom._id.toString(),
        roomName: videoRoom.roomName,
        roomCode: videoRoom.roomCode,
        callerName: callerName,
        callerRole: callerRole,
        appointmentId: appointmentId.toString(),
        timestamp: Date.now()
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Tạo phòng video thành công',
    data: videoRoom
  });
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
  let role = 'patient';
  let participantName = req.user.fullName || 'Unknown';

  // Handle both populated and non-populated fields
  const doctorUserId = videoRoom.doctorId && videoRoom.doctorId.user ?
    (videoRoom.doctorId.user._id || videoRoom.doctorId.user) : null;
  const patientIdStr = videoRoom.patientId ?
    (videoRoom.patientId._id ? videoRoom.patientId._id.toString() : videoRoom.patientId.toString()) : null;

  // Check if user is authorized
  let isAuthorized = false;

  if (doctorUserId && doctorUserId.toString() === userId) {
    role = 'doctor';
    participantName = `Bác sĩ ${req.user.fullName}`;
    isAuthorized = true;
  } else if (patientIdStr && patientIdStr === userId) {
    role = 'patient';
    participantName = `Bệnh nhân ${req.user.fullName}`;
    isAuthorized = true;
  } else if (req.user.role === 'admin' || req.user.roleType === 'admin') {
    role = 'admin';
    participantName = `Admin ${req.user.fullName}`;
    isAuthorized = true;
  } else if (videoRoom.isPublic) {
    // If room is public, anyone can join as patient
    role = 'patient';
    participantName = req.user.fullName || 'Khách';
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền tham gia phòng này'
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

  const addParticipantRecord = async () => {
    videoRoom.participants.push({
      userId,
      role,
      joinedAt: new Date()
    });
    await videoRoom.save();
  };

  // Update room status if first participant
  if (videoRoom.status === 'waiting') {
    videoRoom.status = 'active';
    videoRoom.startTime = new Date();
    await addParticipantRecord();
  } else {
    // Only add if there isn't an active (not left) record for this user
    const activeParticipant = videoRoom.participants.find(
      (p) => p.userId && p.userId.toString() === userId && !p.leftAt
    );

    if (!activeParticipant) {
      await addParticipantRecord();
    }
  }

  res.json({
    success: true,
    data: {
      token,
      wsUrl: process.env.LIVEKIT_WS_URL,
      roomName: videoRoom.roomName,
      roomCode: videoRoom.roomCode,
      role,
      roomId: videoRoom._id,
      meetingType: videoRoom.meetingType,
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

  const videoRoom = await VideoRoom.findById(roomId)
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

  let doctorUserId = normalizeId(videoRoom.doctorId?.user);
  if (!doctorUserId && videoRoom.doctorId) {
    const doctorRecord = await Doctor.findById(videoRoom.doctorId).select('user');
    doctorUserId = normalizeId(doctorRecord?.user);
  }
  const patientUserId = normalizeId(videoRoom.patientId);
  const createdById = normalizeId(videoRoom.createdBy);
  const currentUserId = normalizeId(userId);

  const isAuthorized =
    (doctorUserId && doctorUserId === currentUserId) ||
    (patientUserId && patientUserId === currentUserId) ||
    (createdById && createdById === currentUserId) ||
    req.user.role === 'admin' ||
    req.user.roleType === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền kết thúc phòng này'
    });
  }

  try {
    await finalizeVideoRoom(videoRoom);
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

// Mark participant as left; auto-end if no one remains
exports.leaveVideoRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const videoRoom = await VideoRoom.findById(roomId)
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

  if (videoRoom.status === 'ended') {
    return res.json({
      success: true,
      autoEnded: true,
      message: 'Phòng video đã kết thúc'
    });
  }

  const fallbackRole =
    req.user.role === 'doctor' || req.user.roleType === 'doctor'
      ? 'doctor'
      : (req.user.role === 'admin' || req.user.roleType === 'admin'
        ? 'admin'
        : 'patient');
  const participantRole = resolveParticipantRole(videoRoom, req.user) || fallbackRole;

  let participantMarked = false;
  videoRoom.participants.forEach((participant) => {
    if (
      participant.userId &&
      participant.userId.toString() === userId &&
      !participant.leftAt
    ) {
      participant.leftAt = new Date();
      participantMarked = true;
    }
  });

  if (!participantMarked) {
    videoRoom.participants.push({
      userId,
      role: participantRole,
      joinedAt: new Date(),
      leftAt: new Date()
    });
  }

  await videoRoom.save();

  let activeParticipants = videoRoom.participants.filter((p) => !p.leftAt);

  try {
    const livekitParticipants = await livekitService.listParticipants(videoRoom.roomName);
    if (Array.isArray(livekitParticipants)) {
      const activeIdentities = new Set(
        livekitParticipants.map((participant) => participant.identity?.toString())
      );
      activeParticipants = activeParticipants.filter((participant) =>
        activeIdentities.has(participant.userId?.toString())
      );
    }
  } catch (error) {
    console.error('Error fetching LiveKit participants:', error);
    // Fall back to local participant tracking
  }

  if (activeParticipants.length === 0) {
    await finalizeVideoRoom(videoRoom);
    return res.json({
      success: true,
      autoEnded: true,
      message: 'Cuộc gọi đã kết thúc vì không còn người tham gia'
    });
  }

  await emitVideoRoomUpdate(videoRoom);

  return res.json({
    success: true,
    autoEnded: false
  });
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
  const { page = 1, limit = 10, status, date } = req.query;
  const userId = req.user.id;
  const userRole = (req.user.roleType || req.user.role || '').toLowerCase();

  const query = {};

  // Handle status filtering - default to "ended" when param missing, skip when "all"
  if (status) {
    if (status !== 'all') {
      query.status = status;
    }
  } else {
    query.status = 'ended';
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

  // Filter by specific date if provided (match either startTime or createdAt)
  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { startTime: { $gte: startOfDay, $lte: endOfDay } },
          { createdAt: { $gte: startOfDay, $lte: endOfDay } }
        ]
      });
    }
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

// Validate room code
exports.validateRoomCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã phòng'
    });
  }

  const videoRoom = await VideoRoom.findOne({
    roomCode: code.toUpperCase(),
    status: { $in: ['waiting', 'active'] }
  })
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        select: 'fullName'
      }
    })
    .populate('patientId', 'fullName');

  if (!videoRoom) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy phòng video hoạt động với mã này'
    });
  }

  res.json({
    success: true,
    data: {
      roomId: videoRoom._id,
      roomCode: videoRoom.roomCode,
      meetingType: videoRoom.meetingType,
      status: videoRoom.status,
      participantCount: videoRoom.participants.filter(p => !p.leftAt).length,
      maxParticipants: videoRoom.metadata.maxParticipants,
      doctorName: videoRoom.doctorId && videoRoom.doctorId.user ?
        videoRoom.doctorId.user.fullName : 'N/A',
      patientName: videoRoom.patientId ?
        videoRoom.patientId.fullName : 'N/A'
    }
  });
});

// Join room by code
exports.joinByRoomCode = asyncHandler(async (req, res) => {
  const { roomCode } = req.body;
  const userId = req.user.id;

  if (!roomCode) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã phòng'
    });
  }

  // Find the video room by code
  const videoRoom = await VideoRoom.findOne({
    roomCode: roomCode.toUpperCase(),
    status: { $in: ['waiting', 'active'] }
  })
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
      message: 'Không tìm thấy phòng video hoạt động với mã này'
    });
  }

  // // Check if room has reached max participants
  // const activeParticipants = videoRoom.participants.filter(p => !p.leftAt);
  // if (activeParticipants.length >= videoRoom.metadata.maxParticipants) {
  //   return res.status(400).json({
  //     success: false,
  //     message: 'Phòng đã đầy, không thể tham gia'
  //   });
  // }

  // Determine user role
  let role = 'patient';
  let participantName = req.user.fullName || 'Unknown';

  const doctorUserId = videoRoom.doctorId && videoRoom.doctorId.user ?
    (videoRoom.doctorId.user._id || videoRoom.doctorId.user) : null;
  const patientIdStr = videoRoom.patientId ?
    (videoRoom.patientId._id ? videoRoom.patientId._id.toString() : videoRoom.patientId.toString()) : null;

  if (doctorUserId && doctorUserId.toString() === userId) {
    role = 'doctor';
    participantName = `Bác sĩ ${req.user.fullName}`;
  } else if (patientIdStr && patientIdStr === userId) {
    role = 'patient';
    participantName = `Bệnh nhân ${req.user.fullName}`;
  } else if (req.user.role === 'admin' || req.user.roleType === 'admin') {
    role = 'admin';
    participantName = `Admin ${req.user.fullName}`;
  } else if (req.user.role === 'doctor' || req.user.roleType === 'doctor') {
    role = 'doctor';
    participantName = `Bác sĩ ${req.user.fullName}`;
  } else {
    // Default to patient for public rooms
    role = 'patient';
    participantName = req.user.fullName || 'Khách';
  }

  // Generate access token
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

  // Add participant record
  const addParticipantRecord = async () => {
    videoRoom.participants.push({
      userId,
      role,
      joinedAt: new Date()
    });
    await videoRoom.save();
  };

  // Update room status if first participant
  if (videoRoom.status === 'waiting') {
    videoRoom.status = 'active';
    videoRoom.startTime = new Date();
    await addParticipantRecord();
  } else {
    // Only add if there isn't an active (not left) record for this user
    const activeParticipant = videoRoom.participants.find(
      (p) => p.userId && p.userId.toString() === userId && !p.leftAt
    );

    if (!activeParticipant) {
      await addParticipantRecord();
    }
  }

  res.json({
    success: true,
    message: 'Tham gia phòng thành công',
    data: {
      token,
      wsUrl: process.env.LIVEKIT_WS_URL,
      roomName: videoRoom.roomName,
      roomCode: videoRoom.roomCode,
      role,
      roomId: videoRoom._id,
      meetingType: videoRoom.meetingType,
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

// Get active LiveKit rooms (Admin only) - Only appointment rooms
exports.getActiveRooms = asyncHandler(async (req, res) => {
  try {
    const rooms = await livekitService.listRooms();

    // Filter only appointment rooms (not internal meetings)
    const appointmentRooms = [];

    for (const room of rooms) {
      try {
        const metadata = room.metadata ? JSON.parse(room.metadata) : {};
        // Only include appointment rooms, exclude internal meetings
        if (metadata.meetingType === 'appointment' || !metadata.meetingType) {
          // Get room details from database
          const videoRoom = await VideoRoom.findOne({ roomName: room.name })
            .populate('appointmentId')
            .populate('doctorId')
            .populate('patientId');

          if (videoRoom) {
            // Get participants from LiveKit
            const participants = await livekitService.listParticipants(room.name);

            appointmentRooms.push({
              sid: room.sid,
              name: room.name,
              roomCode: videoRoom.roomCode,
              _id: videoRoom._id,
              roomId: videoRoom._id,
              creationTime: room.creationTime,
              numParticipants: room.numParticipants,
              participants: participants.map(p => ({
                sid: p.sid,
                identity: p.identity,
                name: p.name,
                joinedAt: p.joinedAt
              })),
              appointmentId: videoRoom.appointmentId,
              doctorId: videoRoom.doctorId,
              patientId: videoRoom.patientId
            });
          }
        }
      } catch (error) {
        console.error('Error processing room:', error);
      }
    }

    res.json({
      success: true,
      data: appointmentRooms
    });
  } catch (error) {
    console.error('Error fetching active rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách phòng hoạt động',
      error: error.message
    });
  }
});
