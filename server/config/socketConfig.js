const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

let io;
// Store online users
const onlineUsers = new Map(); // userId -> socketId
// Store mapping of temporarily locked time slots
const lockedTimeSlots = new Map();
// Store timeout IDs to clear them if user books or cancels
const timeoutIds = new Map();
// Store room subscription to track users viewing the same appointment page
const appointmentRooms = new Map();

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'  // Đảm bảo path khớp với client
  });

  // Make io globally available
  global.io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token is required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.userId = user._id;
      socket.userRole = user.roleType;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // User joins their personal room for targeted messages
    socket.join(socket.userId.toString());
    
    // Join role-based rooms for broadcasts to specific user types
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }
    
    // Auto-join inventory_updates room for admins and doctors
    if (socket.userRole === 'admin' || socket.userRole === 'doctor') {
      socket.join('inventory_updates');
      console.log(`User ${socket.userId} joined inventory_updates room`);
    }

    // Auto-join hospital room for doctors
    if (socket.userRole === 'doctor') {
      try {
        const doctor = await Doctor.findOne({ user: socket.userId }).populate('hospitalId');
        if (doctor && doctor.hospitalId) {
          const hospitalRoomKey = `hospital:${doctor.hospitalId._id}`;
          socket.join(hospitalRoomKey);
          socket.doctorHospitalId = doctor.hospitalId._id.toString();
          console.log(`Doctor ${socket.userId} joined hospital room: ${hospitalRoomKey}`);
        }
      } catch (error) {
        console.error('Error joining hospital room:', error);
      }
    }
    
    // Mark user as online
    onlineUsers.set(socket.userId.toString(), socket.id);

    // Send current online list to the connected user
    socket.emit('online_users', Array.from(onlineUsers.keys()));
    
    // Broadcast user online status to their contacts
    socket.broadcast.emit('user_online', { userId: socket.userId.toString() });
    
    // =============== CHAT EVENTS ===============
    
    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // Send message (real-time)
    socket.on('send_message', async (messageData) => {
      try {
        const { conversationId, receiverId } = messageData;
        
        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', messageData);
        
        // Emit to receiver's personal room for notification
        io.to(receiverId.toString()).emit('message_notification', {
          ...messageData,
          senderId: socket.userId
        });
        
        console.log(`Message sent in conversation ${conversationId}`);
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });
    
    // Typing indicator
    socket.on('typing_start', ({ conversationId, receiverId }) => {
      io.to(receiverId.toString()).emit('user_typing', {
        conversationId,
        userId: socket.userId
      });
    });
    
    socket.on('typing_stop', ({ conversationId, receiverId }) => {
      io.to(receiverId.toString()).emit('user_stop_typing', {
        conversationId,
        userId: socket.userId
      });
    });
    
    // Mark messages as read
    socket.on('mark_as_read', async ({ conversationId, messageIds }) => {
      try {
        // Update messages in database
        const result = await Message.updateMany(
          { _id: { $in: messageIds }, conversationId },
          { readAt: new Date() }
        );
        
        // Only emit if messages were actually updated
        if (result.modifiedCount > 0) {
          // Notify all participants in conversation EXCEPT the reader
          socket.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            messageIds,
            readBy: socket.userId
          });
          
          // Emit to ALL devices/tabs of the reader (including this socket)
          io.to(socket.userId.toString()).emit('messages_read', {
            conversationId,
            messageIds,
            readBy: socket.userId
          });
          
          console.log(`[Socket] Marked ${result.modifiedCount} messages as read in conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Video call events
    socket.on('video_call_started', ({ conversationId, roomId, receiverId }) => {
      io.to(receiverId.toString()).emit('incoming_video_call', {
        conversationId,
        roomId,
        callerId: socket.userId
      });
    });
    
    socket.on('video_call_ended', ({ conversationId, roomId, receiverId, duration }) => {
      io.to(receiverId.toString()).emit('video_call_ended_notification', {
        conversationId,
        roomId,
        duration
      });
    });

    // Video call accept/reject/cancel events
    socket.on('video_call_accepted', ({ roomId, roomName }) => {
      console.log(`[Socket] Video call accepted for room: ${roomId}`);
      // Broadcast to room participants
      io.to(`video_room:${roomId}`).emit('call_accepted', {
        roomId,
        roomName,
        acceptedBy: socket.userId
      });
    });

    socket.on('video_call_rejected', ({ roomId, roomName }) => {
      console.log(`[Socket] Video call rejected for room: ${roomId}`);
      // Notify the caller
      io.to(`video_room:${roomId}`).emit('call_rejected', {
        roomId,
        roomName,
        rejectedBy: socket.userId
      });
    });

    socket.on('cancel_video_call', ({ roomId, receiverId }) => {
      console.log(`[Socket] Video call cancelled for room: ${roomId}`);
      if (receiverId) {
        io.to(receiverId.toString()).emit('video_call_cancelled', {
          roomId
        });
      }
    });
    
    // =============== END CHAT EVENTS ===============
    
    // Handle time slot locking
    socket.on('lock_time_slot', ({ scheduleId, timeSlotId, doctorId, date }) => {
      const slotKey = `${scheduleId}_${timeSlotId}`;
      
      // If slot is already locked by someone else, reject with 409 Conflict
      if (lockedTimeSlots.has(slotKey) && lockedTimeSlots.get(slotKey) !== socket.userId.toString()) {
        socket.emit('time_slot_lock_rejected', { 
          message: 'This time slot is currently being processed by another user'
        });
        return;
      }
      
      // Lock the time slot
      lockedTimeSlots.set(slotKey, socket.userId.toString());
      
      // Clear any existing timeout
      if (timeoutIds.has(slotKey)) {
        clearTimeout(timeoutIds.get(slotKey));
      }
      
      // Set timeout to automatically unlock after 30 seconds
      const timeoutId = setTimeout(() => {
        if (lockedTimeSlots.has(slotKey)) {
          lockedTimeSlots.delete(slotKey);
          // Notify all clients that the time slot is available again
          io.emit('time_slot_unlocked', { scheduleId, timeSlotId });
          timeoutIds.delete(slotKey);
        }
      }, 30 * 1000); // 30 seconds
      
      timeoutIds.set(slotKey, timeoutId);
      
      // Join a room specific to this doctor and date to get updates about locked slots
      const roomKey = `appointments_${doctorId}_${date}`;
      socket.join(roomKey);
      
      if (!appointmentRooms.has(socket.id)) {
        appointmentRooms.set(socket.id, []);
      }
      appointmentRooms.get(socket.id).push(roomKey);
      
      // Notify all clients viewing the same doctor schedule that the time slot is locked
      io.to(roomKey).emit('time_slot_locked', { scheduleId, timeSlotId, userId: socket.userId });
      
      // Confirm lock to the requesting client
      socket.emit('time_slot_lock_confirmed', { scheduleId, timeSlotId });
    });
    
    socket.on('unlock_time_slot', ({ scheduleId, timeSlotId, doctorId, date }) => {
      const slotKey = `${scheduleId}_${timeSlotId}`;
      
      // Only the user who locked it can unlock it
      if (lockedTimeSlots.has(slotKey) && lockedTimeSlots.get(slotKey) === socket.userId.toString()) {
        lockedTimeSlots.delete(slotKey);
        
        // Clear timeout
        if (timeoutIds.has(slotKey)) {
          clearTimeout(timeoutIds.get(slotKey));
          timeoutIds.delete(slotKey);
        }
        
        // Notify all clients that the time slot is available again
        const roomKey = `appointments_${doctorId}_${date}`;
        io.to(roomKey).emit('time_slot_unlocked', { scheduleId, timeSlotId });
      }
    });
    
    // Join appointment room to receive updates about locked slots
    socket.on('join_appointment_room', ({ doctorId, date }) => {
      const roomKey = `appointments_${doctorId}_${date}`;
      socket.join(roomKey);
      
      if (!appointmentRooms.has(socket.id)) {
        appointmentRooms.set(socket.id, []);
      }
      appointmentRooms.get(socket.id).push(roomKey);
      
      // Send current locked slots for this doctor and date
      const lockedSlots = [];
      for (const [key, userId] of lockedTimeSlots.entries()) {
        const [scheduleId, timeSlotId] = key.split('_');
        lockedSlots.push({ scheduleId, timeSlotId, userId });
      }
      
      if (lockedSlots.length > 0) {
        socket.emit('current_locked_slots', { lockedSlots });
      }
    });

    // =============== MEETING EVENTS ===============
    
    // Join meeting room to receive real-time updates
    socket.on('join_meeting_room', ({ meetingId }) => {
      const meetingRoomKey = `meeting:${meetingId}`;
      socket.join(meetingRoomKey);
      console.log(`User ${socket.userId} joined meeting room: ${meetingRoomKey}`);
    });

    // Leave meeting room
    socket.on('leave_meeting_room', ({ meetingId }) => {
      const meetingRoomKey = `meeting:${meetingId}`;
      socket.leave(meetingRoomKey);
      console.log(`User ${socket.userId} left meeting room: ${meetingRoomKey}`);
    });
    
    // =============== END MEETING EVENTS ===============
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove user from online users
      onlineUsers.delete(socket.userId.toString());
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', { userId: socket.userId.toString() });
      
      // Clean up appointment rooms
      if (appointmentRooms.has(socket.id)) {
        appointmentRooms.get(socket.id).forEach(room => {
          socket.leave(room);
        });
        appointmentRooms.delete(socket.id);
      }
      
      // Check if this user has any locked time slots and unlock them
      for (const [slotKey, userId] of lockedTimeSlots.entries()) {
        if (userId === socket.userId.toString()) {
          lockedTimeSlots.delete(slotKey);
          
          // Clear timeout
          if (timeoutIds.has(slotKey)) {
            clearTimeout(timeoutIds.get(slotKey));
            timeoutIds.delete(slotKey);
          }
          
          // Extract scheduleId and timeSlotId from the slotKey
          const [scheduleId, timeSlotId] = slotKey.split('_');
          
          // Notify all clients that the time slot is available again
          io.emit('time_slot_unlocked', { scheduleId, timeSlotId });
        }
      }
    });
  });

  return io;
};

// Broadcast time slot update when booking status changes
const broadcastTimeSlotUpdate = (scheduleId, timeSlotInfo, doctorId, date) => {
  if (!io) return;
  
  const roomKey = `appointments_${doctorId}_${date}`;
  io.to(roomKey).emit('time_slot_updated', { 
    scheduleId, 
    timeSlotInfo
  });
};

// Lock a time slot
const lockTimeSlot = (scheduleId, timeSlotId, userId) => {
  const slotKey = `${scheduleId}_${timeSlotId}`;
  
  // If slot is already locked by someone else, return false
  if (lockedTimeSlots.has(slotKey) && lockedTimeSlots.get(slotKey) !== userId) {
    return false;
  }
  
  // Lock the time slot
  lockedTimeSlots.set(slotKey, userId);
  
  // Clear any existing timeout
  if (timeoutIds.has(slotKey)) {
    clearTimeout(timeoutIds.get(slotKey));
  }
  
  // Set timeout to automatically unlock after 30 seconds
  const timeoutId = setTimeout(() => {
    if (lockedTimeSlots.has(slotKey)) {
      lockedTimeSlots.delete(slotKey);
      timeoutIds.delete(slotKey);
    }
  }, 30 * 1000); // 30 seconds
  
  timeoutIds.set(slotKey, timeoutId);
  
  return true;
};

// Unlock a time slot
const unlockTimeSlot = (scheduleId, timeSlotId, userId) => {
  const slotKey = `${scheduleId}_${timeSlotId}`;
  
  // Only the user who locked it can unlock it
  if (lockedTimeSlots.has(slotKey) && lockedTimeSlots.get(slotKey) === userId) {
    lockedTimeSlots.delete(slotKey);
    
    // Clear timeout
    if (timeoutIds.has(slotKey)) {
      clearTimeout(timeoutIds.get(slotKey));
      timeoutIds.delete(slotKey);
    }
    
    return true;
  }
  
  return false;
};

// Check if a time slot is locked
const isTimeSlotLocked = (scheduleId, timeSlotId) => {
  const slotKey = `${scheduleId}_${timeSlotId}`;
  return lockedTimeSlots.has(slotKey);
};

// Get the user who locked a time slot
const getTimeSlotLocker = (scheduleId, timeSlotId) => {
  const slotKey = `${scheduleId}_${timeSlotId}`;
  return lockedTimeSlots.get(slotKey);
};

// Check if user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

// Get online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initializeSocket,
  broadcastTimeSlotUpdate,
  lockTimeSlot,
  unlockTimeSlot,
  isTimeSlotLocked,
  getTimeSlotLocker,
  isUserOnline,
  getOnlineUsers
}; 
