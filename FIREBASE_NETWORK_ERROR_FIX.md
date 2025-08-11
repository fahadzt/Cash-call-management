# Firebase Network Error Fix Guide

## Error: `Firebase: Error (auth/network-request-failed)`

This error occurs when Firebase cannot establish a network connection to its services. Here are the solutions:

## 🔧 Quick Fixes

### 1. **Use Production Firebase (Recommended)**
Edit `.env.local` and set:
```bash
FIREBASE_USE_EMULATOR=false
```

### 2. **Start Firebase Emulators**
If you want to use emulators, run:
```bash
firebase emulators:start --only auth,firestore
```

### 3. **Check Internet Connection**
Ensure you have a stable internet connection.

## 🚀 Step-by-Step Solution

### Option A: Use Production Firebase (Easiest)

1. **Edit `.env.local`**:
   ```bash
   # Change this line:
   FIREBASE_USE_EMULATOR=false
   ```

2. **Restart the development server**:
   ```bash
   npm run dev
   ```

### Option B: Use Firebase Emulators

1. **Start Firebase emulators**:
   ```bash
   firebase emulators:start --only auth,firestore
   ```

2. **Keep `.env.local` as is**:
   ```bash
   FIREBASE_USE_EMULATOR=true
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🔍 Troubleshooting Steps

### 1. **Check Network Connectivity**
```bash
# Test basic internet connectivity
ping google.com

# Test Firebase domain
ping cash-call-management-app.firebaseapp.com
```

### 2. **Verify Firebase Project**
- Ensure the Firebase project `cash-call-management-app` exists
- Check if the API key is valid
- Verify the project is not suspended

### 3. **Check Firewall/Proxy**
- Ensure no firewall is blocking Firebase connections
- Check if you're behind a corporate proxy
- Try using a different network

### 4. **Clear Browser Cache**
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Test in a different browser

## 🛠️ Advanced Solutions

### 1. **Use Different Firebase Project**
If the current project has issues, create a new Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Update the configuration in `.env.local`

### 2. **Fallback to Mock Authentication**
The app has a mock authentication system as fallback. If Firebase continues to fail, the app will use mock data.

### 3. **Check Firebase Rules**
Ensure Firestore security rules allow read/write access:
```javascript
// In firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development only
    }
  }
}
```

## 📱 Mobile/Tablet Issues

If you're testing on mobile devices:
- Ensure the device has internet access
- Check if the device can access Firebase domains
- Try using a mobile hotspot

## 🔄 Reset Everything

If nothing works, try a complete reset:

1. **Stop all servers**:
   ```bash
   # Stop development server (Ctrl+C)
   # Stop Firebase emulators (Ctrl+C)
   ```

2. **Clear cache**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Reinstall dependencies**:
   ```bash
   npm install
   ```

4. **Start fresh**:
   ```bash
   # Start Firebase emulators
   firebase emulators:start --only auth,firestore
   
   # In another terminal, start dev server
   npm run dev
   ```

## 📞 Still Having Issues?

If you continue to experience network errors:

1. **Check the browser console** for detailed error messages
2. **Check the terminal** for Firebase emulator logs
3. **Try using production Firebase** instead of emulators
4. **Contact your network administrator** if behind corporate firewall

## 🎯 Most Common Solutions

1. **Use production Firebase** (set `FIREBASE_USE_EMULATOR=false`)
2. **Ensure Firebase emulators are running** (if using emulators)
3. **Check internet connection**
4. **Clear browser cache**

The app is designed to handle these errors gracefully and will show appropriate error messages to help you resolve the issue. 