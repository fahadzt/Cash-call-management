import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Firebase configuration - use environment variables if available, fallback to hardcoded values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBIay1Tt0Xml7JaJlfEpMSKlg8ojBX3Hsc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cash-call-management-app.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://cash-call-management-app-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cash-call-management-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cash-call-management-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "654299803740",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:654299803740:web:34cad6bfecc4ca1f0bf699"
}

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
const useEmulator = process.env.NODE_ENV === 'development' && process.env.FIREBASE_USE_EMULATOR === 'true'

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
      console.log('✅ Connected to Firebase emulators')
    } catch (error) {
      // Emulators already connected or not available
      console.log('Firebase emulators already connected or not available:', error.message)
    }
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error)
  }
} else {
  console.log('🚀 Using Firebase production services')
}

export { db, auth, storage, functions }
export default app 