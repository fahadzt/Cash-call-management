-- Debug Cash Calls and Affiliate Assignments
-- This script helps diagnose why cash calls aren't showing up for affiliate users

-- Check all cash calls in the database
SELECT 'All Cash Calls:' as info;
SELECT 
  id,
  call_number,
  affiliate_id,
  amount_requested,
  status,
  created_by,
  created_at
FROM public.cash_calls
ORDER BY created_at DESC;

-- Check all affiliates
SELECT 'All Affiliates:' as info;
SELECT 
  id,
  name,
  company_code,
  status
FROM public.affiliates
ORDER BY name;

-- Check user profiles and their affiliate assignments
SELECT 'User Profiles:' as info;
SELECT 
  id,
  email,
  role,
  affiliate_company_id,
  created_at
FROM public.profiles
WHERE role = 'affiliate'
ORDER BY email;

-- Check if there are any cash calls with affiliate_id that don't match existing affiliates
SELECT 'Cash Calls with Invalid Affiliate IDs:' as info;
SELECT 
  cc.id,
  cc.call_number,
  cc.affiliate_id,
  cc.created_at,
  CASE 
    WHEN a.id IS NULL THEN 'Invalid affiliate ID'
    ELSE a.name
  END as affiliate_status
FROM public.cash_calls cc
LEFT JOIN public.affiliates a ON cc.affiliate_id = a.id
WHERE a.id IS NULL
ORDER BY cc.created_at DESC;

-- Check cash calls for CNTXT specifically
SELECT 'Cash Calls for CNTXT:' as info;
SELECT 
  cc.id,
  cc.call_number,
  cc.affiliate_id,
  cc.amount_requested,
  cc.status,
  cc.created_at,
  a.name as affiliate_name
FROM public.cash_calls cc
LEFT JOIN public.affiliates a ON cc.affiliate_id = a.id
WHERE cc.affiliate_id = 'cntxt-003' OR a.name = 'CNTXT'
ORDER BY cc.created_at DESC;

-- Summary statistics
SELECT 'Summary:' as info;
SELECT 
  'Total Cash Calls' as metric,
  COUNT(*) as count
FROM public.cash_calls

UNION ALL

SELECT 
  'Cash Calls with Valid Affiliate IDs' as metric,
  COUNT(*) as count
FROM public.cash_calls cc
JOIN public.affiliates a ON cc.affiliate_id = a.id

UNION ALL

SELECT 
  'Cash Calls with Invalid Affiliate IDs' as metric,
  COUNT(*) as count
FROM public.cash_calls cc
LEFT JOIN public.affiliates a ON cc.affiliate_id = a.id
WHERE a.id IS NULL;
