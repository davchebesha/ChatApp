  const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const pino = require('pino');
const { publishEvent, subscribeToEvents } = require('./utils/rabbitmq');

const logger = pino();

// Store active connections and rooms
const activeConnections = new Map();
const userSockets = new Map();

const initializeSocket = async (io, redisClient) => {
  try {
    // Create Redis adapter for scaling across multiple instances
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    
    await pubClient.connect();
    await subClient.connect();
    
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured');

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.authenticated = true;
        
        logger.info(`Socket authenticated for user: ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    io.on('connection', async (socket) => {
      const userId = socket.userId;
      logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

      // Store user socket mapping
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      activeConnections.set(socket.id, { userId, connectedAt: new Date() });

      // Join user to their personal room
      await socket.join(`user:${userId}`);

      // Publish user online event
      await publishEvent('user.status.changed', {
        userId,
        status: 'online',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Handle joining chat rooms
      socket.on('join_chat', async (chatId) => {
        try {
          await socket.join(`chat:${chatId}`);
          logger.info(`User ${userId} joined chat: ${chatId}`);
          
          // Notify others in the chat
          socket.to(`chat:${chatId}`).emit('user_joined_chat', {
            userId,
            chatId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error('Error joining chat:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle leaving chat rooms
      socket.on('leave_chat', async (chatId) => {
        try {
          await socket.leave(`chat:${chatId}`);
          logger.info(`User ${userId} left chat: ${chatId}`);
          
          // Notify others in the chat
          socket.to(`chat:${chatId}`).emit('user_left_chat', {
            userId,
            chatId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error('Error leaving chat:', error);
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content, type = 'text', replyTo = null } = data;
          
          const messageData = {
            chatId,
            senderId: userId,
            content,
            type,
            replyTo,
            timestamp: new Date().toISOString(),
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };

          // Broadcast to chat room
          io.to(`chat:${chatId}`).emit('new_message', messageData);

          // Publish message event
          await publishEvent('message.sent', messageData);

          logger.info(`Message sent in chat ${chatId} by user ${userId}`);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle message editing
      socket.on('edit_message', async (data) => {
        try {
          const { messageId, newContent, chatId } = data;
          
          const editData = {
            messageId,
            newContent,
            chatId,
            editedBy: userId,
            editedAt: new Date().toISOString()
          };

          // Broadcast to chat room
          io.to(`chat:${chatId}`).emit('message_edited', editData);

          // Publish message edited event
          await publishEvent('message.edited', editData);

          logger.info(`Message ${messageId} edited by user ${userId}`);
        } catch (error) {
          logger.error('Error editing message:', error);
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('user_typing', {
          userId,
          chatId,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data) => {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit('user_typing', {
          userId,
          chatId,
          isTyping: false
        });
      });

      // WebRTC Signaling
      socket.on('webrtc_offer', async (data) => {
        try {
          const { targetUserId, offer, callType = 'video' } = data;
          
          const callData = {
            callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            callerId: userId,
            targetUserId,
            offer,
            callType,
            timestamp: new Date().toISOString()
          };

          // Send offer to target user
          io.to(`user:${targetUserId}`).emit('webrtc_offer', callData);

          // Publish call started event
          await publishEvent('call.started', callData);

          logger.info(`WebRTC offer sent from ${userId} to ${targetUserId}`);
        } catch (error) {
          logger.error('Error handling WebRTC offer:', error);
          socket.emit('error', { message: 'Failed to send call offer' });
        }
      });

      socket.on('webrtc_answer', async (data) => {
        try {
          const { callId, callerId, answer } = data;
          
          // Send answer to caller
          io.to(`user:${callerId}`).emit('webrtc_answer', {
            callId,
            answer,
            answeredBy: userId,
            timestamp: new Date().toISOString()
          });

          logger.info(`WebRTC answer sent from ${userId} to ${callerId}`);
        } catch (error) {
          logger.error('Error handling WebRTC answer:', error);
          socket.emit('error', { message: 'Failed to send call answer' });
        }
      });

      socket.on('webrtc_ice_candidate', (data) => {
        try {
          const { targetUserId, candidate } = data;
          
          // Forward ICE candidate to target user
          io.to(`user:${targetUserId}`).emit('webrtc_ice_candidate', {
            candidate,
            fromUserId: userId
          });
        } catch (error) {
          logger.error('Error handling ICE candidate:', error);
        }
      });

      socket.on('webrtc_call_end', async (data) => {
        try {
          const { callId, targetUserId, reason = 'ended' } = data;
          
          const callEndData = {
            callId,
            endedBy: userId,
            targetUserId,
            reason,
            timestamp: new Date().toISOString()
          };

          // Notify target user
          io.to(`user:${targetUserId}`).emit('end', callEndData);

          // Publish call ended event
          await publishEvent('call.ended', callEndData);

          logger.info(`Call ${callId} ended by ${userId}`);
        } catch (error) {
          logger.error('Error handling call end:', error);
        }
      });

      // Handle file sharing
      socket.on('file_shared', async (data) => {
        try {
          const { chatId, fileData } = data;
          
          const shareData = {
            chatId,
            sharedBy: userId,
            fileData,
            timestamp: new Date().toISOString()
          };

          // Broadcast to chat room
          io.to(`chat:${chatId}`).emit('file_shared', shareData);

          // Publish file uploaded event
          await publishEvent('file.uploaded', shareData);

          logger.info(`File shared in chat ${chatId} by user ${userId}`);
        } catch (error) {
          logger.error('Error sharing file:', error);
          socket.emit('error', { message: 'Failed to share file' });
        }
      });

      // Handle voice messages
      socket.on('voice_message', async (data) => {
        try {
          const { chatId, audioData, duration } = data;
          
          const voiceData = {
            chatId,
            senderId: userId,
            audioData,
            duration,
            type: 'voice',
            timestamp: new Date().toISOString(),
            messageId: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };

          // Broadcast to chat room
          io.to(`chat:${chatId}`).emit('new_message', voiceData);

          // Publish message event
          await publishEvent('message.sent', voiceData);

          logger.info(`Voice message sent in chat ${chatId} by user ${userId}`);
        } catch (error) {
          logger.error('Error sending voice message:', error);
          socket.emit('error', { message: 'Failed to send voice message' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        logger.info(`User disconnected: ${userId} (Socket: ${socket.id}) - Reason: ${reason}`);

        // Remove from active connections
        activeConnections.delete(socket.id);
        
        // Remove from user sockets
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);
          
          // If no more sockets for this user, mark as offline
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
            
            // Publish user offline event
            await publishEvent('user.status.changed', {
              userId,
              status: 'offline',
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${userId}:`, error);
      });
    });

    // Subscribe to external events
    await subscribeToEvents('message.*', async (message) => {
      try {
        const { eventType, data } = message;
        
        switch (eventType) {
          case 'message.sent':
            // Handle cross-service message broadcasting
            if (data.chatId) {
              io.to(`chat:${data.chatId}`).emit('new_message', data);
            }
            break;
          case 'message.edited':
            if (data.chatId) {
              io.to(`chat:${data.chatId}`).emit('message_edited', data);
            }
            break;
        }
      } catch (error) {
        logger.error('Error handling external event:', error);
      }
    });

    await subscribeToEvents('user.status.*', async (message) => {
      try {
        const { eventType, data } = message;
        
        if (eventType === 'user.status.changed') {
          // Broadcast status change to all connected clients
          io.emit('user_status_changed', {
            userId: data.userId,
            status: data.status,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        logger.error('Error handling user status event:', error);
      }
    });

    // Utility functions for external use
    io.sendToUser = (userId, event, data) => {
      io.to(`user:${userId}`).emit(event, data);
    };

    io.sendToChat = (chatId, event, data) => {
      io.to(`chat:${chatId}`).emit(event, data);
    };

    io.getActiveConnections = () => {
      return {
        total: activeConnections.size,
        users: userSockets.size,
        connections: Array.from(activeConnections.entries()).map(([socketId, data]) => ({
          socketId,
          userId: data.userId,
          connectedAt: data.connectedAt
        }))
      };
    };

    logger.info('Socket.IO handlers initialized successfully');
    return io;

  } catch (error) {
    logger.error('Failed to initialize Socket.IO:', error);
    throw error;
  }
};

module.exports = {
  initializeSocket
};