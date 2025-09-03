-- Migration script to update to new role system
-- ADMIN, FINANCE, CFO, AFFILIATE

-- 1. Update user roles enum
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('ADMIN', 'FINANCE', 'CFO', 'AFFILIATE');

-- 2. Update profiles table with new role column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_new user_role,
ADD COLUMN IF NOT EXISTS company_id TEXT;

-- 3. Migrate existing roles to new system
UPDATE public.profiles 
SET 
  role_new = CASE 
    WHEN role = 'admin' THEN 'ADMIN'::user_role
    WHEN role = 'approver' THEN 'CFO'::user_role
    WHEN role = 'affiliate' THEN 'AFFILIATE'::user_role
    WHEN role = 'viewer' THEN 'FINANCE'::user_role
    ELSE 'AFFILIATE'::user_role
  END,
  company_id = CASE 
    WHEN role = 'affiliate' THEN affiliate_company_id
    ELSE 'parent-company' -- Internal users belong to parent company
  END
WHERE role_new IS NULL;

-- 4. Drop old role column and rename new one
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles RENAME COLUMN role_new TO role;

-- 5. Update cash_calls table with new fields
ALTER TABLE public.cash_calls 
ADD COLUMN IF NOT EXISTS affiliate_company_id TEXT,
ADD COLUMN IF NOT EXISTS created_by_user_id TEXT,
ADD COLUMN IF NOT EXISTS assignee_user_id TEXT;

-- 6. Populate new fields from existing data
UPDATE public.cash_calls 
SET 
  affiliate_company_id = affiliate_id,
  created_by_user_id = created_by
WHERE affiliate_company_id IS NULL;

-- 7. Update status enum to include new workflow states
ALTER TABLE public.cash_calls 
DROP CONSTRAINT IF EXISTS cash_calls_status_check;

ALTER TABLE public.cash_calls 
ADD CONSTRAINT cash_calls_status_check 
CHECK (status IN ('draft', 'under_review', 'submitted', 'finance_review', 'ready_for_cfo', 'approved', 'paid', 'rejected'));

-- 8. Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_cash_calls_affiliate_company_id ON public.cash_calls(affiliate_company_id);
CREATE INDEX IF NOT EXISTS idx_cash_calls_assignee_user_id ON public.cash_calls(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_by_user_id ON public.cash_calls(created_by_user_id);

-- 9. Update RLS policies for new role system
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Authenticated users can view cash calls" ON public.cash_calls;

-- New RLS policies for tenant isolation
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Affiliate users can only see their own company's affiliates
CREATE POLICY "Affiliate users can view own company affiliates" ON public.affiliates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'FINANCE' OR profiles.role = 'CFO' 
           OR (profiles.role = 'AFFILIATE' AND profiles.company_id = affiliates.id))
    )
  );

-- Cash calls access control
CREATE POLICY "Role-based cash call access" ON public.cash_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = 'ADMIN' OR 
        profiles.role = 'FINANCE' OR 
        profiles.role = 'CFO' OR
        (profiles.role = 'AFFILIATE' AND profiles.company_id = cash_calls.affiliate_company_id)
      )
    )
  );

-- 10. Create activity logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 11. Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON public.activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 12. Enable RLS on activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs access policy
CREATE POLICY "Users can view activity logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'CFO')
    )
  );

-- 13. Insert sample data for testing
INSERT INTO public.profiles (id, email, full_name, role, company_id, is_active)
VALUES 
  ('admin-user-1', 'admin@example.com', 'System Administrator', 'ADMIN', 'parent-company', true),
  ('finance-user-1', 'finance1@example.com', 'Finance User 1', 'FINANCE', 'parent-company', true),
  ('finance-user-2', 'finance2@example.com', 'Finance User 2', 'FINANCE', 'parent-company', true),
  ('cfo-user-1', 'cfo@example.com', 'Chief Financial Officer', 'CFO', 'parent-company', true),
  ('affiliate-user-1', 'affiliate1@cyberani.com', 'Cyberani User', 'AFFILIATE', 'cyberani-001', true),
  ('affiliate-user-2', 'affiliate2@nextera.com', 'NextEra User', 'AFFILIATE', 'nextera-002', true)
ON CONFLICT (id) DO NOTHING;

-- 14. Update existing cash calls with sample assignments
UPDATE public.cash_calls 
SET assignee_user_id = 'finance-user-1'
WHERE status IN ('submitted', 'finance_review') 
AND assignee_user_id IS NULL
LIMIT 5;

-- 15. Create some sample activity logs
INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, old_values, new_values, metadata)
VALUES 
  ('admin-user-1', 'ASSIGNED_FINANCE', 'cash_calls', (SELECT id FROM public.cash_calls LIMIT 1), 
   '{"assigneeUserId": null}', '{"assigneeUserId": "finance-user-1"}', 
   '{"assigned_by": "admin-user-1", "assigned_to": "finance-user-1"}'),
  ('finance-user-1', 'STATUS_CHANGED', 'cash_calls', (SELECT id FROM public.cash_calls LIMIT 1), 
   '{"status": "submitted"}', '{"status": "finance_review"}', 
   '{"changed_by": "finance-user-1"}')
ON CONFLICT DO NOTHING;

-- 16. Add comments about the migration
COMMENT ON TABLE public.profiles IS 'Updated with new role system: ADMIN, FINANCE, CFO, AFFILIATE';
COMMENT ON COLUMN public.profiles.role IS 'New role system: ADMIN (full access), FINANCE (assigned items), CFO (approval), AFFILIATE (own company)';
COMMENT ON COLUMN public.profiles.company_id IS 'For tenant isolation: AFFILIATE users have their company ID, internal users have parent-company';
COMMENT ON TABLE public.cash_calls IS 'Updated with assignment system and new workflow states';
COMMENT ON COLUMN public.cash_calls.assignee_user_id IS 'Assigned FINANCE user for review (ADMIN can assign)';
COMMENT ON COLUMN public.cash_calls.affiliate_company_id IS 'For tenant isolation - matches affiliate_id but more explicit';
