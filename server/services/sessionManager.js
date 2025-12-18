const Redis = require('redis');

class DistributedSessionManager {
  constructor() {
    this.redis = null;
    this.sessionTTL = 24 * 60 * 60; // 24 hours
  }

  async initialize() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redis.connect();
      console.log('✅ Distributed Session Manager connected to Redis');
    } catch (error) {
      console.error('❌ Session Manager initialization failed:', error);
    }
  }

  async createSession(userId, sessionData) {
    const sessionId = `session:${userId}:${Date.now()}`;
    const sessionInfo = {
      userId,
      ...sessionData,
      createdAt: Date.now(),
      lastAccess: Date.now()
    };

    await this.redis.setEx(sessionId, this.sessionTTL, JSON.stringify(sessionInfo));
    
    // Track user sessions
    await this.redis.sAdd(`user:${userId}:sessions`, sessionId);
    
    return sessionId;
  }

  async getSession(sessionId) {
    const sessionData = await this.redis.get(sessionId);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    
    // Update last access
    session.lastAccess = Date.now();
    await this.redis.setEx(sessionId, this.sessionTTL, JSON.stringify(session));
    
    return session;
  }

  async updateSession(sessionId, updates) {
    const sessionData = await this.redis.get(sessionId);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    Object.assign(session, updates, { lastAccess: Date.now() });
    
    await this.redis.setEx(sessionId, this.sessionTTL, JSON.stringify(session));
    return true;
  }

  async destroySession(sessionId) {
    const sessionData = await this.redis.get(sessionId);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      await this.redis.sRem(`user:${session.userId}:sessions`, sessionId);
    }
    
    await this.redis.del(sessionId);
  }

  async getUserSessions(userId) {
    const sessionIds = await this.redis.sMembers(`user:${userId}:sessions`);
    const sessions = [];
    
    for (const sessionId of sessionIds) {
      const sessionData = await this.redis.get(sessionId);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      } else {
        // Clean up expired session reference
        await this.redis.sRem(`user:${userId}:sessions`, sessionId);
      }
    }
    
    return sessions;
  }

  async destroyAllUserSessions(userId) {
    const sessionIds = await this.redis.sMembers(`user:${userId}:sessions`);
    
    for (const sessionId of sessionIds) {
      await this.redis.del(sessionId);
    }
    
    await this.redis.del(`user:${userId}:sessions`);
  }

  async getActiveUsers() {
    const keys = await this.redis.keys('user:*:sessions');
    const activeUsers = [];
    
    for (const key of keys) {
      const userId = key.split(':')[1];
      const sessionCount = await this.redis.sCard(key);
      if (sessionCount > 0) {
        activeUsers.push({ userId, sessionCount });
      }
    }
    
    return activeUsers;
  }
}

module.exports = DistributedSessionManager;