const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

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
    
    // User joins their personal room for targeted notifications
    socket.join(socket.userId.toString());
    
    // Join role-based rooms for broadcasts to specific user types
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(userId.toString()).emit('notification', notification);
  }
};

// Send notification to multiple users
const sendNotificationToUsers = (userIds, notification) => {
  if (io && userIds && userIds.length > 0) {
    userIds.forEach(userId => {
      if (userId) {
        io.to(userId.toString()).emit('notification', notification);
      }
    });
  }
};

// Send notification to all users with a specific role
const sendNotificationToRole = (role, notification) => {
  if (io) {
    io.to(`role:${role}`).emit('notification', notification);
  }
};

// Broadcast notification to all connected users
const broadcastNotification = (notification) => {
  if (io) {
    io.emit('notification', notification);
  }
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole,
  broadcastNotification
}; 