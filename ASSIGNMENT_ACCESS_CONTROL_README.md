# Assignment & Access Control System

This document outlines the implementation of the new assignment and access control system for the Cash Call Management application.

## 🏗️ Overview

The system implements a comprehensive role-based access control (RBAC) system with assignment capabilities, ensuring proper tenant isolation and workflow management.

## 👥 Role System

### User Roles

1. **ADMIN**
   - Full access to all cash calls
   - Can assign/unassign FINANCE users to cash calls
   - Can perform all actions on any cash call
   - Can switch CAPEX/OPEX templates for any affiliate's checklist

2. **FINANCE**
   - Can view all cash calls but only modify assigned ones
   - Can transition assigned cash calls: `submitted` → `finance_review` → `ready_for_cfo`
   - Can request changes on assigned items
   - Cannot approve/reject (only CFO can do this)

3. **CFO**
   - Can view all cash calls
   - Can only approve/reject cash calls in `ready_for_cfo` status
   - Has read access to all cash call details

4. **AFFILIATE**
   - Can only access cash calls from their own company
   - Can create DRAFT cash calls in their company
   - Can submit their own DRAFT cash calls
   - Cannot see other companies' data (tenant isolation)

### User Model

```typescript
interface User {
  id: string
  email: string
  full_name: string
  role: 'ADMIN' | 'FINANCE' | 'CFO' | 'AFFILIATE'
  companyId: string // For tenant isolation
  affiliate_company_id?: string // Legacy field
  is_active: boolean
  // ... other fields
}
```

## 🏢 Tenant Isolation

### Company Assignment
- **AFFILIATE users**: `companyId` = their affiliate company ID
- **Internal users** (ADMIN, FINANCE, CFO): `companyId` = `'parent-company'`

### Data Access Rules
- AFFILIATE users can only see cash calls where `cashCall.affiliateCompanyId == user.companyId`
- Internal users can see all cash calls based on their role permissions
- No data leakage between companies

## 📋 Assignment System

### Cash Call Assignment
- Only **ADMIN** users can assign/unassign cash calls
- Can only assign to **FINANCE** users who are active
- Assignment creates activity log entries
- Assignment affects workflow permissions

### Cash Call Model

```typescript
interface CashCall {
  id: string
  affiliateCompanyId: string // For tenant isolation
  createdByUserId: string
  assigneeUserId?: string // Assigned FINANCE user (nullable)
  status: 'draft' | 'under_review' | 'submitted' | 'finance_review' | 'ready_for_cfo' | 'approved' | 'paid' | 'rejected'
  // ... other fields
}
```

## 🔄 Workflow States

### Status Transitions

1. **DRAFT** → **SUBMITTED** (AFFILIATE only)
2. **SUBMITTED** → **FINANCE_REVIEW** (Assigned FINANCE user)
3. **FINANCE_REVIEW** → **READY_FOR_CFO** (Assigned FINANCE user)
4. **READY_FOR_CFO** → **APPROVED/REJECTED** (CFO only)

### Role-Based Status Changes

| Role | Can Change Status | Allowed Transitions |
|------|------------------|-------------------|
| AFFILIATE | Only own DRAFT | DRAFT → SUBMITTED |
| FINANCE | Only assigned | SUBMITTED → FINANCE_REVIEW → READY_FOR_CFO |
| CFO | READY_FOR_CFO only | READY_FOR_CFO → APPROVED/REJECTED |
| ADMIN | All | Any transition |

## 🛡️ Access Control Functions

### Core Functions

1. **`getUsersByRole(role)`**
   - Returns active users by role
   - Used for assignment picker

2. **`assignCashCallToFinance(cashCallId, assigneeUserId, adminUserId)`**
   - Assigns cash call to FINANCE user
   - ADMIN only
   - Creates activity log

3. **`unassignCashCall(cashCallId, adminUserId)`**
   - Removes assignment
   - ADMIN only
   - Creates activity log

4. **`getCashCallsByAccess(userId, scope?)`**
   - Role-based cash call retrieval
   - Supports 'mine', 'affiliate', 'all' scopes

5. **`canUserPerformAction(userId, action, cashCallId)`**
   - Checks if user can perform specific action
   - Returns boolean

6. **`updateCashCallStatusWithAuth(cashCallId, newStatus, userId)`**
   - Status update with role validation
   - Enforces workflow rules

## 🌐 API Endpoints

### Users
```
GET /api/users?role=FINANCE
```
Returns active FINANCE users for assignment picker.

### Cash Call Assignment
```
PATCH /api/cash-calls/:id/assign
Body: { assigneeUserId, adminUserId }
```
Assigns/unassigns cash call to FINANCE user (ADMIN only).

### Cash Calls with Access Control
```
GET /api/cash-calls?userId=123&scope=mine
```
Returns cash calls based on user role and access permissions.

## 🎨 UI Components

### CashCallAssignment Component
- Shows current assignment status
- Allows ADMIN to assign/unassign FINANCE users
- Displays assignee information
- Handles assignment workflow

### Integration Points
- Added to cash call details page (ADMIN only)
- Shows assignment status in cash call lists
- Filters available in dashboard

## 📊 Activity Logging

### Assignment Events
- `ASSIGNED_FINANCE`: When cash call is assigned
- `UNASSIGNED_FINANCE`: When assignment is removed
- `STATUS_CHANGED`: When status changes

### Log Structure
```typescript
interface ActivityLog {
  user_id: string
  action: string
  entity_type: 'cash_calls'
  entity_id: string
  old_values: any
  new_values: any
  metadata: {
    assigned_by?: string
    assigned_to?: string
    // ... other metadata
  }
}
```

## 🔧 Database Schema

### Updated Tables

1. **profiles**
   - `role`: New enum ('ADMIN', 'FINANCE', 'CFO', 'AFFILIATE')
   - `company_id`: For tenant isolation

2. **cash_calls**
   - `affiliate_company_id`: Explicit tenant isolation
   - `created_by_user_id`: User who created
   - `assignee_user_id`: Assigned FINANCE user

3. **activity_logs** (new)
   - Tracks all assignment and status changes
   - Supports audit trail

### Indexes
- `idx_cash_calls_affiliate_company_id`
- `idx_cash_calls_assignee_user_id`
- `idx_cash_calls_created_by_user_id`
- `idx_activity_logs_user_id`
- `idx_activity_logs_entity_type`

## 🚀 Migration

### Migration Script
Run `scripts/19-migrate-to-new-role-system.sql` to:
1. Update role enum
2. Migrate existing users to new roles
3. Add new fields to cash_calls table
4. Create activity_logs table
5. Update RLS policies
6. Add sample data

### Role Mapping
- `admin` → `ADMIN`
- `approver` → `CFO`
- `affiliate` → `AFFILIATE`
- `viewer` → `FINANCE`

## 🧪 Testing

### Unit Tests Needed
1. **Affiliate isolation**: Verify AFFILIATE users can't see other companies
2. **Admin assignment**: Verify only ADMIN can assign/unassign
3. **Finance access**: Verify FINANCE users can only modify assigned items
4. **CFO decisions**: Verify CFO can only approve/reject READY_FOR_CFO items

### Test Scenarios
```typescript
// Test affiliate isolation
const affiliateUser = { role: 'AFFILIATE', companyId: 'cyberani-001' }
const cashCalls = await getCashCallsByAccess(affiliateUser.id)
// Should only return cash calls where affiliateCompanyId = 'cyberani-001'

// Test admin assignment
const adminUser = { role: 'ADMIN' }
await assignCashCallToFinance(cashCallId, financeUserId, adminUser.id)
// Should succeed and create activity log

// Test finance permissions
const financeUser = { role: 'FINANCE' }
const canEdit = await canUserPerformAction(financeUser.id, 'edit', cashCallId)
// Should return true only if cash call is assigned to this user
```

## 🔒 Security Considerations

1. **Tenant Isolation**: AFFILIATE users cannot access other companies' data
2. **Role Validation**: All actions validate user role before execution
3. **Assignment Validation**: Only active FINANCE users can be assigned
4. **Status Validation**: Workflow rules prevent invalid status transitions
5. **Activity Logging**: All changes are logged for audit purposes

## 📈 Future Enhancements

1. **Notification System**: Email/in-app notifications for assignments
2. **Bulk Assignment**: Assign multiple cash calls at once
3. **Assignment History**: Track assignment changes over time
4. **Auto-assignment**: Rules-based automatic assignment
5. **Escalation**: Automatic escalation for overdue items

## 🐛 Troubleshooting

### Common Issues

1. **"User does not have permission"**
   - Check user role and company assignment
   - Verify cash call assignment for FINANCE users

2. **"Invalid status transition"**
   - Check current status and user role
   - Verify workflow rules

3. **"Assignee not found"**
   - Ensure assignee is active FINANCE user
   - Check user exists and role is correct

### Debug Commands
```sql
-- Check user roles
SELECT id, email, role, company_id FROM profiles WHERE role IS NOT NULL;

-- Check cash call assignments
SELECT id, call_number, assignee_user_id, status FROM cash_calls WHERE assignee_user_id IS NOT NULL;

-- Check activity logs
SELECT action, entity_id, metadata FROM activity_logs WHERE action LIKE '%ASSIGN%';
```
