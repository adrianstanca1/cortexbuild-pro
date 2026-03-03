-- ============================================================================
-- CREATE TEST USERS FOR CORTEXBUILD V3 ULTIMATE
-- ============================================================================
-- These users allow testing all role types with specific credentials
-- 
-- Credentials:
-- 1. Super Admin:    adrian.stanca1@gmail.com / Cumparavinde1
-- 2. Company Admin:  adrian@ascladdingltd.co.uk / lolozania1
-- 3. Developer:      dev@constructco.com / password123
-- ============================================================================

-- First, ensure companies exist
INSERT INTO companies (id, name, status, subscription_plan)
VALUES 
    ('comp_constructai', 'ConstructAI Platform', 'active', 'enterprise'),
    ('comp_ascladdingltd', 'ASC Cladding Ltd', 'active', 'professional'),
    ('comp_constructco', 'ConstructCo', 'active', 'starter')
ON CONFLICT (id) DO NOTHING;

-- Create auth users in Supabase Auth (if not exists)
-- Note: This requires Supabase Auth API or Dashboard

-- Create user profiles in users table
-- Passwords will need to be set via Supabase Auth

INSERT INTO users (id, email, name, role, company_id)
VALUES 
    -- Super Admin (already exists, update if needed)
    (
        gen_random_uuid(),
        'adrian.stanca1@gmail.com',
        'Adrian Stanca',
        'super_admin',
        'comp_constructai'
    ),
    -- Company Admin
    (
        gen_random_uuid(),
        'adrian@ascladdingltd.co.uk',
        'Adrian ASC',
        'company_admin',
        'comp_ascladdingltd'
    ),
    -- Developer
    (
        gen_random_uuid(),
        'dev@constructco.com',
        'Developer User',
        'developer',
        'comp_constructco'
    )
ON CONFLICT (email) 
DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id;

-- Verify users were created
SELECT email, name, role, company_id FROM users 
WHERE email IN ('adrian.stanca1@gmail.com', 'adrian@ascladdingltd.co.uk', 'dev@constructco.com')
ORDER BY role DESC;

