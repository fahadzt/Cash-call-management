# Role Management Guide

## Overview

The Role Management system allows administrators to manage user roles and permissions across the Cash Call Management System, with special focus on affiliate account management.

## How to Access the Role Management Page

### Method 1: From Dashboard Header (Admin Only)
1. Log in to the system with an admin account
2. Navigate to the Dashboard (`/dashboard`)
3. Look for the "Manage Roles" button in the top-right header area
4. Click the button with the Shield icon to access the role management page

### Method 2: From Quick Actions (Admin Only)
1. On the Dashboard, scroll down to the "Quick Actions" section
2. Find the "Manage Roles" button (only visible to admin users)
3. Click to navigate to the role management page

### Method 3: From Checklist Page (Admin Only)
1. Navigate to the Checklist page (`/checklist`)
2. Look for the "Manage Roles" button in the header
3. Click to access the role management page

### Method 4: Direct URL Access
- Navigate directly to `/manage-roles` in your browser
- **Note**: Only admin users can access this page

## Available Roles

### 1. Administrator (admin)
- **Description**: Full system access and control
- **Permissions**: All system permissions
- **Color**: Red badge
- **Icon**: Shield

### 2. Approver (approver)
- **Description**: Can approve cash calls and manage workflows
- **Permissions**: 
  - Approve cash calls
  - Read and update cash calls
  - Read affiliate information
- **Color**: Blue badge
- **Icon**: UserCheck

### 3. Affiliate User (affiliate)
- **Description**: Can create and manage their affiliate's cash calls
- **Permissions**:
  - Create cash calls for their affiliate
  - Read and update their affiliate's cash calls
  - Read affiliate information
- **Color**: Green badge
- **Icon**: Building2

### 4. Viewer (viewer)
- **Description**: Read-only access to assigned resources
- **Permissions**:
  - Read cash calls
  - Read affiliate information
- **Color**: Gray badge
- **Icon**: Eye

## Features

### User Management Tab
- **Search & Filter**: Find users by name, email, role, affiliate, or status
- **Bulk Operations**: Select multiple users and update their roles simultaneously
- **Individual Editing**: Click the edit button to modify individual user roles
- **User Deletion**: Remove users from the system (with confirmation)

### Affiliate Management Tab
- **Overview**: See all affiliates with user counts and role distributions
- **Statistics**: View how many users are assigned to each affiliate
- **Status Monitoring**: Track affiliate status (active, inactive, suspended)

### Role Assignment for Affiliate Users
When assigning the "Affiliate User" role:
1. Select "Affiliate User" from the role dropdown
2. Choose the specific affiliate company from the affiliate dropdown
3. This ensures the user can only access resources for their assigned affiliate

## Security Features

### Access Control
- Only admin users can access the role management page
- Non-admin users will see an "Access Denied" message
- All role changes are logged for audit purposes

### Validation
- Users cannot assign themselves a lower role than their current role
- Affiliate users are automatically restricted to their assigned affiliate
- Role changes require confirmation for destructive actions

## Best Practices

### Role Assignment
1. **Principle of Least Privilege**: Assign the minimum role necessary for job functions
2. **Affiliate Isolation**: Ensure affiliate users are properly assigned to their companies
3. **Regular Review**: Periodically review user roles and permissions

### Security
1. **Admin Accounts**: Limit admin accounts to essential personnel only
2. **Role Auditing**: Regularly audit role assignments and permissions
3. **User Offboarding**: Remove or deactivate accounts when users leave

### Affiliate Management
1. **Clear Assignment**: Always assign affiliate users to the correct affiliate company
2. **Status Monitoring**: Keep affiliate status up to date
3. **User Distribution**: Monitor user distribution across affiliates

## Troubleshooting

### Common Issues

**"Access Denied" Message**
- Ensure you're logged in with an admin account
- Check that your user profile has the admin role

**Cannot Assign Affiliate Role**
- Make sure to select an affiliate company when assigning the affiliate role
- Verify the affiliate exists and is active

**Bulk Update Fails**
- Check that all selected users can be updated with the chosen role
- Ensure you have permission to modify all selected users

**User Not Appearing in List**
- Verify the user exists in the system
- Check if filters are hiding the user
- Ensure the user account is active

### Support
If you encounter issues with role management:
1. Check the browser console for error messages
2. Verify your admin permissions
3. Contact system administrators for assistance

## Technical Details

### Database Structure
- User roles are stored in the `profiles` table
- Affiliate assignments are linked via `affiliate_company_id`
- Role permissions are defined in the `role_permissions` table

### API Endpoints
- `GET /api/users` - Retrieve all users
- `PUT /api/users/{id}/role` - Update user role
- `DELETE /api/users/{id}` - Delete user
- `GET /api/affiliates` - Retrieve all affiliates

### Permissions Matrix
| Role | Cash Calls | Affiliates | Users | Settings |
|------|------------|------------|-------|----------|
| Admin | Full Access | Full Access | Full Access | Full Access |
| Approver | Read/Update/Approve | Read | Read | None |
| Affiliate | Create/Read/Update (own) | Read | None | None |
| Viewer | Read | Read | None | None |
