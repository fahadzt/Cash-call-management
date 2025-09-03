-- Create account requests table for IT-managed account creation
CREATE TABLE IF NOT EXISTS public.account_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  phone TEXT,
  affiliate_company_id UUID REFERENCES public.affiliates(id),
  reason_for_access TEXT,
  manager_name TEXT,
  manager_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  assigned_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view all requests, users can view their own
CREATE POLICY "Admins can view all requests" ON public.account_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own requests" ON public.account_requests
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Only admins can insert/update/delete requests
CREATE POLICY "Admins can manage requests" ON public.account_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to create user profile after account approval
CREATE OR REPLACE FUNCTION public.create_user_profile_after_approval(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT,
  affiliate_company_id UUID DEFAULT NULL,
  user_position TEXT DEFAULT NULL,
  user_department TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id, email, full_name, role, affiliate_company_id, 
    position, department, phone, is_active, created_at
  ) VALUES (
    user_id, user_email, user_full_name, user_role::user_role, 
    affiliate_company_id, user_position, user_department, 
    user_phone, true, NOW()
  );

  -- Log the account creation
  INSERT INTO public.activity_logs (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    user_id, 'account_created', 'user', user_id, 
    json_build_object(
      'role', user_role,
      'affiliate_company_id', affiliate_company_id,
      'created_by_admin', true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view all logs, users can view their own
CREATE POLICY "Admins can view all logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);
