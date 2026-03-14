-- Seed script for CortexBuild Pro PostgreSQL - CORRECTED SCHEMA v3
-- Run: docker exec -i cortexbuild-db psql -U cortexbuild -d cortexbuild < seed.sql

-- Organizations
INSERT INTO "Organization" (id, name, slug, entitlements, "storageUsedBytes", "isActive", "createdAt", "updatedAt") VALUES
('org-1', 'BuildCorp Solutions', 'buildcorp-solutions', '{"limits": {"maxUsers": 50, "storageGB": 10, "maxProjects": 100}, "modules": {"rfis": true, "team": true, "tasks": true, "safety": true, "reports": true, "projects": true, "documents": true, "submittals": true, "changeOrders": true, "dailyReports": true}}', 0, true, NOW(), NOW()),
('org-2', 'Titan Construction Ltd', 'titan-construction', '{"limits": {"maxUsers": 25, "storageGB": 5, "maxProjects": 50}, "modules": {"rfis": true, "team": true, "tasks": true, "safety": true, "reports": true, "projects": true, "documents": true}}', 0, true, NOW(), NOW()),
('org-3', 'Metro Builders Inc', 'metro-builders', '{"limits": {"maxUsers": 10, "storageGB": 2, "maxProjects": 10}, "modules": {"rfis": true, "team": true, "tasks": true, "projects": true}}', 0, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO "User" (id, email, password, name, role, "organizationId", "emailVerified", "createdAt", "updatedAt") VALUES
('user-1', 'admin@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Super Admin', 'SUPER_ADMIN', 'org-1', NOW(), NOW(), NOW()),
('user-2', 'pm@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'John Anderson', 'ADMIN', 'org-1', NOW(), NOW(), NOW()),
('user-3', 'field@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Sarah Mitchell', 'PROJECT_MANAGER', 'org-1', NOW(), NOW(), NOW()),
('user-4', 'worker1@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Mike Johnson', 'FIELD_WORKER', 'org-1', NOW(), NOW(), NOW()),
('user-5', 'worker2@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Emily Davis', 'FIELD_WORKER', 'org-1', NOW(), NOW(), NOW()),
('user-6', 'safety@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Robert Brown', 'FIELD_WORKER', 'org-1', NOW(), NOW(), NOW()),
('user-7', 'finance@buildcorp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Lisa Wilson', 'ADMIN', 'org-1', NOW(), NOW(), NOW()),
('user-8', 'pm@titan.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'David Chen', 'ADMIN', 'org-2', NOW(), NOW(), NOW()),
('user-9', 'worker@titan.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'James Taylor', 'FIELD_WORKER', 'org-2', NOW(), NOW(), NOW()),
('user-10', 'pm@metro.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W', 'Anna Martinez', 'PROJECT_MANAGER', 'org-3', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Projects (corrected phase: ACTIVE not CONSTRUCTION)
INSERT INTO "Project" (id, name, description, status, location, "clientName", "clientEmail", budget, "startDate", "endDate", "organizationId", "managerId", "createdAt", "updatedAt", phase) VALUES
('proj-1', 'City Centre Plaza', 'A mixed-use development featuring 40 stories of office space and a luxury retail podium.', 'PLANNING', 'Downtown Metro, 123 Main St', 'Metro Development Corp', 'contact@metrodev.com', 50000000, '2025-04-01', '2027-06-30', 'org-1', 'user-2', NOW(), NOW(), 'PRECONSTRUCTION'),
('proj-2', 'Harbor Bridge Renovation', 'Complete renovation of the aging harbor bridge including deck replacement and cable inspection.', 'IN_PROGRESS', 'Harbor District, Bridge Road', 'City Council', 'infrastructure@city.gov', 25000000, '2024-10-01', '2025-12-31', 'org-1', 'user-3', NOW(), NOW(), 'ACTIVE'),
('proj-3', 'Riverside Apartments', 'A 200-unit residential apartment complex with underground parking.', 'IN_PROGRESS', 'Riverside Ave, 456 River Rd', 'Riverside Properties LLC', 'info@riversideprops.com', 35000000, '2025-01-15', '2026-12-31', 'org-1', 'user-3', NOW(), NOW(), 'ACTIVE'),
('proj-4', 'Tech Park Phase 2', 'Expansion of the existing technology park with 3 new office buildings.', 'COMPLETED', 'Innovation District, 789 Tech Blvd', 'TechCorp Industries', 'facilities@techcorp.com', 18000000, '2024-01-01', '2024-12-31', 'org-1', 'user-2', NOW(), NOW(), 'CLOSEOUT'),
('proj-5', 'Hospital Wing Extension', 'New 50-bed patient wing with state-of-the-art facilities.', 'PLANNING', 'General Hospital, 321 Health St', 'Health Authority', 'projects@healthauth.gov', 15000000, '2025-07-01', '2027-03-31', 'org-2', 'user-8', NOW(), NOW(), 'PRECONSTRUCTION'),
('proj-6', 'Shopping Mall Revamp', 'Major renovation of the central shopping mall including new facade.', 'IN_PROGRESS', 'Central Mall, 100 Shopping Way', 'Retail Properties Inc', 'leasing@retailproperties.com', 8000000, '2024-08-01', '2025-08-31', 'org-2', 'user-8', NOW(), NOW(), 'ACTIVE'),
('proj-7', 'School Building Project', 'New primary school with modern facilities and sports complex.', 'PLANNING', 'Oak Street School, 50 Oak Ave', 'Education Department', 'schoolprojects@edu.gov', 6000000, '2026-01-01', '2027-09-30', 'org-3', 'user-10', NOW(), NOW(), 'PRECONSTRUCTION')
ON CONFLICT (id) DO NOTHING;

-- Tasks
INSERT INTO "Task" (id, title, description, status, priority, "dueDate", "completedAt", "projectId", "assigneeId", "creatorId", "createdAt", "updatedAt") VALUES
('task-1', 'Foundation excavation', 'Complete excavation for building foundation', 'IN_PROGRESS', 'HIGH', '2025-05-15', NULL, 'proj-1', 'user-4', 'user-2', NOW(), NOW()),
('task-2', 'Structural steel ordering', 'Order structural steel beams and columns', 'TODO', 'MEDIUM', '2025-05-15', NULL, 'proj-1', 'user-2', 'user-2', NOW(), NOW()),
('task-3', 'Permit application submission', 'Submit building permits to city', 'COMPLETE', 'HIGH', '2025-03-01', '2025-02-28', 'proj-1', 'user-2', 'user-2', NOW(), NOW()),
('task-4', 'Bridge deck replacement', 'Remove and replace bridge deck sections', 'IN_PROGRESS', 'HIGH', '2025-06-01', NULL, 'proj-2', 'user-4', 'user-3', NOW(), NOW()),
('task-5', 'Cable replacement inspection', 'Inspect and replace bridge cables', 'TODO', 'MEDIUM', '2025-05-15', NULL, 'proj-2', 'user-9', 'user-3', NOW(), NOW()),
('task-6', 'Site preparation', 'Clear site and prepare for construction', 'COMPLETE', 'HIGH', '2024-12-15', '2024-12-14', 'proj-3', 'user-5', 'user-3', NOW(), NOW()),
('task-7', 'Foundation pouring', 'Pour concrete foundation for building', 'IN_PROGRESS', 'HIGH', '2025-03-01', NULL, 'proj-3', 'user-4', 'user-3', NOW(), NOW()),
('task-8', 'Final electrical inspection', 'Complete final electrical safety inspection', 'COMPLETE', 'HIGH', '2024-09-01', '2024-08-30', 'proj-4', 'user-2', 'user-2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Equipment
INSERT INTO "Equipment" (id, name, "equipmentNumber", category, manufacturer, model, "serialNumber", status, "organizationId", "currentProjectId", "createdAt", "updatedAt") VALUES
('eq-1', 'Excavator CAT 320', 'EQ-001', 'EXCAVATOR', 'Caterpillar', '320', 'CAT0320A1', 'IN_USE', 'org-1', 'proj-1', NOW(), NOW()),
('eq-2', 'Crane Liebherr LTM 1100', 'EQ-002', 'CRANE', 'Liebherr', 'LTM 1100', 'LIE1100B2', 'AVAILABLE', 'org-1', NULL, NOW(), NOW()),
('eq-3', 'Concrete Pump Putzmeister', 'EQ-003', 'CONCRETE_PUMP', 'Putzmeister', 'BSF 36', 'PUT3600C3', 'IN_USE', 'org-1', 'proj-2', NOW(), NOW()),
('eq-4', 'Bridges Inspection Drone', 'EQ-004', 'DRONE', 'DJI', 'Matrice 300', 'DJI300D4', 'AVAILABLE', 'org-1', NULL, NOW(), NOW()),
('eq-5', 'Backhoe John Deere 310', 'EQ-005', 'BACKHOE', 'John Deere', '310L', 'JD310E5', 'MAINTENANCE', 'org-1', NULL, NOW(), NOW()),
('eq-6', 'Scissor Lift JLG 1930ES', 'EQ-006', 'LIFT', 'JLG', '1930ES', 'JLG193F6', 'AVAILABLE', 'org-1', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Safety Incidents
INSERT INTO "SafetyIncident" (id, severity, description, "incidentDate", "projectId", "reportedById", "createdAt", "updatedAt") VALUES
('inc-1', 'LOW', 'First aid - cut on hand', '2025-03-10', 'proj-1', 'user-6', NOW(), NOW()),
('inc-2', 'MEDIUM', 'Worker tripped - sprained ankle', '2025-03-08', 'proj-2', 'user-6', NOW(), NOW()),
('inc-3', 'LOW', 'Dust in eye - flushed', '2025-03-05', 'proj-3', 'user-6', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'Organization' as table_name, COUNT(*) as count FROM "Organization"
UNION ALL SELECT 'User', COUNT(*) FROM "User"
UNION ALL SELECT 'Project', COUNT(*) FROM "Project"
UNION ALL SELECT 'Task', COUNT(*) FROM "Task"
UNION ALL SELECT 'Equipment', COUNT(*) FROM "Equipment"
UNION ALL SELECT 'SafetyIncident', COUNT(*) FROM "SafetyIncident";