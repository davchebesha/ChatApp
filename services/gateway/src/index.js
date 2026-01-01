const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
require('dotenv').config();

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
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3002',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3003',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3004'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: services
  });
});

// Service discovery endpoint
app.get('/api/services', (req, res) => {
  res.json({
    services: Object.keys(services).map(name => ({
      name,
      url: services[name],
      status: 'unknown' // In production, you'd check actual service health
    }))
  });
});

// Proxy configurations with load balancing support
const createProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${req.url}:`, err);
      res.status(502).json({
        error: 'Service temporarily unavailable',
        message: 'The requested service is currently unavailable. Please try again later.'
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying ${req.method} ${req.url} to ${target}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(`Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  });
};

// Auth service routes
app.use('/api/auth', createProxy(services.auth, {
  '^/api/auth': '/api/auth'
}));

// Chat service routes
app.use('/api/chats', createProxy(services.chat, {
  '^/api/chats': '/api/chats'
}));

app.use('/api/messages', createProxy(services.chat, {
  '^/api/messages': '/api/messages'
}));

app.use('/api/webrtc', createProxy(services.chat, {
  '^/api/webrtc': '/api/webrtc'
}));

// Media service routes
app.use('/api/media', createProxy(services.media, {
  '^/api/media': '/api/media'
}));

app.use('/api/files', createProxy(services.media, {
  '^/api/files': '/api/files'
}));

// User service routes
app.use('/api/users', createProxy(services.user, {
  '^/api/users': '/api/users'
}));

// Socket.IO proxy for WebSocket connections
const socketProxy = createProxyMiddleware({
  target: services.chat,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logLevel: 'info',
  onError: (err, req, res) => {
    logger.error('WebSocket proxy error:', err);
  }
});

app.use('/socket.io', socketProxy);

// Handle WebSocket upgrade
app.on('upgrade', (request, socket, head) => {
  logger.info('WebSocket upgrade request received');
  socketProxy.upgrade(request, socket, head);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.originalUrl
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service routes configured:');
  Object.entries(services).forEach(([name, url]) => {
    logger.info(`  ${name}: ${url}`);
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Gateway server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;