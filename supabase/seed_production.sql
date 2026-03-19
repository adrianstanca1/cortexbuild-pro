-- ═══════════════════════════════════════════════════════════════════════════
-- CortexBuild Platform - Production Seed Data v3.0
-- ═══════════════════════════════════════════════════════════════════════════
-- Target Records:
--   - 50+ Companies (GCs, Subs, Suppliers)
--   - 500+ Users with real roles
--   - 100+ Construction Projects
--   - 1000+ Documents with versions
--   - Real cost codes (CSI MasterFormat)
--   - Real equipment (CAT, Komatsu, etc.)
--   - Real materials (concrete, steel, lumber)
--   - Real safety incidents, RFIs, submittals
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: COMPANIES (50+ organizations)
-- ═══════════════════════════════════════════════════════════════════════════

-- General Contractors (10)
INSERT INTO companies (id, name, slug, industry, email, phone, website, city, state, country, subscription_plan, max_users, max_projects, features, is_active, is_verified, onboarding_completed) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Turner Construction Company', 'turner-construction', 'Construction', 'info@turnerconstruction.com', '212-555-0100', 'https://turnerconstruction.com', 'New York', 'NY', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000002', 'Bechtel Corporation', 'bechtel', 'Construction', 'contact@bechtel.com', '415-555-0101', 'https://bechtel.com', 'San Francisco', 'CA', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000003', 'Whiting-Turner Contracting', 'whiting-turner', 'Construction', 'info@whiting-turner.com', '410-555-0102', 'https://whiting-turner.com', 'Baltimore', 'MD', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, 'white_label': true}', true, true, true),
    ('00000000-0000-0000-0000-000000000004', 'DPR Construction', 'dpr-construction', 'Construction', 'info@dpr.com', '650-555-0103', 'https://dpr.com', 'Redwood City', 'CA', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000005', 'Suffolk Construction', 'suffolk', 'Construction', 'info@suffolk.com', '617-555-0104', 'https://suffolk.com', 'Boston', 'MA', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000006', 'Skanska USA', 'skanska', 'Construction', 'info@skanska.com', '404-555-0105', 'https://skanska.com', 'Atlanta', 'GA', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000007', 'Mortenson Construction', 'mortenson', 'Construction', 'info@mortenson.com', '763-555-0106', 'https://mortenson.com', 'Minneapolis', 'MN', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000008', 'McCarthy Building Companies', 'mccarthy', 'Construction', 'info@mccarthy.com', '314-555-0107', 'https://mccarthy.com', 'St. Louis', 'MO', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000009', 'PCL Construction', 'pcl', 'Construction', 'info@pcl.com', '303-555-0108', 'https://pcl.com', 'Denver', 'CO', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true),
    ('00000000-0000-0000-0000-000000000010', 'Gilbane Building Company', 'gilbane', 'Construction', 'info@gilbane.com', '401-555-0109', 'https://gilbane.com', 'Providence', 'RI', 'USA', 'enterprise', 500, 200, '{"ai_agents": true, "advanced_analytics": true, "api_access": true, "sso": true, "white_label": true}', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Subcontractors (20)
INSERT INTO companies (id, name, slug, industry, email, phone, city, state, subscription_plan, max_users, max_projects, is_active) VALUES
    ('00000000-0000-0000-0000-000000000011', 'ABC Electrical Contractors', 'abc-electrical', 'Electrical', 'info@abcelectrical.com', '555-0201', 'Chicago', 'IL', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000012', 'Premier Plumbing Services', 'premier-plumbing', 'Plumbing', 'info@premierplumbing.com', '555-0202', 'Houston', 'TX', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000013', 'Steel Works Inc', 'steel-works', 'Structural Steel', 'info@steelworks.com', '555-0203', 'Pittsburgh', 'PA', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000014', 'Concrete Solutions LLC', 'concrete-solutions', 'Concrete', 'info@concretesolutions.com', '555-0204', 'Phoenix', 'AZ', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000015', 'Apex Roofing Company', 'apex-roofing', 'Roofing', 'info@apexroofing.com', '555-0205', 'Dallas', 'TX', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000016', 'Master Drywall Systems', 'master-drywall', 'Drywall', 'info@masterdrywall.com', '555-0206', 'Las Vegas', 'NV', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000017', 'Precision HVAC', 'precision-hvac', 'HVAC', 'info@precisionhvac.com', '555-0207', 'Miami', 'FL', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000018', 'Ironwood Carpentry', 'ironwood-carpentry', 'Carpentry', 'info@ironwoodcarpentry.com', '555-0208', 'Portland', 'OR', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000019', 'Elite Painting Pros', 'elite-painting', 'Painting', 'info@elitepainting.com', '555-0209', 'San Diego', 'CA', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000020', 'Foundation Experts', 'foundation-experts', 'Foundation', 'info@foundationexperts.com', '555-0210', 'Seattle', 'WA', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000021', 'Coastal Masonry', 'coastal-masonry', 'Masonry', 'info@coastalmasonry.com', '555-0211', 'Tampa', 'FL', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000022', 'Titan Excavation', 'titan-excavation', 'Excavation', 'info@titanexcavation.com', '555-0212', 'Denver', 'CO', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000023', 'Quality Tile & Stone', 'quality-tile', 'Tile', 'info@qualitytile.com', '555-0213', 'Austin', 'TX', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000024', 'Metro Glass & Glazing', 'metro-glass', 'Glazing', 'info@metroglass.com', '555-0214', 'Detroit', 'MI', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000025', 'Advanced Fire Protection', 'advanced-fire', 'Fire Suppression', 'info@advancedfire.com', '555-0215', 'Nashville', 'TN', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000026', 'Landscape Masters', 'landscape-masters', 'Landscaping', 'info@landscapemasters.com', '555-0216', 'Sacramento', 'CA', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000027', 'Security Systems Pro', 'security-systems', 'Security', 'info@securitysystemspro.com', '555-0217', 'Charlotte', 'NC', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000028', 'Elevator Dynamics', 'elevator-dynamics', 'Elevator', 'info@elevatordynamics.com', '555-0218', 'Philadelphia', 'PA', 'professional', 50, 25, true),
    ('00000000-0000-0000-0000-000000000029', 'Insulation Specialists', 'insulation-specialists', 'Insulation', 'info@insulationspecialists.com', '555-0219', 'Columbus', 'OH', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000030', 'Flooring Solutions', 'flooring-solutions', 'Flooring', 'info@flooringsolutions.com', '555-0220', 'Indianapolis', 'IN', 'starter', 25, 15, true)
ON CONFLICT (id) DO NOTHING;

-- Suppliers (15)
INSERT INTO companies (id, name, slug, industry, email, phone, city, state, subscription_plan, max_users, max_projects, is_active) VALUES
    ('00000000-0000-0000-0000-000000000031', 'Cemex USA', 'cemex', 'Cement Supplier', 'info@cemexusa.com', '555-0301', 'Houston', 'TX', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000032', 'LafargeHolcim', 'lafargeholcim', 'Concrete Supplier', 'info@lafargeholcim.com', '555-0302', 'Chicago', 'IL', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000033', 'Nucor Steel', 'nucor', 'Steel Supplier', 'info@nucor.com', '555-0303', 'Charlotte', 'NC', 'enterprise', 200, 100, true),
    ('00000000-0000-0000-0000-000000000034', 'Weyerhaeuser', 'weyerhaeuser', 'Lumber Supplier', 'info@weyerhaeuser.com', '555-0304', 'Seattle', 'WA', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000035', 'Fastenal Company', 'fastenal', 'Fasteners', 'info@fastenal.com', '555-0305', 'Winona', 'MN', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000036', 'Grainger Industrial', 'grainger', 'Industrial Supply', 'info@grainger.com', '555-0306', 'Lake Forest', 'IL', 'enterprise', 200, 100, true),
    ('00000000-0000-0000-0000-000000000037', 'Home Depot Pro', 'homedepot-pro', 'Building Materials', 'info@homedepotpro.com', '555-0307', 'Atlanta', 'GA', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000038', 'ABC Supply Co', 'abc-supply', 'Roofing Materials', 'info@abcsupply.com', '555-0308', 'Beloit', 'WI', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000039', 'Ferguson Enterprises', 'ferguson', 'Plumbing Supply', 'info@ferguson.com', '555-0309', 'Newport News', 'VA', 'enterprise', 200, 100, true),
    ('00000000-0000-0000-0000-000000000040', 'Graybar Electric', 'graybar', 'Electrical Supply', 'info@graybar.com', '555-0310', 'St. Louis', 'MO', 'enterprise', 200, 100, true),
    ('00000000-0000-0000-0000-000000000041', 'McLane Company', 'mclane', 'Construction Materials', 'info@mclane.com', '555-0311', 'Temple', 'TX', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000042', 'Oldcastle Materials', 'oldcastle', 'Aggregates', 'info@oldcastle.com', '555-0312', 'Atlanta', 'GA', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000043', 'Vulcan Materials', 'vulcan', 'Construction Aggregates', 'info@vulcanmaterials.com', '555-0313', 'Birmingham', 'AL', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000044', 'Martin Marietta', 'martin-marietta', 'Heavy Building Materials', 'info@martinmarietta.com', '555-0314', 'Raleigh', 'NC', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000045', 'EMCOR Group', 'emcor', 'Mechanical Equipment', 'info@emcorgroup.com', '555-0315', 'Norwalk', 'CT', 'enterprise', 200, 100, true)
ON CONFLICT (id) DO NOTHING;

-- Equipment Rental Companies (5)
INSERT INTO companies (id, name, slug, industry, email, phone, city, state, subscription_plan, max_users, max_projects, is_active) VALUES
    ('00000000-0000-0000-0000-000000000046', 'United Rentals', 'united-rentals', 'Equipment Rental', 'info@unitedrentals.com', '555-0401', 'Stamford', 'CT', 'enterprise', 200, 100, true),
    ('00000000-0000-0000-0000-000000000047', 'Sunbelt Rentals', 'sunbelt', 'Equipment Rental', 'info@sunbeltrentals.com', '555-0402', 'Charlotte', 'NC', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000048', 'Herc Rentals', 'herc', 'Equipment Rental', 'info@hercrentals.com', '555-0403', 'Bonita Springs', 'FL', 'business', 100, 50, true),
    ('00000000-0000-0000-0000-000000000049', 'Home Depot Rental', 'hd-rental', 'Tool Rental', 'info@hdrental.com', '555-0404', 'Atlanta', 'GA', 'starter', 25, 15, true),
    ('00000000-0000-0000-0000-000000000050', 'Kennedy Rentals', 'kennedy', 'Heavy Equipment', 'info@kennedyrentals.com', '555-0405', 'Tulsa', 'OK', 'starter', 25, 15, true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: USERS (500+ with realistic roles)
-- ═══════════════════════════════════════════════════════════════════════════

-- Password hash for all users: 'password123' (bcrypt hashed)
-- In production, use proper password hashing

-- Super Admins (3)
INSERT INTO users (id, email, password_hash, name, first_name, last_name, role, company_id, is_email_verified, is_active) VALUES
    ('10000000-0000-0000-0000-000000000001', 'admin@cortexbuild.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'System', 'Admin', 'super_admin', '00000000-0000-0000-0000-000000000001', true, true),
    ('10000000-0000-0000-0000-000000000002', 'platform@cortexbuild.com', '$2b$10$N9qo8uLO