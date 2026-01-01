const express = require('express');
const router = express.Router();
const AdvancedMonitoringService = require('../services/advancedMonitoring');
const GeographicDistributionService = require('../services/geographicDistribution');

// Initialize services
const monitoring = new AdvancedMonitoringService();
const geoDistribution = new GeographicDistributionService();

// Middleware to track requests
router.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    monitoring.trackRequest(responseTime, isError);
    
    // Track geographic distribution
    const clientIp = req.ip || req.connection.remoteAddress;
    if (clientIp) {
      geoDistribution.trackConnection(geoDistribution.currentRegion, clientIp);
    }
  });
  
  next();
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await monitoring.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check with all metrics
router.get('/health/detailed', async (req, res) => {
  try {
    const systemMetrics = await monitoring.collectSystemMetrics();
    const appMetrics = monitoring.collectApplicationMetrics();
    const securityMetrics = monitoring.collectSecurityMetrics();
    const geoStats = geoDistribution.getDistributionStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      application: appMetrics,
      security: securityMetrics,
      geographic: geoStats,
      alerts: monitoring.alerts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System metrics endpoint
router.get('/metrics/system', async (req, res) => {
  try {
    const metrics = await monitoring.collectSystemMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Application metrics endpoint
router.get('/metrics/application', (req, res) => {
  try {
    const metrics = monitoring.collectApplicationMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database metrics endpoint
router.get('/metrics/database', async (req, res) => {
  try {
    // You would pass your actual database clients here
    const metrics = await monitoring.collectDatabaseMetrics(null, null);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Geographic distribution endpoint
router.get('/metrics/geographic', (req, res) => {
  try {
    const stats = geoDistribution.getDistributionStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alerts endpoint
router.get('/alerts', (req, res) => {
  try {
    res.json({
      alerts: monitoring.alerts,
      count: monitoring.alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Performance metrics endpoint
router.get('/metrics/performance', (req, res) => {
  try {
    const performance = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      requestCount: monitoring.requestCount,
      errorCount: monitoring.errorCount,
      errorRate: monitoring.requestCount > 0 ? (monitoring.errorCount / monitoring.requestCount) * 100 : 0,
      averageResponseTime: monitoring.requestCount > 0 ? monitoring.responseTimeSum / monitoring.requestCount : 0,
      timestamp: new Date().toISOString()
    };
    
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Regional optimization endpoint
router.get('/optimize/region', (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress;
    const strategy = req.query.strategy || 'geographic';
    
    const optimal = geoDistribution.getOptimalRegion(clientIp, strategy);
    
    res.json({
      recommended: optimal,
      current: geoDistribution.currentRegion,
      strategy: strategy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deployment recommendations endpoint
router.get('/recommendations/deployment', (req, res) => {
  try {
    const recommendations = geoDistribution.getDeploymentRecommendations();
    
    res.json({
      recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-scaling status endpoint
router.get('/autoscaling/status', (req, res) => {
  try {
    const regions = Object.keys(geoDistribution.regions);
    const scalingStatus = regions.map(regionId => 
      geoDistribution.autoScale(regionId)
    );
    
    res.json({
      regions: scalingStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Failover simulation endpoint (for testing)
router.post('/failover/simulate', (req, res) => {
  try {
    const { failedRegion, backupRegion } = req.body;
    
    if (!failedRegion || !backupRegion) {
      return res.status(400).json({
        error: 'Both failedRegion and backupRegion are required'
      });
    }
    
    geoDistribution.failoverRegion(failedRegion, backupRegion);
    
    res.json({
      message: `Failover simulation completed: ${failedRegion} -> ${backupRegion}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export metrics for external monitoring systems
router.get('/export/prometheus', (req, res) => {
  try {
    const metrics = monitoring.exportMetrics();
    
    // Convert to Prometheus format
    let prometheusMetrics = '';
    
    // System metrics
    if (metrics.system) {
      prometheusMetrics += `# HELP system_cpu_usage CPU usage percentage\n`;
      prometheusMetrics += `# TYPE system_cpu_usage gauge\n`;
      prometheusMetrics += `system_cpu_usage ${metrics.system.cpu.usage}\n\n`;
      
      prometheusMetrics += `# HELP system_memory_usage Memory usage percentage\n`;
      prometheusMetrics += `# TYPE system_memory_usage gauge\n`;
      prometheusMetrics += `system_memory_usage ${metrics.system.memory.usage}\n\n`;
    }
    
    // Application metrics
    if (metrics.application) {
      prometheusMetrics += `# HELP app_request_count Total number of requests\n`;
      prometheusMetrics += `# TYPE app_request_count counter\n`;
      prometheusMetrics += `app_request_count ${metrics.application.requestCount}\n\n`;
      
      prometheusMetrics += `# HELP app_error_rate Error rate percentage\n`;
      prometheusMetrics += `# TYPE app_error_rate gauge\n`;
      prometheusMetrics += `app_error_rate ${metrics.application.errorRate}\n\n`;
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset metrics endpoint (for testing)
router.post('/reset', (req, res) => {
  try {
    monitoring.resetMetrics();
    
    res.json({
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;