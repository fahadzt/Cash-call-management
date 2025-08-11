# Database Setup Guide

## 🗄️ Setting Up Your Supabase Database

Your environment variables are now configured! Next, you need to set up your database with the enhanced schema.

### Step 1: Access Your Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `uxagkwlldteglvksbvno`
3. Navigate to the **SQL Editor** in the left sidebar

### Step 2: Run the Enhanced Data Model

1. **Copy the contents** of `scripts/08-enhanced-data-model.sql`
2. **Paste it** into the SQL Editor in Supabase
3. **Click "Run"** to execute the script

This script will create:
- Enhanced user roles and permissions
- Comprehensive affiliate data model
- Rich cash call metadata
- Comments system
- Activity logs
- Committee-based checklists
- Enhanced stakeholders
- Workflow system

### Step 3: Seed with Sample Data

1. **Copy the contents** of `scripts/09-seed-enhanced-data.sql`
2. **Paste it** into the SQL Editor in Supabase
3. **Click "Run"** to execute the script

This will add:
- 3 sample committees
- Checklist templates and items
- Sample affiliates with enhanced data
- Sample cash calls
- Sample comments and activity logs

### Step 4: Verify the Setup

Run this query in the SQL Editor to verify everything is set up:

```sql
-- Check what was created
SELECT 'Committees' as table_name, COUNT(*) as count FROM public.committees
UNION ALL
SELECT 'Checklist Templates', COUNT(*) FROM public.checklist_templates
UNION ALL
SELECT 'Checklist Items', COUNT(*) FROM public.checklist_items
UNION ALL
SELECT 'Enhanced Affiliates', COUNT(*) FROM public.affiliates
UNION ALL
SELECT 'Enhanced Cash Calls', COUNT(*) FROM public.cash_calls
UNION ALL
SELECT 'Affiliate Checklists', COUNT(*) FROM public.affiliate_checklists
UNION ALL
SELECT 'Comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'Activity Logs', COUNT(*) FROM public.activity_logs;
```

You should see counts for each table indicating the data was created successfully.

## 🎯 What's Now Available

After running these scripts, your enhanced backend will have:

### ✅ **Enhanced Data Models**
- **Users**: Role-based permissions (Admin, Approver, Affiliate, Viewer)
- **Affiliates**: Comprehensive data with contacts, financial ratings, risk levels
- **Cash Calls**: Rich metadata (priority, categories, payment terms, tags)
- **Comments**: Threaded commenting with attachments
- **Activity Logs**: Complete audit trail
- **Checklists**: Committee-based system with templates
- **Stakeholders**: Enhanced with permissions and notifications

### ✅ **Sample Data**
- 3 sample affiliates with enhanced information
- 3 sample cash calls with different statuses
- Committee-based checklist templates
- Sample comments and activity logs

## 🚀 Next Steps

Once your database is set up:

1. **Test the Application**: Visit http://localhost:3000
2. **Explore Features**:
   - Dashboard: http://localhost:3000/dashboard
   - Cash Call Details: http://localhost:3000/cash-call/[id]
   - Checklist Management: http://localhost:3000/checklist
3. **Create Users**: Use the signup page or Supabase Auth dashboard

## 🔧 Troubleshooting

### If you encounter errors:

1. **Check SQL Scripts**: Make sure you copied the entire contents of both files
2. **Verify Permissions**: Ensure your Supabase user has the necessary permissions
3. **Check Logs**: Look for any error messages in the SQL Editor
4. **Reset if Needed**: You can reset your database and start fresh if needed

### Common Issues:

- **Role already exists**: This is normal if you run the script multiple times
- **Table already exists**: The scripts use `IF NOT EXISTS` so this is safe
- **Permission denied**: Check your Supabase project settings

## 📞 Need Help?

If you encounter any issues:
1. Check the SQL Editor logs for error messages
2. Verify your Supabase project settings
3. Review the detailed documentation in `BACKEND_ENHANCEMENT_README.md`

Your enhanced cash call management system is almost ready! 🚀 