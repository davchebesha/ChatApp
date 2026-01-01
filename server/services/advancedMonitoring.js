const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class AdvancedMonitoringService {
  constructor() {
    this.metrics = {
      system: {},
      application: {},
      database: {},
      network: {},
      security: {}
    };
    this.alerts = [];
    this.thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 1000,
      errorRate: 5
    };
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
  }

  // System Metrics Collection
  async collectSystemMetrics() {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();
    const networkStats = await this.getNetworkStats();

    this.metrics.system = {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      network: networkStats,
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      timestamp: new Date().toISOString()
    };

    this.checkThresholds();
    return this.metrics.system;
  }

  // CPU Usage Calculation
  async getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      usage: usage,
      cores: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed
    };
  }

  // Memory Usage
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usage = (usedMemory / totalMemory) * 100;

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: usage,
      processMemory: process.memoryUsage()
    };
  }

  // Disk Usage
  async getDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      return {
        available: stats.size || 0,
        used: 0,
        usage: 0,
        path: process.cwd()
      };
    } catch (error) {
      return {
        available: 0,
        used: 0,
        usage: 0,
        error: error.message
      };
    }
  }

  // Network Statistics
  async getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    const stats = {};

    Object.keys(networkInterfaces).forEach(interfaceName => {
      const interfaces = networkInterfaces[interfaceName];
      stats[interfaceName] = interfaces.map(iface => ({
        address: iface.address,
        netmask: iface.netmask,
        family: iface.family,
        mac: iface.mac,
        internal: iface.internal
      }));
    });

    return stats;
  }

  // Application Metrics
  collectApplicationMetrics() {
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0;

    this.metrics.application = {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: errorRate,
      averageResponseTime: avgResponseTime,
      activeConnections: this.getActiveConnections(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    return this.metrics.application;
  }

  // Database Metrics
  async collectDatabaseMetrics(mongoClient, redisClient) {
    const dbMetrics = {
      mongodb: await this.getMongoDBMetrics(mongoClient),
      redis: await this.getRedisMetrics(redisClient),
      timestamp: new Date().toISOString()
    };

    this.metrics.database = dbMetrics;
    return dbMetrics;
  }

  // MongoDB Metrics
  async getMongoDBMetrics(client) {
    try {
      if (!client) return { status: 'disconnected' };

      const admin = client.db().admin();
      const serverStatus = await admin.serverStatus();
      const dbStats = await client.db().stats();

      return {
        status: 'connected',
        connections: serverStatus.connections,
        operations: serverStatus.opcounters,
        memory: serverStatus.mem,
        network: serverStatus.network,
        storage: {
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexSize: dbStats.indexSize,
          collections: dbStats.collections
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Redis Metrics
  async getRedisMetrics(client) {
    try {
      if (!client) return { status: 'disconnected' };

      const info = await client.info();
      const memory = await client.info('memory');
      const stats = await client.info('stats');

      return {
        status: 'connected',
        info: this.parseRedisInfo(info),
        memory: this.parseRedisInfo(memory),
        stats: this.parseRedisInfo(stats)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Parse Redis INFO output
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};

    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = isNaN(value) ? value : Number(value);
        }
      }
    });

    return result;
  }

  // Security Metrics
  collectSecurityMetrics() {
    this.metrics.security = {
      failedLoginAttempts: this.getFailedLoginAttempts(),
      suspiciousActivities: this.getSuspiciousActivities(),
      activeSecurityEvents: this.getActiveSecurityEvents(),
      timestamp: new Date().toISOString()
    };

    return this.metrics.security;
  }

  // Threshold Checking and Alerting
  checkThresholds() {
    const alerts = [];

    // CPU Alert
    if (this.metrics.system.cpu.usage > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `High CPU usage: ${this.metrics.system.cpu.usage.toFixed(2)}%`,
        threshold: this.thresholds.cpu,
        current: this.metrics.system.cpu.usage,
        timestamp: new Date().toISOString()
      });
    }

    // Memory Alert
    if (this.metrics.system.memory.usage > this.thresholds.memory) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${this.metrics.system.memory.usage.toFixed(2)}%`,
        threshold: this.thresholds.memory,
        current: this.metrics.system.memory.usage,
        timestamp: new Date().toISOString()
      });
    }

    // Error Rate Alert
    if (this.metrics.application && this.metrics.application.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        level: 'critical',
        message: `High error rate: ${this.metrics.application.errorRate.toFixed(2)}%`,
        threshold: this.thresholds.errorRate,
        current: this.metrics.application.errorRate,
        timestamp: new Date().toISOString()
      });
    }

    this.alerts = alerts;
    return alerts;
  }

  // Request Tracking
  trackRequest(responseTime, isError = false) {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    if (isError) {
      this.errorCount++;
    }
  }

  // Get Active Connections
  getActiveConnections() {
    // This would be implemented based on your WebSocket or HTTP server
    return 0;
  }

  // Security Event Tracking
  getFailedLoginAttempts() {
    // Implement based on your authentication system
    return 0;
  }

  getSuspiciousActivities() {
    // Implement based on your security monitoring
    return [];
  }

  getActiveSecurityEvents() {
    // Implement based on your security system
    return [];
  }

  // Health Check
  async getHealthStatus() {
    await this.collectSystemMetrics();
    this.collectApplicationMetrics();
    this.collectSecurityMetrics();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      metrics: this.metrics,
      alerts: this.alerts
    };

    // Determine overall health status
    if (this.alerts.some(alert => alert.level === 'critical')) {
      health.status = 'critical';
    } else if (this.alerts.length > 0) {
      health.status = 'warning';
    }

    return health;
  }

  // Export Metrics for External Monitoring
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      system: this.metrics.system,
      application: this.metrics.application,
      database: this.metrics.database,
      security: this.metrics.security,
      alerts: this.alerts
    };
  }

  // Reset Metrics
  resetMetrics() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.alerts = [];
  }
}

module.exports = AdvancedMonitoringService;