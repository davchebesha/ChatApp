const { activeUsers } = require('../websocket/socketHandler');

// Store active calls
const activeCalls = new Map();

const initializeWebRTC = (io) => {
  io.on('connection', (socket) => {
    
    // Initiate call
    socket.on('call_user', (data) => {
      const { to, from, offer, callType } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        const callId = `${from}-${to}-${Date.now()}`;
        
        activeCalls.set(callId, {
          caller: from,
          recipient: to,
          callType,
          startTime: new Date()
        });

        io.to(recipientSocketId).emit('incoming_call', {
          callId,
          from,
          offer,
          callType
        });

        console.log(`📞 Call initiated: ${from} -> ${to} (${callType})`);
      } else {
        socket.emit('call_failed', {
          message: 'User is offline'
        });
      }
    });

    // Accept call
    socket.on('accept_call', (data) => {
      const { callId, answer, to } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_accepted', {
          callId,
          answer,
          from: socket.userId
        });

        console.log(`✅ Call accepted: ${callId}`);
      }
    });

    // Reject call
    socket.on('reject_call', (data) => {
      const { callId, to } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_rejected', {
          callId,
          from: socket.userId
        });
      }

      activeCalls.delete(callId);
      console.log(`❌ Call rejected: ${callId}`);
    });

    // ICE candidate exchange
    socket.on('ice_candidate', (data) => {
      const { to, candidate } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('ice_candidate', {
          from: socket.userId,
          candidate
        });
      }
    });

    // WebRTC offer
    socket.on('offer', (data) => {
      const { to, offer } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('offer', {
          from: socket.userId,
          offer
        });
      }
    });

    // WebRTC answer
    socket.on('answer', (data) => {
      const { to, answer } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('answer', {
          from: socket.userId,
          answer
        });
      }
    });

    // End call
    socket.on('end_call', (data) => {
      const { callId, to } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_ended', {
          callId,
          from: socket.userId
        });
      }

      const call = activeCalls.get(callId);
      if (call) {
        const duration = (new Date() - call.startTime) / 1000;
        console.log(`📞 Call ended: ${callId} (Duration: ${duration}s)`);
        activeCalls.delete(callId);
      }
    });

    // Toggle audio
    socket.on('toggle_audio', (data) => {
      const { to, enabled } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('peer_audio_toggle', {
          from: socket.userId,
          enabled
        });
      }
    });

    // Toggle video
    socket.on('toggle_video', (data) => {
      const { to, enabled } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('peer_video_toggle', {
          from: socket.userId,
          enabled
        });
      }
    });

    // Screen share
    socket.on('start_screen_share', (data) => {
      const { to } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('peer_screen_share_started', {
          from: socket.userId
        });
      }
    });

    socket.on('stop_screen_share', (data) => {
      const { to } = data;
      
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('peer_screen_share_stopped', {
          from: socket.userId
        });
      }
    });

    // Group call support
    socket.on('join_group_call', (data) => {
      const { roomId, offer } = data;
      
      socket.join(`call-${roomId}`);
      
      // Notify others in the room
      socket.to(`call-${roomId}`).emit('user_joined_call', {
        userId: socket.userId,
        offer
      });

      console.log(`👥 User ${socket.userId} joined group call ${roomId}`);
    });

    socket.on('leave_group_call', (data) => {
      const { roomId } = data;
      
      socket.leave(`call-${roomId}`);
      
      // Notify others in the room
      socket.to(`call-${roomId}`).emit('user_left_call', {
        userId: socket.userId
      });

      console.log(`👥 User ${socket.userId} left group call ${roomId}`);
    });
  });

  return io;
};

module.exports = { initializeWebRTC, activeCalls };
