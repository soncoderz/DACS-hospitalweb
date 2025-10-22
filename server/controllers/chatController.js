const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all conversations for the current user
 * @route   GET /api/chat/conversations
 * @access  Private (User, Doctor, Admin)
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate({
      path: 'participants',
      select: 'fullName profileImage roleType email'
    })
    .sort({ 'lastMessage.timestamp': -1 });

    // Format the response for the client
    const formattedConversations = conversations.map(conv => {
      // Filter out the current user from participants
      const otherParticipants = conv.participants.filter(
        participant => participant._id.toString() !== userId
      );

      return {
        id: conv._id,
        participants: otherParticipants,
        lastMessage: conv.lastMessage,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        appointmentId: conv.appointmentId
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cuộc trò chuyện',
      error: error.message
    });
  }
};

/**
 * @desc    Get messages for a specific conversation
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @access  Private (User, Doctor, Admin)
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập'
      });
    }

    // Get messages, newest first, excluding deleted ones
    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate({
        path: 'senderId',
        select: 'fullName profileImage roleType'
      });

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readAt: null
      },
      {
        readAt: new Date()
      }
    );

    // Reset unread count for current user
    if (conversation.unreadCount && conversation.unreadCount.has(userId.toString())) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      data: messages.reverse() // Send in chronological order
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tin nhắn',
      error: error.message
    });
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/chat/conversations/:conversationId/messages
 * @access  Private (User, Doctor, Admin)
 */
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array() 
      });
    }

    const { conversationId } = req.params;
    const { content, attachments, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập'
      });
    }

    // Get receiver ID (the other participant)
    const receiverId = conversation.participants.find(
      p => p.toString() !== senderId.toString()
    );

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      content,
      conversationId,
      messageType,
      attachments: attachments || []
    });

    await message.save();

    // Update conversation with last message and increment unread count for receiver
    conversation.lastMessage = {
      content,
      senderId,
      timestamp: new Date()
    };
    
    // Update last activity timestamp
    conversation.lastActivity = new Date();
    
    // Initialize unreadCount map if it doesn't exist
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }
    
    // Increment unread count for the receiver
    const receiverUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), receiverUnreadCount + 1);
    
    await conversation.save();

    // Populate sender info
    await message.populate({
      path: 'senderId',
      select: 'fullName profileImage roleType'
    });

    return res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi tin nhắn',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new conversation
 * @route   POST /api/chat/conversations
 * @access  Private (User, Doctor, Admin)
 */
exports.createConversation = async (req, res) => {
  try {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array() 
      });
    }

    const { participantId, initialMessage, appointmentId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.roleType || 'user';

    // Check if essential fields are provided
    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'ID người tham gia không được để trống'
      });
    }

    // Find participant user
    let participant = await User.findById(participantId);
    
    // If not found directly as user, check if it's a doctor ID
    if (!participant) {
      const doctor = await Doctor.findById(participantId);
      if (doctor && doctor.userId) {
        participant = await User.findById(doctor.userId);
      }
    }
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với ID đã cung cấp'
      });
    }
    
    const resolvedParticipantId = participant._id.toString();

    // Check if conversation already exists between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, resolvedParticipantId] },
      isActive: true
    });

    // If conversation exists, return it
    if (conversation) {
      await conversation.populate({
        path: 'participants',
        select: 'fullName profileImage roleType email'
      });
      
      return res.status(200).json({
        success: true,
        message: 'Cuộc trò chuyện đã tồn tại',
        data: conversation,
        exists: true
      });
    }

    // Check business rules based on role
    if (userRole !== 'admin') {
      // For patients trying to chat with doctors
      if (userRole === 'user' && participant.roleType === 'doctor') {
        const doctor = await Doctor.findOne({ user: resolvedParticipantId });
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy thông tin bác sĩ'
          });
        }

        const appointment = await Appointment.findOne({
          patientId: userId,
          doctorId: doctor._id,
          status: { $in: ['pending', 'confirmed', 'completed'] }
        });

        if (!appointment) {
          return res.status(403).json({
            success: false,
            message: 'Bạn cần đặt lịch khám với bác sĩ trước khi tạo cuộc trò chuyện'
          });
        }
      } 
      // For doctors trying to chat with patients
      else if (userRole === 'doctor' && participant.roleType === 'user') {
        const doctor = await Doctor.findOne({ user });
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy thông tin bác sĩ của bạn'
          });
        }

        const appointment = await Appointment.findOne({
          patientId: resolvedParticipantId,
          doctorId: doctor._id,
          status: { $in: ['pending', 'confirmed', 'completed'] }
        });

        if (!appointment) {
          return res.status(403).json({
            success: false,
            message: 'Bệnh nhân này chưa đặt lịch khám với bạn'
          });
        }
      }
      // Prevent other role combinations
      else if (
        !(userRole === 'user' && participant.roleType === 'doctor') && 
        !(userRole === 'doctor' && participant.roleType === 'user')
      ) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ cho phép trò chuyện giữa bác sĩ và bệnh nhân'
        });
      }
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [userId, resolvedParticipantId],
      appointmentId: appointmentId || null
    });

    await conversation.save();

    // If initial message is provided, create it
    if (initialMessage && initialMessage.trim()) {
      const message = new Message({
        senderId: userId,
        receiverId: resolvedParticipantId,
        content: initialMessage,
        conversationId: conversation._id
      });

      await message.save();

      // Update conversation with last message
      conversation.lastMessage = {
        content: initialMessage,
        senderId: userId,
        timestamp: new Date()
      };
      
      await conversation.save();
    }

    // Populate participants info
    await conversation.populate({
      path: 'participants',
      select: 'fullName profileImage roleType email'
    });

    return res.status(201).json({
      success: true,
      message: 'Cuộc trò chuyện được tạo thành công',
      data: conversation,
      exists: false
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo cuộc trò chuyện',
      error: error.message
    });
  }
};

/**
 * @desc    Delete/Archive a conversation
 * @route   DELETE /api/chat/conversations/:conversationId
 * @access  Private (User, Doctor, Admin)
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập'
      });
    }

    // Soft delete the conversation
    conversation.isActive = false;
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: 'Cuộc trò chuyện đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa cuộc trò chuyện',
      error: error.message
    });
  }
};

/**
 * @desc    Get count of unread messages
 * @route   GET /api/chat/unread-count
 * @access  Private (User, Doctor, Admin)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all conversations the user is part of
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    });
    
    const conversationIds = conversations.map(conv => conv._id);
    
    // Count unread messages in all conversations
    const unreadCount = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      readAt: null
    });
    
    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy số tin nhắn chưa đọc',
      error: error.message
    });
  }
};

/**
 * @desc    Get available doctors for chat (for patients)
 * @route   GET /api/chat/available-doctors
 * @access  Private (User)
 */
exports.getAvailableDoctors = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all doctors the user has appointments with
    const appointments = await Appointment.find({
      patientId: userId,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    })
    .populate({
      path: 'doctorId',
      populate: {
        path: 'user',
        select: 'fullName profileImage email'
      }
    })
    .populate('doctorId.specialtyId');
    
    // Extract unique doctors from appointments
    const doctorMap = {};
    appointments.forEach(appointment => {
      if (appointment.doctorId && appointment.doctorId.userId) {
        const doctor = appointment.doctorId;
        const userId = doctor.userId._id;
        
        if (!doctorMap[userId]) {
          doctorMap[userId] = {
            id: userId,
            doctorId: doctor._id,
            fullName: doctor.userId.fullName,
            profileImage: doctor.userId.profileImage,
            email: doctor.userId.email,
            specialty: doctor.specialtyId ? doctor.specialtyId.name : 'Chuyên khoa chung'
          };
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: Object.values(doctorMap)
    });
  } catch (error) {
    console.error('Error getting available doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ có thể trò chuyện',
      error: error.message
    });
  }
};

/**
 * @desc    Get available patients for chat (for doctors)
 * @route   GET /api/chat/available-patients
 * @access  Private (Doctor)
 */
exports.getAvailablePatients = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Find doctor
    const doctor = await Doctor.findOne({ user: doctorId });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Get all patients the doctor has appointments with
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    })
    .populate({
      path: 'patientId',
      select: 'fullName profileImage email phoneNumber'
    });
    
    // Map to unique patients with latest appointment first
    const patientMap = {};
    appointments.forEach(appointment => {
      const patient = appointment.patientId;
      if (patient && !patientMap[patient._id]) {
        patientMap[patient._id] = {
          id: patient._id,
          fullName: patient.fullName,
          profileImage: patient.profileImage,
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          latestAppointment: {
            id: appointment._id,
            date: appointment.appointmentDate,
            status: appointment.status
          }
        };
      }
    });
    
    return res.status(200).json({
      success: true,
      data: Object.values(patientMap)
    });
  } catch (error) {
    console.error('Error getting available patients:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bệnh nhân có thể trò chuyện',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/chat/messages/:messageId
 * @access  Private (User, Doctor, Admin)
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn'
      });
    }
    
    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa tin nhắn này'
      });
    }
    
    // Soft delete the message
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'Tin nhắn đã bị xóa';
    await message.save();
    
    // Check if it's the last message in the conversation and update if needed
    const conversation = await Conversation.findById(message.conversationId);
    if (
      conversation && 
      conversation.lastMessage && 
      conversation.lastMessage.content === message.content
    ) {
      // Find the previous message that isn't deleted
      const previousMessage = await Message.findOne({
        conversationId: message.conversationId,
        isDeleted: false,
        _id: { $ne: messageId }
      }).sort({ createdAt: -1 });
      
      if (previousMessage) {
        conversation.lastMessage = {
          content: previousMessage.content,
          senderId: previousMessage.senderId,
          timestamp: previousMessage.createdAt
        };
      } else {
        // If no previous messages, set a generic lastMessage
        conversation.lastMessage = {
          content: 'Không có tin nhắn',
          senderId: null,
          timestamp: new Date()
        };
      }
      
      await conversation.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tin nhắn đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tin nhắn',
      error: error.message
    });
  }
}; 