# Distributed Chat Application - Complete Deployment Guide

This guide covers deploying your chat application as a fully distributed system with automatic failover, load balancing, and horizontal scaling capabilities.

## 🏗️ Architecture Overview

Your application now supports:
- **Multiple server instances** with automatic load balancing
- **Service discovery** and health monitoring
- **Distributed session management** across servers
- **Message queue** for cross-server communication
- **Automatic failover** when servers go down
- **Horizontal scaling** based on load

## 🚀 Quick Start - Distributed Mode

### Option 1: Docker Compose (Recommended for Development)

```bash
# Make deployment script executable
chmod +x scripts/deploy-distributed.sh

# Deploy with 3 server instances
./scripts/deploy-distributed.sh
```

This will start:
- 3 backend server instances (ports 5000, 5001, 5002)
- MongoDB with replica set capability
- Redis for distributed messaging
- Nginx load balancer
- React frontend

### Option 2: Kubernetes (Production)

```bash
# Make deployment script executable
chmod +x scripts/deploy-kubernetes.sh

# Deploy to Kubernetes cluster
./scripts/deploy-kubernetes.sh
```

## 📋 Prerequisites

### For Docker Deployment:
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### For Kubernetes Deployment:
- Kubernetes cluster (1.20+)
- kubectl configured
- 8GB RAM minimum
- 50GB disk space

## 🔧 Configuration

### Environment Variables

Each server instance uses these environment variables:

```env
# Server Configuration
PORT=5000
SERVER_ID=server-1
CLUSTER_MODE=true
NODE_ENV=production

# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/chatapp?authSource=admin

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Redis (for distributed messaging)
REDIS_URL=redis://redis:6379

# Client
CLIENT_URL=http://localhost:3000
```

### Load Balancer Configuration

The Nginx load balancer is configured with:
- **Least co