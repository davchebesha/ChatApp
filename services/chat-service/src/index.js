const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
require('dotenv').config();

const { initializeSocket } = require('./socket');
const { connectRedis } = require('./utils/redis');
const { connectRabbitMQ } = require('./utils/rabbitmq');
const chatController = require('./controllers/chatController');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for chat service
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chat-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    instance: process.env.HOSTNAME || 'unknown'
  });
});

// Chat routes
app.get('/api/chats', chatController.getChats);
app.post('/api/chats', chatController.createChat);
app.get('/api/chats/:chatId/messages', chatController.getMessages);
app.post('/api/chats/:chatId/messages', chatController.sendMessage);
app.put('/api/messages/:messageId', chatController.editMessage);
app.delete('/api/messages/:messageId', chatController.deleteMessage);

// WebRTC signaling routes
app.post('/api/webrtc/offer', chatController.handleWebRTCOffer);
app.post('/api/webrtc/answer', chatController.handleWebRTCAnswer);
app.post('/api/webrtc/ice-candidate', chatController.handleICECandidate);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    const redisClient = await connectRedis();
    logger.info('Connected to Redis');

    // Connect to RabbitMQ
    await connectRabbitMQ();
    logger.info('Connected to RabbitMQ');

    // Initialize Socket.IO with Redis adapter
    const io = socketIo(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Initialize socket handlers
    await initializeSocket(io, redisClient);
    logger.info('Socket.IO initialized with Redis adapter');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Chat service running on port ${PORT}`);
      logger.info(`Instance ID: ${process.env.HOSTNAME || 'unknown'}`);
    });
  } catch (error) {
    logger.error('Failed to start chat service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = { app, server };