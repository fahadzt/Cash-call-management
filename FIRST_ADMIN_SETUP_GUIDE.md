# First Admin Account Setup Guide

## 🚨 **IMPORTANT: This is a ONE-TIME setup process**

This guide will help you create the very first IT admin account in your Cash Call Management System. After this is done, you'll use the web interface to create additional accounts.

## 🔑 **Prerequisites**

Before you can create your admin account, you need:

1. **Firebase Project Setup** ✅
   - Firebase project created
   - Authentication enabled
   - Firestore database configured

2. **Database Tables Created** ✅
   - Run `scripts/21-create-account-requests.sql` first
   - Ensure all tables exist

3. **Service Account Access** ✅
   - Firebase service account key file
   - Admin SDK permissions

## 🛠️ **Method 1: Using the Setup Script (Recommended)**

### **Step 1: Install Dependencies**
```bash
npm install firebase-admin
```

### **Step 2: Get Firebase Service Account Key**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Place it in your project (e.g., `scripts/firebase-service-account.json`)

### **Step 3: Update the Script**
Edit `scripts/create-admin-account.js`:

```javascript
// Update these values with YOUR information
const ADMIN_EMAIL = 'your-actual-email@company.com';
const ADMIN_PASSWORD = 'your-secure-password-123';
const ADMIN_NAME = 'Your Actual Full Name';

// Update the service account path
const serviceAccount = require('./firebase-service-account.json');

// Update your project ID
databaseURL: 'your-actual-project-id.firebaseio.com'
```

### **Step 4: Run the Script**
```bash
node scripts/create-admin-account.js
```

### **Step 5: Verify Success**
You should see:
```
🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!
=====================================
User ID: [your-user-id]
Email: your-email@company.com
Name: Your Full Name
Role: admin
=====================================
```

## 🗄️ **Method 2: Manual Database Setup**

If you prefer to do it manually:

### **Step 1: Create Firebase User**
```bash
# Using Firebase CLI
firebase auth:create-user \
  --email "admin@company.com" \
  --password "securepassword123" \
  --display-name "Admin User"
```

### **Step 2: Get the User ID**
From the CLI output, note the `uid` value.

### **Step 3: Run SQL Script**
Edit `scripts/23-create-first-admin.sql`:
- Replace `YOUR_FIREBASE_USER_ID` with the actual UID
- Replace `admin@company.com` with your email
- Replace `Your Full Name` with your name

### **Step 4: Execute SQL**
```bash
psql -d your_database -f scripts/23-create-first-admin.sql
```

## 🔐 **After Creating Your Admin Account**

### **1. Test Login**
- Go to `/login`
- Sign in with your email and password
- You should be redirected to the dashboard

### **2. Access Admin Panel**
- Navigate to `/manage-users`
- You should see the admin interface with two tabs

### **3. Create Additional Admin Accounts**
- Use the web interface to create more IT admin accounts
- Never share your main admin credentials

## 🚨 **Security Best Practices**

### **Password Requirements**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common patterns or company names
- Use a password manager

### **Account Security**
- Enable 2FA if possible
- Regular password changes
- Monitor login activity
- Never share admin credentials

### **Post-Setup Cleanup**
- Delete the setup script after use
- Remove service account keys from public repos
- Secure your Firebase project settings

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"Firebase Admin not initialized"**
- Check service account key path
- Verify Firebase project configuration
- Ensure you have admin SDK permissions

#### **"Database connection failed"**
- Verify database is running
- Check connection credentials
- Ensure tables exist

#### **"User already exists"**
- Check if account was already created
- Use Firebase Console to verify
- Try different email if needed

#### **"Permission denied"**
- Verify service account has admin rights
- Check Firebase project permissions
- Ensure database user has write access

### **Getting Help**
1. Check Firebase Console for errors
2. Review database logs
3. Verify all prerequisites are met
4. Check network connectivity

## 📋 **Setup Checklist**

- [ ] Firebase project configured
- [ ] Database tables created
- [ ] Service account key downloaded
- [ ] Script updated with your details
- [ ] Admin account created successfully
- [ ] Login tested
- [ ] Admin panel accessible
- [ ] Setup script deleted
- [ ] Service account key secured

## 🎯 **Next Steps**

After creating your admin account:

1. **Explore the admin interface** at `/manage-users`
2. **Create additional IT admin accounts** for your team
3. **Set up email notifications** for account requests
4. **Configure affiliate companies** if needed
5. **Test the account request workflow**
6. **Train your IT team** on the system

## ⚠️ **Important Reminders**

- **This is a ONE-TIME setup** - don't run it multiple times
- **Secure your credentials** - this is your master admin account
- **Backup your setup** - keep a secure copy of your configuration
- **Test thoroughly** - ensure everything works before going live
- **Document the process** - for future reference and team training

---

**Need help?** Check the troubleshooting section or review the main system documentation in `IT_ACCOUNT_MANAGEMENT_README.md`.
