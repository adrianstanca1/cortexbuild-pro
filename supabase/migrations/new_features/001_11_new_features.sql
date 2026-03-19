-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 11 New Features for Production
-- Version: 3.0.0
-- Date: 2026-03-18
-- ═══════════════════════════════════════════════════════════════════════════

-- Feature 1: Equipment Management
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('excavator', 'bulldozer', 'crane', 'loader', 'forklift', 'generator', 'compressor', 'pump', 'welding', 'other')),
    category TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    year INTEGER,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'repair', 'retired')),
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    location TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id),
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    current_value DECIMAL(15, 2),
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    monthly_rate DECIMAL(10, 2),
    fuel_type TEXT,
    fuel_capacity DECIMAL(10, 2),
    operating_hours DECIMAL(10, 2) DEFAULT 0,
    last_service_date DATE,
    next_service_date DATE,
    service_interval_hours INTEGER,
    insurance_policy TEXT,
    insurance_expiry DATE,
    registration_number TEXT,
    license_plate TEXT,
    vin TEXT,
    features JSONB DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    photos TEXT[],
    documents TEXT[],
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'preventive' CHECK (type IN ('preventive', 'corrective', 'emergency', 'inspection')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    completed_date DATE,
    technician_id UUID REFERENCES users(id),
    vendor_id UUID REFERENCES vendors(id),
    work_performed TEXT,
    parts_replaced JSONB DEFAULT '[]',
    labor_hours DECIMAL(10, 2),
    parts_cost DECIMAL(15, 2) DEFAULT 0,
    labor_cost DECIMAL(15, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    downtime_hours DECIMAL(10, 2),
    next_service_date DATE,
    notes TEXT,
    photos TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_company ON equipment(company_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);

-- Feature 2: Materials & Inventory
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('concrete', 'steel', 'lumber', 'masonry', 'finishes', 'mechanical', 'electrical', 'plumbing', 'other')),
    subcategory TEXT,
    description TEXT,
    sku TEXT,
    manufacturer TEXT,
    supplier TEXT,
    unit TEXT DEFAULT 'each',
    unit_price DECIMAL(15, 2) DEFAULT 0,
    stock_quantity DECIMAL(12, 4) DEFAULT 0,
    reorder_level DECIMAL(12, 4) DEFAULT 0,
    reorder_quantity DECIMAL(12, 4) DEFAULT 0,
    warehouse_location TEXT,
    specifications JSONB DEFAULT '{}',
    safety_data TEXT,
    handling_instructions TEXT,
    storage_requirements TEXT,
    lead_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    photos TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 4) NOT NULL,
    unit TEXT,
    location TEXT,
    batch_number TEXT,
    lot_number TEXT,
    received_date DATE,
    expiry_date DATE,
    installed_quantity DECIMAL(12, 4) DEFAULT 0,
    wasted_quantity DECIMAL(12, 4) DEFAULT 0,
    notes TEXT,
    tracked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_company ON materials(company_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_material_inventory_material ON material_inventory(material_id);

-- Feature 3: Permit Management
CREATE TABLE IF NOT EXISTS permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    permit_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hot_work', 'confined_space', 'excavation', 'electrical', 'lockout_tagout', 'working_at_height', 'crane_lift', 'demolition', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'expired', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
    requested_by UUID REFERENCES users(id),
    requested_date TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    extended_until DATE,
    location TEXT,
    work_description TEXT,
    hazards TEXT[],
    precautions TEXT[],
    equipment_required TEXT[],
    ppe_required TEXT[],
    gas_test_required BOOLEAN DEFAULT false,
    gas_test_result TEXT,
    fire_watch_required BOOLEAN DEFAULT false,
    confined_space_class TEXT,
    voltage_level TEXT,
    lockout_points TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, permit_number)
);

CREATE TABLE IF NOT EXISTS permit_extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
    extended_by UUID REFERENCES users(id),
    extended_from DATE NOT NULL,
    extended_to DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permits_project ON permits(project_id);
CREATE INDEX idx_permits_status ON permits(status);

-- Feature 4: Safety Inspections
CREATE TABLE IF NOT EXISTS safety_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    inspection_number TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'routine' CHECK (type IN ('routine', 'scheduled', 'unannounced', 'follow_up', 'pre_work')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE NOT NULL,
    conducted_date DATE,
    location TEXT,
    inspector_id UUID REFERENCES users(id),
    findings TEXT,
    hazards_identified INTEGER DEFAULT 0,
    corrective_actions TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    score DECIMAL(5, 2),
    photos TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, inspection_number)
);

CREATE INDEX idx_safety_inspections_project ON safety_inspections(project_id);

-- Feature 5: Safety Meetings (Toolbox Talks)
CREATE TABLE IF NOT EXISTS safety_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_number TEXT NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    conductor_id UUID REFERENCES users(id),
    attendees UUID[],
    attendees_count INTEGER DEFAULT 0,
    content TEXT,
    quiz_required BOOLEAN DEFAULT false,
    quiz_pass_rate DECIMAL(5, 2),
    photos TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, meeting_number)
);

CREATE TABLE IF NOT EXISTS safety_meeting_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES safety_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    signature TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_safety_meetings_project ON safety_meetings(project_id);

-- Feature 6: Snag Items / Punch List
CREATE TABLE IF NOT EXISTS snags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snag_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    room TEXT,
    location TEXT,
    grid_reference TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'verified', 'rejected')),
    raised_by UUID REFERENCES users(id),
    raised_date TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES users(id),
    assigned_date TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    completed_date TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    verified_date TIMESTAMPTZ,
    photos TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, snag_number)
);

CREATE INDEX idx_snags_project ON snags(project_id);
CREATE INDEX idx_snags_status ON snags(status);

-- Feature 7: Resource Logs
CREATE TABLE IF NOT EXISTS resource_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('labor', 'equipment', 'material')),
    category TEXT,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    unit TEXT,
    hours DECIMAL(10, 2),
    cost DECIMAL(15, 2) DEFAULT 0,
    vendor_id UUID REFERENCES vendors(id),
    notes TEXT,
    logged_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resource_logs_project ON resource_logs(project_id);
CREATE INDEX idx_resource_logs_date ON resource_logs(date);

-- Feature 8: Site Diaries
CREATE TABLE IF NOT EXISTS site_diaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, entry_number)
);

CREATE INDEX idx_site_diaries_project ON site_diaries(project_id);

-- Feature 9: Document Categories
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES document_categories(id),
    code TEXT,
    description TEXT,
    color TEXT,
    icon TEXT,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

CREATE INDEX idx_document_categories_company ON document_categories(company_id);

-- Feature 10: RFI & Submittal Categories
CREATE TABLE IF NOT EXISTS rfi_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS submittal_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

CREATE INDEX idx_rfi_categories_company ON rfi_categories(company_id);
CREATE INDEX idx_submittal_types_company ON submittal_types(company_id);

-- Feature 11: Cost Codes (CSI MasterFormat)
CREATE TABLE IF NOT EXISTS cost_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    parent_code UUID REFERENCES cost_codes(id),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- Insert default CSI MasterFormat cost codes
INSERT INTO cost_codes (company_id, code, title, level, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, '00', 'Procurement and Contracting Requirements', 1, 1),
    ('00000000-0000-0000-0000-000000000001'::uuid, '01', 'General Requirements', 1, 2),
    ('00000000-0000-0000-0000-000000000001'::uuid, '02', 'Existing Conditions', 1, 3),
    ('00000000-0000-0000-0000-000000000001'::uuid, '03', 'Concrete', 1, 4),
    ('00000000-0000-0000-0000-000000000001'::uuid, '04', 'Masonry', 1, 5),
    ('00000000-0000-0000-0000-000000000001'::uuid, '05', 'Metals', 1, 6),
    ('00000000-0000-0000-0000-000000000001'::uuid, '06', 'Wood, Plastics, and Composites', 1, 7),
    ('00000000-0000-0000-0000-000000000001'::uuid, '07', 'Thermal and Moisture Protection', 1, 8),
    ('00000000-0000-0000-0000-000000000001'::uuid, '08', 'Openings', 1, 9),
    ('00000000-0000-0000-0000-000000000001'::uuid, '09', 'Finishes', 1, 10),
    ('00000000-0000-0000-0000-000000000001'::uuid, '10', 'Specialties', 1, 11),
    ('00000000-0000-0000-0000-000000000001'::uuid, '11', 'Equipment', 1, 12),
    ('00000000-0000-0000-0000-000000000001'::uuid, '12', 'Furnishings', 1, 13),
    ('00000000-0000-0000-0000-000000000001'::uuid, '13', 'Special Construction', 1, 14),
    ('00000000-0000-0000-0000-000000000001'::uuid, '14', 'Conveying Equipment', 1, 15),
    ('00000000-0000-0000-0000-000000000001'::uuid, '21', 'Fire Suppression', 1, 16),
    ('00000000-0000-0000-0000-000000000001'::uuid, '22', 'Plumbing', 1, 17),
    ('00000000-0000-0000-0000-000000000001'::uuid, '23', 'Heating, Ventilating, and Air Conditioning', 1, 18),
    ('00000000-0000-0000-0000-000000000001'::uuid, '25', 'Integrated Automation', 1, 19),
    ('00000000-0000-0000-0000-000000000001'::uuid, '26', 'Electrical', 1, 20),
    ('00000000-0000-0000-0000-000000000001'::uuid, '27', 'Communications', 1, 21),
    ('00000000-0000-0000-0000-000000000001'::uuid, '28', 'Electronic Safety and Security', 1, 22),
    ('00000000-0000-0000-0000-000000000001'::uuid, '31', 'Earthwork', 1, 23),
    ('00000000-0000-0000-0000-000000000001'::uuid, '32', 'Exterior Improvements', 1, 24),
    ('00000000-0000-0000-0000-000000000001'::uuid, '33', 'Utilities', 1, 25)
ON CONFLICT (company_id, code) DO NOTHING;

CREATE INDEX idx_cost_codes_company ON cost_codes(company_id);
CREATE INDEX idx_cost_codes_parent ON cost_codes(parent_code);
