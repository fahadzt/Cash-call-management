-- Fix Existing Tables for Cash Call Management
-- This script works with existing tables and adds missing columns

-- 1. First, let's see what tables exist and their structure
-- (This will help us understand what we're working with)

-- 2. Add missing columns to affiliates table if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'status') THEN
        ALTER TABLE public.affiliates ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'legal_name') THEN
        ALTER TABLE public.affiliates ADD COLUMN legal_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'tax_id') THEN
        ALTER TABLE public.affiliates ADD COLUMN tax_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'registration_number') THEN
        ALTER TABLE public.affiliates ADD COLUMN registration_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'contact_email') THEN
        ALTER TABLE public.affiliates ADD COLUMN contact_email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'contact_phone') THEN
        ALTER TABLE public.affiliates ADD COLUMN contact_phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'address') THEN
        ALTER TABLE public.affiliates ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'country') THEN
        ALTER TABLE public.affiliates ADD COLUMN country TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'city') THEN
        ALTER TABLE public.affiliates ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'postal_code') THEN
        ALTER TABLE public.affiliates ADD COLUMN postal_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'website') THEN
        ALTER TABLE public.affiliates ADD COLUMN website TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'partnership_type') THEN
        ALTER TABLE public.affiliates ADD COLUMN partnership_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'partnership_start_date') THEN
        ALTER TABLE public.affiliates ADD COLUMN partnership_start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'partnership_end_date') THEN
        ALTER TABLE public.affiliates ADD COLUMN partnership_end_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'financial_rating') THEN
        ALTER TABLE public.affiliates ADD COLUMN financial_rating TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'risk_level') THEN
        ALTER TABLE public.affiliates ADD COLUMN risk_level TEXT DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'affiliates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.affiliates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Create cash_calls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cash_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_number TEXT NOT NULL UNIQUE,
    title TEXT,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    amount_requested DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'draft',
    priority TEXT DEFAULT 'medium',
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
    compliance_status TEXT DEFAULT 'pending',
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_calls_affiliate_id ON public.cash_calls(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_cash_calls_status ON public.cash_calls(status);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_by ON public.cash_calls(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_calls_created_at ON public.cash_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_company_code ON public.affiliates(company_code);

-- 5. Add some sample data if affiliates table is empty
INSERT INTO public.affiliates (name, company_code, status) 
VALUES 
    ('Aramco Digital', 'ARAMCO001', 'active'),
    ('Tech Solutions Inc', 'TECH001', 'active'),
    ('Global Partners Ltd', 'GLOBAL001', 'active')
ON CONFLICT (company_code) DO NOTHING;

-- 6. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers to automatically update updated_at
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

-- 8. Enable Row Level Security (RLS) but with permissive policies for testing
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_calls ENABLE ROW LEVEL SECURITY;

-- 9. Create permissive policies for testing (you can make these more restrictive later)
DROP POLICY IF EXISTS "Allow all operations on affiliates" ON public.affiliates;
CREATE POLICY "Allow all operations on affiliates" ON public.affiliates
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on cash_calls" ON public.cash_calls;
CREATE POLICY "Allow all operations on cash_calls" ON public.cash_calls
    FOR ALL USING (true);

-- 10. Grant necessary permissions
GRANT ALL ON public.affiliates TO authenticated;
GRANT ALL ON public.cash_calls TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Verify the setup
SELECT 
    'affiliates' as table_name,
    COUNT(*) as row_count
FROM public.affiliates
UNION ALL
SELECT 
    'cash_calls' as table_name,
    COUNT(*) as row_count
FROM public.cash_calls; 