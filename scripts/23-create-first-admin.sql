-- Script to create the first IT admin account
-- IMPORTANT: Only run this ONCE to create your first admin account
-- After that, use the web interface to create additional accounts

-- Step 1: First, create the user in Firebase Auth manually
-- You can do this through Firebase Console or Firebase CLI
-- Example Firebase CLI command:
-- firebase auth:create-user --email "admin@company.com" --password "securepassword123" --display-name "Admin User"

-- Step 2: Get the Firebase User ID from the created user
-- You can find this in Firebase Console or from the CLI output

-- Step 3: Replace 'YOUR_FIREBASE_USER_ID' below with the actual ID from Firebase
-- Replace 'admin@company.com' with your actual email
-- Replace 'Your Full Name' with your actual name

-- Step 4: Run this script

-- Create the first admin profile
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  is_active, 
  created_at,
  department,
  position
) VALUES (
  'YOUR_FIREBASE_USER_ID', -- REPLACE WITH ACTUAL FIREBASE USER ID
  'admin@company.com',      -- REPLACE WITH YOUR ACTUAL EMAIL
  'Your Full Name',         -- REPLACE WITH YOUR ACTUAL NAME
  'admin',
  true,
  NOW(),
  'IT',
  'System Administrator'
);

-- Log the admin account creation
INSERT INTO public.activity_logs (
  user_id,
  action,
  resource_type,
  resource_id,
  details,
  created_at
) VALUES (
  'YOUR_FIREBASE_USER_ID', -- REPLACE WITH ACTUAL FIREBASE USER ID
  'first_admin_created',
  'user',
  'YOUR_FIREBASE_USER_ID', -- REPLACE WITH ACTUAL FIREBASE USER ID
  '{"created_by": "system_setup", "note": "First admin account created during system setup"}',
  NOW()
);

-- Verify the admin account was created
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM public.profiles 
WHERE role = 'admin';

-- Show all profiles to confirm
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM public.profiles 
ORDER BY created_at;
