const Redis = require('redis');
const EventEmitter = require('events');

class DistributedMessageQueue extends EventEmitter {
  constructor() {
    super();
    this.redis = null;
    this.subscriber = null;
    this.publisher = null;
    this.queues = new Map();
  }

  async initialize() {
    try {
      // Main Redis connection
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      // Publisher connection
      this.publisher = this.redis.duplicate();
      
      // Subscriber connection
      this.subscriber = this.redis.duplicate();
      
      await Promise.all([
        this.redis.connect(),
        this.publisher.connect(),
        this.subscriber.connect()
      ]);
      
      console.log('✅ Distributed Message Queue connected to Redis');
      
      // Subscribe to distributed events
      await this.setupSubscriptions();
      
    } catch (error) {
      console.error('❌ Message Queue initialization failed:', error);
    }
  }

  async setupSubscriptions() {
    // Subscribe to chat events
    await this.subscriber.subscribe('chat:messages', (message) => {
      const data = JSON.parse(message);
      this.emit('new_message', data);
    });

    await this.subscriber.subscribe('chat:typing', (message) => {
      const data = JSON.parse(message);
      this.emit('user_typing', data);
    });

    await this.subscriber.subscribe('user:status', (message) => {
      const data = JSON.parse(message);
      this.emit('user_status_change', data);
    });

    await this.subscriber.subscribe('webrtc:signaling', (message) => {
      const data = JSON.parse(message);
      this.emit('webrtc_signal', data);
    });

    console.log('📡 Subscribed to distributed events');
  }

  // Publish message to all server instances
  async publishMessage(channel, data) {
    try {
      await this.publisher.publish(channel, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Failed to publish message:', error);
    }
  }

  // Add message to persistent queue
  async enqueueMessage(queueName, message, priority = 0) {
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: message,
      priority,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3
    };

    // Add to sorted set with priority as score
    await this.redis.zAdd(`queue:${queueName}`, {
      score: priority,
      value: JSON.stringify(messageData)
    });

    return messageData.id;
  }

  // Process messages from queue
  async dequeueMessage(queueName) {
    try {
      // Get highest priority message
      const messages = await this.redis.zPopMax(`queue:${queueName}`);
      
      if (messages.length === 0) return null;
      
      const messageData = JSON.parse(messages[0].value);
      return messageData;
      
    } catch (error) {
      console.error('❌ Failed to dequeue message:', error);
      return null;
    }
  }

  // Retry failed message
  async retryMessage(queueName, messageData) {
    messageData.attempts++;
    
    if (messageData.attempts < messageData.maxAttempts) {
      // Re-add to queue with lower priority
      await this.redis.zAdd(`queue:${queueName}`, {
        score: messageData.priority - messageData.attempts,
        value: JSON.stringify(messageData)
      });
      return true;
    }
    
    // Move to dead letter queue
    await this.redis.lPush(`dlq:${queueName}`, JSON.stringify(messageData));
    return false;
  }

  // Get queue statistics
  async getQueueStats(queueName) {
    const queueSize = await this.redis.zCard(`queue:${queueName}`);
    const dlqSize = await this.redis.lLen(`dlq:${queueName}`);
    
    return {
      queueName,
      pendingMessages: queueSize,
      deadLetterMessages: dlqSize
    };
  }

  // Broadcast to all connected clients across all servers
  async broadcastToAll(event, data) {
    await this.publishMessage('broadcast:all', { event, data });
  }

  // Send to specific user across all servers
  async sendToUser(userId, event, data) {
    await this.publishMessage('user:message', {
      userId,
      event,
      data
    });
  }

  // Send to chat room across all servers
  async sendToRoom(roomId, event, data) {
    await this.publishMessage('room:message', {
      roomId,
      event,
      data
    });
  }

  // WebRTC signaling across servers
  async sendWebRTCSignal(targetUserId, signal) {
    await this.publishMessage('webrtc:signaling', {
      targetUserId,
      signal
    });
  }

  async shutdown() {
    if (this.subscriber) await this.subscriber.disconnect();
    if (this.publisher) await this.publisher.disconnect();
    if (this.redis) await this.redis.disconnect();
    console.log('📡 Message Queue disconnected');
  }
}

module.exports = DistributedMessageQueue;