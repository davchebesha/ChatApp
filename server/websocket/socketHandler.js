const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// Store active users
const activeUsers = new Map();

const initializeWebSocket = (io, messageQueue = null) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Setup distributed message queue listeners if available
  if (messageQueue) {
    messageQueue.on('new_message', (data) => {
      io.to(data.chatId).emit('new_message', data.message);
    });

    messageQueue.on('user_typing', (data) => {
      io.to(data.chatId).emit('user_typing', data);
    });

    messageQueue.on('user_status_change', (data) => {
      io.emit('user_status', data);
    });

    messageQueue.on('webrtc_signal', (data) => {
      const targetSocket = activeUsers.get(data.targetUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('webrtc_signal', data.signal);
      }
    });
  }

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (Server: ${process.env.SERVER_ID || 'unknown'})`);
    
    // Add user to active users
    activeUsers.set(socket.userId, socket.id);
    
    // Update user status to online
    User.findByIdAndUpdate(socket.userId, { 
      status: 'online',
      lastSeen: new Date()
    }).exec();

    // Broadcast user online status across all servers
    const statusData = {
      userId: socket.userId,
      status: 'online'
    };
    
    if (messageQueue) {
      messageQueue.publishMessage('user:status', statusData);
    } else {
      socket.broadcast.emit('user_status', statusData);
    }

    // Join user's chat rooms
    socket.on('join_chats', async (chatIds) => {
      chatIds.forEach(chatId => {
        socket.join(chatId);
      });
      console.log(`User ${socket.userId} joined ${chatIds.length} chats`);
    });

    // Join specific chat
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Leave chat
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type, replyTo } = data;
        
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
          type: type || 'text',
          replyTo
        });

        await message.populate('sender', 'username avatar');
        
        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date()
        });

        // Emit to all users in the chat across all servers
        if (messageQueue) {
          messageQueue.publishMessage('chat:messages', {
            chatId,
            message
          });
        } else {
          io.to(chatId).emit('new_message', message);
        }

        // Send notifications to offline users
        const chat = await Chat.findById(chatId);
        const offlineParticipants = chat.participants.filter(
          p => p.toString() !== socket.userId && !activeUsers.has(p.toString())
        );

        offlineParticipants.forEach(async (userId) => {
          await Notification.create({
            recipient: userId,
            sender: socket.userId,
            type: 'message',
            title: 'New Message',
            body: content,
            data: { chatId, messageId: message._id }
          });
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      const typingData = {
        userId: socket.userId,
        username: socket.user.username,
        chatId,
        isTyping
      };

      if (messageQueue) {
        messageQueue.publishMessage('chat:typing', typingData);
      } else {
        socket.to(chatId).emit('user_typing', typingData);
      }
    });

    // Mark message as read
    socket.on('read_message', async (data) => {
      try {
        const { messageId, chatId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          const alreadyRead = message.readBy.some(
            r => r.user.toString() === socket.userId
          );

          if (!alreadyRead) {
            message.readBy.push({
              user: socket.userId,
              readAt: new Date()
            });
            await message.save();

            // Notify sender
            io.to(chatId).emit('message_read', {
              messageId,
              userId: socket.userId,
              readAt: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Read message error:', error);
      }
    });

    // Edit message
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content, chatId } = data;
        
        const message = await Message.findById(messageId);
        if (message && message.sender.toString() === socket.userId) {
          message.content = content;
          message.edited = true;
          message.editedAt = new Date();
          await message.save();

          io.to(chatId).emit('message_edited', message);
        }
      } catch (error) {
        console.error('Edit message error:', error);
      }
    });

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, chatId, deleteForEveryone } = data;
        
        const message = await Message.findById(messageId);
        if (message && message.sender.toString() === socket.userId) {
          if (deleteForEveryone) {
            message.deleted = true;
            message.deletedAt = new Date();
            message.content = 'This message was deleted';
            await message.save();

            io.to(chatId).emit('message_deleted', {
              messageId,
              deleteForEveryone: true
            });
          } else {
            message.deletedFor.push(socket.userId);
            await message.save();

            socket.emit('message_deleted', {
              messageId,
              deleteForEveryone: false
            });
          }
        }
      } catch (error) {
        console.error('Delete message error:', error);
      }
    });

    // Add reaction
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji, chatId } = data;
        
        const message = await Message.findById(messageId);
        if (message) {
          const existingReaction = message.reactions.find(
            r => r.user.toString() === socket.userId
          );

          if (existingReaction) {
            existingReaction.emoji = emoji;
          } else {
            message.reactions.push({ user: socket.userId, emoji });
          }

          await message.save();

          io.to(chatId).emit('reaction_added', {
            messageId,
            userId: socket.userId,
            emoji
          });
        }
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // User status change
    socket.on('change_status', async (status) => {
      try {
        await User.findByIdAndUpdate(socket.userId, { status });
        const statusData = {
          userId: socket.userId,
          status
        };

        if (messageQueue) {
          messageQueue.publishMessage('user:status', statusData);
        } else {
          socket.broadcast.emit('user_status', statusData);
        }
      } catch (error) {
        console.error('Change status error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userId} (Server: ${process.env.SERVER_ID || 'unknown'})`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Broadcast user offline status across all servers
      const statusData = {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      };

      if (messageQueue) {
        messageQueue.publishMessage('user:status', statusData);
      } else {
        socket.broadcast.emit('user_status', statusData);
      }
    });
  });

  return io;
};

module.exports = { initializeWebSocket, activeUsers };
