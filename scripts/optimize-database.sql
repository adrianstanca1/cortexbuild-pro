-- Database Performance Optimization Script
-- Add missing indexes to improve query performance

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(companyId);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(createdAt);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(managerId);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assignedTo);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(dueDate);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(companyId);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Memberships table indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(userId);
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON memberships(companyId);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON memberships(role);

-- Construction module indexes
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON inspections(projectId);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_scheduled_date ON inspections(scheduledDate);

CREATE INDEX IF NOT EXISTS idx_submittals_project_id ON submittals(projectId);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittals_due_date ON submittals(dueDate);

CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON changeOrders(projectId);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON changeOrders(status);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON auditLogs(companyId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON auditLogs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON auditLogs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON auditLogs(action);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(companyId, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(projectId, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships(userId, status);

-- Full-text search indexes (if supported)
-- These improve search performance for text fields
CREATE INDEX IF NOT EXISTS idx_projects_name_search ON projects(name);
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks(title);

-- Analyze tables to update statistics
ANALYZE projects;
ANALYZE tasks;
ANALYZE users;
ANALYZE memberships;
ANALYZE inspections;
ANALYZE submittals;
ANALYZE changeOrders;
ANALYZE auditLogs;
