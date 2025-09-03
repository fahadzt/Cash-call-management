#!/bin/bash

echo "Deploying Firestore indexes..."

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

echo "Firestore indexes deployed successfully!"
echo ""
echo "If you encounter any issues, you can also create the index manually:"
echo "1. Go to: https://console.firebase.google.com/v1/r/project/cash-call-management-app/firestore/indexes"
echo "2. Click 'Create Index'"
echo "3. Collection ID: documents"
echo "4. Fields:"
echo "   - cash_call_id (Ascending)"
echo "   - uploaded_at (Descending)"
echo "5. Click 'Create'"
