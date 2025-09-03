#!/bin/bash

echo "🚀 Starting Firebase Storage Emulator..."
echo "This will allow uploads to work locally without CORS issues"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Start the storage emulator
echo "📁 Starting Storage emulator on port 9199..."
firebase emulators:start --only storage --port 9199

echo "✅ Storage emulator should now be running on http://localhost:9199"
echo "💡 You can now test uploads without CORS issues!"
