-- Check and fix foreign key relationships

-- Ensure the foreign key from cash_calls to profiles exists
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_calls_created_by_fkey' 
        AND table_name = 'cash_calls'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.cash_calls 
        ADD CONSTRAINT cash_calls_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure the foreign key from cash_calls to profiles for approved_by exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_calls_approved_by_fkey' 
        AND table_name = 'cash_calls'
    ) THEN
        ALTER TABLE public.cash_calls 
        ADD CONSTRAINT cash_calls_approved_by_fkey 
        FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure the foreign key from cash_calls to affiliates exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_calls_affiliate_id_fkey' 
        AND table_name = 'cash_calls'
    ) THEN
        ALTER TABLE public.cash_calls 
        ADD CONSTRAINT cash_calls_affiliate_id_fkey 
        FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create a view for easier cash call queries with user info
CREATE OR REPLACE VIEW cash_calls_with_details AS
SELECT 
    cc.*,
    a.name as affiliate_name,
    a.company_code as affiliate_code,
    p_creator.full_name as creator_name,
    p_creator.email as creator_email,
    p_approver.full_name as approver_name,
    p_approver.email as approver_email
FROM public.cash_calls cc
LEFT JOIN public.affiliates a ON cc.affiliate_id = a.id
LEFT JOIN public.profiles p_creator ON cc.created_by = p_creator.id
LEFT JOIN public.profiles p_approver ON cc.approved_by = p_approver.id;

-- Grant access to the view
GRANT SELECT ON cash_calls_with_details TO authenticated;
