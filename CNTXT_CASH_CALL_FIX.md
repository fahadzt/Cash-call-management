# 🔧 CNTXT Cash Call Persistence Fix

## 🚨 **The Problem**

You're trying to create a cash call in a CNTXT account, but the cash call doesn't persist in the dashboard after refresh. This means the cash call is being created but not showing up when you reload the page.

## ✅ **Fixes Applied**

I've made several improvements to fix this issue:

### **1. Fixed Cash Call Creation Process**

**Before:** The dashboard was manually adding the new cash call to local state, which could cause inconsistencies.

**After:** The dashboard now reloads data from the database after creating a cash call, ensuring the state matches the database.

### **2. Added Comprehensive Debugging**

Created a dedicated CNTXT debug page at: **http://localhost:3000/debug-cntxt-user**

This page will help identify:
- ✅ User role and affiliate company settings
- ✅ Whether CNTXT affiliate exists in database
- ✅ Cash call creation and persistence issues
- ✅ Filtering problems

## 🧪 **Testing Steps**

### **Step 1: Use the CNTXT Debug Page**

1. **Visit:** http://localhost:3000/debug-cntxt-user
2. **Login as your CNTXT user**
3. **Check the user information section** to verify:
   - Role is set to `affiliate`
   - Affiliate company ID is set correctly
   - CNTXT affiliate is found in database

### **Step 2: Verify CNTXT Settings**

1. **Click "Verify CNTXT Settings"** button
2. **Check the result** - it should show:
   - ✅ CNTXT settings verified correctly
   - ❌ If there are issues, it will tell you what's wrong

### **Step 3: Test Cash Call Creation**

1. **Click "Create CNTXT Test Cash Call"** button
2. **Watch the console** for debug messages
3. **Check if the cash call appears** in the list
4. **Refresh the page** to test persistence

### **Step 4: Check Browser Console**

Look for these debug messages:
```
Debug - CNTXT User Profile: { userId: "...", userRole: "affiliate", ... }
Debug - CNTXT Affiliate found: { id: "...", name: "CNTXT", ... }
Debug - Creating CNTXT cash call with affiliate: { ... }
Debug - CNTXT cash call created successfully: "..."
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: User Role Not Set to 'affiliate'**

**Problem:** User role is not set to 'affiliate'
**Solution:** Update user profile in Firebase

### **Issue 2: No affiliate_company_id Assigned**

**Problem:** User doesn't have an affiliate_company_id
**Solution:** Assign the correct CNTXT affiliate ID to the user

### **Issue 3: CNTXT Affiliate Not Found**

**Problem:** CNTXT affiliate doesn't exist in database
**Solution:** Create CNTXT affiliate in database

### **Issue 4: Firebase Emulator Issues**

**Problem:** Using Firebase emulators (ephemeral data)
**Solution:** Use production Firebase or backup data

## 🛠️ **Manual Fixes**

### **If CNTXT Affiliate Doesn't Exist:**

1. **Go to Firebase Console**
2. **Navigate to Firestore Database**
3. **Find the 'affiliates' collection**
4. **Add a new document:**
   ```json
   {
     "name": "CNTXT",
     "company_code": "CNTXT001",
     "status": "active",
     "created_at": "2024-01-15T10:00:00Z",
     "updated_at": "2024-01-15T10:00:00Z"
   }
   ```

### **If User Profile Needs Update:**

1. **Go to Firebase Console**
2. **Navigate to Firestore Database**
3. **Find the 'users' collection**
4. **Find your user document**
5. **Update the fields:**
   ```json
   {
     "role": "affiliate",
     "affiliate_company_id": "CNTXT_AFFILIATE_ID"
   }
   ```

## 🚀 **Expected Behavior After Fix**

### **CNTXT User Workflow:**

1. **Login as CNTXT user**
2. **Go to dashboard**
3. **Create a new cash call**
4. **✅ Cash call appears immediately**
5. **✅ Cash call persists after refresh**
6. **✅ Cash call appears in admin dashboard**
7. **❌ Cash call does NOT appear in other affiliate dashboards**

### **Debug Page Results:**

- **User Information:** Shows correct role and affiliate
- **Verify Settings:** Shows ✅ PASS
- **Create Test Cash Call:** Shows ✅ Success
- **Cash Calls List:** Shows the created cash calls

## 📞 **Troubleshooting**

### **Still Not Working?**

1. **Check browser console** for error messages
2. **Use the debug page** to identify specific issues
3. **Verify Firebase connection** is working
4. **Check if using production Firebase** (not emulators)

### **Console Errors to Look For:**

- `Error creating cash call: ...`
- `User not authenticated`
- `CNTXT affiliate not found`
- `Permission denied`

### **Network Issues:**

- Check if Firebase is accessible
- Verify internet connection
- Check Firebase security rules

## 📝 **Summary**

The fix ensures that:

1. **Cash calls are properly saved to the database**
2. **Dashboard reloads data after creation**
3. **CNTXT users can see their own cash calls**
4. **Data persists across page refreshes**
5. **Proper role-based access control**

Use the debug page to identify any remaining issues and verify that everything is working correctly for your CNTXT account.
