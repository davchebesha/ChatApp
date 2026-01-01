const geoip = require('geoip-lite');

class GeographicDistributionService {
  constructor() {
    this.regions = {
      'us-east-1': {
        name: 'US East (N. Virginia)',
        location: { lat: 39.0458, lng: -77.5081 },
        status: 'active',
        load: 0,
        connections: 0,
        responseTime: 0
      },
      'us-west-2': {
        name: 'US West (Oregon)',
        location: { lat: 45.5152, lng: -122.6784 },
        status: 'active',
        load: 0,
        connections: 0,
        responseTime: 0
      },
      'eu-west-1': {
        name: 'Europe (Ireland)',
        location: { lat: 53.3498, lng: -6.2603 },
        status: 'active',
        load: 0,
        connections: 0,
        responseTime: 0
      },
      'ap-southeast-1': {
        name: 'Asia Pacific (Singapore)',
        location: { lat: 1.3521, lng: 103.8198 },
        status: 'active',
        load: 0,
        connections: 0,
        responseTime: 0
      },
      'ap-northeast-1': {
        name: 'Asia Pacific (Tokyo)',
        location: { lat: 35.6762, lng: 139.6503 },
        status: 'active',
        load: 0,
        connections: 0,
        responseTime: 0
      }
    };
    
    this.currentRegion = process.env.AWS_REGION || 'us-east-1';
    this.loadBalancingStrategy = 'round-robin'; // round-robin, least-connections, geographic
    this.connectionCounts = new Map();
    this.responseTimesHistory = new Map();
  }

  // Get user's geographic location
  getUserLocation(ip) {
    try {
      const geo = geoip.lookup(ip);
      if (geo) {
        return {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          latitude: geo.ll[0],
          longitude: geo.ll[1],
          timezone: geo.timezone
        };
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
    
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC'
    };
  }

  // Calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Find nearest region for a user
  findNearestRegion(userLocation) {
    let nearestRegion = this.currentRegion;
    let shortestDistance = Infinity;

    Object.entries(this.regions).forEach(([regionId, region]) => {
      if (region.status === 'active') {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          region.location.lat,
          region.location.lng
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestRegion = regionId;
        }
      }
    });

    return {
      regionId: nearestRegion,
      region: this.regions[nearestRegion],
      distance: shortestDistance
    };
  }

  // Get optimal region based on strategy
  getOptimalRegion(userIp, strategy = this.loadBalancingStrategy) {
    const userLocation = this.getUserLocation(userIp);
    
    switch (strategy) {
      case 'geographic':
        return this.findNearestRegion(userLocation);
      
      case 'least-connections':
        return this.findLeastLoadedRegion();
      
      case 'round-robin':
        return this.getNextRoundRobinRegion();
      
      case 'performance':
        return this.findBestPerformingRegion(userLocation);
      
      default:
        return this.findNearestRegion(userLocation);
    }
  }

  // Find region with least connections
  findLeastLoadedRegion() {
    let leastLoadedRegion = this.currentRegion;
    let lowestLoad = Infinity;

    Object.entries(this.regions).forEach(([regionId, region]) => {
      if (region.status === 'active' && region.connections < lowestLoad) {
        lowestLoad = region.connections;
        leastLoadedRegion = regionId;
      }
    });

    return {
      regionId: leastLoadedRegion,
      region: this.regions[leastLoadedRegion],
      load: lowestLoad
    };
  }

  // Round-robin region selection
  getNextRoundRobinRegion() {
    const activeRegions = Object.keys(this.regions).filter(
      regionId => this.regions[regionId].status === 'active'
    );
    
    if (activeRegions.length === 0) {
      return {
        regionId: this.currentRegion,
        region: this.regions[this.currentRegion]
      };
    }

    const currentIndex = activeRegions.indexOf(this.currentRegion);
    const nextIndex = (currentIndex + 1) % activeRegions.length;
    const nextRegion = activeRegions[nextIndex];

    return {
      regionId: nextRegion,
      region: this.regions[nextRegion]
    };
  }

  // Find best performing region
  findBestPerformingRegion(userLocation) {
    let bestRegion = this.currentRegion;
    let bestScore = -Infinity;

    Object.entries(this.regions).forEach(([regionId, region]) => {
      if (region.status === 'active') {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          region.location.lat,
          region.location.lng
        );

        // Score based on distance, load, and response time
        const distanceScore = 1000 / (distance + 1);
        const loadScore = 100 / (region.load + 1);
        const responseTimeScore = 1000 / (region.responseTime + 1);
        
        const totalScore = distanceScore + loadScore + responseTimeScore;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestRegion = regionId;
        }
      }
    });

    return {
      regionId: bestRegion,
      region: this.regions[bestRegion],
      score: bestScore
    };
  }

  // Update region metrics
  updateRegionMetrics(regionId, metrics) {
    if (this.regions[regionId]) {
      this.regions[regionId] = {
        ...this.regions[regionId],
        ...metrics,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Track connection
  trackConnection(regionId, userIp) {
    if (this.regions[regionId]) {
      this.regions[regionId].connections++;
      
      const userLocation = this.getUserLocation(userIp);
      const connectionKey = `${regionId}-${userIp}`;
      
      this.connectionCounts.set(connectionKey, {
        regionId,
        userLocation,
        connectedAt: new Date().toISOString()
      });
    }
  }

  // Remove connection
  removeConnection(regionId, userIp) {
    if (this.regions[regionId] && this.regions[regionId].connections > 0) {
      this.regions[regionId].connections--;
      
      const connectionKey = `${regionId}-${userIp}`;
      this.connectionCounts.delete(connectionKey);
    }
  }

  // Track response time
  trackResponseTime(regionId, responseTime) {
    if (this.regions[regionId]) {
      const history = this.responseTimesHistory.get(regionId) || [];
      history.push({
        responseTime,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 measurements
      if (history.length > 100) {
        history.shift();
      }

      this.responseTimesHistory.set(regionId, history);

      // Update average response time
      const avgResponseTime = history.reduce((sum, item) => sum + item.responseTime, 0) / history.length;
      this.regions[regionId].responseTime = avgResponseTime;
    }
  }

  // Get geographic distribution statistics
  getDistributionStats() {
    const stats = {
      totalRegions: Object.keys(this.regions).length,
      activeRegions: Object.values(this.regions).filter(r => r.status === 'active').length,
      totalConnections: Object.values(this.regions).reduce((sum, r) => sum + r.connections, 0),
      regions: {},
      userDistribution: this.getUserDistribution(),
      loadBalancing: {
        strategy: this.loadBalancingStrategy,
        currentRegion: this.currentRegion
      }
    };

    Object.entries(this.regions).forEach(([regionId, region]) => {
      stats.regions[regionId] = {
        ...region,
        loadPercentage: this.calculateLoadPercentage(regionId),
        healthScore: this.calculateHealthScore(regionId)
      };
    });

    return stats;
  }

  // Calculate load percentage for a region
  calculateLoadPercentage(regionId) {
    const region = this.regions[regionId];
    const totalConnections = Object.values(this.regions).reduce((sum, r) => sum + r.connections, 0);
    
    if (totalConnections === 0) return 0;
    return (region.connections / totalConnections) * 100;
  }

  // Calculate health score for a region
  calculateHealthScore(regionId) {
    const region = this.regions[regionId];
    
    if (region.status !== 'active') return 0;
    
    // Score based on response time and load
    const responseTimeScore = Math.max(0, 100 - (region.responseTime / 10));
    const loadScore = Math.max(0, 100 - region.load);
    
    return (responseTimeScore + loadScore) / 2;
  }

  // Get user distribution by country/region
  getUserDistribution() {
    const distribution = {};
    
    this.connectionCounts.forEach((connection) => {
      const country = connection.userLocation.country;
      if (!distribution[country]) {
        distribution[country] = {
          count: 0,
          regions: {}
        };
      }
      
      distribution[country].count++;
      
      if (!distribution[country].regions[connection.regionId]) {
        distribution[country].regions[connection.regionId] = 0;
      }
      distribution[country].regions[connection.regionId]++;
    });
    
    return distribution;
  }

  // Failover to backup region
  failoverRegion(failedRegionId, backupRegionId) {
    if (this.regions[failedRegionId]) {
      this.regions[failedRegionId].status = 'failed';
      
      // Move connections to backup region
      const connectionsToMove = this.regions[failedRegionId].connections;
      this.regions[failedRegionId].connections = 0;
      
      if (this.regions[backupRegionId]) {
        this.regions[backupRegionId].connections += connectionsToMove;
      }
      
      console.log(`Failover: Moved ${connectionsToMove} connections from ${failedRegionId} to ${backupRegionId}`);
    }
  }

  // Auto-scaling based on load
  autoScale(regionId, targetLoad = 70) {
    const region = this.regions[regionId];
    if (!region) return;

    const currentLoad = this.calculateLoadPercentage(regionId);
    
    if (currentLoad > targetLoad) {
      // Scale up - add more capacity
      console.log(`Auto-scaling up region ${regionId}: Current load ${currentLoad}%`);
      return {
        action: 'scale-up',
        regionId,
        currentLoad,
        targetLoad
      };
    } else if (currentLoad < targetLoad * 0.3) {
      // Scale down - reduce capacity
      console.log(`Auto-scaling down region ${regionId}: Current load ${currentLoad}%`);
      return {
        action: 'scale-down',
        regionId,
        currentLoad,
        targetLoad
      };
    }

    return {
      action: 'no-change',
      regionId,
      currentLoad,
      targetLoad
    };
  }

  // Get region recommendations for new deployments
  getDeploymentRecommendations() {
    const stats = this.getDistributionStats();
    const recommendations = [];

    // Analyze user distribution
    Object.entries(stats.userDistribution).forEach(([country, data]) => {
      if (data.count > 100) { // Significant user base
        const nearestRegion = this.findNearestRegionForCountry(country);
        if (nearestRegion.distance > 5000) { // More than 5000km away
          recommendations.push({
            type: 'new-region',
            country,
            userCount: data.count,
            nearestRegion: nearestRegion.regionId,
            distance: nearestRegion.distance,
            priority: 'high'
          });
        }
      }
    });

    return recommendations;
  }

  // Find nearest region for a country
  findNearestRegionForCountry(country) {
    // This would use a country-to-coordinates mapping
    // For now, return a default calculation
    return this.findNearestRegion({ latitude: 0, longitude: 0 });
  }
}

module.exports = GeographicDistributionService;