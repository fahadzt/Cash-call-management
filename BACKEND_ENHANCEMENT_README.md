# Cash Call Management System - Enhanced Backend

This document outlines the enhanced backend structure for the Cash Call Management System, featuring normalized data models, proper relationships, and comprehensive functionality.

## 🏗️ Enhanced Data Model Overview

The backend has been completely restructured with proper normalization and relationships between all entities:

### Core Entities

1. **Users & Roles** - Enhanced user management with role-based permissions
2. **Affiliates** - Comprehensive affiliate information with contacts
3. **Cash Calls** - Rich cash call data with enhanced metadata
4. **Comments** - Threaded commenting system with attachments
5. **Activity Logs** - Comprehensive audit trail
6. **Checklists** - Committee-based checklist system
7. **Stakeholders** - Enhanced stakeholder management
8. **Workflows** - Approval workflow system

## 📊 Database Schema

### 1. User Management & Roles

```sql
-- Enhanced user roles
CREATE TYPE user_role AS ENUM ('admin', 'approver', 'affiliate', 'viewer');

-- Enhanced profiles table
ALTER TABLE public.profiles 
ADD COLUMN role user_role DEFAULT 'viewer',
ADD COLUMN department TEXT,
ADD COLUMN position TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Role permissions system
CREATE TABLE public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource, action)
);
```

### 2. Enhanced Affiliates

```sql
-- Enhanced affiliates with comprehensive data
ALTER TABLE public.affiliates 
ADD COLUMN legal_name TEXT,
ADD COLUMN tax_id TEXT,
ADD COLUMN registration_number TEXT,
ADD COLUMN country TEXT,
ADD COLUMN city TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN website TEXT,
ADD COLUMN status TEXT DEFAULT 'active',
ADD COLUMN partnership_type TEXT,
ADD COLUMN partnership_start_date DATE,
ADD COLUMN partnership_end_date DATE,
ADD COLUMN financial_rating TEXT,
ADD COLUMN risk_level TEXT DEFAULT 'low';

-- Affiliate contacts (many-to-many)
CREATE TABLE public.affiliate_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Enhanced Cash Calls

```sql
-- Enhanced cash calls with rich metadata
ALTER TABLE public.cash_calls 
ADD COLUMN title TEXT,
ADD COLUMN priority TEXT DEFAULT 'medium',
ADD COLUMN category TEXT,
ADD COLUMN subcategory TEXT,
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN exchange_rate DECIMAL(10,6) DEFAULT 1.0,
ADD COLUMN amount_in_original_currency DECIMAL(15,2),
ADD COLUMN original_currency TEXT,
ADD COLUMN payment_terms TEXT,
ADD COLUMN payment_method TEXT,
ADD COLUMN bank_account_info JSONB,
ADD COLUMN supporting_documents JSONB,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN internal_notes TEXT,
ADD COLUMN external_notes TEXT,
ADD COLUMN tags TEXT[],
ADD COLUMN risk_assessment TEXT,
ADD COLUMN compliance_status TEXT DEFAULT 'pending';

-- Cash call versioning for audit trail
CREATE TABLE public.cash_call_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cash_call_id, version_number)
);
```

### 4. Comments System

```sql
-- Threaded comments with attachments
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment attachments
CREATE TABLE public.comment_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Activity Logs

```sql
-- Comprehensive activity logging
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity categories
CREATE TABLE public.activity_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Enhanced Checklist System

```sql
-- Committees
CREATE TABLE public.committees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist templates
CREATE TABLE public.checklist_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist items
CREATE TABLE public.checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_requirements TEXT,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate checklists
CREATE TABLE public.affiliate_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in_progress',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist responses
CREATE TABLE public.checklist_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_checklist_id UUID REFERENCES public.affiliate_checklists(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started',
  response TEXT,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(affiliate_checklist_id, checklist_item_id)
);
```

### 7. Enhanced Stakeholders

```sql
-- Enhanced stakeholders with permissions
ALTER TABLE public.stakeholders 
ADD COLUMN permissions JSONB,
ADD COLUMN notification_preferences JSONB,
ADD COLUMN assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Stakeholder notifications
CREATE TABLE public.stakeholder_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Workflow System

```sql
-- Approval workflows
CREATE TABLE public.approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow steps
CREATE TABLE public.workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  required_role user_role,
  required_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_required BOOLEAN DEFAULT true,
  can_skip BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash call approvals
CREATE TABLE public.cash_call_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Database Operations

### Enhanced Database Functions

The new `lib/enhanced-database.ts` file provides comprehensive functions for all operations:

#### Cash Call Operations
```typescript
// Get enhanced cash calls with filters
const cashCalls = await getCashCallsEnhanced(userId, {
  status: ['under_review', 'approved'],
  priority: ['high', 'urgent'],
  date_from: '2024-01-01'
});

// Create enhanced cash call
const newCashCall = await createCashCallEnhanced({
  call_number: 'CC-2024-001',
  title: 'Digital Transformation Investment',
  affiliate_id: 'affiliate-uuid',
  amount_requested: 2500000,
  priority: 'high',
  category: 'Technology Investment',
  created_by: userId
});

// Update cash call with activity logging
const updatedCashCall = await updateCashCallEnhanced(
  cashCallId,
  { status: 'approved', priority: 'urgent' },
  userId
);
```

#### Comments System
```typescript
// Get threaded comments
const comments = await getComments(cashCallId);

// Create comment
const comment = await createComment({
  cash_call_id: cashCallId,
  user_id: userId,
  content: 'Review completed successfully',
  is_internal: false
});

// Create reply
const reply = await createComment({
  cash_call_id: cashCallId,
  user_id: userId,
  parent_comment_id: commentId,
  content: 'Additional information provided',
  is_internal: true
});
```

#### Activity Logs
```typescript
// Log activity
await logActivity({
  user_id: userId,
  action: 'Cash Call Updated',
  entity_type: 'cash_calls',
  entity_id: cashCallId,
  old_values: previousData,
  new_values: updatedData
});

// Get activity logs with filters
const logs = await getActivityLogs({
  entity_type: 'cash_calls',
  entity_id: cashCallId,
  limit: 50
});
```

#### Checklist Operations
```typescript
// Get committees
const committees = await getCommittees();

// Get checklist templates
const templates = await getChecklistTemplates(committeeId);

// Get checklist items
const items = await getChecklistItems(templateId, committeeId);

// Create affiliate checklist
const checklist = await createAffiliateChecklist({
  affiliate_id: affiliateId,
  cash_call_id: cashCallId,
  template_id: templateId,
  created_by: userId
});

// Get checklist responses
const responses = await getChecklistResponses(checklistId);

// Update checklist response
const response = await updateChecklistResponse(
  responseId,
  { status: 'completed', response: 'All documents submitted' },
  userId
);
```

#### Stakeholder Management
```typescript
// Get stakeholders
const stakeholders = await getStakeholders(cashCallId);

// Add stakeholder
const stakeholder = await addStakeholder({
  cash_call_id: cashCallId,
  user_id: userId,
  role: 'approver',
  permissions: { can_approve: true, can_comment: true },
  assigned_by: currentUserId
});

// Remove stakeholder
await removeStakeholder(stakeholderId);
```

#### Permission System
```typescript
// Check user permissions
const canApprove = await hasPermission(userId, 'cash_calls', 'approve');
const canCreate = await hasPermission(userId, 'cash_calls', 'create');

// Get user permissions
const permissions = await getUserPermissions(userId);
```

## 📋 Setup Instructions

### 1. Run Database Migration

Execute the enhanced data model script:

```bash
# Run the enhanced data model
psql -d your_database -f scripts/08-enhanced-data-model.sql

# Seed with sample data
psql -d your_database -f scripts/09-seed-enhanced-data.sql
```

### 2. Update Application Code

Replace the old database operations with the new enhanced functions:

```typescript
// Old way
import { getCashCalls, createCashCall } from './lib/database';

// New way
import { 
  getCashCallsEnhanced, 
  createCashCallEnhanced,
  getComments,
  createComment,
  logActivity
} from './lib/enhanced-database';
```

### 3. Update Components

Update your React components to use the new data structures:

```typescript
// Example: Enhanced cash call component
const CashCallDetail = ({ cashCallId }: { cashCallId: string }) => {
  const [cashCall, setCashCall] = useState<CashCall | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [checklistProgress, setChecklistProgress] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [cashCallData, commentsData, progressData] = await Promise.all([
        getCashCallEnhanced(cashCallId),
        getComments(cashCallId),
        getChecklistProgress(cashCallId)
      ]);
      
      setCashCall(cashCallData);
      setComments(commentsData);
      setChecklistProgress(progressData);
    };
    
    loadData();
  }, [cashCallId]);

  // Component JSX...
};
```

## 🎯 Key Features

### 1. **Normalized Data Structure**
- Proper relationships between all entities
- No data duplication
- Referential integrity with foreign keys

### 2. **Role-Based Access Control**
- Four user roles: Admin, Approver, Affiliate, Viewer
- Granular permissions per resource and action
- Easy permission checking with `hasPermission()` function

### 3. **Comprehensive Audit Trail**
- All changes logged with before/after values
- User tracking with IP addresses and session IDs
- Activity categorization for easy filtering

### 4. **Threaded Comments System**
- Support for nested comments (replies)
- Internal vs external comments
- Private comments for sensitive information
- File attachments support

### 5. **Committee-Based Checklists**
- Three main committees with specific checklists
- Template-based checklist creation
- Progress tracking and completion percentages
- Review workflow for checklist items

### 6. **Enhanced Cash Call Management**
- Rich metadata (priority, category, tags, etc.)
- Multi-currency support
- Payment terms and methods
- Risk assessment and compliance tracking
- Version control for changes

### 7. **Advanced Stakeholder Management**
- Granular permissions per stakeholder
- Notification preferences
- Assignment tracking
- Soft deletion (deactivation)

### 8. **Workflow System**
- Configurable approval workflows
- Multi-step approval processes
- Role-based and user-based approvals
- Skip conditions and requirements

## 🔍 Database Views

The enhanced system includes several views for easy querying:

### `cash_calls_enhanced`
Provides comprehensive cash call data with related information:
- Affiliate details
- Creator and approver information
- Comment counts
- Stakeholder counts
- Checklist progress

### `checklist_progress`
Shows checklist completion progress by committee:
- Total items per committee
- Completed items count
- In-progress items count
- Completion percentage

## 📊 Performance Optimizations

### Indexes
The enhanced schema includes strategic indexes for optimal performance:
- Cash calls: affiliate_id, created_by, status, created_at, due_date
- Comments: cash_call_id, user_id, created_at
- Activity logs: entity_type, entity_id, user_id, created_at
- Checklist responses: affiliate_checklist_id, status
- Stakeholders: cash_call_id, user_id

### Query Optimization
- Efficient joins using foreign keys
- Proper indexing on frequently queried columns
- Views for complex aggregations
- JSONB for flexible metadata storage

## 🔒 Security Features

### Row Level Security (RLS)
- User-based access control
- Role-based permissions
- Data isolation between users

### Audit Trail
- Complete change history
- User action tracking
- Compliance-ready logging

### Permission System
- Granular resource-level permissions
- Action-based access control
- Easy permission management

## 🚀 Migration Path

### Phase 1: Database Migration
1. Run `08-enhanced-data-model.sql`
2. Run `09-seed-enhanced-data.sql`
3. Verify data integrity

### Phase 2: Code Migration
1. Update imports to use enhanced database functions
2. Update components to handle new data structures
3. Implement new features (comments, checklists, etc.)

### Phase 3: Feature Rollout
1. Enable new features gradually
2. Train users on new functionality
3. Monitor performance and usage

## 📈 Benefits

1. **Scalability**: Normalized structure supports growth
2. **Maintainability**: Clear relationships and constraints
3. **Flexibility**: JSONB fields for extensible metadata
4. **Security**: Comprehensive audit trail and permissions
5. **Performance**: Optimized queries and indexing
6. **Compliance**: Complete change tracking and logging
7. **User Experience**: Rich features like comments and checklists
8. **Business Intelligence**: Enhanced reporting capabilities

This enhanced backend provides a solid foundation for a comprehensive cash call management system with enterprise-grade features and scalability. 