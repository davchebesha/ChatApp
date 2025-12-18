# Deployment Guide

This guide covers deploying the distributed chat application in various environments.

## Prerequisites

- Node.js 16+ and npm
- MongoDB 5+
- Redis 6+
- Docker and Docker Compose (for containerized deployment)
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd distributed-chat-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

Create `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 4. Start MongoDB

```bash
# Using MongoDB service
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:5
```

### 5. Start Redis

```bash
# Using Redis service
redis-server

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### 6. Create Upload Directory

```bash
cd server
mkdir uploads
```

### 7. Start the Application

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm start
```

### 8. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Docker Deployment

### 1. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 2. Individual Container Management

```bash
# Build server image
cd server
docker build -t chat-server .

# Build client image
cd client
docker build -t chat-client .

# Run containers
docker run -d -p 5000:5000 --name chat-server chat-server
docker run -d -p 3000:80 --name chat-client chat-client
```

## Production Deployment

### AWS Deployment

#### 1. EC2 Setup

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd distributed-chat-app

# Install dependencies
cd server && npm ci --only=production
cd ../client && npm ci

# Build client
npm run build

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/chatapp
sudo ln -s /etc/nginx/sites-available/chatapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Start server with PM2
cd server
pm2 start server.js --name chat-server
pm2 save
pm2 startup
```

#### 3. Configure SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Heroku Deployment

#### 1. Prepare Application

Create `Procfile` in root:

```
web: cd server && npm start
```

#### 2. Deploy

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

### DigitalOcean Deployment

#### 1. Create Droplet

- Choose Ubuntu 20.04 LTS
- Select appropriate size (2GB RAM minimum)
- Add SSH key

#### 2. Setup Application

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Follow EC2 setup steps above
```

#### 3. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Kubernetes Deployment

### 1. Create Kubernetes Manifests

`k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-server
  template:
    metadata:
      labels:
        app: chat-server
    spec:
      containers:
      - name: chat-server
        image: your-registry/chat-server:latest
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: jwt-secret
```

### 2. Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services

# Scale deployment
kubectl scale deployment chat-server --replicas=5
```

## Database Setup

### MongoDB Replica Set

```bash
# Start MongoDB instances
mongod --replSet rs0 --port 27017 --dbpath /data/db1
mongod --replSet rs0 --port 27018 --dbpath /data/db2
mongod --replSet rs0 --port 27019 --dbpath /data/db3

# Initialize replica set
mongo --port 27017
> rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
```

### Redis Cluster

```bash
# Create Redis cluster
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1
```

## Monitoring Setup

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Generate startup script
pm2 startup
pm2 save
```

### Application Monitoring

Install monitoring tools:

```bash
# Install New Relic
npm install newrelic --save

# Install Datadog
npm install dd-trace --save
```

## Backup Strategy

### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/chatapp" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/chatapp" /backup/20231201
```

### Automated Backups

Create cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/bin/mongodump --uri="mongodb://localhost:27017/chatapp" --out=/backup/$(date +\%Y\%m\%d)
```

## Performance Optimization

### 1. Enable Compression

```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

### 2. Configure Caching

```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();
```

### 3. Database Indexing

```javascript
// Create indexes
db.messages.createIndex({ chat: 1, createdAt: -1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.chats.createIndex({ participants: 1 });
```

## Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable helmet middleware
- [ ] Validate all inputs
- [ ] Sanitize user data
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Implement logging and monitoring

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check connection
   mongo --eval "db.adminCommand('ping')"
   ```

2. **Redis Connection Error**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

4. **WebSocket Connection Failed**
   - Check CORS configuration
   - Verify WebSocket proxy settings in Nginx
   - Check firewall rules

## Scaling Guidelines

### When to Scale

- CPU usage > 70% consistently
- Memory usage > 80%
- Response time > 500ms
- WebSocket connections > 10,000 per server

### Horizontal Scaling

```bash
# Add more server instances
pm2 scale chat-server +3

# Or with Docker
docker-compose up -d --scale server=5
```

### Vertical Scaling

- Upgrade server resources (CPU, RAM)
- Optimize database queries
- Implement caching
- Use CDN for static assets

## Maintenance

### Regular Tasks

- Monitor server health
- Check error logs
- Review performance metrics
- Update dependencies
- Backup database
- Clean old files
- Rotate logs

### Updates

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit
npm audit fix

# Update PM2
pm2 update
```

## Support

For issues and questions:
- Check logs: `pm2 logs` or `docker-compose logs`
- Review documentation
- Check GitHub issues
- Contact support team
