#!/usr/bin/env node

/**
 * Firebase Emulator Data Export Script
 * 
 * This script exports data from Firebase emulators to JSON files
 * to prevent data loss during development.
 * 
 * Usage:
 * 1. Start Firebase emulators: firebase emulators:start
 * 2. Run this script: node scripts/export-firebase-data.js
 * 3. Data will be saved to scripts/firebase-data-backup/
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, connectFirestoreEmulator } = require('firebase/firestore');

// Firebase config (same as in lib/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBIay1Tt0Xml7JaJlfEpMSKlg8ojBX3Hsc",
  authDomain: "cash-call-management-app.firebaseapp.com",
  databaseURL: "https://cash-call-management-app-default-rtdb.firebaseio.com",
  projectId: "cash-call-management-app",
  storageBucket: "cash-call-management-app.firebasestorage.app",
  messagingSenderId: "654299803740",
  appId: "1:654299803740:web:34cad6bfecc4ca1f0bf699"
};

// Collections to export
const COLLECTIONS = [
  'users',
  'affiliates', 
  'cash_calls',
  'comments',
  'activity_logs',
  'committees',
  'checklist_templates',
  'checklist_items',
  'affiliate_checklists',
  'checklist_responses',
  'stakeholders',
  'notifications',
  'cash_call_approvals',
  'status_options'
];

async function exportFirebaseData() {
  try {
    console.log('🚀 Starting Firebase data export...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Connect to emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Connected to Firebase emulator');
    
    // Create backup directory
    const backupDir = path.join(__dirname, 'firebase-data-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportData = {
      timestamp,
      collections: {}
    };
    
    // Export each collection
    for (const collectionName of COLLECTIONS) {
      console.log(`📦 Exporting ${collectionName}...`);
      
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        
        querySnapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        exportData.collections[collectionName] = documents;
        console.log(`✅ Exported ${documents.length} documents from ${collectionName}`);
      } catch (error) {
        console.warn(`⚠️  Failed to export ${collectionName}:`, error.message);
        exportData.collections[collectionName] = [];
      }
    }
    
    // Save to file
    const filename = `firebase-export-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n✅ Export completed successfully!`);
    console.log(`📁 Data saved to: ${filepath}`);
    console.log(`📊 Total collections exported: ${Object.keys(exportData.collections).length}`);
    
    // Show summary
    Object.entries(exportData.collections).forEach(([collectionName, documents]) => {
      console.log(`   ${collectionName}: ${documents.length} documents`);
    });
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
exportFirebaseData();
