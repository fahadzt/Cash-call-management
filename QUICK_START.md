# Quick Start Guide - Enhanced Cash Call Management System

## 🚀 Running on Localhost

### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Supabase account and project

### Step 1: Environment Setup

1. **Copy the environment template:**
   ```bash
   cp env.template .env.local
   ```

2. **Edit `.env.local` and add your Supabase credentials:**
   ```bash
   # Get these from your Supabase project dashboard
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 2: Database Setup

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Run the enhanced data model script:**
   ```sql
   -- Copy and paste the contents of scripts/08-enhanced-data-model.sql
   ```
4. **Run the seed data script:**
   ```sql
   -- Copy and paste the contents of scripts/09-seed-enhanced-data.sql
   ```

### Step 3: Start Development Server

```bash
# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev
```

The application will be available at: **http://localhost:3000**

## 🔧 Alternative: Automated Setup

Use the provided setup script:

```bash
./setup-localhost.sh
```

This script will:
- Create `.env.local` from template
- Check environment variables
- Install dependencies
- Guide you through database setup
- Start the development server

## 📊 Database Migration Commands

If you have Supabase CLI installed:

```bash
# Push the enhanced schema to your database
supabase db push

# Or run individual scripts
supabase db reset --linked
```

## 🎯 What's New in the Enhanced Backend

### Features Available:
- ✅ **Enhanced Cash Calls** with rich metadata
- ✅ **Threaded Comments System** with attachments
- ✅ **Committee-based Checklists** with progress tracking
- ✅ **Comprehensive Activity Logs** for audit trails
- ✅ **Role-based Access Control** with granular permissions
- ✅ **Enhanced Stakeholder Management**
- ✅ **Workflow System** for approvals

### Sample Data Included:
- 3 sample affiliates with enhanced data
- 3 sample cash calls with different statuses
- Committee-based checklist templates
- Sample comments and activity logs

## 🔍 Testing the Enhanced Features

### 1. **Cash Call Management**
- Navigate to `/dashboard`
- View enhanced cash calls with priority, categories, and progress
- Create new cash calls with rich metadata

### 2. **Comments System**
- Open any cash call detail page
- Add comments and replies
- Test internal vs external comments

### 3. **Checklist System**
- Navigate to `/checklist`
- View committee-based checklists
- Update checklist item statuses
- Track progress completion

### 4. **Activity Logs**
- Check the activity log on cash call detail pages
- Verify audit trail for all changes

## 🛠️ Troubleshooting

### Common Issues:

1. **Environment Variables Not Set**
   ```bash
   # Check if .env.local exists and has correct values
   cat .env.local
   ```

2. **Database Connection Issues**
   - Verify Supabase URL and key are correct
   - Check if database scripts were run successfully
   - Ensure Row Level Security (RLS) is configured

3. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules
   pnpm install
   pnpm dev
   ```

4. **TypeScript Errors**
   ```bash
   # Check for type issues
   pnpm run lint
   ```

## 📱 Accessing the Application

Once running, you can access:

- **Main Dashboard**: http://localhost:3000/dashboard
- **Cash Call Details**: http://localhost:3000/cash-call/[id]
- **Checklist Management**: http://localhost:3000/checklist
- **Admin Settings**: http://localhost:3000/admin (admin role required)

## 🔐 Default Users

The system includes sample data. You can create users through:
- Supabase Auth dashboard
- Or use the signup page in the application

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify database connectivity
3. Review the `BACKEND_ENHANCEMENT_README.md` for detailed documentation
4. Check the migration guide in `scripts/10-migration-guide.md`

## 🎉 Success!

Your enhanced cash call management system is now running on localhost with:
- Normalized database structure
- Comprehensive audit trails
- Rich feature set
- Scalable architecture

Enjoy exploring the enhanced features! 🚀 