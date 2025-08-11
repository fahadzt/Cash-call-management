-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Affiliates policies (all authenticated users can read)
CREATE POLICY "Authenticated users can view affiliates" ON public.affiliates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage affiliates" ON public.affiliates
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Cash calls policies
CREATE POLICY "Users can view cash calls they created or are stakeholders in" ON public.cash_calls
  FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.stakeholders
      WHERE cash_call_id = id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can create cash calls" ON public.cash_calls
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update cash calls they created" ON public.cash_calls
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Stakeholders policies
CREATE POLICY "Users can view stakeholder assignments they're part of" ON public.stakeholders
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.cash_calls
      WHERE id = cash_call_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Audit log policies (read-only for admins)
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
