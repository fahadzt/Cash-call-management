# 🔥 Firebase Database Setup Guide

This guide will help you set up a comprehensive Firebase database for your cash call management application that handles everything from authentication to file storage.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Structure](#database-structure)
5. [Security Rules](#security-rules)
6. [Local Development](#local-development)
7. [Deployment](#deployment)
8. [Features Overview](#features-overview)
9. [Troubleshooting](#troubleshooting)

## 🚀 Prerequisites

- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Google account for Firebase Console

## 🔧 Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `cash-call-management`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Services

In your Firebase project, enable these services:

1. **Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (optional)

2. **Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select location closest to your users

3. **Storage**
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
   - Select location

4. **Functions** (optional)
   - Go to Functions
   - Click "Get started"
   - Enable billing if required

### Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Register app with name: `cash-call-management-web`
5. Copy the configuration object

## ⚙️ Environment Configuration

### Step 1: Create Environment File

```bash
cp firebase.env.template .env.local
```

### Step 2: Fill Configuration

Edit `.env.local` with your Firebase project details:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🗄️ Database Structure

The Firebase database includes these collections:

### Core Collections

1. **`users`** - User profiles and authentication
2. **`affiliates`** - Affiliate companies and partners
3. **`cash_calls`** - Cash call requests and management
4. **`comments`** - Comments on cash calls
5. **`activity_logs`** - Audit trail and activity tracking

### Checklist System

6. **`committees`** - Review committees
7. **`checklist_templates`** - Reusable checklist templates
8. **`checklist_items`** - Individual checklist items
9. **`affiliate_checklists`** - Checklists assigned to affiliates
10. **`checklist_responses`** - Responses to checklist items

### Workflow & Approvals

11. **`stakeholders`** - Users involved in cash call approval
12. **`notifications`** - User notifications
13. **`cash_call_approvals`** - Approval records

## 🔒 Security Rules

### Firestore Rules

The security rules are defined in `firestore.rules` and provide:

- **Role-based access control** (Admin, Approver, Affiliate, Viewer)
- **User-specific data protection**
- **Audit trail protection**
- **Proper data validation**

### Storage Rules

Storage rules in `storage.rules` ensure:

- **User-specific file access**
- **Organized file structure**
- **Secure document uploads**

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

## 🛠️ Local Development

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Start Firebase Emulators

```bash
# Start all emulators
firebase emulators:start

# Or start specific services
firebase emulators:start --only firestore,auth,storage
```

### Step 3: Run Application

```bash
pnpm dev
```

The app will automatically connect to Firebase emulators in development mode.

## 🚀 Deployment

### Step 1: Build Application

```bash
pnpm build
```

### Step 2: Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only storage
```

## ✨ Features Overview

### 🔐 Authentication & Authorization

- **Email/Password authentication**
- **Role-based access control**
- **User profile management**
- **Password reset functionality**

### 📊 Data Management

- **CRUD operations for all entities**
- **Real-time data synchronization**
- **Batch operations for efficiency**
- **Transaction support for complex operations**

### 📁 File Storage

- **Avatar image uploads**
- **Document management**
- **Organized file structure**
- **Secure file access**

### 🔍 Search & Filtering

- **Full-text search capabilities**
- **Advanced filtering options**
- **Sorting and pagination**
- **Export functionality**

### 📈 Analytics & Reporting

- **Dashboard statistics**
- **Activity tracking**
- **Audit trails**
- **Performance monitoring**

### 🔔 Real-time Features

- **Live data updates**
- **Real-time notifications**
- **Collaborative features**
- **Instant feedback**

## 🛡️ Security Features

### Data Protection

- **Encrypted data transmission**
- **Secure authentication**
- **Role-based permissions**
- **Audit logging**

### Access Control

- **User-specific data isolation**
- **Committee-based access**
- **Approval workflows**
- **Document security**

## 🔧 Advanced Features

### Batch Operations

```typescript
// Update multiple cash calls
await batchUpdateCashCalls([
  { id: '1', updates: { status: 'approved' } },
  { id: '2', updates: { status: 'rejected' } }
])
```

### Transactions

```typescript
// Approve cash call with transaction
await approveCashCallWithTransaction(
  'cash-call-id',
  50000,
  'user-id'
)
```

### Real-time Listeners

```typescript
// Subscribe to cash call updates
const unsubscribe = subscribeToCashCalls((cashCalls) => {
  console.log('Cash calls updated:', cashCalls)
})
```

### File Upload

```typescript
// Upload document
const fileUrl = await uploadDocument('cash-call-id', file)

// Upload avatar
const avatarUrl = await uploadAvatar('user-id', file)
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify environment variables
   - Ensure Authentication is enabled

2. **Permission Denied**
   - Check security rules
   - Verify user role
   - Review Firestore rules

3. **Emulator Connection Issues**
   - Ensure emulators are running
   - Check port configurations
   - Verify Firebase CLI installation

4. **File Upload Failures**
   - Check Storage rules
   - Verify file size limits
   - Ensure proper file paths

### Debug Commands

```bash
# Check Firebase configuration
firebase projects:list

# View emulator logs
firebase emulators:start --debug

# Test security rules
firebase firestore:rules:test

# Export data
firebase firestore:export
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 🎯 Next Steps

1. **Set up your Firebase project** using the steps above
2. **Configure environment variables** with your project details
3. **Deploy security rules** to protect your data
4. **Test the application** with Firebase emulators
5. **Deploy to production** when ready

Your Firebase database is now ready to handle all aspects of your cash call management application! 🚀 