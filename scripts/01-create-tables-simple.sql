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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_calls ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view affiliates" ON public.affiliates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view cash calls" ON public.cash_calls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create cash calls" ON public.cash_calls
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
