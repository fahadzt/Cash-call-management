-- Create Affiliate Companies for Signup Process
-- This script ensures the affiliate companies used in signup exist in the database

-- Insert the 4 affiliate companies used in the signup process
INSERT INTO public.affiliates (id, name, company_code, status, created_at, updated_at) VALUES
  ('cyberani-001', 'Cyberani', 'CYBERANI-001', 'active', NOW(), NOW()),
  ('nextera-002', 'NextEra', 'NEXTERA-002', 'active', NOW(), NOW()),
  ('cntxt-003', 'CNTXT', 'CNTXT-003', 'active', NOW(), NOW()),
  ('plantdigital-004', 'Plant Digital', 'PLANTDIGITAL-004', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_code = EXCLUDED.company_code,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Verify the affiliates were created
SELECT 'Created Affiliates:' as info;
SELECT id, name, company_code, status FROM public.affiliates WHERE id IN (
  'cyberani-001', 'nextera-002', 'cntxt-003', 'plantdigital-004'
) ORDER BY name;

-- Check if any users have affiliate_company_id that don't match existing affiliates
SELECT 'Users with Invalid Affiliate IDs:' as info;
SELECT 
  p.id,
  p.email,
  p.role,
  p.affiliate_company_id,
  CASE 
    WHEN p.affiliate_company_id IS NULL THEN 'No affiliate assigned'
    WHEN a.id IS NULL THEN 'Invalid affiliate ID'
    ELSE a.name
  END as affiliate_status
FROM public.profiles p
LEFT JOIN public.affiliates a ON p.affiliate_company_id = a.id
WHERE p.role = 'affiliate' 
  AND (p.affiliate_company_id IS NULL OR a.id IS NULL);

-- Show all affiliate users and their companies
SELECT 'All Affiliate Users:' as info;
SELECT 
  p.email,
  p.role,
  p.affiliate_company_id,
  a.name as affiliate_name,
  a.company_code
FROM public.profiles p
LEFT JOIN public.affiliates a ON p.affiliate_company_id = a.id
WHERE p.role = 'affiliate'
ORDER BY p.email;
