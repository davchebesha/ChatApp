# Distributed Chat Application

A full-featured, scalable chat/messaging application with real-time communication, voice/video calling, and distributed architecture.

## Features

- **Authentication**: JWT-based auth with password hashing
- **Real-Time Messaging**: One-to-one, group chats, channels
- **Media**: Voice/video calls, screen sharing, audio messages
- **File Management**: Upload/download files with preview
- **Notifications**: Real-time push notifications
- **Search**: Messages, users, groups/channels
- **Distributed Architecture**: Microservices, load balancing, scalability

## Tech Stack

- **Frontend**: React, Socket.io-client, WebRTC
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB
- **Real-Time**: WebSockets (Socket.io)
- **Media**: WebRTC (Simple-peer)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Load Balancer│────▶│  API Server │
│   (React)   │     │   (Nginx)    │     │  (Express)  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            │                │
            ┌───────▼────────┐         ┌────────▼──────┐  ┌──────▼──────┐
            │ WebSocket      │         │   MongoDB     │  │    Redis    │
            │ Server         │         │   (Replica)   │  │   (Queue)   │
            └───────┬────────┘         └───────────────┘  └─────────────┘
                    │
            ┌───────▼────────┐
            │ WebRTC Signaling│
            │    Server       │
            └─────────────────┘
```

## 🚀 Quick Start

**⭐ NEW USER? START HERE:** [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide!

**📚 LOOKING FOR DOCS?** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Complete documentation guide

**🎨 VISUAL OVERVIEW?** [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) - See the big picture

**📋 COMPLETE GUIDE?** [COMPLETE_PROJECT_GUIDE.md](COMPLETE_PROJECT_GUIDE.md) - Everything in one place

## Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables:

Create `.env` file in `/server`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
```

4. Start MongoDB:
```bash
mongod
```

5. Start the application:

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm start
```

6. Access the application at `http://localhost:3000`

## Project Structure

```
/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.js
│   └── package.json
│
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── websocket/        # Socket.io handlers
│   ├── webrtc/           # WebRTC signaling
│   └── server.js
│
└── README.md

```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/search` - Search users

### Messages
- `GET /api/messages/:chatId` - Get chat messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Chats
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create chat/group
- `PUT /api/chats/:id` - Update chat
- `DELETE /api/chats/:id` - Delete chat

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Download file

## WebSocket Events

### Client → Server
- `join_chat` - Join chat room
- `send_message` - Send message
- `typing` - User typing indicator
- `read_message` - Mark message as read

### Server → Client
- `new_message` - New message received
- `message_edited` - Message edited
- `message_deleted` - Message deleted
- `user_typing` - User typing notification
- `user_status` - User online/offline status

## WebRTC Signaling

- `call_user` - Initiate call
- `call_accepted` - Call accepted
- `ice_candidate` - Exchange ICE candidates
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `end_call` - End call

## Distributed System Design

### Microservices Architecture
1. **API Gateway**: Routes requests to appropriate services
2. **Auth Service**: Handles authentication and authorization
3. **Chat Service**: Manages messages and conversations
4. **User Service**: User profile management
5. **File Service**: File upload/download handling
6. **Notification Service**: Push notifications

### Scalability Features
- **Horizontal Scaling**: Multiple server instances behind load balancer
- **Database Replication**: MongoDB replica sets for high availability
- **Caching**: Redis for session management and message queuing
- **CDN**: Static assets and file storage
- **Message Queue**: Redis pub/sub for distributed WebSocket communication

### Fault Tolerance
- Health checks for all services
- Automatic failover with replica sets
- Circuit breaker pattern for service calls
- Graceful degradation

## Security Best Practices

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- File upload validation
- XSS protection
- SQL injection prevention (using Mongoose)
- HTTPS in production

## Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Production Considerations
- Use environment variables for secrets
- Enable HTTPS with SSL certificates
- Configure MongoDB replica sets
- Set up Redis cluster
- Use PM2 for process management
- Configure Nginx as reverse proxy
- Enable monitoring and logging

## License

MIT
