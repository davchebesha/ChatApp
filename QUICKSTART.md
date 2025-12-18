# Quick Start Guide

Get the chat application running in 5 minutes!

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 16+ installed
- ✅ MongoDB installed and running
- ✅ A code editor (VS Code recommended)
- ✅ Command Prompt or PowerShell (Windows)

## Step-by-Step Installation

### 1. Open Command Prompt

Press `Win + R`, type `cmd`, and press Enter.

### 2. Navigate to Project Folder

```cmd
cd path\to\distributed-chat-app
```

Replace `path\to\distributed-chat-app` with your actual project path.

### 3. Install Dependencies

```cmd
REM Install server dependencies
cd server
npm install

REM Install client dependencies
cd ..\client
npm install

REM Go back to root
cd ..
```

This will take 2-3 minutes to download all packages.

### 4. Configure Environment

```cmd
cd server
copy .env.example .env
```

Open `server\.env` in Notepad and make sure it looks like this:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=my_super_secret_key_12345
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Create Upload Folder

```cmd
mkdir uploads
cd ..
```

### 6. Start MongoDB

Open a **NEW** Command Prompt window and run:

```cmd
mongod
```

Leave this window open. You should see "Waiting for connections on port 27017".

### 7. Start the Backend Server

Open **ANOTHER** Command Prompt window and run:

```cmd
cd path\to\distributed-chat-app\server
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
📡 WebSocket server ready
🎥 WebRTC signaling server ready
```

Leave this window open.

### 8. Start the Frontend

Open **ONE MORE** Command Prompt window and run:

```cmd
cd path\to\distributed-chat-app\client
npm start
```

Your browser will automatically open to `http://localhost:3000`

## First Time Usage

### Create Your First Account

1. Click **"Register"** on the login page
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click **"Register"**
4. You'll be automatically logged in!

### Create a Second Account (for testing)

1. Open a **new incognito/private browser window**
2. Go to `http://localhost:3000`
3. Register another account:
   - Username: `testuser2`
   - Email: `test2@example.com`
   - Password: `password123`

### Start Chatting!

1. In the first browser window, click **"New Chat"**
2. Search for `testuser2`
3. Click on the user to create a chat
4. Type a message and press Enter
5. Switch to the second browser window
6. You should see the message appear in real-time!

## Common Commands

### Stop the Application

Press `Ctrl + C` in each Command Prompt window (server and client).

### Restart the Application

```cmd
REM In server window
npm run dev

REM In client window
npm start
```

### Clear Database (Start Fresh)

```cmd
REM Stop MongoDB (Ctrl + C in MongoDB window)
REM Delete data folder (be careful!)
rmdir /s /q C:\data\db
mkdir C:\data\db
mongod
```

## Troubleshooting

### "MongoDB connection error"

**Solution:** Make sure MongoDB is running in a separate window.

```cmd
mongod
```

### "Port 5000 already in use"

**Solution:** Kill the process using port 5000.

```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### "npm command not found"

**Solution:** Install Node.js from https://nodejs.org/ and restart Command Prompt.

### "Cannot find module"

**Solution:** Reinstall dependencies.

```cmd
cd server
rmdir /s /q node_modules
npm install

cd ..\client
rmdir /s /q node_modules
npm install
```

### Browser doesn't open automatically

**Solution:** Manually open your browser and go to `http://localhost:3000`

## Testing Features

### Test Messaging
1. Create two accounts in different browsers
2. Start a chat between them
3. Send messages back and forth
4. Try editing a message (hover and click edit)
5. Try deleting a message
6. Try adding reactions (hover over message)

### Test Video Call
1. In a chat, click the video camera icon
2. Accept the call in the other browser
3. You should see both video streams
4. Try muting/unmuting
5. Try turning camera on/off
6. Try screen sharing

### Test File Upload
1. Click the paperclip icon in chat
2. Select an image or document
3. Send the file
4. Click to preview/download

### Test Search
1. Click the search icon in sidebar
2. Search for users, messages, or chats
3. Click on results to navigate

### Test Notifications
1. Click the bell icon in sidebar
2. View your notifications
3. Mark as read or delete

### Test Settings
1. Click the settings icon
2. Update your profile
3. Upload an avatar
4. Change notification preferences

## Next Steps

- ✅ Explore all features
- ✅ Read the full documentation in README.md
- ✅ Check out FEATURES.md for complete feature list
- ✅ Review API_DOCUMENTATION.md for API details
- ✅ Learn about architecture in ARCHITECTURE.md

## Need Help?

- Check TESTING.md for detailed testing procedures
- Check DEPLOYMENT.md for production deployment
- Review the code comments for implementation details

## Summary

You now have a fully functional chat application running locally! 

**Three windows should be open:**
1. MongoDB (mongod)
2. Backend Server (npm run dev)
3. Frontend (npm start)

**Browser should show:**
- Login/Register page at http://localhost:3000

Happy chatting! 🎉
