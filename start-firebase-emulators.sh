#!/bin/bash

# Start Firebase Emulators
# This script starts Firebase emulators for local development

echo "🚀 Starting Firebase Emulators..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Start emulators
echo "📝 Starting Firebase emulators..."
firebase emulators:start --only firestore,auth

echo ""
echo "✅ Firebase emulators started successfully!"
echo "🔧 You can now use the application with local Firebase services."
echo "🌐 Emulator UI: http://localhost:4000"
echo "📊 Firestore: localhost:8080"
echo "🔐 Auth: localhost:9099"
