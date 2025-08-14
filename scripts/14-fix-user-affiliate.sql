-- Fix User Affiliate Assignment
-- This script helps assign the correct affiliate_company_id to users

-- Step 1: Check what affiliates exist
SELECT 'Available Affiliates:' as info;
SELECT id, name, company_code, status FROM public.affiliates ORDER BY name;

-- Step 2: Check current user profiles
SELECT 'Current User Profiles:' as info;
SELECT 
  id,
  email,
  role,
  affiliate_company_id,
  CASE 
    WHEN affiliate_company_id IS NULL THEN '❌ No affiliate assigned'
    WHEN EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_company_id) THEN '✅ Valid affiliate'
    ELSE '❌ Invalid affiliate ID'
  END as status
FROM public.profiles 
WHERE role = 'affiliate'
ORDER BY email;

-- Step 3: Show users without affiliate assignments
SELECT 'Users Needing Affiliate Assignment:' as info;
SELECT 
  id,
  email,
  role,
  affiliate_company_id
FROM public.profiles 
WHERE role = 'affiliate' 
  AND (affiliate_company_id IS NULL OR 
       NOT EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_company_id));

-- Step 4: Example of how to fix a user (uncomment and modify as needed)
-- UPDATE public.profiles 
-- SET affiliate_company_id = 'affiliate-id-from-step-1'
-- WHERE email = 'user-email@example.com';

-- Step 5: Verify the fix
SELECT 'After Fix - User Profiles:' as info;
SELECT 
  p.id,
  p.email,
  p.role,
  p.affiliate_company_id,
  a.name as affiliate_name,
  a.company_code
FROM public.profiles p
LEFT JOIN public.affiliates a ON p.affiliate_company_id = a.id
WHERE p.role = 'affiliate'
ORDER BY p.email;
