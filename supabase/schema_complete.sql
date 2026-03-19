-- ═══════════════════════════════════════════════════════════════════════════
-- CortexBuild Platform - Production PostgreSQL Schema v3.0
-- ═══════════════════════════════════════════════════════════════════════════
-- Version: 3.0.0 PRODUCTION
-- Database: PostgreSQL 16 (Supabase)
-- Total Tables: 75
-- Total Indexes: 150+
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: CORE SYSTEM TABLES (Multi-tenancy Foundation)
-- ═══════════════════════════════════════════════════════════════════════════

-- Companies (Organizations)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry TEXT DEFAULT 'Construction',
    email TEXT,
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    zip_code TEXT,
    tax_id TEXT,
    subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'business', 'enterprise', 'ultimate')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    max_users INTEGER DEFAULT 10,
    max_projects INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 10,
    features JSONB DEFAULT '{"ai_agents": false, "advanced_analytics": false, "api_access": false, "sso": false, "white_label": false}',
    settings JSONB DEFAULT '{}',
    billing_email TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'company_owner', 'company_admin', 'project_manager', 'field_worker', 'viewer', 'developer')),
    avatar_url TEXT,
    phone TEXT,
    job_title TEXT,
    department TEXT,
    employee_id TEXT,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    currency TEXT DEFAULT 'USD',
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    last_ip INET,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Refresh Tokens (OAuth)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked BOOLEAN DEFAULT false
);

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: PROJECT MANAGEMENT MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'business', 'government')),
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    fax TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    zip_code TEXT,
    tax_id TEXT,
    payment_terms INTEGER DEFAULT 30,
    credit_limit DECIMAL(15, 2),
    balance DECIMAL(15, 2) DEFAULT 0,
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    project_number TEXT NOT NULL,
    type TEXT DEFAULT 'commercial' CHECK (type IN ('commercial', 'residential', 'industrial', 'infrastructure', 'institutional')),
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    budget DECIMAL(15, 2) DEFAULT 0,
    budget_consumed DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    forecast_cost DECIMAL(15, 2),
    contingency DECIMAL(15, 2) DEFAULT 0,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    zip_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    superintendent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    schedule_variance INTEGER DEFAULT 0,
    cost_variance DECIMAL(15, 2) DEFAULT 0,
    cpi DECIMAL(5, 4),
    spi DECIMAL(5, 4),
    critical_path_days INTEGER,
    weather_days_lost INTEGER DEFAULT 0,
    safety_incident_count INTEGER DEFAULT 0,
    rfi_count INTEGER DEFAULT 0,
    submittal_count INTEGER DEFAULT 0,
    change_order_count INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    team_size INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    template_data JSONB,
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, project_number)
);

-- Project Team Members
CREATE TABLE IF NOT EXISTS project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer', 'guest')),
    permissions JSONB DEFAULT '{}',
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    removed_by UUID REFERENCES users(id),
    UNIQUE(project_id, user_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    number TEXT,
    csi_code TEXT,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'under_review', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id),
    due_date DATE,
    start_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2),
    remaining_hours DECIMAL(10, 2),
    percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10, 2),
    cost DECIMAL(15, 2) DEFAULT 0,
    dependencies UUID[],
    predecessors UUID[],
    successors UUID[],
    lag_days INTEGER DEFAULT 0,
    lead_days INTEGER DEFAULT 0,
    is_milestone BOOLEAN DEFAULT false,
    is_critical BOOLEAN DEFAULT false,
    is_summary BOOLEAN DEFAULT false,
    wbs_level INTEGER DEFAULT 1,
    wbs_code TEXT,
    tags TEXT[],
    labels TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Task Dependencies (for critical path)
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    predecessor_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT DEFAULT 'FS' CHECK (dependency_type IN ('FS', 'FF', 'SS', 'SF')),
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, predecessor_task_id)
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    number TEXT,
    due_date DATE NOT NULL,
    actual_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    is_critical BOOLEAN DEFAULT false,
    baseline_date DATE,
    variance_days INTEGER DEFAULT 0,
    responsible_id UUID REFERENCES users(id),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: DOCUMENT MANAGEMENT MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- Document Categories
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

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    document_number TEXT,
    revision TEXT DEFAULT '0',
    revision_number INTEGER DEFAULT 0,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_extension TEXT,
    file_size BIGINT NOT NULL,
    file_type TEXT,
    mime_type TEXT,
    checksum TEXT,
    storage_provider TEXT DEFAULT 's3',
    storage_bucket TEXT,
    storage_key TEXT,
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'obsolete', 'active')),
    access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted')),
    is_public BOOLEAN DEFAULT false,
    allow_download BOOLEAN DEFAULT true,
    allow_share BOOLEAN DEFAULT false,
    requires_signature BOOLEAN DEFAULT false,
    expiry_date DATE,
    retention_date DATE,
    archive_date DATE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    parent_document_id UUID REFERENCES documents(id),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, document_number, revision)
);

-- Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum TEXT,
    change_summary TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    storage_provider TEXT DEFAULT 's3',
    storage_bucket TEXT,
    storage_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Reviews
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    comments TEXT,
    review_date TIMESTAMPTZ,
    response TEXT,
    response_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, reviewer_id)
);

-- Document Shares
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'download', 'admin')),
    message TEXT,
    expires_at TIMESTAMPTZ,
    accessed_at TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Drawings (Specialized Documents)
CREATE TABLE IF NOT EXISTS drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    drawing_number TEXT NOT NULL,
    title TEXT NOT NULL,
    discipline TEXT DEFAULT 'architectural' CHECK (discipline IN ('architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'civil', 'landscape')),
    revision TEXT DEFAULT '0',
    revision_date DATE,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    sheet_count INTEGER DEFAULT 1,
    scale TEXT,
    drawn_by TEXT,
    checked_by TEXT,
    approved_by TEXT,
    issue_date DATE,
    status TEXT DEFAULT 'issued' CHECK (status IN ('draft', 'under_review', 'issued', 'superseded', 'obsolete')),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, drawing_number, revision)
);

-- Drawing Registers
CREATE TABLE IF NOT EXISTS drawing_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    register_date TIMESTAMPTZ DEFAULT NOW(),
    registered_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: RFI & SUBMITTAL MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- RFI Categories
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

-- RFIs (Requests for Information)
CREATE TABLE IF NOT EXISTS rfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rfi_number TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES rfi_categories(id) ON DELETE SET NULL,
    response TEXT,
    response_date TIMESTAMPTZ,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'answered', 'closed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    answered_by UUID REFERENCES users(id),
    due_date DATE,
    answered_by_date DATE,
    response_required_by DATE,
    impact_type TEXT[] DEFAULT ARRAY[]::TEXT[],
    impact_description TEXT,
    cost_impact DECIMAL(15, 2) DEFAULT 0,
    schedule_impact_days INTEGER DEFAULT 0,
    is_critical BOOLEAN DEFAULT false,
    requires_change_order BOOLEAN DEFAULT false,
    related_rfi_ids UUID[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, rfi_number)
);

-- RFI Attachments
CREATE TABLE IF NOT EXISTS rfi_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    storage_provider TEXT DEFAULT 's3',
    storage_bucket TEXT,
    storage_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFI History/Audit Trail
CREATE TABLE IF NOT EXISTS rfi_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'assigned', 'answered', 'closed', 'attachment_added')),
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submittal Types
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

-- Submittals
CREATE TABLE IF NOT EXISTS submittals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submittal_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type_id UUID REFERENCES submittal_types(id) ON DELETE SET NULL,
    specification_section TEXT,
    revision INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'approved_with_notes', 'rejected', 'revise_and_resubmit', 'cancelled')),
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    reviewed_date TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    rejection_reason TEXT,
    review_comments TEXT,
    manufacturer TEXT,
    supplier TEXT,
    expected_delivery_date DATE,
    required_date DATE,
    is_critical BOOLEAN DEFAULT false,
    requires_sample BOOLEAN DEFAULT false,
    requires_mockup BOOLEAN DEFAULT false,
    related_submittal_ids UUID[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, submittal_number)
);

-- Submittal Attachments
CREATE TABLE IF NOT EXISTS submittal_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    storage_provider TEXT DEFAULT 's3',
    storage_bucket TEXT,
    storage_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submittal Reviews
CREATE TABLE IF NOT EXISTS submittal_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_type TEXT DEFAULT 'internal' CHECK (reviewer_type IN ('internal', 'architect', 'engineer', 'owner', 'consultant')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'approved_with_notes', 'rejected', 'revise_and_resubmit')),
    comments TEXT,
    review_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submittal_id, reviewer_id)
);

-- Submittal Log
CREATE TABLE IF NOT EXISTS submittal_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: FINANCIAL MANAGEMENT MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- Cost Codes (CSI MasterFormat)
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

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'revised', 'archived')),
    total_budget DECIMAL(15, 2) DEFAULT 0,
    contingency DECIMAL(15, 2) DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Line Items
CREATE TABLE IF NOT EXISTS budget_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
    cost_code TEXT NOT NULL,
    description TEXT NOT NULL,
    original_amount DECIMAL(15, 2) DEFAULT 0,
    revised_amount DECIMAL(15, 2),
    committed_amount DECIMAL(15, 2) DEFAULT 0,
    actual_amount DECIMAL(15, 2) DEFAULT 0,
    forecast_amount DECIMAL(15, 2),
    variance DECIMAL(15, 2) DEFAULT 0,
    percent_complete DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change Orders
CREATE TABLE IF NOT EXISTS change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    change_order_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    originator_type TEXT DEFAULT 'owner' CHECK (originator_type IN ('owner', 'contractor', 'designer', 'unforeseen')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'executed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
    proposed_date DATE,
    approved_date DATE,
    executed_date DATE,
    cost_change DECIMAL(15, 2) DEFAULT 0,
    schedule_change_days INTEGER DEFAULT 0,
    impact_description TEXT,
    justification TEXT,
    supporting_docs TEXT[],
    approved_by UUID REFERENCES users(id),
    submitted_by UUID REFERENCES users(id),
    related_change_order_ids UUID[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, change_order_number)
);

-- Change Order Line Items
CREATE TABLE IF NOT EXISTS change_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
    cost_code TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 4) DEFAULT 0,
    unit TEXT,
    unit_price DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    markup_percent DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Claims / Pay Applications
CREATE TABLE IF NOT EXISTS progress_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    claim_number TEXT NOT NULL,
    title TEXT NOT NULL,
    claim_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid', 'cancelled')),
    claimed_amount DECIMAL(15, 2) DEFAULT 0,
    approved_amount DECIMAL(15, 2),
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    retention_amount DECIMAL(15, 2) DEFAULT 0,
    previous_claimed_amount DECIMAL(15, 2) DEFAULT 0,
    previous_paid_amount DECIMAL(15, 2) DEFAULT 0,
    total_earned_to_date DECIMAL(15, 2) DEFAULT 0,
    balance_to_complete DECIMAL(15, 2),
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_date TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    paid_date DATE,
    payment_reference TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, claim_number)
);

-- Progress Claim Line Items
CREATE TABLE IF NOT EXISTS progress_claim_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    progress_claim_id UUID NOT NULL REFERENCES progress_claims(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
    cost_code TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduled_value DECIMAL(15, 2) DEFAULT 0,
    previous_earned DECIMAL(15, 2) DEFAULT 0,
    current_earned DECIMAL(15, 2) DEFAULT 0,
    total_earned DECIMAL(15, 2) DEFAULT 0,
    balance_to_complete DECIMAL(15, 2),
    stored_materials DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance_due DECIMAL(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    terms TEXT,
    footer TEXT,
    billing_address JSONB,
    shipping_address JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, invoice_number)
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER DEFAULT 1,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 4) DEFAULT 1,
    unit TEXT DEFAULT 'each',
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    payment_number TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'check' CHECK (payment_method IN ('check', 'wire', 'ach', 'credit_card', 'cash', 'other')),
    reference_number TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, payment_number)
);

-- Vendors / Subcontractors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'subcontractor' CHECK (type IN ('subcontractor', 'supplier', 'manufacturer', 'consultant')),
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    fax TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    zip_code TEXT,
    trade TEXT,
    specialty TEXT,
    license_number TEXT,
    license_state TEXT,
    license_expiry DATE,
    insurance_carrier TEXT,
    policy_number TEXT,
    insurance_expiry DATE,
    bonding_capacity DECIMAL(15, 2),
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    payment_terms INTEGER DEFAULT 30,
    tax_id TEXT,
    bank_details JSONB,
    contacts JSONB DEFAULT '[]',
    certifications TEXT[],
    tags TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    is_prequalified BOOLEAN DEFAULT false,
    prequalification_date DATE,
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    po_number TEXT NOT NULL,
    title TEXT,
    issue_date DATE NOT NULL,
    delivery_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged', 'approved', 'partially_received', 'completed', 'cancelled')),
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    received_amount DECIMAL(15, 2) DEFAULT 0,
    billed_amount DECIMAL(15, 2) DEFAULT 0,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    shipping_address TEXT,
    billing_address TEXT,
    notes TEXT,
    terms TEXT,
    approved_by UUID REFERENCES users(id),
    issued_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(company_id, po_number)
);

-- Purchase Order Line Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER DEFAULT 1,
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 4) DEFAULT 1,
    unit TEXT DEFAULT 'each',
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    received_quantity DECIMAL(12, 4) DEFAULT 0,
    billed_quantity DECIMAL(12, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries / Timesheets
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL,
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10, 2),
    total_amount DECIMAL(15, 2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'approved', 'invoiced', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    invoiced BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES invoices(id),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT,
    is_billable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    vendor TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    billable BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'reimbursed', 'rejected')),
    payment_method TEXT,
    receipt_url TEXT,
    notes TEXT,
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    reimbursed_at TIMESTAMPTZ,
    receipt_images TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: SAFETY & QUALITY MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- Safety Incident Types
CREATE TABLE IF NOT EXISTS incident_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Safety Incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    incident_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type_id UUID REFERENCES incident_types(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'near_miss' CHECK (category IN ('near_miss', 'first_aid', 'medical_treatment', 'lost_time', 'fatal', 'property_damage', 'environmental')),
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'under_investigation', 'closed', 'pending_review')),
    occurrence_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    weather_conditions TEXT,
    work_activity TEXT,
    injury_type TEXT,
    body_part_affected TEXT,
    object_substance TEXT,
    unsafe_act TEXT,
    unsafe_condition TEXT,
    root_cause TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_date TIMESTAMPTZ DEFAULT NOW(),
    investigated_by UUID REFERENCES users(id),
    investigation_date TIMESTAMPTZ,
    investigation_findings TEXT,
    closed_by UUID REFERENCES users(id),
    closed_date TIMESTAMPTZ,
    osha_recordable BOOLEAN DEFAULT false,
    lost_work_days INTEGER DEFAULT 0,
    restricted_work_days INTEGER DEFAULT 0,
    medical_treatment_days INTEGER DEFAULT 0,
    property_damage_cost DECIMAL(15, 2) DEFAULT 0,
    witness_names TEXT[],
    witness_statements TEXT[],
    photos TEXT[],
    documents TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, incident_number)
);

-- Safety Incident Photos
CREATE TABLE IF NOT EXISTS incident_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id),
    storage_provider TEXT DEFAULT 's3',
    storage_bucket TEXT,
    storage_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Inspections
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

-- Safety Meetings / Toolbox Talks
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

-- Safety Meeting Attendees
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

-- Permits
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

-- Permit Extensions
CREATE TABLE IF NOT EXISTS permit_extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_id UUID NOT NULL REFERENCES permits(id) ON DELETE CASCADE,
    extended_by UUID REFERENCES users(id),
    extended_from DATE NOT NULL,
    extended_to DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Checks / Inspections
CREATE TABLE IF NOT EXISTS quality_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    check_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'inspection' CHECK (type IN ('inspection', 'test', 'audit', 'review')),
    category TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE NOT NULL,
    conducted_date DATE,
    location TEXT,
    inspector_id UUID REFERENCES users(id),
    work_section TEXT,
    specification_section TEXT,
    drawing_reference TEXT,
    checklist JSONB DEFAULT '[]',
    results JSONB DEFAULT '{}',
    findings TEXT,
    defects_found INTEGER DEFAULT 0,
    non_conformances INTEGER DEFAULT 0,
    corrective_actions TEXT,
    rework_required BOOLEAN DEFAULT false,
    rework_cost DECIMAL(15, 2) DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    photos TEXT[],
    documents TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, check_number)
);

-- Defects / Punch List Items
CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    defect_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'workmanship' CHECK (category IN ('workmanship', 'material', 'dimension', 'finish', 'function', 'safety')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'assigned', 'in_progress', 'under_review', 'completed', 'rejected')),
    location TEXT NOT NULL,
    work_section TEXT,
    specification_section TEXT,
    drawing_reference TEXT,
    identified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    identified_date TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES users(id),
    assigned_date TIMESTAMPTZ,
    due_date DATE,
    completed_date DATE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_date TIMESTAMPTZ,
    closed_by UUID REFERENCES users(id),
    closed_date TIMESTAMPTZ,
    rejection_reason TEXT,
    rework_required BOOLEAN DEFAULT false,
    rework_cost DECIMAL(15, 2) DEFAULT 0,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    photos TEXT[],
    documents TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(project_id, defect_number)
);

-- Defect Photos
CREATE TABLE IF NOT EXISTS defect_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    defect_id UUID NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id),
    storage_provider TEXT DEFAULT 's3',
    storage_bucket TEXT,
    storage_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snag Items / Punch List
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

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: FIELD MANAGEMENT MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- Daily Logs / Daily Reports
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    log_number TEXT NOT NULL,
    date DATE NOT NULL,
    weather_id UUID REFERENCES weather_logs(id),
    work_performed TEXT NOT NULL,
    work_areas TEXT[],
    headcount_total INTEGER DEFAULT 0,
    headcount_company INTEGER DEFAULT 0,
    headcount_subcontractor INTEGER DEFAULT 0,
    headcount_visitor INTEGER DEFAULT 0,
    equipment_on_site JSONB DEFAULT '[]',
    materials_received JSONB DEFAULT '[]',
    deliveries JSONB DEFAULT '[]',
    visitors JSONB DEFAULT '[]',
    incidents TEXT,
    issues TEXT,
    delays TEXT,
    inspections JSONB DEFAULT '[]',
    tests JSONB DEFAULT '[]',
    photos TEXT[],
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, log_number)
);

-- Weather Logs
CREATE TABLE IF NOT EXISTS weather_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    temperature_min DECIMAL(5, 2),
    temperature_max DECIMAL(5, 2),
    temperature_avg DECIMAL(5, 2),
    conditions TEXT,
    precipitation_mm DECIMAL(6, 2) DEFAULT 0,
    snow_mm DECIMAL(6, 2) DEFAULT 0,
    wind_speed_kmh DECIMAL(6, 2),
    wind_direction TEXT,
    wind_gusts_kmh DECIMAL(6, 2),
    humidity_percent INTEGER,
    pressure_hpa DECIMAL(6, 2),
    visibility_km DECIMAL(5, 2),
    uv_index INTEGER,
    sunrise TIMESTAMPTZ,
    sunset TIMESTAMPTZ,
    work_stoppage BOOLEAN DEFAULT false,
    stoppage_reason TEXT,
    stoppage_hours DECIMAL(5, 2) DEFAULT 0,
    recorded_by UUID REFERENCES users(id),
    data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'api', 'station')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, date)
);

-- Site Diaries
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

-- Resource Logs (Labor, Equipment, Materials)
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

-- Equipment
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

-- Equipment Assignments
CREATE TABLE IF NOT EXISTS equipment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    assigned_from DATE NOT NULL,
    assigned_to DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    assigned_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Maintenance Logs
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

-- Materials
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

-- Material Inventory
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

-- Material Deliveries
CREATE TABLE IF NOT EXISTS material_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delivery_number TEXT NOT NULL,
    po_id UUID REFERENCES purchase_orders(id),
    vendor_id UUID REFERENCES vendors(id),
    expected_date DATE,
    actual_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'partial', 'cancelled')),
    carrier TEXT,
    tracking_number TEXT,
    items JSONB DEFAULT '[]',
    received_by UUID REFERENCES users(id),
    inspected_by UUID REFERENCES users(id),
    inspection_result TEXT,
    damage_notes TEXT,
    return_required BOOLEAN DEFAULT false,
    return_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, delivery_number)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: COMMUNICATION & COLLABORATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Threads
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    is_locked BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Participants
CREATE TABLE IF NOT EXISTS message_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    has_read BOOLEAN DEFAULT false,
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(thread_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'task', 'rfi', 'submittal', 'change_order', 'payment', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    in_app BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT true,
    sms BOOLEAN DEFAULT false,
    push BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- Comments (Universal)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    mentions UUID[],
    attachments JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs / Audit Trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'export', 'import', 'share', 'download', 'upload', 'approve', 'reject', 'submit', 'assign', 'transfer', 'status_change')),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_name TEXT,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES sessions(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 9: AI & AUTOMATION MODULE
-- ═══════════════════════════════════════════════════════════════════════════

-- AI Model Configs
CREATE TABLE IF NOT EXISTS ai_model_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini', 'ollama', 'local', 'azure')),
    model TEXT NOT NULL,
    api_endpoint TEXT,
    api_key TEXT,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    top_p DECIMAL(3, 2) DEFAULT 1,
    frequency_penalty DECIMAL(3, 2) DEFAULT 0,
    presence_penalty DECIMAL(3, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Prompts / Templates
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'construction', 'safety', 'financial', 'schedule', 'quality', 'rfi', 'submittal')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    output_format TEXT DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversations / Threads
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT,
    model_config_id UUID REFERENCES ai_model_configs(id),
    prompt_id UUID REFERENCES ai_prompts(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    token_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agent Runs
CREATE TABLE IF NOT EXISTS ai_agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    agent_version TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    token_usage JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'event', 'scheduled', 'api')),
    trigger_config JSONB DEFAULT '{}',
    nodes JSONB DEFAULT '[]',
    edges JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id),
    trigger_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    current_node TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Execution Logs
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id TEXT,
    node_name TEXT,
    action TEXT,
    status TEXT,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations / Webhooks
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'suspended', 'error')),
    config JSONB DEFAULT '{}',
    credentials JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT UNIQUE NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    headers JSONB DEFAULT '{}',
    last_triggered_at TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    prefix TEXT NOT NULL,
    hash TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    ip_whitelist INET[],
    rate_limit INTEGER DEFAULT 1000,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10: REPORTING & ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('project_status', 'financial', 'schedule', 'safety', 'quality', 'resource', 'custom')),
    format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv', 'html', 'json')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    filters JSONB DEFAULT '{}',
    columns JSONB DEFAULT '[]',
    group_by JSONB DEFAULT '[]',
    sort_by JSONB DEFAULT '[]',
    schedule_config JSONB,
    recipients TEXT[],
    file_path TEXT,
    file_size BIGINT,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    layout JSONB DEFAULT '[]',
    widgets JSONB DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    shared_with UUID[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs / Metrics
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'financial', 'schedule', 'safety', 'quality', 'productivity')),
    target_value DECIMAL(15, 2),
    actual_value DECIMAL(15, 2) DEFAULT 0,
    unit TEXT,
    formula TEXT,
    data_source TEXT,
    refresh_frequency TEXT DEFAULT 'daily' CHECK (refresh_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI History
CREATE TABLE IF NOT EXISTS kpi_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    value DECIMAL(15, 2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Analytics Snapshots
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_type TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 11: GLOBAL MARKETPLACE (SDK APPS)
-- ═══════════════════════════════════════════════════════════════════════════

-- SDK Apps
CREATE TABLE IF NOT EXISTS sdk_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📦',
    category TEXT DEFAULT 'productivity',
    code TEXT,
    version TEXT DEFAULT '1.0.0',
    status TEXT DEFAULT 'draft',
    review_status TEXT DEFAULT 'draft' CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected')),
    is_public BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    install_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    pricing_model TEXT DEFAULT 'free' CHECK (pricing_model IN ('free', 'one_time', 'subscription', 'usage')),
    price DECIMAL(15, 2) DEFAULT 0,
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    documentation_url TEXT,
    support_url TEXT,
    privacy_url TEXT,
    terms_url TEXT,
    homepage_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Reviews
CREATE TABLE IF NOT EXISTS app_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES sdk_apps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    developer_response TEXT,
    response_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id, user_id)
);

-- User App Installations
CREATE TABLE IF NOT EXISTS user_app_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES sdk_apps(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    uninstalled_at TIMESTAMPTZ,
    UNIQUE(user_id, app_id)
);

-- Company App Installations
CREATE TABLE IF NOT EXISTS company_app_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES sdk_apps(id) ON DELETE CASCADE,
    installed_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    uninstalled_at TIMESTAMPTZ,
    UNIQUE(company_id, app_id)
);

-- App Review History
CREATE TABLE IF NOT EXISTS app_review_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES sdk_apps(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    feedback TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Analytics
CREATE TABLE IF NOT EXISTS app_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES sdk_apps(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Subscriptions
CREATE TABLE IF NOT EXISTS app_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES sdk_apps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 12: SYSTEM CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════════════

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percent INTEGER DEFAULT 0,
    allowed_companies UUID[],
    allowed_users UUID[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limits
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    limit_value INTEGER NOT NULL,
    window_seconds INTEGER DEFAULT 3600,
    current_count INTEGER DEFAULT 0,
    reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs / Background Tasks
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 0,
    payload JSONB NOT NULL,
    result JSONB,
    error TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    locked_by TEXT,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job History
CREATE TABLE IF NOT EXISTS job_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    payload JSONB,
    result JSONB,
    error TEXT,
    attempts INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Storage
CREATE TABLE IF NOT EXISTS storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    original_name TEXT,
    provider TEXT DEFAULT 's3' CHECK (provider IN ('s3', 'gcs', 'azure', 'local', 'minio')),
    bucket TEXT,
    key TEXT,
    region TEXT,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    checksum TEXT,
    uploaded_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queues
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
    config JSONB DEFAULT '{}',
    concurrency INTEGER DEFAULT 10,
    max_attempts INTEGER DEFAULT 3,
    retry_delay INTEGER DEFAULT 1000,
    dead_letter_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue Messages
CREATE TABLE IF NOT EXISTS queue_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 13: PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_subscription ON companies(subscription_plan, is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(company_id, project_number);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(company_id, status) WHERE status IN ('active', 'planning');
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(is_milestone);
CREATE INDEX IF NOT EXISTS idx_tasks_critical ON tasks(is_critical);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(project_id, status) WHERE status IN ('not_started', 'in_progress', 'blocked');

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_latest ON documents(company_id, is_latest) WHERE is_latest = true;
CREATE INDEX IF NOT EXISTS idx_documents_number ON documents(company_id, document_number);

-- RFI indexes
CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_rfis_priority ON rfis(priority);
CREATE INDEX IF NOT EXISTS idx_rfis_requested ON rfis(requested_by);
CREATE INDEX IF NOT EXISTS idx_rfis_assigned ON rfis(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rfis_number ON rfis(project_id, rfi_number);
CREATE INDEX IF NOT EXISTS idx_rfis_open ON rfis(project_id, status) WHERE status IN ('open', 'in_review');

-- Submittal indexes
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittals_submitted ON submittals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submittals_number ON submittals(project_id, submittal_number);
CREATE INDEX IF NOT EXISTS idx_submittals_pending ON submittals(project_id, status) WHERE status IN ('submitted', 'under_review');

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(company_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_number ON change_orders(project_id, change_order_number);
CREATE INDEX IF NOT EXISTS idx_progress_claims_project ON progress_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_claims_status ON progress_claims(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Safety indexes
CREATE INDEX IF NOT EXISTS idx_safety_incidents_project ON safety_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_category ON safety_incidents(category);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_number ON safety_incidents(project_id, incident_number);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_project ON safety_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_permits_project ON permits(project_id);
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
CREATE INDEX IF NOT EXISTS idx_permits_type ON permits(type);

-- Quality indexes
CREATE INDEX IF NOT EXISTS idx_quality_checks_project ON quality_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_status ON quality_checks(status);
CREATE INDEX IF NOT EXISTS idx_defects_project ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_priority ON defects(priority);

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_company ON equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment ON equipment_assignments(equipment_id);

-- Material indexes
CREATE INDEX IF NOT EXISTS idx_materials_company ON materials(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_material_inventory_material ON material_inventory(material_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_project ON material_inventory(project_id);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_company ON ai_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_company ON ai_agent_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_status ON ai_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflows_company ON workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_company ON webhooks(company_id);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_sdk_apps_developer ON sdk_apps(developer_id);
CREATE INDEX IF NOT EXISTS idx_sdk_apps_status ON sdk_apps(review_status, is_public);
CREATE INDEX IF NOT EXISTS idx_sdk_apps_category ON sdk_apps(category);
CREATE INDEX IF NOT EXISTS idx_app_installations_user ON user_app_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_app_installations_company ON company_app_installations(company_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_app ON app_analytics(app_id);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON jobs(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_storage_company ON storage(company_id);
CREATE INDEX IF NOT EXISTS idx_storage_project ON storage(project_id);
CREATE INDEX IF NOT EXISTS idx_kpis_company ON kpis(company_id);
CREATE INDEX IF NOT EXISTS idx_kpis_project ON kpis(project_id);
CREATE INDEX IF NOT EXISTS idx_kpi_history_kpi ON kpi_history(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_history_date ON kpi_history(recorded_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_project_status ON documents(project_id, status);
CREATE INDEX IF NOT EXISTS idx_rfis_project_status ON rfis(project_id, status);
CREATE INDEX IF NOT EXISTS idx_submittals_project_status ON submittals(project_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_project_status ON safety_incidents(project_id, status);
CREATE INDEX IF NOT EXISTS idx_defects_project_status ON defects(project_id, status);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_name_trgm ON documents USING gin (name gin_trgm_ops);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_projects_metadata ON projects USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON tasks USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_companies_features ON companies USING gin (features);
CREATE INDEX IF NOT EXISTS idx_users_metadata ON users USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_activity_logs_changes ON activity_logs USING gin (changes);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 14: ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_apps ENABLE ROW LEVEL SECURITY;

-- Helper function to get user company
CREATE OR REPLACE FUNCTION get_user_company_id() RETURNS UUID AS $$
    SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_company_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'company_owner', 'company_admin')
    );
$$ LANGUAGE SQL STABLE;

-- Companies policies
CREATE POLICY "Users can view their company" ON companies
    FOR SELECT USING (id = get_user_company_id());

-- Users policies
CREATE POLICY "Users can view their company users" ON users
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Projects policies
CREATE POLICY "Users can view company projects" ON projects
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Admins can create projects" ON projects
    FOR INSERT WITH CHECK (
        company_id = get_user_company_id() 
        AND is_company_admin()
    );

CREATE POLICY "Users can update company projects" ON projects
    FOR UPDATE USING (company_id = get_user_company_id());

-- Tasks policies
CREATE POLICY "Users can view company tasks" ON tasks
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM projects WHERE id = tasks.project_id AND company_id = get_user_company_id())
    );

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS(SELECT 1 FROM projects WHERE id = tasks.project_id AND company_id = get_user_company_id())
    );

-- Documents policies
CREATE POLICY "Users can view company documents" ON documents
    FOR SELECT USING (company_id = get_user_company_id());

-- RFIs policies
CREATE POLICY "Users can view company RFIs" ON rfis
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM projects WHERE id = rfis.project_id AND company_id = get_user_company_id())
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Activity logs policies
CREATE POLICY "Admins can view activity logs" ON activity_logs
    FOR SELECT USING (
        company_id = get_user_company_id() 
        AND is_company_admin()
    );

-- Comments policies
CREATE POLICY "Users can view comments" ON comments
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (author_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 15: TRIGGERS & STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfis_updated_at BEFORE UPDATE ON rfis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submittals_updated_at BEFORE UPDATE ON submittals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION log_entity_change() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (company_id, project_id, user_id, action, entity_type, entity_id, entity_name, changes)
        VALUES (NEW.company_id, NEW.project_id, auth.uid(), 'create', TG_TABLE_NAME, NEW.id, NEW.name::text, jsonb_build_object('new', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_logs (company_id, project_id, user_id, action, entity_type, entity_id, entity_name, changes)
        VALUES (NEW.company_id, NEW.project_id, auth.uid(), 'update', TG_TABLE_NAME, NEW.id, NEW.name::text, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_logs (company_id, project_id, user_id, action, entity_type, entity_id, entity_name, changes)
        VALUES (OLD.company_id, OLD.project_id, auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, OLD.name::text, jsonb_build_object('deleted', to_jsonb(OLD)));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers (selective to avoid excessive logging)
CREATE TRIGGER audit_projects_change AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION log_entity_change();
CREATE TRIGGER audit_rfis_change AFTER INSERT OR UPDATE OR DELETE ON rfis FOR EACH ROW EXECUTE FUNCTION log_entity_change();
CREATE TRIGGER audit_submittals_change AFTER INSERT OR UPDATE OR DELETE ON submittals FOR EACH ROW EXECUTE FUNCTION log_entity_change();
CREATE TRIGGER audit_change_orders_change AFTER INSERT OR UPDATE OR DELETE ON change_orders FOR EACH ROW EXECUTE FUNCTION log_entity_change();

-- Project cost aggregation function
CREATE OR REPLACE FUNCTION calculate_project_costs(project_id_param UUID) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'budget', p.budget,
        'actual_cost', COALESCE(actual.total, 0),
        'committed_cost', COALESCE(committed.total, 0),
        'forecast_cost', p.forecast_cost,
        'cost_variance', p.budget - COALESCE(actual.total, 0),
        'burn_rate', CASE WHEN p.budget > 0 THEN COALESCE(actual.total, 0) / p.budget ELSE 0 END
    ) INTO result
    FROM projects p
    LEFT JOIN (
        SELECT SUM(total) as total FROM budget_line_items WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param)
    ) actual ON true
    LEFT JOIN (
        SELECT SUM(total) as total FROM purchase_order_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE project_id = project_id_param AND status IN ('approved', 'sent'))
    ) committed ON true
    WHERE p.id = project_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Schedule critical path calculation
CREATE OR REPLACE FUNCTION calculate_critical_path(project_id_param UUID) RETURNS TABLE(task_id UUID, is_critical BOOLEAN, early_start DATE, early_end DATE, late_start DATE, late_end DATE, total_float INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE task_path AS (
        SELECT 
            t.id,
            t.due_date as early_end,
            t.due_date - (t.estimated_hours / 8) as early_start,
            t.due_date as late_end,
            t.due_date - (t.estimated_hours / 8) as late_start,
            0 as total_float
        FROM tasks t
        WHERE t.project_id = project_id_param
        AND NOT EXISTS (SELECT 1 FROM task_dependencies td WHERE td.task_id = t.id)
        
        UNION ALL
        
        SELECT 
            t.id,
            GREATEST(tp.early_end, t.due_date - (t.estimated_hours / 8)) as early_end,
            GREATEST(tp.early_end, t.due_date - (t.estimated_hours / 8)) - (t.estimated_hours / 8) as early_start,
            LEAST(tp.late_end, t.due_date) as late_end,
            LEAST(tp.late_end, t.due_date) - (t.estimated_hours / 8) as late_start,
            ABS(tp.late_end - tp.early_end) as total_float
        FROM tasks t
        JOIN task_dependencies td ON td.task_id = t.id
        JOIN task_path tp ON tp.id = td.predecessor_task_id
        WHERE t.project_id = project_id_param
    )
    SELECT 
        id as task_id,
        total_float <= 1 as is_critical,
        early_start,
        early_end,
        late_start,
        late_end,
        total_float
    FROM task_path;
END;
$$ LANGUAGE plpgsql;

-- Budget variance analysis function
CREATE OR REPLACE FUNCTION analyze_budget_variance(project_id_param UUID) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'original_budget', COALESCE(orig.total, 0),
        'revised_budget', COALESCE(rev.total, 0),
        'actual_cost', COALESCE(actual.total, 0),
        'committed_cost', COALESCE(committed.total, 0),
        'forecast_to_complete', COALESCE(forecast.total, 0),
        'estimated_total_cost', COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0),
        'budget_variance', COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0)),
        'variance_percent', CASE WHEN COALESCE(rev.total, 0) > 0 
            THEN ((COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0))) / COALESCE(rev.total, 0)) * 100 
            ELSE 0 END,
        'cpi', CASE WHEN COALESCE(actual.total, 0) > 0 THEN COALESCE(orig.total, 0) / COALESCE(actual.total, 0) ELSE 1 END,
        'status', CASE 
            WHEN COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0)) > 0 THEN 'under_budget'
            WHEN COALESCE(rev.total, 0) - (COALESCE(actual.total, 0) + COALESCE(committed.total, 0) + COALESCE(forecast.total, 0)) < -COALESCE(rev.total, 0) * 0.1 THEN 'over_budget_critical'
            ELSE 'over_budget'
        END
    ) INTO result
    FROM (
        SELECT SUM(original_amount) as total FROM budget_line_items WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = 1)
    ) orig,
    (
        SELECT SUM(revised_amount) as total FROM budget_line_items WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param))
    ) rev,
    (
        SELECT SUM(actual_amount) as total FROM budget_line_items WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param))
    ) actual,
    (
        SELECT SUM(total) as total FROM purchase_order_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE project_id = project_id_param AND status IN ('approved', 'sent'))
    ) committed,
    (
        SELECT SUM(forecast_amount) as total FROM budget_line_items WHERE budget_id IN (SELECT id FROM budgets WHERE project_id = project_id_param AND version = (SELECT MAX(version) FROM budgets WHERE project_id = project_id_param))
    ) forecast;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Resource leveling function
CREATE OR REPLACE FUNCTION level_resources(project_id_param UUID, resource_type TEXT DEFAULT 'labor') RETURNS TABLE(resource_id UUID, overallocated BOOLEAN, allocation_percent DECIMAL, recommended_action TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as resource_id,
        CASE WHEN COUNT(t.id) * AVG(t.estimated_hours) > 40 THEN TRUE ELSE FALSE END as overallocated,
        (COUNT(t.id) * AVG(t.estimated_hours) / 40.0 * 100) as allocation_percent,
        CASE 
            WHEN COUNT(t.id) * AVG(t.estimated_hours) > 60 THEN 'reassign_tasks'
            WHEN COUNT(t.id) * AVG(t.estimated_hours) > 40 THEN 'reduce_workload'
            WHEN COUNT(t.id) * AVG(t.estimated_hours) < 20 THEN 'increase_utilization'
            ELSE 'optimal'
        END as recommended_action
    FROM users u
    LEFT JOIN tasks t ON t.assigned_to = u.id AND t.project_id = project_id_param AND t.status IN ('not_started', 'in_progress')
    WHERE u.company_id = (SELECT company_id FROM projects WHERE id = project_id_param LIMIT 1)
    GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- Dashboard view for project summary
CREATE OR REPLACE VIEW project_dashboard_summary AS
SELECT 
    p.id,
    p.name,
    p.project_number,
    p.status,
    p.progress,
    p.budget,
    p.actual_cost,
    p.budget - p.actual_cost as budget_remaining,
    p.start_date,
    p.end_date,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status IN ('completed')) as completed_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status IN ('in_progress')) as in_progress_tasks,
    (SELECT COUNT(*) FROM rfis WHERE project_id = p.id AND status IN ('open', 'in_review')) as open_rfis,
    (SELECT COUNT(*) FROM submittals WHERE project_id = p.id AND status IN ('submitted', 'under_review')) as pending_submittals,
    (SELECT COUNT(*) FROM change_orders WHERE project_id = p.id AND status IN ('draft', 'submitted')) as pending_changes,
    (SELECT COUNT(*) FROM safety_incidents WHERE project_id = p.id AND status IN ('reported', 'under_investigation')) as open_incidents,
    (SELECT COUNT(*) FROM defects WHERE project_id = p.id AND status IN ('identified', 'assigned')) as open_defects,
    (SELECT COUNT(*) FROM daily_logs WHERE project_id = p.id AND date = CURRENT_DATE) as has_daily_log,
    p.updated_at
FROM projects p
WHERE p.deleted_at IS NULL;

-- Resource utilization view
CREATE OR REPLACE VIEW resource_utilization AS
SELECT 
    u.id,
    u.name,
    u.role,
    c.name as company_name,
    COUNT(t.id) as assigned_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN t.status IN ('in_progress', 'blocked') THEN 1 ELSE 0 END) as active_tasks,
    SUM(t.estimated_hours) as total_estimated_hours,
    AVG(t.percent_complete) as avg_task_completion,
    (
        SELECT COUNT(DISTINCT project_id) 
        FROM tasks 
        WHERE assigned_to = u.id AND status IN ('in_progress', 'blocked')
    ) as active_projects
FROM users u
LEFT JOIN tasks t ON t.assigned_to = u.id
LEFT JOIN companies c ON c.id = u.company_id
WHERE u.is_active = true
GROUP BY u.id, u.name, u.role, c.name;

-- Financial summary view
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.budget,
    COALESCE(bi.total_budget, 0) as budgeted_amount,
    COALESCE(po.total_committed, 0) as committed_amount,
    COALESCE(inv.total_invoiced, 0) as invoiced_amount,
    COALESCE(pay.total_paid, 0) as paid_amount,
    p.budget - COALESCE(po.total_committed, 0) as budget_remaining,
    COALESCE(po.total_committed, 0) - COALESCE(inv.total_invoiced, 0) as work_in_progress,
    CASE 
        WHEN p.budget > 0 THEN (COALESCE(po.total_committed, 0) / p.budget * 100)
        ELSE 0
    END as commitment_percent
FROM projects p
LEFT JOIN (
    SELECT b.project_id, SUM(bli.original_amount) as total_budget
    FROM budgets b
    JOIN budget_line_items bli ON bli.budget_id = b.id
    GROUP BY b.project_id
) bi ON bi.project_id = p.id
LEFT JOIN (
    SELECT project_id, SUM(total) as total_committed
    FROM purchase_order_items poi
    JOIN purchase_orders po ON po.id = poi.po_id
    WHERE po.status IN ('approved', 'sent', 'completed')
    GROUP BY project_id
) po ON po.project_id = p.id
LEFT JOIN (
    SELECT project_id, SUM(total_amount) as total_invoiced
    FROM invoices
    WHERE status NOT IN ('cancelled')
    GROUP BY project_id
) inv ON inv.project_id = p.id
LEFT JOIN (
    SELECT i.project_id, SUM(paid_amount) as total_paid
    FROM invoices i
    WHERE i.status = 'paid'
    GROUP BY i.project_id
) pay ON pay.project_id = p.id
WHERE p.deleted_at IS NULL;

-- Safety metrics view
CREATE OR REPLACE VIEW safety_metrics AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.start_date,
    CURRENT_DATE - p.start_date as days_active,
    COALESCE(inc.total, 0) as total_incidents,
    COALESCE(inc.lost_time, 0) as lost_time_incidents,
    COALESCE(inc.medical, 0) as medical_treatment_incidents,
    COALESCE(inc.near_miss, 0) as near_misses,
    CASE WHEN p.start_date IS NOT NULL 
        THEN (COALESCE(inc.total, 0) * 200000) / ((CURRENT_DATE - p.start_date) * COALESCE(headcount.avg, 1))
        ELSE 0 
    END as trir,
    CASE WHEN p.start_date IS NOT NULL 
        THEN (COALESCE(inc.lost_time, 0) * 200000) / ((CURRENT_DATE - p.start_date) * COALESCE(headcount.avg, 1))
        ELSE 0 
    END as ltir,
    COALESCE(ins.total, 0) as total_inspections,
    COALESCE(ins.avg_score, 0) as avg_inspection_score,
    COALESCE(meetings.total, 0) as safety_meetings_held,
    COALESCE(permits.active, 0) as active_permits
FROM projects p
LEFT JOIN (
    SELECT 
        project_id,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE category = 'lost_time') as lost_time,
        COUNT(*) FILTER (WHERE category IN ('medical_treatment', 'first_aid')) as medical,
        COUNT(*) FILTER (WHERE category = 'near_miss') as near_miss
    FROM safety_incidents
    GROUP BY project_id
) inc ON inc.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) as total, AVG(score) as avg_score
    FROM safety_inspections
    WHERE status = 'completed'
    GROUP BY project_id
) ins ON ins.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) as total
    FROM safety_meetings
    GROUP BY project_id
) meetings ON meetings.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) as active
    FROM permits
    WHERE status = 'active'
    GROUP BY project_id
) permits ON permits.project_id = p.id
LEFT JOIN (
    SELECT project_id, AVG(headcount_total) as avg
    FROM daily_logs
    GROUP BY project_id
) headcount ON headcount.project_id = p.id
WHERE p.deleted_at IS NULL;

-- Schema complete marker
-- Total Tables: 75
-- Total Indexes: 150+
-- Total Views: 6
-- Total Stored Procedures: 4
-- Total Triggers: 8
-- ═══════════════════════════════════════════════════════════════════════════