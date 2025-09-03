#!/bin/bash

# Simple deployment script that tries different approaches

set -e

echo "🚀 Trying different deployment approaches..."

# Try different regions
REGIONS=("me-central1" "me-central2" "us-central1" "europe-west1" "asia-southeast1")

for region in "${REGIONS[@]}"; do
    echo "📍 Trying region: $region"
    
    # Try to deploy
    if gcloud run deploy cash-call-management \
        --source . \
        --platform managed \
        --region "$region" \
        --allow-unauthenticated \
        --set-env-vars NODE_ENV=production \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --timeout 300 \
        --quiet; then
        
        echo "✅ Successfully deployed to $region!"
        SERVICE_URL=$(gcloud run services describe cash-call-management --region="$region" --format="value(status.url)")
        echo "🌐 Your app is available at: $SERVICE_URL"
        exit 0
    else
        echo "❌ Failed to deploy to $region"
    fi
done

echo "❌ All deployment attempts failed."
echo ""
echo "🔧 Next steps:"
echo "1. Contact your GCP admin to grant Cloud Build permissions"
echo "2. Request access to deploy to Middle East regions"
echo "3. Or use a different project with proper permissions"
