-- Add affiliate_company_id field to profiles table
-- This script adds the missing field that's causing the "Affiliate company not found" error

-- Add the affiliate_company_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS affiliate_company_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Update existing affiliate users to have a default affiliate company if they don't have one
-- This is a temporary fix - you should manually assign the correct affiliate_company_id to each user
UPDATE public.profiles 
SET affiliate_company_id = (
  SELECT id FROM public.affiliates 
  WHERE status = 'active' 
  ORDER BY created_at 
  LIMIT 1
)
WHERE role = 'affiliate' 
  AND affiliate_company_id IS NULL
  AND EXISTS (SELECT 1 FROM public.affiliates WHERE status = 'active');

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_company_id ON public.profiles(affiliate_company_id);

-- Add RLS policy for affiliate_company_id
CREATE POLICY "Users can view affiliate_company_id" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Verify the changes
SELECT 
  'Profiles with affiliate_company_id' as check_type,
  COUNT(*) as count
FROM public.profiles 
WHERE affiliate_company_id IS NOT NULL

UNION ALL

SELECT 
  'Profiles without affiliate_company_id' as check_type,
  COUNT(*) as count
FROM public.profiles 
WHERE affiliate_company_id IS NULL;
