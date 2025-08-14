-- Fix User CNTXT Assignment
-- This script will assign the current user to CNTXT affiliate company

-- First, ensure CNTXT exists
INSERT INTO public.affiliates (id, name, company_code, status, created_at, updated_at) VALUES
  ('cntxt-003', 'CNTXT', 'CNTXT-003', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_code = EXCLUDED.company_code,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Update the current user's profile to assign them to CNTXT
-- Replace 'YOUR_EMAIL_HERE' with your actual email address
UPDATE public.profiles 
SET affiliate_company_id = 'cntxt-003'
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace this with your email
  AND role = 'affiliate';

-- Alternative: Update all affiliate users who don't have an affiliate_company_id
UPDATE public.profiles 
SET affiliate_company_id = 'cntxt-003'
WHERE role = 'affiliate' 
  AND affiliate_company_id IS NULL;

-- Show the updated user profile
SELECT 
  'Updated User Profile:' as info,
  p.email,
  p.role,
  p.affiliate_company_id,
  a.name as affiliate_name,
  a.company_code
FROM public.profiles p
LEFT JOIN public.affiliates a ON p.affiliate_company_id = a.id
WHERE p.role = 'affiliate'
ORDER BY p.email;

-- Verify CNTXT exists
SELECT 'CNTXT Affiliate:' as info;
SELECT id, name, company_code, status FROM public.affiliates WHERE id = 'cntxt-003';
