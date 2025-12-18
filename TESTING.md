# Testing Guide

This document provides comprehensive testing instructions for the distributed chat application.

## Testing Overview

The application includes:
- Unit tests
- Integration tests
- End-to-end tests
- Load testing
- Security testing

## Setup Testing Environment

### Install Testing Dependencies

```bash
# Server testing dependencies
cd server
npm install --save-dev jest supertest mongodb-memory-server

# Client testing dependencies
cd ../client
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Manual Testing Steps

### 1. Authentication Testing

#### Register New User
1. Navigate to http://localhost:3000/register
2. Fill in the form:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Register"
4. Verify redirect to chat interface
5. Check JWT token in localStorage

#### Login
1. Navigate to http://localhost:3000/login
2. Enter credentials:
   - Email: test@example.com
   - Password: password123
3. Click "Login"
4. Verify successful login and redirect

#### Logout
1. Click logout button in sidebar
2. Verify redirect to login page
3. Check token removed from localStorage

### 2. User Profile Testing

#### View Profile
1. Login to application
2. Click on user avatar/settings
3. Verify profile information displayed

#### Update Profile
1. Navigate to profile settings
2. Update username or bio
3. Click save
4. Verify changes reflected immediately

#### Upload Avatar
1. Go to profile settings
2. Click on avatar upload
3. Select an image file
4. Verify avatar updated

### 3. Chat Testing

#### Create Private Chat
1. Click "New Chat" button
2. Select "Private Chat"
3. Search for a user
4. Select user and create chat
5. Verify chat appears in sidebar

#### Create Group Chat
1. Click "New Chat" button
2. Select "Group Chat"
3. Enter group name
4. Search and select multiple users
5. Create group
6. Verify group appears in sidebar

#### Send Message
1. Select a chat
2. Type message in input field
3. Press Enter or click send
4. Verify message appears in chat window
5. Check message delivered to recipient

#### Edit Message
1. Hover over your message
2. Click edit icon
3. Modify message content
4. Save changes
5. Verify "Edited" indicator appears

#### Delete Message
1. Hover over your message
2. Click delete icon
3. Choose "Delete for everyone" or "Delete for me"
4. Verify message deleted

#### React to Message
1. Hover over a message
2. Click reaction icon
3. Select emoji
4. Verify reaction appears on message

#### Reply to Message
1. Hover over a message
2. Click reply icon
3. Type reply
4. Send message
5. Verify reply indicator shown

### 4. Real-Time Features Testing

#### Typing Indicator
1. Open same chat on two devices/browsers
2. Start typing on one device
3. Verify typing indicator appears on other device
4. Stop typing
5. Verify indicator disappears

#### Online Status
1. Login on one device
2. Check user status on another device
3. Verify "Online" status shown
4. Logout
5. Verify "Offline" status shown

#### Message Delivery Status
1. Send message to offline user
2. Verify "Sent" status
3. When user comes online, verify "Delivered" status
4. When user reads message, verify "Read" status

### 5. File Upload Testing

#### Upload Image
1. Click attachment icon
2. Select image file (JPG, PNG)
3. Send message
4. Verify image preview shown
5. Click image to view full size

#### Upload Document
1. Click attachment icon
2. Select document (PDF, DOC)
3. Send message
4. Verify file name and size shown
5. Click to download

#### Upload Video
1. Click attachment icon
2. Select video file (MP4)
3. Send message
4. Verify video player shown

### 6. Voice/Video Call Testing

#### Voice Call
1. Select a chat
2. Click phone icon
3. Verify call initiated
4. On recipient device, accept call
5. Test audio quality
6. Test mute/unmute
7. End call

#### Video Call
1. Select a chat
2. Click video icon
3. Verify video call initiated
4. Accept call on recipient device
5. Test video quality
6. Test camera on/off
7. Test microphone on/off
8. End call

#### Screen Sharing
1. During video call
2. Click screen share button
3. Select screen/window to share
4. Verify screen visible to recipient
5. Stop screen sharing

### 7. Group Features Testing

#### Add Member to Group
1. Open group chat
2. Click group info
3. Click "Add Member"
4. Search and select user
5. Add to group
6. Verify member added

#### Remove Member from Group
1. Open group chat
2. Click group info
3. Select member
4. Click "Remove"
5. Verify member removed

#### Make Admin
1. Open group chat (as admin)
2. Click group info
3. Select member
4. Click "Make Admin"
5. Verify admin status granted

### 8. Search Testing

#### Search Messages
1. Click search icon
2. Enter search query
3. Verify matching messages shown
4. Click result to navigate to message

#### Search Users
1. In new chat modal
2. Enter username in search
3. Verify matching users shown
4. Select user to start chat

#### Search Chats
1. In sidebar search bar
2. Enter chat name
3. Verify matching chats filtered

### 9. Notification Testing

#### Desktop Notifications
1. Allow notifications in browser
2. Minimize or switch tab
3. Receive new message
4. Verify desktop notification appears
5. Click notification to open chat

#### In-App Notifications
1. Receive message in different chat
2. Verify notification badge on chat
3. Verify unread count updated

### 10. Chat Management Testing

#### Pin Chat
1. Right-click on chat
2. Select "Pin"
3. Verify chat moves to top
4. Unpin to restore position

#### Mute Chat
1. Right-click on chat
2. Select "Mute"
3. Verify mute icon shown
4. Receive message
5. Verify no notification sound

#### Archive Chat
1. Right-click on chat
2. Select "Archive"
3. Verify chat removed from list
4. Navigate to archived chats
5. Unarchive to restore

#### Delete Chat
1. Right-click on chat
2. Select "Delete"
3. Confirm deletion
4. Verify chat removed
5. Verify messages deleted

### 11. Block User Testing

#### Block User
1. Open user profile
2. Click "Block User"
3. Confirm action
4. Verify cannot send messages
5. Verify cannot receive messages

#### Unblock User
1. Go to settings
2. Navigate to blocked users
3. Select user
4. Click "Unblock"
5. Verify can communicate again

## Automated Testing

### Backend Unit Tests

Create `server/tests/auth.test.js`:

```javascript
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

describe('Authentication', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('Register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'testuser');
  });

  test('Login with valid credentials', async () => {
    // Create user first
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
  });
});
```

### Run Backend Tests

```bash
cd server
npm test
```

### Frontend Component Tests

Create `client/src/components/Auth/Login.test.js`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

test('renders login form', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  
  expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  expect(screen.getByText('Login')).toBeInTheDocument();
});

test('shows error on empty submit', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  
  const submitButton = screen.getByText('Login');
  fireEvent.click(submitButton);
  
  // Add assertions for error messages
});
```

### Run Frontend Tests

```bash
cd client
npm test
```

## Load Testing

### Using Artillery

Install Artillery:

```bash
npm install -g artillery
```

Create `load-test.yml`:

```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
scenarios:
  - name: "Send messages"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/messages"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            chatId: "{{ chatId }}"
            content: "Test message"
```

Run load test:

```bash
artillery run load-test.yml
```

## Performance Testing

### Metrics to Monitor

1. **Response Time**
   - API endpoints < 200ms
   - WebSocket latency < 50ms
   - Database queries < 100ms

2. **Throughput**
   - Messages per second
   - Concurrent connections
   - API requests per second

3. **Resource Usage**
   - CPU usage < 70%
   - Memory usage < 80%
   - Network bandwidth

### Tools

- **Artillery**: Load testing
- **Apache JMeter**: Performance testing
- **k6**: Load testing
- **New Relic**: APM monitoring
- **Datadog**: Infrastructure monitoring

## Security Testing

### 1. SQL Injection Testing
- Test all input fields with SQL injection payloads
- Verify proper input sanitization

### 2. XSS Testing
- Test message content with XSS scripts
- Verify proper output encoding

### 3. Authentication Testing
- Test JWT token expiration
- Test invalid tokens
- Test authorization checks

### 4. Rate Limiting Testing
- Send rapid requests
- Verify rate limiting works
- Check error responses

### 5. File Upload Testing
- Upload malicious files
- Test file size limits
- Verify file type validation

## Browser Compatibility Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Mobile Responsiveness Testing

Test on different screen sizes:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

## WebRTC Testing

### Test Scenarios

1. **Direct P2P Connection**
   - Both users on same network
   - Verify direct connection established

2. **NAT Traversal**
   - Users behind different NATs
   - Verify STUN server usage

3. **TURN Fallback**
   - Restrictive firewall scenario
   - Verify TURN relay works

4. **Network Quality**
   - Test on different network speeds
   - Verify adaptive bitrate

## Continuous Integration Testing

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd server && npm ci
          cd ../client && npm ci
      
      - name: Run backend tests
        run: cd server && npm test
      
      - name: Run frontend tests
        run: cd client && npm test
      
      - name: Build application
        run: cd client && npm run build
```

## Test Coverage

### Generate Coverage Report

```bash
# Backend coverage
cd server
npm test -- --coverage

# Frontend coverage
cd client
npm test -- --coverage
```

### Coverage Goals

- Line coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 80%

## Bug Reporting

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/videos
5. Browser/OS information
6. Console errors
7. Network logs

## Test Checklist

- [ ] All authentication flows work
- [ ] Messages send and receive correctly
- [ ] Real-time features work (typing, status)
- [ ] File uploads work for all types
- [ ] Voice/video calls connect successfully
- [ ] Group features work correctly
- [ ] Search functionality works
- [ ] Notifications appear correctly
- [ ] Chat management features work
- [ ] Mobile responsive design works
- [ ] Cross-browser compatibility verified
- [ ] Performance meets requirements
- [ ] Security vulnerabilities addressed
- [ ] Load testing passed
- [ ] All automated tests pass
