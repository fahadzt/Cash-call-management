# 🚀 GCP Deployment Guide

## Prerequisites

### 1. Company Firebase Project Access
- Get Firebase Project ID from your company
- Ensure you have access permissions (Owner, Editor, or Firebase Admin)
- Get Firebase configuration details

### 2. GCP Account Setup
- Access to company GCP account
- Billing enabled
- Cloud Run permissions

## Step-by-Step Deployment

### Step 1: Switch to Company Firebase Project

```bash
# List available projects
firebase projects:list

# Switch to company project (replace with actual project ID)
firebase use YOUR_COMPANY_PROJECT_ID

# Verify the switch
firebase projects:list
```

### Step 2: Update Firebase Configuration

1. **Get Firebase Config from Company Project:**
   - Go to Firebase Console → Project Settings → General
   - Copy the Firebase configuration object

2. **Update Environment Variables:**
   ```bash
   # Create production environment file
   cp .env.local .env.production
   
   # Add company Firebase config
   echo "NEXT_PUBLIC_FIREBASE_API_KEY=your_company_api_key" >> .env.production
   echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_company_project.firebaseapp.com" >> .env.production
   echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_company_project_id" >> .env.production
   echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_company_project.appspot.com" >> .env.production
   echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id" >> .env.production
   echo "NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id" >> .env.production
   ```

### Step 3: Enable Firebase Services

1. **Enable Authentication:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password authentication

2. **Enable Firestore:**
   - Go to Firebase Console → Firestore Database
   - Create database in production mode
   - Choose location (me-central2 recommended for Middle East)

3. **Enable Storage:**
   - Go to Firebase Console → Storage
   - Click "Get Started"
   - Choose location (me-central2 - same as Firestore)

### Step 4: Deploy Firebase Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore

# Deploy Storage security rules
firebase deploy --only storage
```

### Step 5: Deploy to GCP Cloud Run

1. **Install Google Cloud CLI:**
   ```bash
   # If not already installed
   brew install google-cloud-sdk
   ```

2. **Authenticate with GCP:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_COMPANY_GCP_PROJECT_ID
   ```

3. **Build and Deploy:**
   ```bash
   # Build the application
   npm run build
   
   # Deploy to Cloud Run
gcloud run deploy cash-call-management \
  --source . \
  --platform managed \
  --region me-central2 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
   ```

### Step 6: Set Up Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service cash-call-management \
  --domain your-domain.com \
  --region me-central2
```

## Environment Variables for Production

Create `.env.production` with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_company_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_company_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_company_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_company_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_USE_EMULATOR=false
NODE_ENV=production
```

## Security Considerations

1. **Firestore Rules:** Ensure proper security rules are in place
2. **Storage Rules:** Configure appropriate access controls
3. **Authentication:** Set up proper user roles and permissions
4. **CORS:** Configure CORS for your domain

## Monitoring and Maintenance

1. **Set up Firebase Analytics** (optional)
2. **Configure error monitoring** (Sentry, etc.)
3. **Set up automated backups** for Firestore
4. **Monitor Cloud Run performance**

## Troubleshooting

### Common Issues:
1. **Permission Denied:** Ensure you have proper GCP/Firebase permissions
2. **Build Failures:** Check Node.js version compatibility
3. **Deployment Timeout:** Increase timeout limits in Cloud Run
4. **Environment Variables:** Verify all required env vars are set

### Useful Commands:
```bash
# Check deployment status
gcloud run services describe cash-call-management --region me-central2

# View logs
gcloud logs read --service=cash-call-management

# Update service
gcloud run services update cash-call-management --region me-central2
```
