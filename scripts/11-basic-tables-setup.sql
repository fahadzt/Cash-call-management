-- Basic Tables Setup for Cash Call Management
-- Run this in your Supabase SQL Editor if cash call creation is failing

-- 1. Create affiliates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company_code TEXT UNIQUE NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    registration_number TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    country TEXT,
    city TEXT,
    postal_code TEXT,
    website TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    partnership_type TEXT,
    partnership_start_date DATE,
    partnership_end_date DATE,
    financial_rating TEXT,
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create cash_calls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cash_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_number TEXT NOT NULL UNIQUE,
    title TEXT,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    amount_requested DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'paid', 'rejected')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT,
    subcategory TEXT,
    description TEXT,
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0,
    amount_in_original_currency DECIMAL(15,2),
    original_currency TEXT,
    payment_terms TEXT,
    payment_method TEXT,
    bank_account_info JSONB,
    supporting_documents JSONB,
    rejection_reason TEXT,
    internal_notes TEXT,
    external_notes TEXT,
    tags TEXT[],
    risk_assessment TEXT,
    compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'approved', 'rejected', 'under_review')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_calls_affiliate_id ON public.cash_calls(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cash_calls_status ON public.cash_calls(status);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_by ON public.cash_calls(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_at ON public.cash_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_company_code ON public.affiliates(company_code);

-- 4. Add some sample data if tables are empty
INSERT INTO public.affiliates (name, company_code, status) 
VALUES 
    ('Aramco Digital', 'ARAMCO001', 'active'),
    ('Tech Solutions Inc', 'TECH001', 'active'),
    ('Global Partners Ltd', 'GLOBAL001', 'active')
ON CONFLICT (company_code) DO NOTHING;

-- 5. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER update_affiliates_updated_at
    BEFORE UPDATE ON public.affiliates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_calls_updated_at ON public.cash_calls;
CREATE TRIGGER update_cash_calls_updated_at
    BEFORE UPDATE ON public.cash_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS) but with permissive policies for testing
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_calls ENABLE ROW LEVEL SECURITY;

-- 8. Create permissive policies for testing (you can make these more restrictive later)
CREATE POLICY "Allow all operations on affiliates" ON public.affiliates
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on cash_calls" ON public.cash_calls
    FOR ALL USING (true);

-- 9. Grant necessary permissions
GRANT ALL ON public.affiliates TO authenticated;
GRANT ALL ON public.cash_calls TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 10. Verify the setup
SELECT 
    'affiliates' as table_name,
    COUNT(*) as row_count
FROM public.affiliates
UNION ALL
SELECT 
    'cash_calls' as table_name,
    COUNT(*) as row_count
FROM public.cash_calls; 