const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
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

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // User joins their personal room for targeted messages
    socket.join(socket.userId.toString());
    
    // Join role-based rooms for broadcasts to specific user types
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }
    
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
        if (key.startsWith(`${doctorId}_`)) {
          const [scheduleId, timeSlotId] = key.split('_');
          lockedSlots.push({ scheduleId, timeSlotId, userId });
        }
      }
      
      if (lockedSlots.length > 0) {
        socket.emit('current_locked_slots', { lockedSlots });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
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

module.exports = {
  initializeSocket,
  broadcastTimeSlotUpdate,
  lockTimeSlot,
  unlockTimeSlot,
  isTimeSlotLocked,
  getTimeSlotLocker
}; 