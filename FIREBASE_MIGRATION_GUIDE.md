# 🔄 Firebase Migration Guide

This guide will help you migrate from Supabase to Firebase for your cash call management application.

## 📋 Migration Overview

### What's Changing

- **Database**: Supabase (PostgreSQL) → Firebase (Firestore)
- **Authentication**: Supabase Auth → Firebase Auth
- **Storage**: Supabase Storage → Firebase Storage
- **Real-time**: Supabase Realtime → Firestore Real-time listeners

### Benefits of Migration

- ✅ **Better scalability** with Firebase's global infrastructure
- ✅ **Enhanced security** with Firebase Security Rules
- ✅ **Real-time capabilities** with Firestore listeners
- ✅ **Better offline support** with Firestore offline persistence
- ✅ **Comprehensive analytics** with Firebase Analytics
- ✅ **Simplified deployment** with Firebase Hosting

## 🚀 Migration Steps

### Step 1: Backup Current Data

Before migrating, export your current Supabase data:

```bash
# Export Supabase data (if you have access to Supabase CLI)
supabase db dump --data-only > backup.sql

# Or manually export from Supabase Dashboard
# Go to Table Editor → Select all tables → Export as CSV
```

### Step 2: Set Up Firebase Project

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase project
   firebase init
   ```

2. **Enable Services**
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Functions (optional)

### Step 3: Configure Environment

1. **Update Environment Variables**
   ```bash
   # Copy Firebase template
   cp firebase.env.template .env.local
   
   # Fill in your Firebase configuration
   # Get these from Firebase Console → Project Settings → General → Your apps
   ```

2. **Update Package Dependencies**
   ```bash
   # Remove Supabase
   pnpm remove @supabase/supabase-js
   
   # Add Firebase
   pnpm add firebase
   ```

### Step 4: Update Application Code

#### 1. Replace Database Imports

**Before (Supabase):**
```typescript
import { supabase } from './supabase'
import { getCashCallsEnhanced } from './enhanced-database'
```

**After (Firebase):**
```typescript
import { getCashCalls } from './firebase-database'
```

#### 2. Update Authentication

**Before (Supabase):**
```typescript
import { supabase } from './supabase'

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

**After (Firebase):**
```typescript
import { signIn } from './firebase-database'

const userCredential = await signIn(email, password)
```

#### 3. Update Data Operations

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('cash_calls')
  .select('*')
  .eq('status', 'pending')
```

**After (Firebase):**
```typescript
const cashCalls = await getCashCalls({
  status: ['pending']
})
```

### Step 5: Data Migration

#### 1. Create Migration Script

Create a script to migrate your data:

```typescript
// scripts/migrate-to-firebase.ts
import { supabase } from '../lib/supabase'
import { 
  createAffiliate, 
  createCashCall, 
  createUser 
} from '../lib/firebase-database'

async function migrateData() {
  try {
    // Migrate users
    const { data: users } = await supabase.from('profiles').select('*')
    for (const user of users || []) {
      await createUser({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'viewer',
        // ... other fields
      })
    }

    // Migrate affiliates
    const { data: affiliates } = await supabase.from('affiliates').select('*')
    for (const affiliate of affiliates || []) {
      await createAffiliate({
        name: affiliate.name,
        company_code: affiliate.company_code,
        // ... other fields
      })
    }

    // Migrate cash calls
    const { data: cashCalls } = await supabase.from('cash_calls').select('*')
    for (const cashCall of cashCalls || []) {
      await createCashCall({
        call_number: cashCall.call_number,
        affiliate_id: cashCall.affiliate_id,
        amount_requested: cashCall.amount_requested,
        // ... other fields
      })
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

migrateData()
```

#### 2. Run Migration

```bash
# Run migration script
npx tsx scripts/migrate-to-firebase.ts
```

### Step 6: Update Components

#### 1. Replace Database Functions

Update all components to use Firebase functions:

```typescript
// Before
import { getCashCallsEnhanced } from '@/lib/enhanced-database'

// After
import { getCashCalls } from '@/lib/firebase-database'
```

#### 2. Update Authentication Context

Replace Supabase auth with Firebase auth:

```typescript
// Before
import { useAuth } from '@/lib/supabase-auth-context'

// After
import { useAuth } from '@/lib/firebase-auth-context'
```

#### 3. Update Real-time Listeners

Replace Supabase real-time with Firestore listeners:

```typescript
// Before
const subscription = supabase
  .channel('cash_calls')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_calls' }, callback)
  .subscribe()

// After
const unsubscribe = subscribeToCashCalls(callback)
```

### Step 7: Test Migration

#### 1. Local Testing

```bash
# Start Firebase emulators
firebase emulators:start

# Run application
pnpm dev
```

#### 2. Verify Functionality

- ✅ Authentication works
- ✅ Data CRUD operations work
- ✅ Real-time updates work
- ✅ File uploads work
- ✅ Security rules work

### Step 8: Deploy to Production

#### 1. Deploy Firebase Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

#### 2. Deploy Application

```bash
# Build application
pnpm build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 🔄 Data Structure Mapping

### Supabase → Firebase Mapping

| Supabase Table | Firebase Collection | Notes |
|----------------|-------------------|-------|
| `profiles` | `users` | User profiles and authentication |
| `affiliates` | `affiliates` | Affiliate companies |
| `cash_calls` | `cash_calls` | Cash call requests |
| `comments` | `comments` | Comments on cash calls |
| `activity_logs` | `activity_logs` | Audit trail |
| `committees` | `committees` | Review committees |
| `checklist_templates` | `checklist_templates` | Checklist templates |
| `checklist_items` | `checklist_items` | Individual checklist items |
| `affiliate_checklists` | `affiliate_checklists` | Assigned checklists |
| `checklist_responses` | `checklist_responses` | Checklist responses |
| `stakeholders` | `stakeholders` | Approval stakeholders |
| `notifications` | `notifications` | User notifications |

### Field Type Mapping

| Supabase Type | Firebase Type | Notes |
|---------------|---------------|-------|
| `uuid` | `string` | Document IDs |
| `timestamp` | `timestamp` | Date/time fields |
| `jsonb` | `map` | Complex data |
| `text[]` | `array` | String arrays |
| `boolean` | `boolean` | Boolean values |
| `numeric` | `number` | Numeric values |

## 🛡️ Security Migration

### Supabase RLS → Firebase Security Rules

**Before (Supabase RLS):**
```sql
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);
```

**After (Firebase Rules):**
```javascript
match /users/{userId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.id || 
     resource.data.role == 'admin');
}
```

## 🔧 Configuration Changes

### Environment Variables

**Before (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**After (.env.local):**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Package.json Changes

**Remove:**
```json
"@supabase/supabase-js": "latest"
```

**Add:**
```json
"firebase": "^10.7.1"
```

## 🐛 Common Migration Issues

### 1. Authentication Issues

**Problem:** Users can't sign in after migration
**Solution:** Ensure Firebase Authentication is properly configured and users are migrated

### 2. Permission Denied Errors

**Problem:** Security rules blocking access
**Solution:** Deploy proper Firebase security rules and test thoroughly

### 3. Real-time Not Working

**Problem:** Real-time updates not functioning
**Solution:** Replace Supabase real-time with Firestore listeners

### 4. File Upload Issues

**Problem:** Files not uploading to Firebase Storage
**Solution:** Update file upload functions to use Firebase Storage

## ✅ Migration Checklist

- [ ] Backup Supabase data
- [ ] Set up Firebase project
- [ ] Configure environment variables
- [ ] Update package dependencies
- [ ] Replace database imports
- [ ] Update authentication
- [ ] Migrate data
- [ ] Update components
- [ ] Test locally
- [ ] Deploy security rules
- [ ] Deploy to production
- [ ] Verify functionality
- [ ] Remove Supabase dependencies

## 🎯 Post-Migration

### 1. Monitor Performance

- Check Firebase Console for usage metrics
- Monitor Firestore read/write operations
- Track authentication usage

### 2. Optimize Queries

- Add composite indexes for complex queries
- Use pagination for large datasets
- Implement caching strategies

### 3. Security Review

- Review security rules regularly
- Monitor access patterns
- Update rules as needed

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Migration Guide](https://firebase.google.com/docs/firestore/manage-data/migrate-data)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

Your migration to Firebase is now complete! 🚀 