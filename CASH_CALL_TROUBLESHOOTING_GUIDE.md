# 🔧 Cash Call Creation Troubleshooting Guide

## 🚨 **The Problem**

You're creating a cash call in your affiliate account, but it doesn't appear in the dashboard. This means the cash call creation is failing silently or there's a filtering issue.

## 🧪 **Step-by-Step Debugging**

### **Step 1: Use the Simple Test Page**

1. **Visit:** http://localhost:3001/simple-cash-call-test
2. **Login with your affiliate account**
3. **Check the user information** to verify:
   - Role is set to `affiliate`
   - Affiliate company ID is assigned
   - You can see available affiliates

### **Step 2: Check Browser Console**

Open your browser's developer tools (F12) and look for these debug messages:

```
=== USER INFO ===
User ID: ...
User Email: ...
User Role: affiliate
Affiliate Company ID: ...

=== AFFILIATES ===
Total affiliates: X
- Company Name (CODE): ID

=== CASH CALLS ===
Total cash calls visible: X
```

### **Step 3: Test Cash Call Creation**

1. **Click "Create Test Cash Call"** button
2. **Watch the console** for these messages:
   ```
   === CREATING TEST CASH CALL ===
   Using affiliate: {id: "...", name: "...", ...}
   Creating cash call with data: {...}
   ✅ Cash call created successfully with ID: ...
   === RELOADING DATA ===
   Updated cash calls count: X
   ```

### **Step 4: Check for Errors**

Look for error messages in the console:
- `❌ Error creating cash call: ...`
- `Permission denied`
- `User not authenticated`
- `No affiliates found`

## 🔍 **Common Issues & Solutions**

### **Issue 1: User Not Authenticated**

**Symptoms:**
- Page shows "Not authenticated"
- Console shows authentication errors

**Solution:**
1. Make sure you're logged in
2. Check if your session is valid
3. Try logging out and back in

### **Issue 2: User Role Not Set to 'affiliate'**

**Symptoms:**
- User role shows as 'unknown' or something else
- Cash calls don't appear after creation

**Solution:**
1. Check your user profile in Firebase Console
2. Update the role to 'affiliate'
3. Make sure `affiliate_company_id` is set

### **Issue 3: No Affiliate Company ID**

**Symptoms:**
- Affiliate Company ID shows as 'None'
- Cash calls are created but not visible

**Solution:**
1. Assign the correct affiliate company ID to your user
2. Make sure the affiliate exists in the database

### **Issue 4: No Affiliates in Database**

**Symptoms:**
- "No affiliates found" error
- Available Affiliates shows 0

**Solution:**
1. Check if affiliates exist in Firebase
2. Create affiliates if they don't exist

### **Issue 5: Cash Call Creation Fails**

**Symptoms:**
- Error when clicking "Create Test Cash Call"
- Console shows creation errors

**Solution:**
1. Check Firebase permissions
2. Verify Firebase connection
3. Check if using production Firebase (not emulators)

## 🛠️ **Manual Database Checks**

### **Check User Profile in Firebase Console:**

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the 'users' collection
4. Find your user document
5. Verify these fields:
   ```json
   {
     "role": "affiliate",
     "affiliate_company_id": "YOUR_AFFILIATE_ID",
     "email": "your-email@example.com"
   }
   ```

### **Check Affiliates in Firebase Console:**

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the 'affiliates' collection
4. Verify your affiliate exists:
   ```json
   {
     "name": "Your Company Name",
     "company_code": "YOUR_CODE",
     "status": "active"
   }
   ```

### **Check Cash Calls in Firebase Console:**

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the 'cash_calls' collection
4. Look for recently created cash calls
5. Verify the `affiliate_id` matches your company

## 🚀 **Quick Fixes**

### **If Using Firebase Emulators:**

```bash
# Stop emulators and use production
export FIREBASE_USE_EMULATOR=false
npm run dev:production
```

### **If User Profile Needs Update:**

```javascript
// In Firebase Console, update your user document:
{
  "role": "affiliate",
  "affiliate_company_id": "YOUR_AFFILIATE_ID"
}
```

### **If Affiliate Doesn't Exist:**

```javascript
// In Firebase Console, create affiliate document:
{
  "name": "Your Company",
  "company_code": "YOUR_CODE",
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z"
}
```

## 📞 **Testing Checklist**

### **Before Testing:**
- [ ] You're logged in with your affiliate account
- [ ] Your user role is set to 'affiliate'
- [ ] Your affiliate_company_id is assigned
- [ ] Your affiliate exists in the database
- [ ] You're using production Firebase (not emulators)

### **During Testing:**
- [ ] Visit the simple test page
- [ ] Check user information is correct
- [ ] Create a test cash call
- [ ] Verify cash call appears in the list
- [ ] Check browser console for errors

### **After Testing:**
- [ ] Cash call appears immediately after creation
- [ ] Cash call persists after page refresh
- [ ] Cash call appears in admin dashboard
- [ ] No error messages in console

## 🔧 **Advanced Debugging**

### **Check Firebase Connection:**

```javascript
// In browser console, test Firebase connection:
import { db } from './lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

// Test reading affiliates
const affiliatesRef = collection(db, 'affiliates')
const snapshot = await getDocs(affiliatesRef)
console.log('Affiliates found:', snapshot.size)
```

### **Check User Permissions:**

```javascript
// Test if user can read/write
import { doc, getDoc, setDoc } from 'firebase/firestore'

// Test reading user profile
const userRef = doc(db, 'users', 'YOUR_USER_ID')
const userDoc = await getDoc(userRef)
console.log('User profile:', userDoc.data())
```

## 📝 **Summary**

The most common causes of cash calls not appearing are:

1. **User role not set to 'affiliate'**
2. **No affiliate_company_id assigned**
3. **Affiliate doesn't exist in database**
4. **Using Firebase emulators (ephemeral data)**
5. **Firebase permissions issues**

Use the simple test page to identify the specific issue and follow the solutions above to fix it.
