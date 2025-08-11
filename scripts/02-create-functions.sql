-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate cash call numbers
CREATE OR REPLACE FUNCTION public.generate_cash_call_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(call_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.cash_calls
  WHERE call_number ~ '^CC-[0-9]+$';
  
  NEW.call_number = 'CC-' || LPAD(next_number::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
