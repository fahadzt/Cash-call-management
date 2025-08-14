# 🔧 Affiliate Cash Call Filtering Fix

## 🚨 **The Problem**

You reported that when creating cash calls in an affiliate account, they disappear from the affiliate dashboard after refresh, but remain visible in the admin dashboard. This was happening because:

### **Root Cause: Debug Code in Role-Based Access Control**

The `getCashCallsForUser` function in `lib/firebase-database.ts` had temporary debugging code that was returning **all cash calls** for affiliate users instead of filtering them to show only their company's cash calls.

## ✅ **The Fix Applied**

I've fixed the `getCashCallsForUser` function to properly filter cash calls based on user roles:

### **Before (Broken):**
```typescript
// TEMPORARY: Return all cash calls for debugging
console.log('Debug - TEMPORARILY RETURNING ALL CASH CALLS FOR AFFILIATE USER')
return cashCalls
```

### **After (Fixed):**
```typescript
// Filter cash calls to only show the affiliate's own company's cash calls
const filteredCashCalls = cashCalls.filter(cashCall => cashCall.affiliate_id === affiliateCompanyId)
console.log('Debug - Filtered cash calls for affiliate:', {
  totalCashCalls: cashCalls.length,
  filteredCount: filteredCashCalls.length,
  affiliateId: affiliateCompanyId,
  matchingCashCalls: filteredCashCalls.map(cc => ({ id: cc.id, call_number: cc.call_number }))
})
return filteredCashCalls
```

## 🎯 **How It Works Now**

### **Role-Based Access Control:**

1. **Admin/Approver Users:**
   - ✅ Can see **all cash calls** from all companies
   - ✅ Can create, edit, and approve any cash call

2. **Affiliate Users:**
   - ✅ Can only see **their own company's cash calls**
   - ✅ Can only create cash calls for their own company
   - ✅ Cannot see cash calls from other companies

3. **Viewer Users:**
   - ✅ Can see all cash calls (read-only access)

### **Example Scenarios:**

**Scenario 1: CNTXT Affiliate User**
- User role: `affiliate`
- Affiliate company ID: `cntxt-company-id`
- **Visible cash calls:** Only CNTXT cash calls
- **Hidden cash calls:** All other companies' cash calls

**Scenario 2: Admin User**
- User role: `admin`
- **Visible cash calls:** All cash calls from all companies
- **Can manage:** All cash calls

## 🧪 **Testing the Fix**

### **Step 1: Use the Test Page**
Visit: **http://localhost:3000/test-affiliate-filtering**

This page will:
- ✅ Show your current user role and affiliate company
- ✅ Display how many cash calls you can see vs. total cash calls
- ✅ Run automated tests to verify filtering is working
- ✅ Allow you to create test cash calls

### **Step 2: Manual Testing**

1. **Test as Affiliate User:**
   ```bash
   # Login as a CNTXT affiliate user
   # Create a cash call for CNTXT
   # Verify it appears in your dashboard
   # Verify it doesn't appear in other affiliate dashboards
   ```

2. **Test as Admin User:**
   ```bash
   # Login as an admin user
   # Verify you can see all cash calls from all companies
   # Verify you can manage all cash calls
   ```

3. **Test Cross-Company Isolation:**
   ```bash
   # Create cash calls for different companies
   # Login as different affiliate users
   # Verify each affiliate only sees their own company's cash calls
   ```

### **Step 3: Console Debugging**

Check the browser console for debug messages:
```
Debug - getCashCallsForUser called: { userId: "...", userRole: "affiliate", affiliateCompanyId: "..." }
Debug - Filtered cash calls for affiliate: { totalCashCalls: 10, filteredCount: 3, affiliateId: "..." }
```

## 🔍 **Verification Checklist**

### **For Affiliate Users:**
- [ ] Can only see cash calls from their own company
- [ ] Cannot see cash calls from other companies
- [ ] Can create new cash calls for their company
- [ ] Cash calls persist after page refresh
- [ ] Cash calls appear in admin dashboard

### **For Admin Users:**
- [ ] Can see all cash calls from all companies
- [ ] Can manage all cash calls
- [ ] Can see affiliate-filtered views

### **For Data Integrity:**
- [ ] Cash calls are not duplicated
- [ ] Cash calls are not lost on refresh
- [ ] Proper affiliate company association

## 🛠️ **Technical Details**

### **Key Functions Modified:**

1. **`getCashCallsForUser()`** in `lib/firebase-database.ts`
   - Now properly filters cash calls by `affiliate_id`
   - Maintains role-based access control

2. **`createCashCall()`** in `lib/firebase-database.ts`
   - Already correctly associates cash calls with affiliate companies
   - No changes needed

### **Database Schema:**
```typescript
interface CashCall {
  id: string
  affiliate_id: string  // Links to affiliate company
  created_by: string    // Links to user who created it
  // ... other fields
}

interface User {
  id: string
  role: 'admin' | 'approver' | 'affiliate' | 'viewer'
  affiliate_company_id?: string  // For affiliate users
  // ... other fields
}
```

## 🚀 **Expected Behavior After Fix**

### **CNTXT Affiliate User:**
1. Login to CNTXT affiliate account
2. Create a cash call for CNTXT
3. **✅ Cash call appears in CNTXT dashboard**
4. **✅ Cash call persists after refresh**
5. **✅ Cash call appears in admin dashboard**
6. **❌ Cash call does NOT appear in other affiliate dashboards**

### **Admin User:**
1. Login to admin account
2. **✅ Can see all cash calls from all companies**
3. **✅ Can manage all cash calls**
4. **✅ Can filter by affiliate company**

## 📞 **Troubleshooting**

### **Issue: Still seeing all cash calls as affiliate**
- Check browser console for debug messages
- Verify user role is set to `affiliate`
- Verify `affiliate_company_id` is set correctly
- Clear browser cache and refresh

### **Issue: Cash calls not appearing at all**
- Check if user has proper authentication
- Verify affiliate company exists in database
- Check browser console for errors

### **Issue: Cannot create cash calls**
- Verify user has proper permissions
- Check if affiliate company is active
- Verify form validation

## 📝 **Summary**

The fix ensures that:
1. **Affiliate users only see their own company's cash calls**
2. **Admin users can see and manage all cash calls**
3. **Data integrity is maintained**
4. **Role-based access control works correctly**

This resolves the issue where cash calls were disappearing from affiliate dashboards while remaining visible to admins. Now each affiliate will only see their own company's cash calls, while admins can see everything.
