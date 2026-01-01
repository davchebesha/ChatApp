# Authentication Diagnostic Guide

## Issue: Unable to Login and Register

Based on my investigation, here are the potential causes and solutions:

## Current Status ✅
- **Server is running**: Port 5001 ✅
- **Client is running**: Port 3000 ✅  
- **MongoDB is connected**: ✅
- **Demo user exists**: demo@nexuschat.com / demo123 ✅
- **API endpoints work**: Direct API test successful ✅
- **Routing is configured**: Login/Register routes exist ✅

## Potential Issues & Solutions

### 1. Browser Console Errors
**Check**: Open browser console (F12) and look for errors when trying to login/register

**Common Issues**:
- CORS errors
- Network connectivity issues
- JavaScript errors
- Toast notification library issues

### 2. Network Connectivity
**Test**: Visit http://localhost:3000/debug to run authentication tests

**Steps**:
1. Go to http://localhost:3000/debug
2. Click "Test API Direct" - should work
3. Click "Test Login" - should work
4. Check the results

### 3. Client-Server Communication
**Check**: Ensure both servers are running on correct ports

```bash
# Check if servers are running
netstat -an | findstr :3000
netstat -an | findstr :5001
```

### 4. Browser Cache/Storage Issues
**Solution**: Clear browser data
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Local Storage
4. Clear Session Storage
5. Refresh page

### 5. Proxy Configuration
**Check**: The client package.json has proxy set to http://localhost:5001

**If proxy isn't working**:
- Restart client server: `npm start` in client folder
- Check for port conflicts

### 6. Authentication Context Issues
**Check**: Ensure AuthProvider is wrapping the app correctly

**Debug Steps**:
1. Check if useAuth hook is accessible
2. Verify login/register functions exist
3. Check if navigation after login works

## Quick Fix Steps

### Step 1: Clear Browser Data
1. Press F12 to open DevTools
2. Go to Application tab
3. Clear all storage (Local Storage, Session Storage, Cookies)
4. Refresh the page

### Step 2: Test Direct API
1. Go to http://localhost:3000/debug
2. Run all three tests
3. Check results

### Step 3: Check Console Errors
1. Open browser console (F12)
2. Try to login with demo@nexuschat.com / demo123
3. Look for any red error messages
4. Report any errors found

### Step 4: Test Different Browser
Try logging in using a different browser or incognito mode to rule out browser-specific issues.

### Step 5: Restart Services
```bash
# Stop all processes
Ctrl+C on all running terminals

# Restart server
cd server
npm run dev

# Restart client (new terminal)
cd client  
npm start
```

## Expected Behavior
1. **Login Page**: Should show form with email/password fields
2. **Demo Login**: Should work with demo@nexuschat.com / demo123
3. **After Login**: Should redirect to /chat page
4. **Register**: Should create new user and redirect to /chat

## Debug Information to Collect
If issues persist, please provide:
1. Browser console errors (F12 → Console tab)
2. Network tab errors (F12 → Network tab)
3. Results from /debug page tests
4. Browser and OS version

## Contact for Support
If none of these solutions work, the issue might be:
- Firewall blocking connections
- Antivirus software interference  
- Windows Defender blocking localhost connections
- Port conflicts with other applications

Let me know the specific error messages you see, and I can provide more targeted solutions.