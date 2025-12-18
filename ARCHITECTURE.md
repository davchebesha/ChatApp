# Distributed Chat Application - Architecture Documentation

## System Architecture Overview

This document describes the distributed architecture of the chat application, including microservices design, scalability strategies, and fault tolerance mechanisms.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer (Nginx)                    │
│                    (Round Robin / Least Connections)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │ Server  │     │ Server  │    │ Server  │
    │ Node 1  │     │ Node 2  │    │ Node 3  │
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │ MongoDB │     │  Redis  │    │ Message │
    │ Replica │     │  Cache  │    │  Queue  │
    │   Set   │     │         │    │ (Redis) │
    └─────────┘     └─────────┘    └─────────┘
```

## Microservices Architecture

### 1. API Gateway Service
- **Purpose**: Single entry point for all client requests
- **Responsibilities**:
  - Request routing
  - Authentication/Authorization
  - Rate limiting
  - Request/Response transformation
  - API versioning

### 2. Authentication Service
- **Purpose**: User authentication and authorization
- **Responsibilities**:
  - User registration
  - Login/Logout
  - JWT token generation and validation
  - Password hashing and verification
  - Session management

### 3. User Service
- **Purpose**: User profile management
- **Responsibilities**:
  - Profile CRUD operations
  - Avatar upload
  - User search
  - Contact management
  - Block/Unblock users

### 4. Chat Service
- **Purpose**: Chat and conversation management
- **Responsibilities**:
  - Create/Update/Delete chats
  - Group management
  - Channel management
  - Participant management
  - Chat metadata

### 5. Message Service
- **Purpose**: Message handling and storage
- **Responsibilities**:
  - Send/Receive messages
  - Edit/Delete messages
  - Message reactions
  - Message search
  - Message delivery status

### 6. File Service
- **Purpose**: File upload and storage
- **Responsibilities**:
  - File upload
  - File download
  - File validation
  - Storage management
  - CDN integration

### 7. WebSocket Service
- **Purpose**: Real-time communication
- **Responsibilities**:
  - WebSocket connection management
  - Real-time message delivery
  - Typing indicators
  - Online status
  - Presence management

### 8. WebRTC Signaling Service
- **Purpose**: Voice/Video call signaling
- **Responsibilities**:
  - Call initiation
  - ICE candidate exchange
  - Offer/Answer exchange
  - Call state management
  - Screen sharing coordination

### 9. Notification Service
- **Purpose**: Push notifications
- **Responsibilities**:
  - Desktop notifications
  - Email notifications
  - SMS notifications (optional)
  - Notification preferences
  - Notification history

## Database Architecture

### MongoDB Schema Design

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  avatar: String,
  bio: String,
  status: Enum['online', 'offline', 'away', 'busy'],
  lastSeen: Date,
  blockedUsers: [ObjectId],
  contacts: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### Chats Collection
```javascript
{
  _id: ObjectId,
  name: String,
  type: Enum['private', 'group', 'channel'],
  participants: [ObjectId],
  admins: [ObjectId],
  creator: ObjectId,
  avatar: String,
  description: String,
  lastMessage: ObjectId,
  pinnedBy: [ObjectId],
  mutedBy: [{user: ObjectId, until: Date}],
  archivedBy: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  chat: ObjectId,
  sender: ObjectId,
  content: String,
  type: Enum['text', 'image', 'video', 'audio', 'file', 'voice'],
  file: {
    url: String,
    name: String,
    size: Number,
    mimeType: String
  },
  replyTo: ObjectId,
  forwardedFrom: ObjectId,
  reactions: [{user: ObjectId, emoji: String}],
  readBy: [{user: ObjectId, readAt: Date}],
  deliveredTo: [{user: ObjectId, deliveredAt: Date}],
  edited: Boolean,
  editedAt: Date,
  deleted: Boolean,
  deletedAt: Date,
  deletedFor: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Database Replication

**MongoDB Replica Set Configuration:**
- 1 Primary node (read/write)
- 2 Secondary nodes (read-only)
- Automatic failover
- Data redundancy

**Benefits:**
- High availability
- Data durability
- Read scalability
- Zero downtime maintenance

## Scalability Strategies

### Horizontal Scaling

1. **Application Servers**
   - Multiple Node.js instances
   - Load balanced with Nginx
   - Stateless design
   - Session stored in Redis

2. **Database Sharding**
   - Shard by user ID
   - Shard by chat ID
   - Consistent hashing
   - Automatic rebalancing

3. **WebSocket Scaling**
   - Redis Pub/Sub for message broadcasting
   - Sticky sessions for WebSocket connections
   - Multiple WebSocket servers
   - Connection pooling

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching
- Use CDN for static assets

### Caching Strategy

**Redis Cache Layers:**

1. **Session Cache**
   - User sessions
   - JWT tokens
   - TTL: 7 days

2. **Data Cache**
   - User profiles
   - Chat metadata
   - Recent messages
   - TTL: 1 hour

3. **Query Cache**
   - Search results
   - User lists
   - TTL: 5 minutes

## Load Balancing

### Nginx Configuration

```nginx
upstream chat_servers {
    least_conn;
    server server1:5000 weight=1;
    server server2:5000 weight=1;
    server server3:5000 weight=1;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://chat_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Load Balancing Algorithms

1. **Round Robin**: Distribute requests evenly
2. **Least Connections**: Route to server with fewest connections
3. **IP Hash**: Consistent routing based on client IP
4. **Weighted**: Distribute based on server capacity

## Message Queue System

### Redis Pub/Sub

**Purpose**: Distribute messages across multiple server instances

**Channels:**
- `chat:{chatId}` - Chat-specific messages
- `user:{userId}` - User-specific notifications
- `global` - System-wide broadcasts

**Flow:**
```
Client → Server 1 → Redis Pub → All Servers → Connected Clients
```

## WebRTC Architecture

### Signaling Flow

```
Caller                  Signaling Server              Callee
  │                            │                         │
  ├─────── call_user ─────────▶│                         │
  │                            ├──── incoming_call ─────▶│
  │                            │                         │
  │                            │◀──── accept_call ───────┤
  │◀──── call_accepted ────────┤                         │
  │                            │                         │
  ├──── ice_candidate ────────▶│──── ice_candidate ─────▶│
  │◀─── ice_candidate ─────────┤◀─── ice_candidate ──────┤
  │                            │                         │
  ├═══════ Direct P2P Connection ═══════════════════════▶│
```

### STUN/TURN Servers

- **STUN**: Discover public IP address
- **TURN**: Relay traffic when P2P fails
- Fallback mechanism for NAT traversal

## Fault Tolerance

### Strategies

1. **Health Checks**
   - Periodic server health checks
   - Automatic removal of unhealthy nodes
   - Graceful degradation

2. **Circuit Breaker Pattern**
   - Prevent cascading failures
   - Automatic retry with exponential backoff
   - Fallback responses

3. **Database Failover**
   - Automatic primary election
   - Read from secondaries
   - Write-ahead logging

4. **Message Persistence**
   - Queue messages during downtime
   - Retry failed deliveries
   - Dead letter queue

### Error Handling

- Graceful error responses
- Logging and monitoring
- Alert system for critical errors
- Automatic recovery mechanisms

## Security Measures

1. **Authentication**
   - JWT tokens
   - Secure password hashing (bcrypt)
   - Token expiration and refresh

2. **Authorization**
   - Role-based access control
   - Resource-level permissions
   - API rate limiting

3. **Data Protection**
   - HTTPS/TLS encryption
   - WebSocket secure (WSS)
   - Database encryption at rest
   - Input validation and sanitization

4. **DDoS Protection**
   - Rate limiting
   - IP whitelisting/blacklisting
   - Request throttling
   - Cloudflare integration

## Monitoring and Logging

### Metrics to Monitor

- Request rate and latency
- Error rates
- Database query performance
- WebSocket connections
- Memory and CPU usage
- Network bandwidth

### Logging Strategy

- Centralized logging (ELK Stack)
- Log levels (ERROR, WARN, INFO, DEBUG)
- Request/Response logging
- Error tracking (Sentry)

## Deployment Strategy

### Docker Containerization

```yaml
services:
  - api-server (multiple instances)
  - websocket-server (multiple instances)
  - mongodb (replica set)
  - redis (cluster)
  - nginx (load balancer)
```

### CI/CD Pipeline

1. Code commit
2. Automated tests
3. Build Docker images
4. Push to registry
5. Deploy to staging
6. Run integration tests
7. Deploy to production
8. Health check verification

### Zero-Downtime Deployment

- Blue-green deployment
- Rolling updates
- Canary releases
- Automatic rollback on failure

## Performance Optimization

1. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Aggregation pipelines

2. **Caching**
   - Redis caching
   - Browser caching
   - CDN caching

3. **Code Optimization**
   - Async/await patterns
   - Event-driven architecture
   - Memory leak prevention
   - Efficient algorithms

4. **Network Optimization**
   - Compression (gzip)
   - Minification
   - Lazy loading
   - WebSocket for real-time data

## Future Enhancements

1. **Kubernetes Orchestration**
   - Auto-scaling
   - Self-healing
   - Service discovery
   - Configuration management

2. **Message Encryption**
   - End-to-end encryption
   - Key exchange protocols
   - Secure key storage

3. **AI Features**
   - Smart replies
   - Message translation
   - Spam detection
   - Sentiment analysis

4. **Analytics**
   - User behavior tracking
   - Usage statistics
   - Performance metrics
   - Business intelligence
