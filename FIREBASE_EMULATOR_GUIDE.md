# 🔥 Firebase Emulator Data Persistence Guide

## 🚨 **The Problem: Cash Calls Disappearing**

You're experiencing an issue where cash calls are created successfully but then disappear from the dashboard. This is happening because:

### **Root Cause: Firebase Emulator Ephemeral Storage**

Firebase emulators use **ephemeral storage** - meaning:
- ✅ Data is stored in memory during the emulator session
- ❌ Data is **lost when the emulator restarts**
- ❌ Data is **lost when the development server restarts**
- ❌ Data is **lost when the browser refreshes** (in some cases)

## 🛠️ **Solutions**

### **Solution 1: Use Firebase Production (Recommended)**

**For persistent development, use Firebase production services instead of emulators:**

1. **Remove or set the environment variable:**
   ```bash
   # In your .env.local file, either remove this line or set it to false:
   FIREBASE_USE_EMULATOR=false
   ```

2. **Or set it in your terminal:**
   ```bash
   export FIREBASE_USE_EMULATOR=false
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

**Benefits:**
- ✅ Data persists permanently
- ✅ Real-world testing environment
- ✅ No data loss on restarts

**Note:** Make sure you have proper Firebase security rules in production.

### **Solution 2: Use Data Backup Scripts**

**For development with emulators, use the backup scripts:**

1. **Export data before stopping emulators:**
   ```bash
   node scripts/export-firebase-data.js
   ```

2. **Import data when starting emulators:**
   ```bash
   node scripts/import-firebase-data.js
   ```

3. **Or import a specific backup:**
   ```bash
   node scripts/import-firebase-data.js firebase-export-2024-01-15T10-30-00-000Z.json
   ```

### **Solution 3: Automatic Backup on Emulator Start**

**Add this to your development workflow:**

1. **Before starting development:**
   ```bash
   # Start emulators
   firebase emulators:start
   
   # In another terminal, import latest backup
   node scripts/import-firebase-data.js
   ```

2. **Before stopping development:**
   ```bash
   # Export current data
   node scripts/export-firebase-data.js
   
   # Stop emulators
   # (Ctrl+C in emulator terminal)
   ```

## 🔧 **Current Configuration**

### **Firebase Setup**
- **Project:** `cash-call-management-app`
- **Emulator Ports:**
  - Firestore: `localhost:8080`
  - Auth: `localhost:9099`
  - Storage: `localhost:9199`
  - UI: `localhost:4000`

### **Environment Variables**
```bash
# To use emulators (ephemeral data):
FIREBASE_USE_EMULATOR=true

# To use production (persistent data):
FIREBASE_USE_EMULATOR=false
# or remove the variable entirely
```

## 🧪 **Testing the Fix**

### **Step 1: Verify Current Setup**
1. Check browser console for Firebase connection message
2. Look for either:
   - `⚠️ Connected to Firebase emulators - DATA WILL BE LOST ON RESTART`
   - `🚀 Using Firebase production services - Data will persist`

### **Step 2: Test Cash Call Creation**
1. Create a cash call in the dashboard
2. Verify it appears in the list
3. Refresh the page
4. Check if the cash call is still there

### **Step 3: Test Data Persistence**
1. Create several cash calls
2. Stop the development server (`Ctrl+C`)
3. Restart the development server (`npm run dev`)
4. Check if cash calls are still visible

## 📊 **Data Backup Location**

Backup files are stored in:
```
scripts/firebase-data-backup/
├── firebase-export-2024-01-15T10-30-00-000Z.json
├── firebase-export-2024-01-15T11-45-00-000Z.json
└── ...
```

## 🚀 **Recommended Development Workflow**

### **For Persistent Development:**
```bash
# 1. Set environment to use production
export FIREBASE_USE_EMULATOR=false

# 2. Start development server
npm run dev

# 3. Create and test cash calls
# Data will persist across restarts
```

### **For Testing with Emulators:**
```bash
# 1. Start emulators
firebase emulators:start

# 2. Import previous data (if any)
node scripts/import-firebase-data.js

# 3. Start development server
npm run dev

# 4. Test functionality

# 5. Export data before stopping
node scripts/export-firebase-data.js
```

## 🔍 **Troubleshooting**

### **Issue: Still seeing emulator messages**
- Check your `.env.local` file
- Restart the development server
- Clear browser cache

### **Issue: Backup scripts not working**
- Ensure Firebase CLI is installed: `npm install -g firebase-tools`
- Ensure emulators are running: `firebase emulators:start`
- Check console for connection errors

### **Issue: Production data not working**
- Verify Firebase project configuration
- Check Firebase security rules
- Ensure you have proper authentication

## 📝 **Summary**

The cash call disappearance issue is caused by Firebase emulator ephemeral storage. To fix this:

1. **For development:** Use `FIREBASE_USE_EMULATOR=false` to use production Firebase
2. **For testing:** Use the backup scripts to preserve emulator data
3. **For production:** Ensure proper Firebase security rules are in place

This will ensure your cash calls persist and are visible in the dashboard consistently.
