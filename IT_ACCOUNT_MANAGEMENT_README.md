# IT-Managed Account Creation System

## Overview

This system replaces the previous user signup functionality with a comprehensive IT-managed account creation workflow. IT administrators now have full control over who can access the Cash Call Management System, ensuring proper governance and security compliance.

## Key Features

### 🔐 **Complete IT Control**
- IT admins approve/reject all account requests
- IT assigns roles and permissions from the start
- IT controls affiliate company assignments
- No unauthorized account creation

### 📋 **Account Request Workflow**
1. **User submits request** → Fills out comprehensive form
2. **IT receives notification** → Email alert for new requests
3. **IT reviews request** → In enhanced user management interface
4. **IT approves/rejects** → With role assignment and affiliate mapping
5. **Account created automatically** → Firebase Auth + database profile
6. **Welcome email sent** → With temporary credentials
7. **User can login** → And change password on first access

### 🎯 **Enhanced Security**
- Role-based access control from account creation
- Audit trail for all account activities
- Manager approval required for requests
- Comprehensive request validation

## System Components

### 1. **Account Request Form** (`/account-request`)
- Replaces the old signup page
- Collects comprehensive user information
- Requires manager approval details
- Validates against existing accounts

### 2. **Enhanced User Management** (`/manage-users`)
- New tab interface for account requests
- Full request review and approval system
- Role assignment and affiliate mapping
- Request status tracking

### 3. **Database Structure**
- `account_requests` table for pending requests
- `activity_logs` table for audit trail
- Enhanced user profiles with role management

### 4. **API Endpoints**
- `POST /api/account-requests` - Submit new requests
- `POST /api/users/create` - Create approved accounts
- `POST /api/account-requests/[id]/reject` - Reject requests
- `POST /api/account-requests/[id]/request-info` - Request more info

## Database Schema

### Account Requests Table
```sql
CREATE TABLE public.account_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  phone TEXT,
  affiliate_company_id UUID REFERENCES public.affiliates(id),
  reason_for_access TEXT,
  manager_name TEXT,
  manager_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  assigned_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Activity Logs Table
```sql
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## User Roles & Permissions

### **Viewer** (Default)
- Read-only access to cash calls
- View affiliate information
- Basic dashboard access

### **Affiliate**
- Manage own cash calls
- Submit new cash call requests
- View own affiliate data

### **Approver**
- Review and approve cash calls
- Manage cash call workflows
- Access to approval dashboard

### **Admin**
- Full system access
- User management
- Account request approval
- System configuration

## Implementation Steps

### 1. **Database Setup**
```bash
# Run the SQL script to create new tables
psql -d your_database -f scripts/21-create-account-requests.sql
```

### 2. **Environment Variables**
```bash
# Add to your .env file
ADMIN_NOTIFICATION_EMAILS=admin1@company.com,admin2@company.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. **Email Service Integration**
The system includes a placeholder email service. To enable real emails:

1. Choose an email provider (SendGrid, AWS SES, etc.)
2. Update `lib/email-service.ts` with your provider's integration
3. Set up environment variables for your email service

### 4. **Firebase Configuration**
Ensure your Firebase project has the necessary authentication settings:
- Email/password authentication enabled
- Appropriate security rules
- Service account credentials for server-side operations

## Usage Guide

### For Users Requesting Access

1. **Navigate to** `/account-request`
2. **Fill out the form** with:
   - Personal information (name, email, position, department)
   - Company information (affiliate company if applicable)
   - Access justification
   - Manager approval details
3. **Submit request** and wait for IT review
4. **Receive notification** when account is approved/rejected

### For IT Administrators

1. **Access user management** via `/manage-users`
2. **Switch to "Account Requests" tab** to view pending requests
3. **Review each request** for completeness and justification
4. **Approve requests** by:
   - Assigning appropriate role
   - Mapping to affiliate company
   - Adding approval notes
   - Sending welcome email (optional)
5. **Reject requests** with reason and notes
6. **Request more information** if needed

## Security Features

### **Access Control**
- Only admin users can manage account requests
- Row-level security (RLS) on all tables
- Audit logging for all administrative actions

### **Data Validation**
- Email uniqueness validation
- Required field validation
- Manager approval verification
- Duplicate request prevention

### **Audit Trail**
- All account creation activities logged
- Request approval/rejection tracking
- Role assignment history
- Admin action accountability

## Email Notifications

The system supports several types of automated emails:

### **Welcome Email**
- Sent when account is approved
- Includes temporary credentials
- Login instructions and security notes

### **Rejection Email**
- Sent when request is rejected
- Includes rejection reason
- Contact information for follow-up

### **Information Request Email**
- Sent when more details are needed
- Specific information requested
- Instructions for response

### **Admin Notifications**
- Alert admins of new requests
- Request summary and action required
- Direct link to admin panel

## Troubleshooting

### Common Issues

1. **Account Creation Fails**
   - Check Firebase authentication settings
   - Verify database permissions
   - Review error logs for specific issues

2. **Email Not Sending**
   - Verify email service configuration
   - Check environment variables
   - Review email service logs

3. **Permission Denied Errors**
   - Ensure user has admin role
   - Check RLS policies
   - Verify database connections

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_ACCOUNT_REQUESTS=true
```

## Future Enhancements

### **Planned Features**
- Bulk account request processing
- Advanced role templates
- Automated approval workflows
- Integration with HR systems
- Advanced reporting and analytics

### **Integration Opportunities**
- Single Sign-On (SSO) integration
- Active Directory synchronization
- Multi-factor authentication (MFA)
- Advanced audit reporting

## Support

For technical support or questions about the IT-managed account creation system:

1. **Check the logs** for error details
2. **Review this documentation** for implementation details
3. **Contact the development team** for complex issues
4. **Submit feature requests** through the project repository

---

**Note**: This system is designed for enterprise environments where strict access control and governance are required. All account creation activities are logged and auditable for compliance purposes.
