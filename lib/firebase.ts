import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Firebase configuration - use environment variables if available, fallback to correct hardcoded values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyArgq_mKPHX5Oi8lqihFlrcW8F4L0gWIds",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prj-adc-gcp-coop-poc.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://prj-adc-gcp-coop-poc-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prj-adc-gcp-coop-poc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prj-adc-gcp-coop-poc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1005601289659",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1005601289659:web:ae6bd8c2500bb36759409e"
}

// Debug: Log the configuration being used
console.log('🔥 Firebase Config Being Used:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
  appId: firebaseConfig.appId,
  envVars: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  }
})

// Debug: Log all environment variables
console.log('🔍 All Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 10) + '...',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
})

// Test: Check if .env.local is being read
console.log('🧪 Environment File Test:', {
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  projectIdValue: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  expectedProjectId: 'prj-adc-gcp-coop-poc'
})

// Initialize Firebase
let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (error) {
  console.error('Error initializing Firebase app:', error)
  throw new Error('Failed to initialize Firebase. Please check your configuration.')
}

// Initialize Firebase services with error handling
let db, auth, storage, functions

try {
  db = getFirestore(app)
  auth = getAuth(app)
  storage = getStorage(app)
  functions = getFunctions(app)
} catch (error) {
  console.error('Error initializing Firebase services:', error)
  throw new Error('Failed to initialize Firebase services.')
}

// Initialize Analytics conditionally
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null)

// Connect to emulators in development
// WARNING: Firebase emulators use ephemeral storage - data is lost when emulator restarts
// Set FIREBASE_USE_EMULATOR=true only for testing, not for persistent development
const useEmulator = process.env.NODE_ENV === 'development' && process.env.FIREBASE_USE_EMULATOR === 'true' // Force emulator for now

if (useEmulator) {
  try {
    const emulatorHost = process.env.FIREBASE_EMULATOR_HOST || 'localhost'
    const firestorePort = process.env.FIREBASE_FIRESTORE_EMULATOR_PORT || 8080
    const authPort = process.env.FIREBASE_AUTH_EMULATOR_PORT || 9099
    const storagePort = process.env.FIREBASE_STORAGE_EMULATOR_PORT || 9199
    const functionsPort = process.env.FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001

    // Only connect to emulators if they're not already connected
    try {
      connectFirestoreEmulator(db, emulatorHost, parseInt(firestorePort.toString()))
      connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`)
      connectStorageEmulator(storage, emulatorHost, parseInt(storagePort.toString()))
      connectFunctionsEmulator(functions, emulatorHost, parseInt(functionsPort.toString()))
      console.log('⚠️  Connected to Firebase emulators - DATA WILL BE LOST ON RESTART')
      console.log('💡 To use persistent data, set FIREBASE_USE_EMULATOR=false or remove the environment variable')
    } catch (error: any) {
      // Emulators already connected or not available
      console.log('Firebase emulators already connected or not available:', error.message)
    }
  } catch (error: any) {
    console.error('Error connecting to Firebase emulators:', error)
  }
} else {
  console.log('🚀 Using Firebase production services - Data will persist')
}

export { db, auth, storage, functions }
export default app 