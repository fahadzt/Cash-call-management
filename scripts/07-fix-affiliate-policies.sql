-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can insert affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can update affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Admins can delete affiliates" ON public.affiliates;

-- Create separate, clear policies for each operation
CREATE POLICY "Admins and managers can insert affiliates" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update affiliates" ON public.affiliates
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete affiliates" ON public.affiliates
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Ensure the existing SELECT policy is still there
DROP POLICY IF EXISTS "Authenticated users can view affiliates" ON public.affiliates;
CREATE POLICY "Authenticated users can view affiliates" ON public.affiliates
  FOR SELECT TO authenticated USING (true);
