const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const pino = require('pino');
const { getRedisClient } = require('../utils/redis');
const { publishEvent } = require('../utils/rabbitmq');

const logger = pino();

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: {
    type: Date,
    default: null
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper functions
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

const getLoginAttemptKey = (email) => `login_attempts:${email}`;
const getBlockKey = (email) => `blocked:${email}`;

const checkLoginAttempts = async (email) => {
  const redis = getRedisClient();
  const attemptKey = getLoginAttemptKey(email);
  const blockKey = getBlockKey(email);

  // Check if user is currently blocked
  const isBlocked = await redis.get(blockKey);
  if (isBlocked) {
    const ttl = await redis.ttl(blockKey);
    return {
      blocked: true,
      remainingTime: ttl,
      attempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3
    };
  }

  // Get current attempt count
  const attempts = await redis.get(attemptKey);
  return {
    blocked: false,
    attempts: attempts ? parseInt(attempts) : 0,
    remainingTime: 0
  };
};

const recordFailedAttempt = async (email) => {
  const redis = getRedisClient();
  const attemptKey = getLoginAttemptKey(email);
  const blockKey = getBlockKey(email);
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3;
  const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 3600; // 1 hour

  // Increment attempt counter
  const attempts = await redis.incr(attemptKey);
  await redis.expire(attemptKey, lockoutTime);

  logger.warn(`Failed login attempt ${attempts} for email: ${email}`);

  // Publish failed login event
  await publishEvent('auth.login.failed', {
    email,
    attempts,
    timestamp: new Date().toISOString(),
    ip: 'unknown' // Would be passed from middleware in real implementation
  });

  if (attempts >= maxAttempts) {
    // Block the user
    await redis.setex(blockKey, lockoutTime, 'blocked');
    await redis.del(attemptKey); // Clear attempts counter

    logger.error(`User blocked after ${attempts} failed attempts: ${email}`);

    // Publish account blocked event
    await publishEvent('auth.account.blocked', {
      email,
      attempts,
      blockedUntil: new Date(Date.now() + lockoutTime * 1000).toISOString(),
      timestamp: new Date().toISOString()
    });

    return { blocked: true, attempts };
  }

  return { blocked: false, attempts };
};

const clearLoginAttempts = async (email) => {
  const redis = getRedisClient();
  const attemptKey = getLoginAttemptKey(email);
  await redis.del(attemptKey);
};

// Controllers
const register = async (req, res) => {
  try {
    // Validate input
    await Promise.all(registerValidation.map(validation => validation.run(req)));
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email or username'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await user.save();

    // Publish user registered event
    await publishEvent('auth.user.registered', {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    // Validate input
    await Promise.all(loginValidation.map(validation => validation.run(req)));
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check login attempts
    const attemptStatus = await checkLoginAttempts(email);
    
    if (attemptStatus.blocked) {
      return res.status(429).json({
        error: 'Account temporarily blocked',
        message: `Too many failed login attempts. Try again in ${Math.ceil(attemptStatus.remainingTime / 60)} minutes.`,
        blockedUntil: new Date(Date.now() + attemptStatus.remainingTime * 1000).toISOString()
      });
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      await recordFailedAttempt(email);
      return res.status(401).json({
        error: 'Invalid credentials',
        attempts: attemptStatus.attempts + 1,
        maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3
      });
    }

    // Check if user is blocked in database
    if (user.isBlocked && user.blockedUntil && user.blockedUntil > new Date()) {
      return res.status(403).json({
        error: 'Account is blocked',
        message: 'Your account has been blocked. Please contact support.',
        blockedUntil: user.blockedUntil.toISOString()
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      const failureResult = await recordFailedAttempt(email);
      
      const remainingAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) - failureResult.attempts;
      
      if (failureResult.blocked) {
        return res.status(429).json({
          error: 'Account blocked',
          message: 'Too many failed login attempts. Your account has been temporarily blocked.',
          attempts: failureResult.attempts,
          maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3
        });
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        attempts: failureResult.attempts,
        maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3,
        remainingAttempts: remainingAttempts,
        warning: remainingAttempts <= 1 ? 'Warning: Your account will be blocked after one more failed attempt.' : null
      });
    }

    // Clear failed attempts on successful login
    await clearLoginAttempts(email);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Update user status and last seen
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Publish login event
    await publishEvent('auth.user.login', {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    logger.info(`User logged in successfully: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type'
      });
    }

    // Find user and validate refresh token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    const tokenExists = user.refreshTokens.some(
      t => t.token === refreshToken && t.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (user) {
          // Remove refresh token if provided
          if (refreshToken) {
            user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
          }
          
          // Update user status
          user.status = 'offline';
          user.lastSeen = new Date();
          await user.save();

          // Publish logout event
          await publishEvent('auth.user.logout', {
            userId: user._id.toString(),
            username: user.username,
            timestamp: new Date().toISOString()
          });
        }
      } catch (tokenError) {
        // Token might be expired, but we still want to logout
        logger.warn('Token verification failed during logout:', tokenError.message);
      }
    }

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
      message: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // In a real implementation, you would:
    // 1. Generate a secure reset token
    // 2. Store it in Redis with expiration
    // 3. Send email with reset link
    
    // For now, just return success (don't reveal if email exists)
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      message: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Validate new password
    if (!newPassword || newPassword.length < 6 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long and contain at least one letter and one number'
      });
    }
    
    // In a real implementation, you would:
    // 1. Verify the reset token from Redis
    // 2. Find the user associated with the token
    // 3. Hash the new password and update the user
    // 4. Clear the reset token
    
    res.json({
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyToken,
  forgotPassword,
  resetPassword
};