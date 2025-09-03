#!/bin/bash

# 🚀 GCP Deployment Script for Cash Call Management
# Make sure to update the variables below with your company's details

set -e  # Exit on any error

# Configuration - Updated for Aramco Digital POC
COMPANY_PROJECT_ID="prj-adc-gcp-coop-poc"
COMPANY_FIREBASE_PROJECT_ID="prj-adc-gcp-coop-poc"
SERVICE_NAME="cash-call-management"
REGION="me-central2"

echo "🚀 Starting deployment to GCP..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first:"
    echo "   brew install google-cloud-sdk"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project to: $COMPANY_PROJECT_ID"
gcloud config set project $COMPANY_PROJECT_ID

# Switch to company Firebase project (using existing project for now)
echo "🔥 Using existing Firebase project: cash-call-management-app"
firebase use cash-call-management-app

# Build the application
echo "🔨 Building the application..."
npm run build

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is available at: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "1. Update Firebase configuration with your company's details"
echo "2. Set up custom domain (optional)"
echo "3. Configure monitoring and alerts"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: gcloud logs read --service=$SERVICE_NAME"
echo "   Update service: gcloud run services update $SERVICE_NAME --region=$REGION"
echo "   Delete service: gcloud run services delete $SERVICE_NAME --region=$REGION"
