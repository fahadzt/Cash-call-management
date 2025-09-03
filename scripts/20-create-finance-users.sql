-- Create Finance Users for Assignment System
-- This script adds finance users to the system for testing the assignment functionality

-- Insert finance users with the 'viewer' role (which maps to 'FINANCE' in the new system)
INSERT INTO public.profiles (id, email, full_name, role, company_id, is_active, created_at, updated_at)
VALUES 
  ('finance-user-1', 'finance1@example.com', 'Sarah Johnson', 'viewer', 'parent-company', true, NOW(), NOW()),
  ('finance-user-2', 'finance2@example.com', 'Michael Chen', 'viewer', 'parent-company', true, NOW(), NOW()),
  ('finance-user-3', 'finance3@example.com', 'Emily Rodriguez', 'viewer', 'parent-company', true, NOW(), NOW()),
  ('finance-user-4', 'finance4@example.com', 'David Thompson', 'viewer', 'parent-company', true, NOW(), NOW()),
  ('finance-user-5', 'finance5@example.com', 'Lisa Wang', 'viewer', 'parent-company', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Add some additional details for finance users
UPDATE public.profiles 
SET 
  department = 'Finance',
  position = 'Financial Analyst',
  phone = '+1-555-0123'
WHERE id = 'finance-user-1';

UPDATE public.profiles 
SET 
  department = 'Finance',
  position = 'Senior Financial Analyst',
  phone = '+1-555-0124'
WHERE id = 'finance-user-2';

UPDATE public.profiles 
SET 
  department = 'Finance',
  position = 'Financial Controller',
  phone = '+1-555-0125'
WHERE id = 'finance-user-3';

UPDATE public.profiles 
SET 
  department = 'Finance',
  position = 'Financial Manager',
  phone = '+1-555-0126'
WHERE id = 'finance-user-4';

UPDATE public.profiles 
SET 
  department = 'Finance',
  position = 'Financial Director',
  phone = '+1-555-0127'
WHERE id = 'finance-user-5';

-- Create some sample cash calls for testing assignment
INSERT INTO public.cash_calls (
  call_number, 
  affiliate_id, 
  amount_requested, 
  status, 
  description, 
  created_by, 
  created_at, 
  updated_at,
  affiliate_company_id,
  created_by_user_id
) VALUES 
  ('CC-2024-001', (SELECT id FROM public.affiliates LIMIT 1), 50000.00, 'submitted', 'Equipment purchase for Cyberani', 'admin-user-1', NOW(), NOW(), (SELECT id FROM public.affiliates LIMIT 1), 'admin-user-1'),
  ('CC-2024-002', (SELECT id FROM public.affiliates LIMIT 1), 75000.00, 'submitted', 'Software licensing for NextEra', 'admin-user-1', NOW(), NOW(), (SELECT id FROM public.affiliates LIMIT 1), 'admin-user-1'),
  ('CC-2024-003', (SELECT id FROM public.affiliates LIMIT 1), 120000.00, 'draft', 'Infrastructure upgrade', 'admin-user-1', NOW(), NOW(), (SELECT id FROM public.affiliates LIMIT 1), 'admin-user-1'),
  ('CC-2024-004', (SELECT id FROM public.affiliates LIMIT 1), 25000.00, 'submitted', 'Training program', 'admin-user-1', NOW(), NOW(), (SELECT id FROM public.affiliates LIMIT 1), 'admin-user-1'),
  ('CC-2024-005', (SELECT id FROM public.affiliates LIMIT 1), 90000.00, 'submitted', 'Research and development', 'admin-user-1', NOW(), NOW(), (SELECT id FROM public.affiliates LIMIT 1), 'admin-user-1')
ON CONFLICT (call_number) DO NOTHING;

-- Assign some cash calls to finance users for testing
UPDATE public.cash_calls 
SET assignee_user_id = 'finance-user-1'
WHERE call_number = 'CC-2024-001';

UPDATE public.cash_calls 
SET assignee_user_id = 'finance-user-2'
WHERE call_number = 'CC-2024-002';

UPDATE public.cash_calls 
SET assignee_user_id = 'finance-user-3'
WHERE call_number = 'CC-2024-004';

-- Create activity logs for the assignments
INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, old_values, new_values, metadata, created_at)
VALUES 
  ('admin-user-1', 'ASSIGNED_FINANCE', 'cash_calls', (SELECT id FROM public.cash_calls WHERE call_number = 'CC-2024-001'), 
   '{"assigneeUserId": null}', '{"assigneeUserId": "finance-user-1"}', 
   '{"assigned_by": "admin-user-1", "assigned_to": "finance-user-1"}', NOW()),
  
  ('admin-user-1', 'ASSIGNED_FINANCE', 'cash_calls', (SELECT id FROM public.cash_calls WHERE call_number = 'CC-2024-002'), 
   '{"assigneeUserId": null}', '{"assigneeUserId": "finance-user-2"}', 
   '{"assigned_by": "admin-user-1", "assigned_to": "finance-user-2"}', NOW()),
  
  ('admin-user-1', 'ASSIGNED_FINANCE', 'cash_calls', (SELECT id FROM public.cash_calls WHERE call_number = 'CC-2024-004'), 
   '{"assigneeUserId": null}', '{"assigneeUserId": "finance-user-3"}', 
   '{"assigned_by": "admin-user-1", "assigned_to": "finance-user-3"}', NOW())
ON CONFLICT DO NOTHING;

-- Display the created finance users
SELECT 
  id,
  email,
  full_name,
  role,
  department,
  position,
  is_active,
  created_at
FROM public.profiles 
WHERE role = 'viewer' 
ORDER BY full_name;

-- Display cash calls with assignments
SELECT 
  cc.call_number,
  cc.amount_requested,
  cc.status,
  cc.assignee_user_id,
  p.full_name as assignee_name,
  p.email as assignee_email
FROM public.cash_calls cc
LEFT JOIN public.profiles p ON cc.assignee_user_id = p.id
WHERE cc.assignee_user_id IS NOT NULL
ORDER BY cc.created_at DESC;
