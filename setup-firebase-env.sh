#!/bin/bash

# Firebase Environment Setup Script
echo "🚀 Setting up Firebase environment variables..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local with Firebase configuration
cat > .env.local << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBIay1Tt0Xml7JaJlfEpMSKlg8ojBX3Hsc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cash-call-management-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://cash-call-management-app-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cash-call-management-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cash-call-management-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=654299803740
NEXT_PUBLIC_FIREBASE_APP_ID=1:654299803740:web:34cad6bfecc4ca1f0bf699

# Firebase Emulator Configuration (for development)
FIREBASE_USE_EMULATOR=true
FIREBASE_EMULATOR_HOST=localhost
FIREBASE_FIRESTORE_EMULATOR_PORT=8080
FIREBASE_AUTH_EMULATOR_PORT=9099
FIREBASE_STORAGE_EMULATOR_PORT=9199
FIREBASE_FUNCTIONS_EMULATOR_PORT=5001
EOF

echo "✅ Created .env.local with Firebase configuration"
echo ""
echo "📋 Next steps:"
echo "1. Start Firebase emulators: firebase emulators:start"
echo "2. Start the development server: npm run dev"
echo "3. If you still get network errors, try:"
echo "   - Check your internet connection"
echo "   - Disable FIREBASE_USE_EMULATOR=true to use production Firebase"
echo "   - Check if Firebase project is accessible"
echo ""
echo "🔧 To use production Firebase instead of emulators, edit .env.local and set:"
echo "   FIREBASE_USE_EMULATOR=false" 