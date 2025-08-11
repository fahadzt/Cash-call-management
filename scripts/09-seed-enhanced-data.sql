-- Seed Enhanced Database with Sample Data
-- This script populates the enhanced data model with realistic sample data

-- =====================================================
-- 1. SEED COMMITTEES AND CHECKLIST TEMPLATES
-- =====================================================

-- Insert checklist templates for each committee
INSERT INTO public.checklist_templates (name, description, committee_id, is_default) 
SELECT 
    'Standard Digital Partnership Checklist',
    'Comprehensive checklist for digital transformation partnerships',
    id,
    true
FROM public.committees 
WHERE name = 'Aramco Digital Company'
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_templates (name, description, committee_id, is_default) 
SELECT 
    'Technology Innovation Partnership Checklist',
    'Checklist for technology and innovation affiliate partnerships',
    id,
    true
FROM public.committees 
WHERE name = 'Business Proponent - T&I Affiliate Affairs'
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_templates (name, description, committee_id, is_default) 
SELECT 
    'Energy Partnership Checklist',
    'Comprehensive checklist for energy sector partnerships',
    id,
    true
FROM public.committees 
WHERE name = '2nd Tiered Affiliate - NextEra'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. SEED CHECKLIST ITEMS FOR ARAMCO DIGITAL
-- =====================================================

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '1',
    'Corporate Registration Certificate',
    'Valid corporate registration certificate from the relevant authority',
    'Original or certified copy of corporate registration certificate, notarized if required',
    true,
    1
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Aramco Digital Company' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '2',
    'Tax Registration Documents',
    'Complete tax registration and compliance documentation',
    'Tax registration certificate, VAT registration (if applicable), tax clearance certificate',
    true,
    2
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Aramco Digital Company' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '3',
    'Financial Statements (Last 3 Years)',
    'Audited financial statements for the past three years',
    'Annual audited financial statements, balance sheets, income statements, cash flow statements',
    true,
    3
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Aramco Digital Company' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '4',
    'Board Resolution for Partnership',
    'Board resolution authorizing the partnership agreement',
    'Board resolution minutes, signed by board members, notarized if required',
    true,
    4
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Aramco Digital Company' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '5',
    'Digital Transformation Strategy',
    'Comprehensive digital transformation strategy document',
    'Digital strategy roadmap, technology stack documentation, implementation timeline',
    true,
    5
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Aramco Digital Company' AND ct.is_default = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. SEED CHECKLIST ITEMS FOR BUSINESS PROPONENT
-- =====================================================

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '1',
    'Business Plan & Strategy Document',
    'Comprehensive business plan and strategic roadmap',
    'Executive summary, market analysis, competitive analysis, financial projections',
    true,
    1
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Business Proponent - T&I Affiliate Affairs' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '2',
    'Technology Transfer Agreement',
    'Technology transfer and intellectual property agreement',
    'Technology transfer agreement, IP licensing terms, confidentiality clauses',
    true,
    2
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Business Proponent - T&I Affiliate Affairs' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '3',
    'Intellectual Property Documentation',
    'Complete IP portfolio and protection documentation',
    'Patent documentation, trademark certificates, copyright registrations, trade secrets protection',
    true,
    3
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Business Proponent - T&I Affiliate Affairs' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '4',
    'Innovation & Development Roadmap',
    'Detailed innovation and development roadmap',
    'R&D roadmap, innovation pipeline, development milestones, resource allocation plan',
    true,
    4
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Business Proponent - T&I Affiliate Affairs' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '5',
    'Technical Capability Assessment',
    'Assessment of technical capabilities and expertise',
    'Technical team profiles, expertise matrix, capability assessment report',
    true,
    5
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = 'Business Proponent - T&I Affiliate Affairs' AND ct.is_default = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. SEED CHECKLIST ITEMS FOR NEXTERA
-- =====================================================

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '1',
    'Energy Partnership Agreement',
    'Comprehensive energy partnership agreement',
    'Partnership agreement, joint venture terms, operational framework',
    true,
    1
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = '2nd Tiered Affiliate - NextEra' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '2',
    'Renewable Energy Certificates',
    'Renewable energy certificates and compliance documentation',
    'REC certificates, renewable energy compliance reports, sustainability certifications',
    true,
    2
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = '2nd Tiered Affiliate - NextEra' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '3',
    'Environmental Impact Assessment',
    'Environmental impact assessment and sustainability report',
    'EIA report, environmental compliance certificates, sustainability assessment',
    true,
    3
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = '2nd Tiered Affiliate - NextEra' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '4',
    'Grid Integration Technical Specs',
    'Technical specifications for grid integration',
    'Grid integration study, technical specifications, interconnection agreements',
    true,
    4
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = '2nd Tiered Affiliate - NextEra' AND ct.is_default = true
ON CONFLICT DO NOTHING;

INSERT INTO public.checklist_items (template_id, committee_id, item_number, title, description, document_requirements, is_required, order_index)
SELECT 
    ct.id,
    c.id,
    '5',
    'Energy Market Analysis',
    'Comprehensive energy market analysis and projections',
    'Market analysis report, demand projections, competitive landscape analysis',
    true,
    5
FROM public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE c.name = '2nd Tiered Affiliate - NextEra' AND ct.is_default = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. SEED SAMPLE AFFILIATES WITH ENHANCED DATA
-- =====================================================

INSERT INTO public.affiliates (
    name, 
    company_code, 
    legal_name,
    contact_email,
    contact_phone,
    address,
    country,
    city,
    website,
    partnership_type,
    partnership_start_date,
    financial_rating,
    risk_level
) VALUES 
(
    'TechInnovate Solutions',
    'TIS-001',
    'TechInnovate Solutions Ltd.',
    'contact@techinnovate.com',
    '+1-555-0123',
    '123 Innovation Drive, Tech City, TC 12345',
    'United States',
    'Tech City',
    'https://techinnovate.com',
    'Technology Partnership',
    '2023-01-15',
    'A+',
    'low'
),
(
    'GreenEnergy Partners',
    'GEP-002',
    'GreenEnergy Partners LLC',
    'info@greenenergy.com',
    '+1-555-0456',
    '456 Renewable Way, Green City, GC 67890',
    'United States',
    'Green City',
    'https://greenenergy.com',
    'Energy Partnership',
    '2023-03-20',
    'A',
    'medium'
),
(
    'Digital Dynamics Corp',
    'DDC-003',
    'Digital Dynamics Corporation',
    'hello@digitaldynamics.com',
    '+1-555-0789',
    '789 Digital Boulevard, Cyber City, CC 11111',
    'United States',
    'Cyber City',
    'https://digitaldynamics.com',
    'Digital Transformation',
    '2023-06-10',
    'A-',
    'low'
)
ON CONFLICT (company_code) DO NOTHING;

-- =====================================================
-- 6. SEED SAMPLE CASH CALLS WITH ENHANCED DATA
-- =====================================================

-- Get affiliate IDs for reference
DO $$
DECLARE
    tis_id UUID;
    gep_id UUID;
    ddc_id UUID;
BEGIN
    -- Get affiliate IDs
    SELECT id INTO tis_id FROM public.affiliates WHERE company_code = 'TIS-001';
    SELECT id INTO gep_id FROM public.affiliates WHERE company_code = 'GEP-002';
    SELECT id INTO ddc_id FROM public.affiliates WHERE company_code = 'DDC-003';

    -- Insert sample cash calls if affiliates exist
    IF tis_id IS NOT NULL THEN
        INSERT INTO public.cash_calls (
            call_number,
            title,
            affiliate_id,
            amount_requested,
            status,
            priority,
            category,
            description,
            currency,
            payment_terms,
            tags,
            due_date,
            created_by
        ) VALUES (
            'CC-2024-001',
            'Digital Transformation Infrastructure Investment',
            tis_id,
            2500000.00,
            'under_review',
            'high',
            'Technology Investment',
            'Investment in digital infrastructure and cloud migration services',
            'USD',
            'Net 30',
            ARRAY['digital-transformation', 'infrastructure', 'cloud'],
            '2024-03-15',
            (SELECT id FROM auth.users LIMIT 1)
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF gep_id IS NOT NULL THEN
        INSERT INTO public.cash_calls (
            call_number,
            title,
            affiliate_id,
            amount_requested,
            status,
            priority,
            category,
            description,
            currency,
            payment_terms,
            tags,
            due_date,
            created_by
        ) VALUES (
            'CC-2024-002',
            'Renewable Energy Project Funding',
            gep_id,
            5000000.00,
            'approved',
            'urgent',
            'Energy Investment',
            'Funding for solar energy project development and implementation',
            'USD',
            'Net 45',
            ARRAY['renewable-energy', 'solar', 'sustainability'],
            '2024-04-20',
            (SELECT id FROM auth.users LIMIT 1)
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF ddc_id IS NOT NULL THEN
        INSERT INTO public.cash_calls (
            call_number,
            title,
            affiliate_id,
            amount_requested,
            status,
            priority,
            category,
            description,
            currency,
            payment_terms,
            tags,
            due_date,
            created_by
        ) VALUES (
            'CC-2024-003',
            'AI and Machine Learning Platform Development',
            ddc_id,
            1800000.00,
            'draft',
            'medium',
            'AI Development',
            'Development of AI and ML platform for predictive analytics',
            'USD',
            'Net 30',
            ARRAY['ai', 'machine-learning', 'analytics'],
            '2024-05-10',
            (SELECT id FROM auth.users LIMIT 1)
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 7. CREATE SAMPLE AFFILIATE CHECKLISTS
-- =====================================================

-- Create affiliate checklists for existing cash calls
INSERT INTO public.affiliate_checklists (affiliate_id, cash_call_id, template_id, status, created_by)
SELECT 
    cc.affiliate_id,
    cc.id,
    ct.id,
    'in_progress',
    cc.created_by
FROM public.cash_calls cc
CROSS JOIN public.checklist_templates ct
JOIN public.committees c ON ct.committee_id = c.id
WHERE ct.is_default = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. SEED SAMPLE COMMENTS
-- =====================================================

-- Insert sample comments for cash calls
INSERT INTO public.comments (cash_call_id, user_id, content, is_internal, is_private)
SELECT 
    cc.id,
    cc.created_by,
    'Initial review completed. All documentation appears to be in order.',
    false,
    false
FROM public.cash_calls cc
WHERE cc.status = 'under_review'
ON CONFLICT DO NOTHING;

INSERT INTO public.comments (cash_call_id, user_id, content, is_internal, is_private)
SELECT 
    cc.id,
    cc.created_by,
    'Additional financial documentation required before approval.',
    true,
    false
FROM public.cash_calls cc
WHERE cc.status = 'under_review'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. SEED SAMPLE ACTIVITY LOGS
-- =====================================================

-- Insert sample activity logs
INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, new_values)
SELECT 
    cc.created_by,
    'Cash Call Created',
    'cash_calls',
    cc.id,
    jsonb_build_object('call_number', cc.call_number, 'amount', cc.amount_requested)
FROM public.cash_calls cc
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify the seeded data
SELECT 'Committees' as table_name, COUNT(*) as count FROM public.committees
UNION ALL
SELECT 'Checklist Templates' as table_name, COUNT(*) as count FROM public.checklist_templates
UNION ALL
SELECT 'Checklist Items' as table_name, COUNT(*) as count FROM public.checklist_items
UNION ALL
SELECT 'Enhanced Affiliates' as table_name, COUNT(*) as count FROM public.affiliates
UNION ALL
SELECT 'Enhanced Cash Calls' as table_name, COUNT(*) as count FROM public.cash_calls
UNION ALL
SELECT 'Affiliate Checklists' as table_name, COUNT(*) as count FROM public.affiliate_checklists
UNION ALL
SELECT 'Comments' as table_name, COUNT(*) as count FROM public.comments
UNION ALL
SELECT 'Activity Logs' as table_name, COUNT(*) as count FROM public.activity_logs; 