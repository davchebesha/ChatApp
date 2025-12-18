# API Documentation

Complete API reference for the distributed chat application.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "",
    "status": "offline"
  }
}
```

**Errors:**
- `400` - Validation error or user already exists
- `500` - Server error

---

### Login

Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "/uploads/avatar.jpg",
    "status": "online",
    "bio": "Hello, I'm John!"
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials
- `500` - Server error

---

### Logout

Logout current user.

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User

Get authenticated user information.

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "/uploads/avatar.jpg",
    "status": "online",
    "bio": "Hello, I'm John!",
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
}
```

---

## User Endpoints

### Get User Profile

Get user profile by ID.

**Endpoint:** `GET /users/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "avatar": "/uploads/avatar.jpg",
    "status": "online",
    "bio": "Hello, I'm John!",
    "lastSeen": "2023-12-01T10:00:00.000Z"
  }
}
```

**Errors:**
- `404` - User not found

---

### Update Profile

Update current user profile.

**Endpoint:** `PUT /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "johndoe_updated",
  "bio": "New bio text",
  "status": "away"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe_updated",
    "bio": "New bio text",
    "status": "away"
  }
}
```

---

### Upload Avatar

Upload user avatar image.

**Endpoint:** `POST /users/avatar`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** Form data with `avatar` field

**Response:** `200 OK`
```json
{
  "success": true,
  "avatar": "/uploads/avatar-123456.jpg"
}
```

**Errors:**
- `400` - No file uploaded or invalid file type

---

### Search Users

Search for users by username or email.

**Endpoint:** `GET /users/search?query=john`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `query` (required) - Search term

**Response:** `200 OK`
```json
{
  "success": true,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "/uploads/avatar.jpg",
      "status": "online"
    }
  ]
}
```

---

### Block User

Block a user.

**Endpoint:** `POST /users/block/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### Unblock User

Unblock a user.

**Endpoint:** `DELETE /users/block/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

## Chat Endpoints

### Get All Chats

Get all chats for current user.

**Endpoint:** `GET /chats`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "chats": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "private",
      "participants": [
        {
          "id": "507f1f77bcf86cd799439012",
          "username": "janedoe",
          "avatar": "/uploads/avatar2.jpg",
          "status": "online"
        }
      ],
      "lastMessage": {
        "id": "507f1f77bcf86cd799439013",
        "content": "Hello!",
        "createdAt": "2023-12-01T10:00:00.000Z"
      },
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  ]
}
```

---

### Create Chat

Create a new chat (private or group).

**Endpoint:** `POST /chats`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "group",
  "participants": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "name": "My Group",
  "description": "Group description"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "chat": {
    "id": "507f1f77bcf86cd799439011",
    "type": "group",
    "name": "My Group",
    "description": "Group description",
    "participants": [...],
    "creator": "507f1f77bcf86cd799439010",
    "admins": ["507f1f77bcf86cd799439010"],
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
}
```

---

### Update Chat

Update chat information (name, description, avatar).

**Endpoint:** `PUT /chats/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "chat": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Group Name",
    "description": "Updated description"
  }
}
```

**Errors:**
- `403` - Not authorized (not admin)
- `404` - Chat not found

---

### Add Participants

Add participants to group chat.

**Endpoint:** `POST /chats/:id/participants`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "participants": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "chat": {
    "id": "507f1f77bcf86cd799439011",
    "participants": [...]
  }
}
```

---

### Remove Participant

Remove participant from group chat.

**Endpoint:** `DELETE /chats/:id/participants`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439014"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "chat": {
    "id": "507f1f77bcf86cd799439011",
    "participants": [...]
  }
}
```

---

### Pin/Unpin Chat

Toggle pin status for a chat.

**Endpoint:** `POST /chats/:id/pin`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "pinned": true
}
```

---

### Archive/Unarchive Chat

Toggle archive status for a chat.

**Endpoint:** `POST /chats/:id/archive`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "archived": true
}
```

---

### Delete Chat

Delete a chat (creator only).

**Endpoint:** `DELETE /chats/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

**Errors:**
- `403` - Not authorized (not creator)

---

## Message Endpoints

### Get Messages

Get messages for a specific chat.

**Endpoint:** `GET /messages/:chatId?page=1&limit=50`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Messages per page (default: 50)

**Response:** `200 OK`
```json
{
  "success": true,
  "messages": [
    {
      "id": "507f1f77bcf86cd799439011",
      "chat": "507f1f77bcf86cd799439010",
      "sender": {
        "id": "507f1f77bcf86cd799439012",
        "username": "johndoe",
        "avatar": "/uploads/avatar.jpg"
      },
      "content": "Hello!",
      "type": "text",
      "reactions": [],
      "readBy": [],
      "edited": false,
      "deleted": false,
      "createdAt": "2023-12-01T10:00:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1
}
```

---

### Send Message

Send a new message.

**Endpoint:** `POST /messages`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (if sending file)

**Request Body:**
```json
{
  "chatId": "507f1f77bcf86cd799439010",
  "content": "Hello, how are you?",
  "type": "text",
  "replyTo": "507f1f77bcf86cd799439011"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439012",
    "chat": "507f1f77bcf86cd799439010",
    "sender": {...},
    "content": "Hello, how are you?",
    "type": "text",
    "replyTo": "507f1f77bcf86cd799439011",
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
}
```

---

### Edit Message

Edit an existing message.

**Endpoint:** `PUT /messages/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439012",
    "content": "Updated message content",
    "edited": true,
    "editedAt": "2023-12-01T10:05:00.000Z"
  }
}
```

**Errors:**
- `403` - Not authorized (not sender)
- `404` - Message not found

---

### Delete Message

Delete a message.

**Endpoint:** `DELETE /messages/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "deleteForEveryone": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### Add Reaction

Add reaction to a message.

**Endpoint:** `POST /messages/:id/reaction`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439012",
    "reactions": [
      {
        "user": "507f1f77bcf86cd799439010",
        "emoji": "👍"
      }
    ]
  }
}
```

---

### Search Messages

Search messages by content.

**Endpoint:** `GET /messages/search?query=hello&chatId=507f1f77bcf86cd799439010`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `query` (required) - Search term
- `chatId` (optional) - Limit search to specific chat

**Response:** `200 OK`
```json
{
  "success": true,
  "messages": [
    {
      "id": "507f1f77bcf86cd799439012",
      "content": "Hello, how are you?",
      "sender": {...},
      "chat": {...},
      "createdAt": "2023-12-01T10:00:00.000Z"
    }
  ]
}
```

---

## File Endpoints

### Upload File

Upload a file.

**Endpoint:** `POST /files/upload`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:** Form data with `file` field

**Response:** `200 OK`
```json
{
  "success": true,
  "file": {
    "url": "/uploads/file-123456.pdf",
    "name": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  }
}
```

**Errors:**
- `400` - No file uploaded or invalid file type
- `413` - File too large

---

### Download File

Download a file.

**Endpoint:** `GET /files/:filename`

**Headers:** `Authorization: Bearer <token>`

**Response:** File download

**Errors:**
- `404` - File not found

---

### Delete File

Delete a file.

**Endpoint:** `DELETE /files/:filename`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## WebSocket Events

### Client → Server Events

#### join_chats
Join multiple chat rooms.

**Payload:**
```javascript
socket.emit('join_chats', ['chatId1', 'chatId2', 'chatId3']);
```

#### join_chat
Join a specific chat room.

**Payload:**
```javascript
socket.emit('join_chat', 'chatId');
```

#### send_message
Send a message.

**Payload:**
```javascript
socket.emit('send_message', {
  chatId: 'chatId',
  content: 'Hello!',
  type: 'text',
  replyTo: 'messageId'
});
```

#### typing
Send typing indicator.

**Payload:**
```javascript
socket.emit('typing', {
  chatId: 'chatId',
  isTyping: true
});
```

#### read_message
Mark message as read.

**Payload:**
```javascript
socket.emit('read_message', {
  messageId: 'messageId',
  chatId: 'chatId'
});
```

#### edit_message
Edit a message.

**Payload:**
```javascript
socket.emit('edit_message', {
  messageId: 'messageId',
  content: 'Updated content',
  chatId: 'chatId'
});
```

#### delete_message
Delete a message.

**Payload:**
```javascript
socket.emit('delete_message', {
  messageId: 'messageId',
  chatId: 'chatId',
  deleteForEveryone: true
});
```

#### add_reaction
Add reaction to message.

**Payload:**
```javascript
socket.emit('add_reaction', {
  messageId: 'messageId',
  emoji: '👍',
  chatId: 'chatId'
});
```

---

### Server → Client Events

#### new_message
Receive new message.

**Payload:**
```javascript
socket.on('new_message', (message) => {
  // Handle new message
});
```

#### user_typing
User typing notification.

**Payload:**
```javascript
socket.on('user_typing', ({ userId, username, chatId, isTyping }) => {
  // Show/hide typing indicator
});
```

#### message_edited
Message edited notification.

**Payload:**
```javascript
socket.on('message_edited', (message) => {
  // Update message in UI
});
```

#### message_deleted
Message deleted notification.

**Payload:**
```javascript
socket.on('message_deleted', ({ messageId, deleteForEveryone }) => {
  // Remove or hide message
});
```

#### reaction_added
Reaction added notification.

**Payload:**
```javascript
socket.on('reaction_added', ({ messageId, userId, emoji }) => {
  // Update message reactions
});
```

#### user_status
User status change.

**Payload:**
```javascript
socket.on('user_status', ({ userId, status, lastSeen }) => {
  // Update user status in UI
});
```

---

## WebRTC Signaling Events

### call_user
Initiate a call.

**Payload:**
```javascript
socket.emit('call_user', {
  to: 'userId',
  from: 'myUserId',
  offer: rtcOffer,
  callType: 'video'
});
```

### incoming_call
Receive incoming call.

**Payload:**
```javascript
socket.on('incoming_call', ({ callId, from, offer, callType }) => {
  // Show incoming call UI
});
```

### accept_call
Accept a call.

**Payload:**
```javascript
socket.emit('accept_call', {
  callId: 'callId',
  answer: rtcAnswer,
  to: 'userId'
});
```

### call_accepted
Call accepted notification.

**Payload:**
```javascript
socket.on('call_accepted', ({ callId, answer, from }) => {
  // Establish connection
});
```

### ice_candidate
Exchange ICE candidates.

**Payload:**
```javascript
socket.emit('ice_candidate', {
  to: 'userId',
  candidate: iceCandidate
});

socket.on('ice_candidate', ({ from, candidate }) => {
  // Add ICE candidate
});
```

### end_call
End a call.

**Payload:**
```javascript
socket.emit('end_call', {
  callId: 'callId',
  to: 'userId'
});

socket.on('call_ended', ({ callId, from }) => {
  // Close connection
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `413` - Payload Too Large
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate limited:
- Authentication: 5 requests per minute
- General API: 100 requests per minute
- File uploads: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response includes:**
```json
{
  "data": [...],
  "totalPages": 10,
  "currentPage": 1,
  "totalItems": 500
}
```
