const Redis = require('ioredis');

class DistributedSessionManager {
  constructor() {
    this.redis = null;
    this.isClusterMode = process.env.CLUSTER_MODE === 'true';
    this.serverId = process.env.SERVER_ID || 'unknown';
    this.sessionTTL = 24 * 60 * 60; // 24 hours
  }

  async initialize() {
    try {
      if (this.isClusterMode) {
        // Redis Cluster configuration
        const clusterNodes = process.env.REDIS_CLUSTER_NODES?.split(',') || ['localhost:6379'];
        this.redis = new Redis.Cluster(clusterNodes.map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        }), {
          redisOptions: {
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
          },
          enableOfflineQueue: false,
          retryDelayOnClusterDown: 300,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          scaleReads: 'slave'
        });
      } else {
        // Single Redis instance
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        });
      }

      this.redis.on('connect', () => {
        console.log(`✅ Redis connected (${this.serverId})`);
      });

      this.redis.on('error', (error) => {
        console.error(`❌ Redis error (${this.serverId}):`, error);
      });

      this.redis.on('close', () => {
        console.log(`🔌 Redis connection closed (${this.serverId})`);
      });

      // Test connection
      await this.redis.ping();
      console.log(`🔄 Session manager initialized (${this.serverId})`);

    } catch (error) {
      console.error(`❌ Failed to initialize session manager (${this.serverId}):`, error);
      throw error;
    }
  }

  // Store user session across servers
  async setUserSession(userId, sessionData) {
    try {
      const key = `session:${userId}`;
      const data = {
        ...sessionData,
        serverId: this.serverId,
        lastSeen: new Date().toISOString(),
        ttl: this.sessionTTL
      };
      
      await this.redis.setex(key, data.ttl, JSON.stringify(data));
      console.log(`📝 Session stored for user ${userId} on ${this.serverId}`);
      
    } catch (error) {
      console.error(`❌ Failed to store session for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user session from any server
  async getUserSession(userId) {
    try {
      const key = `session:${userId}`;
      const data = await this.redis.get(key);
      
      if (data) {
        const session = JSON.parse(data);
        // Update last seen
        session.lastSeen = new Date().toISOString();
        await this.redis.setex(key, session.ttl, JSON.stringify(session));
        return session;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get session for user ${userId}:`, error);
      return null;
    }
  }

  // Remove user session
  async removeUserSession(userId) {
    try {
      const key = `session:${userId}`;
      await this.redis.del(key);
      console.log(`🗑️ Session removed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to remove session for user ${userId}:`, error);
    }
  }

  // Store user's socket connection info
  async setUserSocket(userId, socketId, serverId = this.serverId) {
    try {
      const key = `socket:${userId}`;
      const data = {
        socketId,
        serverId,
        connectedAt: new Date().toISOString()
      };
      
      await this.redis.setex(key, 3600, JSON.stringify(data)); // 1 hour TTL
      console.log(`🔌 Socket stored for user ${userId} on ${serverId}`);
      
    } catch (error) {
      console.error(`❌ Failed to store socket for user ${userId}:`, error);
    }
  }

  // Get user's socket connection info
  async getUserSocket(userId) {
    try {
      const key = `socket:${userId}`;
      const data = await this.redis.get(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get socket for user ${userId}:`, error);
      return null;
    }
  }

  // Remove user's socket connection
  async removeUserSocket(userId) {
    try {
      const key = `socket:${userId}`;
      await this.redis.del(key);
      console.log(`🔌 Socket removed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to remove socket for user ${userId}:`, error);
    }
  }

  // Get all online users across all servers
  async getOnlineUsers() {
    try {
      const pattern = 'socket:*';
      const keys = await this.redis.keys(pattern);
      const onlineUsers = [];
      
      if (keys.length > 0) {
        const values = await this.redis.mget(keys);
        
        for (let i = 0; i < keys.length; i++) {
          if (values[i]) {
            const userId = keys[i].replace('socket:', '');
            const socketData = JSON.parse(values[i]);
            onlineUsers.push({
              userId,
              ...socketData
            });
          }
        }
      }
      
      return onlineUsers;
    } catch (error) {
      console.error(`❌ Failed to get online users:`, error);
      return [];
    }
  }

  // Publish message to all servers
  async publishToServers(channel, message) {
    try {
      const data = {
        serverId: this.serverId,
        timestamp: new Date().toISOString(),
        message
      };
      
      await this.redis.publish(channel, JSON.stringify(data));
      console.log(`📡 Published to channel ${channel} from ${this.serverId}`);
      
    } catch (error) {
      console.error(`❌ Failed to publish to channel ${channel}:`, error);
    }
  }

  // Subscribe to messages from other servers
  async subscribeToChannel(channel, callback) {
    try {
      const subscriber = this.redis.duplicate();
      
      subscriber.subscribe(channel, (err, count) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${channel}:`, err);
        } else {
          console.log(`📡 Subscribed to channel ${channel} (${this.serverId})`);
        }
      });
      
      subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const data = JSON.parse(message);
            // Don't process messages from the same server
            if (data.serverId !== this.serverId) {
              callback(data);
            }
          } catch (error) {
            console.error(`❌ Failed to parse message from ${channel}:`, error);
          }
        }
      });
      
      return subscriber;
    } catch (error) {
      console.error(`❌ Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async createSession(userId, sessionData) {
    return await this.setUserSession(userId, sessionData);
  }

  async getSession(sessionId) {
    // Extract userId from sessionId if it follows the pattern session:userId
    const userId = sessionId.replace('session:', '');
    return await this.getUserSession(userId);
  }

  async destroySession(sessionId) {
    const userId = sessionId.replace('session:', '');
    return await this.removeUserSession(userId);
  }

  async getUserSessions(userId) {
    const session = await this.getUserSession(userId);
    return session ? [session] : [];
  }

  async destroyAllUserSessions(userId) {
    return await this.removeUserSession(userId);
  }

  async getActiveUsers() {
    return await this.getOnlineUsers();
  }

  // Health check
  async healthCheck() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency: `${latency}ms`,
        serverId: this.serverId,
        clusterMode: this.isClusterMode
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        serverId: this.serverId,
        clusterMode: this.isClusterMode
      };
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.quit();
        console.log(`🔌 Session manager shutdown complete (${this.serverId})`);
      }
    } catch (error) {
      console.error(`❌ Error during session manager shutdown (${this.serverId}):`, error);
    }
  }
}

module.exports = DistributedSessionManager;