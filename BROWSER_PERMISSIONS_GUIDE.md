# Browser Permissions Guide for Video/Voice Calls

## Problem
When trying to make video or voice calls, you see the error: **"Could not access camera/microphone"**

This happens because your browser needs explicit permission to access your camera and microphone.

---

## Quick Fix (Recommended)

### Step 1: Allow Permissions When Prompted
When you click the video or voice call button, your browser will show a permission popup at the top of the page:

```
localhost:3000 wants to:
☐ Use your camera
☐ Use your microphone

[Block] [Allow]
```

**Click "Allow"** to grant permissions.

---

## If You Accidentally Clicked "Block"

### Method 1: Using the Address Bar (Easiest)

1. Look at your browser's address bar where it says `localhost:3000`
2. Click the **lock icon (🔒)** or **camera icon** on the left side
3. You'll see a dropdown menu with Camera and Microphone settings
4. Change both from "Block" to "Allow"
5. **Refresh the page** (press F5 or Ctrl+R)
6. Try the call again

### Method 2: Browser Settings

#### For Google Chrome:
1. Click the three dots (⋮) in the top-right corner
2. Go to **Settings**
3. Click **Privacy and security** in the left sidebar
4. Click **Site Settings**
5. Click **Camera** and then **Microphone**
6. Find `localhost:3000` in the "Blocked" list
7. Click the trash icon to remove it
8. Refresh the page and try again

#### For Microsoft Edge:
1. Click the three dots (⋯) in the top-right corner
2. Go to **Settings**
3. Click **Cookies and site permissions**
4. Click **Camera** and then **Microphone**
5. Find `localhost:3000` and change to "Allow"
6. Refresh the page

#### For Firefox:
1. Click the lock icon in the address bar
2. Click the arrow (>) next to "Connection secure"
3. Click **More Information**
4. Go to the **Permissions** tab
5. Find "Use the Camera" and "Use the Microphone"
6. Uncheck "Use Default" and select "Allow"
7. Close the dialog and refresh

---

## Testing Your Camera/Microphone

Before making a call, you can test if your devices work:

1. Open a new tab
2. Go to: https://webcamtests.com/
3. Click "Test my cam" to verify your camera works
4. Click "Test my mic" to verify your microphone works

---

## Common Issues

### Issue: "No camera or microphone found"
**Solution:** 
- Make sure your camera/microphone is plugged in
- Check if other apps are using it (close Zoom, Teams, Skype, etc.)
- Restart your browser

### Issue: "Camera/microphone is already in use"
**Solution:**
- Close other applications that might be using your camera (Zoom, Teams, Skype, Discord)
- Close other browser tabs that might be using the camera
- Restart your browser

### Issue: Permissions keep resetting
**Solution:**
- Make sure you're using `localhost:3000` (not `127.0.0.1:3000`)
- Clear your browser cache and cookies
- Try a different browser (Chrome, Edge, Firefox)

---

## New Features in the App

The app now includes:

1. **Better Error Messages**: You'll see exactly what went wrong and how to fix it
2. **Retry Button**: After granting permissions, click "Retry" instead of refreshing
3. **Permission Instructions**: Step-by-step guide shown in the app when permissions are denied
4. **Voice-Only Calls**: Voice calls now show a nice avatar UI instead of blank video
5. **Loading State**: Shows "Requesting camera and microphone access..." while waiting

---

## How to Use Video/Voice Calls

1. Open a chat with a user
2. Click the **video camera icon** (📹) for video call OR **phone icon** (📞) for voice call
3. **Allow permissions** when your browser asks
4. Wait for the other user to join
5. Use the controls at the bottom:
   - 🎤 Mute/Unmute microphone
   - 📹 Turn camera on/off (video calls only)
   - 🖥️ Share screen (video calls only)
   - ❌ End call

---

## Still Having Issues?

If you're still experiencing problems:

1. **Check browser console for errors:**
   - Press F12 to open Developer Tools
   - Click the "Console" tab
   - Look for red error messages
   - Share these with your developer

2. **Try a different browser:**
   - Chrome (recommended)
   - Microsoft Edge
   - Firefox

3. **Check Windows permissions:**
   - Go to Windows Settings → Privacy → Camera
   - Make sure "Allow apps to access your camera" is ON
   - Do the same for Microphone

4. **Update your browser:**
   - Make sure you're using the latest version

---

## Security Note

Your camera and microphone are only accessed when you initiate a call. The app cannot access them without your explicit permission, and you can revoke permissions at any time through your browser settings.
