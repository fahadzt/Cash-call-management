#!/bin/bash

# Deploy Firebase Security Rules
# This script deploys the Firestore security rules to fix permission issues

echo "🚀 Deploying Firebase Security Rules..."

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

# Deploy Firestore rules
echo "📝 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "🔧 The permission error should now be resolved."
    echo "🔄 Please refresh your application and try creating a cash call again."
else
    echo "❌ Failed to deploy Firestore rules."
    echo "Please check your Firebase configuration and try again."
    exit 1
fi

echo ""
echo "📋 Next steps:"
echo "1. Refresh your application"
echo "2. Try creating a cash call again"
echo "3. Check the browser console for any remaining errors"
