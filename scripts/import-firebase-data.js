#!/usr/bin/env node

/**
 * Firebase Emulator Data Import Script
 * 
 * This script imports data from JSON backup files back into Firebase emulators.
 * 
 * Usage:
 * 1. Start Firebase emulators: firebase emulators:start
 * 2. Run this script: node scripts/import-firebase-data.js [filename]
 * 3. If no filename provided, uses the most recent backup
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

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

async function importFirebaseData(filename = null) {
  try {
    console.log('🚀 Starting Firebase data import...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Connect to emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Connected to Firebase emulator');
    
    // Find backup file
    const backupDir = path.join(__dirname, 'firebase-data-backup');
    if (!fs.existsSync(backupDir)) {
      console.error('❌ Backup directory not found. Run export script first.');
      process.exit(1);
    }
    
    let backupFile;
    if (filename) {
      backupFile = path.join(backupDir, filename);
      if (!fs.existsSync(backupFile)) {
        console.error(`❌ Backup file not found: ${backupFile}`);
        process.exit(1);
      }
    } else {
      // Find most recent backup file
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('firebase-export-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        console.error('❌ No backup files found. Run export script first.');
        process.exit(1);
      }
      
      backupFile = path.join(backupDir, files[0]);
      console.log(`📁 Using most recent backup: ${files[0]}`);
    }
    
    // Load backup data
    console.log(`📖 Loading backup data from: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
    console.log(`📦 Collections to import: ${Object.keys(backupData.collections).length}`);
    
    // Import each collection
    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
      console.log(`📦 Importing ${collectionName} (${documents.length} documents)...`);
      
      try {
        for (const document of documents) {
          const { id, ...data } = document;
          await setDoc(doc(db, collectionName, id), data);
        }
        
        console.log(`✅ Imported ${documents.length} documents to ${collectionName}`);
      } catch (error) {
        console.error(`❌ Failed to import ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n✅ Import completed successfully!');
    console.log('🔄 Firebase emulator now contains the imported data');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Get filename from command line arguments
const filename = process.argv[2] || null;

// Run the import
importFirebaseData(filename);
