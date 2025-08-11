-- Add RLS policies for admin operations

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON public.profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage affiliates
CREATE POLICY "Admins can insert affiliates" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update affiliates" ON public.affiliates
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete affiliates" ON public.affiliates
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow all authenticated users to view all profiles (for user management)
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
