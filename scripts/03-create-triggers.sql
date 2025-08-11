-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_calls_updated_at
  BEFORE UPDATE ON public.cash_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for auto-generating cash call numbers
CREATE TRIGGER generate_cash_call_number_trigger
  BEFORE INSERT ON public.cash_calls
  FOR EACH ROW
  WHEN (NEW.call_number IS NULL)
  EXECUTE FUNCTION public.generate_cash_call_number();
