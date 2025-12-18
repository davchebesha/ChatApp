const Redis = require('redis');
const os = require('os');

class ServiceRegistry {
  constructor() {
    this.redis = null;
    this.serviceId = `${os.hostname()}-${process.pid}`;
    this.serviceName = 'chat-server';
    this.heartbeatInterval = null;
    this.services = new Map();
  }

  async initialize() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redis.connect();
      console.log('✅ Service Registry connected to Redis');
      
      // Register this service
      await this.registerService();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Watch for service changes
      this.watchServices();
      
    } catch (error) {
      console.error('❌ Service Registry initialization failed:', error);
    }
  }

  async registerService() {
    const serviceInfo = {
      id: this.serviceId,
      name: this.serviceName,
      host: os.hostname(),
      port: process.env.PORT || 5000,
      pid: process.pid,
      status: 'healthy',
      lastHeartbeat: Date.now(),
      startTime: Date.now(),
      version: process.env.npm_package_version || '1.0.0'
    };

    const key = `services:${this.serviceName}:${this.serviceId}`;
    await this.redis.setEx(key, 30, JSON.stringify(serviceInfo)); // 30 second TTL
    
    console.log(`🔧 Service registered: ${this.serviceId}`);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.registerService(); // Refresh registration
        await this.checkServiceHealth();
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    }, 10000); // Every 10 seconds
  }

  async checkServiceHealth() {
    try {
      // Check database connection
      const mongoose = require('mongoose');
      const dbHealthy = mongoose.connection.readyState === 1;
      
      // Check memory usage (more lenient threshold)
      const memUsage = process.memoryUsage();
      const memHealthy = memUsage.heapUsed < 500 * 1024 * 1024; // 500MB threshold
      
      const status = dbHealthy && memHealthy ? 'healthy' : 'unhealthy';
      
      if (status === 'unhealthy') {
        console.warn('⚠️ Service health check failed - DB:', dbHealthy, 'Memory:', memHealthy);
      }
      
      return status;
    } catch (error) {
      console.warn('⚠️ Service health check failed:', error.message);
      return 'unhealthy';
    }
  }

  async getHealthyServices() {
    try {
      const keys = await this.redis.keys(`services:${this.serviceName}:*`);
      const services = [];
      
      for (const key of keys) {
        const serviceData = await this.redis.get(key);
        if (serviceData) {
          const service = JSON.parse(serviceData);
          const timeSinceHeartbeat = Date.now() - service.lastHeartbeat;
          
          // Consider service healthy if heartbeat within last 30 seconds
          if (timeSinceHeartbeat < 30000) {
            services.push(service);
          }
        }
      }
      
      return services;
    } catch (error) {
      console.error('❌ Failed to get healthy services:', error);
      return [];
    }
  }

  async watchServices() {
    // Subscribe to service events
    const subscriber = this.redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('service:events', (message) => {
      const event = JSON.parse(message);
      console.log(`📡 Service event: ${event.type} - ${event.serviceId}`);
      
      if (event.type === 'service_down') {
        this.handleServiceDown(event.serviceId);
      }
    });
  }

  async handleServiceDown(serviceId) {
    console.log(`🔄 Handling service down: ${serviceId}`);
    // Implement failover logic here
    // Redistribute load, notify load balancer, etc.
  }

  async shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Deregister service
    const key = `services:${this.serviceName}:${this.serviceId}`;
    await this.redis.del(key);
    
    // Notify other services
    await this.redis.publish('service:events', JSON.stringify({
      type: 'service_down',
      serviceId: this.serviceId,
      timestamp: Date.now()
    }));
    
    await this.redis.disconnect();
    console.log('🔧 Service deregistered');
  }
}

module.exports = ServiceRegistry;