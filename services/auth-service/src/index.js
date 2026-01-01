const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
require('dotenv').config();

const authController = require('./controllers/authController');
const { connectRedis } = require('./utils/redis');
const { connectRabbitMQ } = require('./utils/rabbitmq');

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
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Auth routes
app.post('/api/auth/register', authLimiter, authController.register);
app.post('/api/auth/login', authLimiter, authController.login);
app.post('/api/auth/refresh', authController.refreshToken);
app.post('/api/auth/logout', authController.logout);
app.post('/api/auth/forgot-password', authLimiter, authController.forgotPassword);
app.post('/api/auth/reset-password', authLimiter, authController.resetPassword);
app.get('/api/auth/verify-token', authController.verifyToken);

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
    await connectRedis();
    logger.info('Connected to Redis');

    // Connect to RabbitMQ
    await connectRabbitMQ();
    logger.info('Connected to RabbitMQ');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = app;