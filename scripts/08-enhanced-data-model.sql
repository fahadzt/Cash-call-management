-- Enhanced Data Model for Cash Call Management System
-- This script creates a normalized, scalable database structure

-- =====================================================
-- 1. ENHANCED USER ROLES AND PERMISSIONS
-- =====================================================

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'approver', 'affiliate', 'viewer');

-- Update profiles table with enhanced role system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer',
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS affiliate_company_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Create role permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- =====================================================
-- 2. ENHANCED AFFILIATES MODEL
-- =====================================================

-- Add more fields to affiliates table
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS partnership_type TEXT,
ADD COLUMN IF NOT EXISTS partnership_start_date DATE,
ADD COLUMN IF NOT EXISTS partnership_end_date DATE,
ADD COLUMN IF NOT EXISTS financial_rating TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

-- Create affiliate contacts table (many-to-many)
CREATE TABLE IF NOT EXISTS public.affiliate_contacts (
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

-- =====================================================
-- 3. ENHANCED CASH CALLS MODEL
-- =====================================================

-- Add more fields to cash_calls table
ALTER TABLE public.cash_calls 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS amount_in_original_currency DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS original_currency TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS bank_account_info JSONB,
ADD COLUMN IF NOT EXISTS supporting_documents JSONB,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS external_notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS risk_assessment TEXT,
ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'approved', 'rejected', 'under_review'));

-- Create cash call versions table for audit trail
CREATE TABLE IF NOT EXISTS public.cash_call_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cash_call_id, version_number)
);

-- =====================================================
-- 4. COMMENTS SYSTEM
-- =====================================================

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
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

-- Create comment attachments table
CREATE TABLE IF NOT EXISTS public.comment_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ENHANCED ACTIVITY LOGS
-- =====================================================

-- Drop existing audit_log table if it exists
DROP TABLE IF EXISTS public.audit_log;

-- Create enhanced activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
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

-- Create activity log categories
CREATE TABLE IF NOT EXISTS public.activity_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ENHANCED CHECKLIST SYSTEM
-- =====================================================

-- Create committees table
CREATE TABLE IF NOT EXISTS public.committees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklist templates table
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklist items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
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

-- Create affiliate checklists table
CREATE TABLE IF NOT EXISTS public.affiliate_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklist item responses table
CREATE TABLE IF NOT EXISTS public.checklist_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_checklist_id UUID REFERENCES public.affiliate_checklists(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'under_review', 'needs_revision', 'on_hold', 'approved', 'completed', 'rejected', 'blocked', 'pending_info', 'waiting_approval', 'escalated')),
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

-- =====================================================
-- 7. ENHANCED STAKEHOLDERS SYSTEM
-- =====================================================

-- Add more fields to stakeholders table
ALTER TABLE public.stakeholders 
ADD COLUMN IF NOT EXISTS permissions JSONB,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create stakeholder notifications table
CREATE TABLE IF NOT EXISTS public.stakeholder_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. WORKFLOW AND APPROVAL SYSTEM
-- =====================================================

-- Create approval workflows table
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow steps table
CREATE TABLE IF NOT EXISTS public.workflow_steps (
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

-- Create cash call approvals table
CREATE TABLE IF NOT EXISTS public.cash_call_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  workflow_step_id UUID REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_calls_affiliate_id ON public.cash_calls(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_by ON public.cash_calls(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_calls_status ON public.cash_calls(status);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_at ON public.cash_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_calls_due_date ON public.cash_calls(due_date);

CREATE INDEX IF NOT EXISTS idx_comments_cash_call_id ON public.comments(cash_call_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type_entity_id ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_checklist_responses_affiliate_checklist_id ON public.checklist_responses(affiliate_checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_responses_status ON public.checklist_responses(status);

CREATE INDEX IF NOT EXISTS idx_stakeholders_cash_call_id ON public.stakeholders(cash_call_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_user_id ON public.stakeholders(user_id);

-- =====================================================
-- 10. SEED DATA
-- =====================================================

-- Insert default committees
INSERT INTO public.committees (name, description, color, order_index) VALUES
('Aramco Digital Company', 'Primary digital transformation committee', '#3B82F6', 1),
('Business Proponent - T&I Affiliate Affairs', 'Technology and innovation affairs committee', '#10B981', 2),
('2nd Tiered Affiliate - NextEra', 'Energy partnership committee', '#F59E0B', 3)
ON CONFLICT DO NOTHING;

-- Insert default role permissions
INSERT INTO public.role_permissions (role, resource, action) VALUES
-- Admin permissions
('admin', 'cash_calls', 'create'),
('admin', 'cash_calls', 'read'),
('admin', 'cash_calls', 'update'),
('admin', 'cash_calls', 'delete'),
('admin', 'cash_calls', 'approve'),
('admin', 'affiliates', 'create'),
('admin', 'affiliates', 'read'),
('admin', 'affiliates', 'update'),
('admin', 'affiliates', 'delete'),
('admin', 'users', 'create'),
('admin', 'users', 'read'),
('admin', 'users', 'update'),
('admin', 'users', 'delete'),
-- Approver permissions
('approver', 'cash_calls', 'read'),
('approver', 'cash_calls', 'update'),
('approver', 'cash_calls', 'approve'),
('approver', 'affiliates', 'read'),
('approver', 'users', 'read'),
-- Affiliate permissions
('affiliate', 'cash_calls', 'create'),
('affiliate', 'cash_calls', 'read'),
('affiliate', 'cash_calls', 'update'),
('affiliate', 'affiliates', 'read'),
-- Viewer permissions
('viewer', 'cash_calls', 'read'),
('viewer', 'affiliates', 'read')
ON CONFLICT DO NOTHING;

-- Insert default activity categories
INSERT INTO public.activity_categories (name, description, color) VALUES
('Cash Call Created', 'When a new cash call is created', '#10B981'),
('Cash Call Updated', 'When a cash call is modified', '#3B82F6'),
('Cash Call Approved', 'When a cash call is approved', '#059669'),
('Cash Call Rejected', 'When a cash call is rejected', '#DC2626'),
('Cash Call Paid', 'When a cash call is marked as paid', '#7C3AED'),
('Comment Added', 'When a comment is added', '#6B7280'),
('Checklist Updated', 'When checklist items are updated', '#F59E0B'),
('User Activity', 'General user activity', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. VIEWS FOR EASY QUERYING
-- =====================================================

-- Enhanced cash calls view with all related data
CREATE OR REPLACE VIEW cash_calls_enhanced AS
SELECT 
    cc.*,
    a.name as affiliate_name,
    a.company_code as affiliate_code,
    a.status as affiliate_status,
    p_creator.full_name as creator_name,
    p_creator.email as creator_email,
    p_creator.role as creator_role,
    p_approver.full_name as approver_name,
    p_approver.email as approver_email,
    p_approver.role as approver_role,
    (SELECT COUNT(*) FROM public.comments WHERE cash_call_id = cc.id) as comment_count,
    (SELECT COUNT(*) FROM public.stakeholders WHERE cash_call_id = cc.id AND is_active = true) as stakeholder_count,
    (SELECT COUNT(*) FROM public.checklist_responses cr 
     JOIN public.affiliate_checklists ac ON cr.affiliate_checklist_id = ac.id 
     WHERE ac.cash_call_id = cc.id AND cr.status = 'completed') as completed_checklist_items,
    (SELECT COUNT(*) FROM public.checklist_responses cr 
     JOIN public.affiliate_checklists ac ON cr.affiliate_checklist_id = ac.id 
     WHERE ac.cash_call_id = cc.id) as total_checklist_items
FROM public.cash_calls cc
LEFT JOIN public.affiliates a ON cc.affiliate_id = a.id
LEFT JOIN public.profiles p_creator ON cc.created_by = p_creator.id
LEFT JOIN public.profiles p_approver ON cc.approved_by = p_approver.id;

-- Checklist progress view
CREATE OR REPLACE VIEW checklist_progress AS
SELECT 
    ac.id as affiliate_checklist_id,
    ac.affiliate_id,
    ac.cash_call_id,
    c.name as committee_name,
    COUNT(cr.id) as total_items,
    COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as completed_items,
    COUNT(CASE WHEN cr.status = 'in_progress' THEN 1 END) as in_progress_items,
    COUNT(CASE WHEN cr.status = 'not_started' THEN 1 END) as not_started_items,
    ROUND(
        (COUNT(CASE WHEN cr.status = 'completed' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(cr.id), 0)::DECIMAL) * 100, 2
    ) as completion_percentage
FROM public.affiliate_checklists ac
LEFT JOIN public.checklist_responses cr ON ac.id = cr.affiliate_checklist_id
LEFT JOIN public.checklist_items ci ON cr.checklist_item_id = ci.id
LEFT JOIN public.committees c ON ci.committee_id = c.id
GROUP BY ac.id, ac.affiliate_id, ac.cash_call_id, c.name;

-- Grant permissions on views
GRANT SELECT ON cash_calls_enhanced TO authenticated;
GRANT SELECT ON checklist_progress TO authenticated; 