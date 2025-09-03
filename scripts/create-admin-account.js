#!/usr/bin/env node

/**
 * Script to create the first IT admin account
 * This script helps you set up your first admin account without manual database work
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Set up Firebase service account key
 * 3. Run: node scripts/create-admin-account.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Configuration - UPDATE THESE VALUES
const ADMIN_EMAIL = 'your-email@company.com'; // REPLACE WITH YOUR EMAIL
const ADMIN_PASSWORD = 'your-secure-password'; // REPLACE WITH YOUR PASSWORD
const ADMIN_NAME = 'Your Full Name'; // REPLACE WITH YOUR NAME
const ADMIN_DEPARTMENT = 'IT';
const ADMIN_POSITION = 'System Administrator';

// Firebase configuration - UPDATE WITH YOUR VALUES
const serviceAccount = require('./path-to-your-service-account-key.json'); // REPLACE WITH ACTUAL PATH

async function createAdminAccount() {
  try {
    console.log('🚀 Starting admin account creation...');
    
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: 'your-project-id.firebaseio.com' // REPLACE WITH YOUR PROJECT ID
    });
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase Admin initialized');
    
    // Step 1: Create user in Firebase Auth
    console.log('📝 Creating user in Firebase Auth...');
    const userRecord = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true
    });
    
    console.log('✅ Firebase user created:', userRecord.uid);
    
    // Step 2: Create profile in database
    console.log('💾 Creating profile in database...');
    await db.collection('profiles').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      department: ADMIN_DEPARTMENT,
      position: ADMIN_POSITION
    });
    
    console.log('✅ Profile created in database');
    
    // Step 3: Log the creation
    console.log('📋 Logging admin creation...');
    await db.collection('activity_logs').add({
      user_id: userRecord.uid,
      action: 'first_admin_created',
      resource_type: 'user',
      resource_id: userRecord.uid,
      details: {
        created_by: 'system_setup',
        note: 'First admin account created during system setup'
      },
      created_at: new Date()
    });
    
    console.log('✅ Activity logged');
    
    // Success message
    console.log('\n🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`User ID: ${userRecord.uid}`);
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Name: ${ADMIN_NAME}`);
    console.log(`Role: admin`);
    console.log('=====================================');
    console.log('\n📱 You can now:');
    console.log('1. Go to /login');
    console.log('2. Sign in with your email and password');
    console.log('3. Access /manage-users to manage the system');
    console.log('\n⚠️  IMPORTANT: Delete this script after use for security!');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Firebase service account key path');
    console.log('2. Verify your Firebase project configuration');
    console.log('3. Ensure you have the required permissions');
  }
}

// Run the script
if (require.main === module) {
  createAdminAccount();
}

module.exports = { createAdminAccount };
