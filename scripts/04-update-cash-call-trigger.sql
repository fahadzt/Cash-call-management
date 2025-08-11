-- Update the cash call number generation function
CREATE OR REPLACE FUNCTION public.generate_cash_call_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Only generate if call_number is not provided
  IF NEW.call_number IS NULL OR NEW.call_number = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(call_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.cash_calls
    WHERE call_number ~ '^CC-[0-9]+$';
    
    NEW.call_number = 'CC-' || LPAD(next_number::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS generate_cash_call_number_trigger ON public.cash_calls;
CREATE TRIGGER generate_cash_call_number_trigger
  BEFORE INSERT ON public.cash_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_cash_call_number();
