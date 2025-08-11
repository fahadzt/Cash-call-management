-- Insert sample affiliates
INSERT INTO public.affiliates (name, company_code, contact_email, contact_phone, address) VALUES
('Alpha Partners LLC', 'ALPHA', 'contact@alphapartners.com', '+1-555-0101', '123 Business Ave, New York, NY 10001'),
('Beta Ventures Inc', 'BETA', 'info@betaventures.com', '+1-555-0102', '456 Innovation Dr, San Francisco, CA 94105'),
('Gamma Holdings', 'GAMMA', 'admin@gammaholdings.com', '+1-555-0103', '789 Corporate Blvd, Chicago, IL 60601'),
('Delta Corp', 'DELTA', 'support@deltacorp.com', '+1-555-0104', '321 Enterprise St, Austin, TX 73301')
ON CONFLICT (company_code) DO NOTHING;
