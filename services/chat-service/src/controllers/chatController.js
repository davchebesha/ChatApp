const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const { publishEvent } = require('../utils/rabbitmq');

const logger = pino();

// Chat Schema
const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return this.type === 'group'; }
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() { return this.type === 'text'; }
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    required: function() { return ['image', 'file', 'voice', 'video'].includes(this.type); }
  },
  fileName: {
    type: String,
    required: function() { return ['file', 'voice', 'video'].includes(this.type); }
  },
  fileSize: {
    type: Number,
    required: function() { return ['image', 'file', 'voice', 'video'].includes(this.type); }
  },
  duration: {
    type: Number,
    required: function() { return ['voice', 'video'].includes(this.type); }
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

// Controllers
const getChats = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'username avatar status lastSeen')
    .populate('lastMessage')
    .populate('createdBy', 'username')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Chat.countDocuments({ participants: userId });

    res.json({
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching chats:', error);
    res.status(500).json({
      error: 'Failed to fetch chats',
      message: error.message
    });
  }
};

const createChat = async (req, res) => {
  try {
    const { name, type, participants } = req.body;
    const createdBy = req.userId;

    // Validate input
    if (!type || !['private', 'group'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid chat type'
      });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        error: 'Participants are required'
      });
    }

    if (type === 'group' && !name) {
      return res.status(400).json({
        error: 'Group name is required'
      });
    }

    // Add creator to participants if not already included
    const allParticipants = [...new Set([createdBy, ...participants])];

    // For private chats, ensure only 2 participants
    if (type === 'private' && allParticipants.length !== 2) {
      return res.status(400).json({
        error: 'Private chat must have exactly 2 participants'
      });
    }

    // Check if private chat already exists
    if (type === 'private') {
      const existingChat = await Chat.findOne({
        type: 'private',
        participants: { $all: allParticipants, $size: 2 }
      });

      if (existingChat) {
        return res.status(409).json({
          error: 'Private chat already exists',
          chat: existingChat
        });
      }
    }

    // Create chat
    const chat = new Chat({
      name,
      type,
      participants: allParticipants,
      createdBy
    });

    await chat.save();
    await chat.populate('participants', 'username avatar status');

    // Publish chat created event
    await publishEvent('chat.created', {
      chatId: chat._id.toString(),
      name: chat.name,
      type: chat.type,
      participants: allParticipants,
      createdBy,
      timestamp: new Date().toISOString()
    });

    logger.info(`Chat created: ${chat._id} by user ${createdBy}`);

    res.status(201).json({
      message: 'Chat created successfully',
      chat
    });
  } catch (error) {
    logger.error('Error creating chat:', error);
    res.status(500).json({
      error: 'Failed to create chat',
      message: error.message
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found or access denied'
      });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'username avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ chatId });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: error.message
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', replyTo = null } = req.body;
    const senderId = req.userId;

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: senderId
    });

    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found or access denied'
      });
    }

    // Validate content based on type
    if (type === 'text' && (!content || content.trim().length === 0)) {
      return res.status(400).json({
        error: 'Message content is required'
      });
    }

    // Create message
    const message = new Message({
      chatId,
      senderId,
      content: content?.trim(),
      type,
      replyTo
    });

    await message.save();
    await message.populate('senderId', 'username avatar');

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    // Publish message sent event
    await publishEvent('message.sent', {
      messageId: message._id.toString(),
      chatId,
      senderId,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt.toISOString()
    });

    logger.info(`Message sent in chat ${chatId} by user ${senderId}`);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Message content is required'
      });
    }

    // Find message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message not found or access denied'
      });
    }

    // Update message
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    // Publish message edited event
    await publishEvent('message.edited', {
      messageId: message._id.toString(),
      chatId: message.chatId.toString(),
      newContent: message.content,
      editedBy: userId,
      editedAt: message.editedAt.toISOString()
    });

    logger.info(`Message ${messageId} edited by user ${userId}`);

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error editing message:', error);
    res.status(500).json({
      error: 'Failed to edit message',
      message: error.message
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    // Find message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message not found or access denied'
      });
    }

    await Message.deleteOne({ _id: messageId });

    // Publish message deleted event
    await publishEvent('message.deleted', {
      messageId: message._id.toString(),
      chatId: message.chatId.toString(),
      deletedBy: userId,
      timestamp: new Date().toISOString()
    });

    logger.info(`Message ${messageId} deleted by user ${userId}`);

    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({
      error: 'Failed to delete message',
      message: error.message
    });
  }
};

// WebRTC Signaling Controllers
const handleWebRTCOffer = async (req, res) => {
  try {
    const { targetUserId, offer, callType = 'video' } = req.body;
    const callerId = req.userId;

    const callData = {
      callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callerId,
      targetUserId,
      offer,
      callType,
      timestamp: new Date().toISOString()
    };

    // Publish call started event
    await publishEvent('call.started', callData);

    res.json({
      message: 'WebRTC offer processed',
      callId: callData.callId
    });
  } catch (error) {
    logger.error('Error handling WebRTC offer:', error);
    res.status(500).json({
      error: 'Failed to process WebRTC offer',
      message: error.message
    });
  }
};

const handleWebRTCAnswer = async (req, res) => {
  try {
    const { callId, callerId, answer } = req.body;
    const answeredBy = req.userId;

    // Publish call answered event
    await publishEvent('call.answered', {
      callId,
      callerId,
      answeredBy,
      answer,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'WebRTC answer processed'
    });
  } catch (error) {
    logger.error('Error handling WebRTC answer:', error);
    res.status(500).json({
      error: 'Failed to process WebRTC answer',
      message: error.message
    });
  }
};

const handleICECandidate = async (req, res) => {
  try {
    const { targetUserId, candidate } = req.body;
    const fromUserId = req.userId;

    // Publish ICE candidate event
    await publishEvent('webrtc.ice_candidate', {
      fromUserId,
      targetUserId,
      candidate,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'ICE candidate processed'
    });
  } catch (error) {
    logger.error('Error handling ICE candidate:', error);
    res.status(500).json({
      error: 'Failed to process ICE candidate',
      message: error.message
    });
  }
};

// Apply auth middleware to all routes
module.exports = {
  getChats: [verifyToken, getChats],
  createChat: [verifyToken, createChat],
  getMessages: [verifyToken, getMessages],
  sendMessage: [verifyToken, sendMessage],
  editMessage: [verifyToken, editMessage],
  deleteMessage: [verifyToken, deleteMessage],
  handleWebRTCOffer: [verifyToken, handleWebRTCOffer],
  handleWebRTCAnswer: [verifyToken, handleWebRTCAnswer],
  handleICECandidate: [verifyToken, handleICECandidate]
};