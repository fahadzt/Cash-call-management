-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_code TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cash_calls table
CREATE TABLE IF NOT EXISTS public.cash_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_number TEXT UNIQUE NOT NULL,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_requested DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'paid', 'rejected')),
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create stakeholders table (many-to-many relationship with cash_calls)
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_call_id UUID REFERENCES public.cash_calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'reviewer' CHECK (role IN ('reviewer', 'approver', 'observer')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cash_call_id, user_id)
);

-- Create audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
