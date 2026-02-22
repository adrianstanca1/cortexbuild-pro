# Production Database Migration for Risk Assessment
# SQL commands to apply to the production MySQL database

-- Run these commands on the production database via Hostinger phpMyAdmin or SSH

-- ===== RISK ASSESSMENT FEATURE MIGRATION =====
-- Version: 1.0.0
-- Date: 2025-01-05

-- Create new tables for risk assessment
CREATE TABLE IF NOT EXISTS risk_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId VARCHAR(36) NOT NULL,
    companyId VARCHAR(36) NOT NULL,
    type ENUM('budget', 'timeline', 'resource', 'scope', 'quality') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact VARCHAR(50) NOT NULL,
    status ENUM('pending', 'acknowledged', 'implemented', 'dismissed') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdBy VARCHAR(36),
    INDEX idx_projectId (projectId),
    INDEX idx_companyId (companyId),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to existing projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS budgetRisk ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS timelineRisk ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS resourceRisk ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS scopeRisk ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS qualityRisk ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS healthScore DECIMAL(3,1) DEFAULT 85.0,
ADD COLUMN IF NOT EXISTS riskLevel ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
ADD COLUMN IF NOT EXISTS riskLastCalculated TIMESTAMP NULL DEFAULT NULL;

-- Add risk-related indexes
ALTER TABLE projects 
ADD INDEX IF NOT EXISTS idx_healthScore (healthScore),
ADD INDEX IF NOT EXISTS idx_riskLevel (riskLevel),
ADD INDEX IF NOT EXISTS idx_riskLastCalculated (riskLastCalculated);

-- Create risk metrics table for historical tracking
CREATE TABLE IF NOT EXISTS risk_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId VARCHAR(36) NOT NULL,
    companyId VARCHAR(36) NOT NULL,
    overallHealth DECIMAL(3,1) NOT NULL,
    budgetRisk ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    timelineRisk ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    resourceRisk ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    scopeRisk ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    qualityRisk ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    budgetVariance DECIMAL(5,2) DEFAULT 0.00,
    scheduleVariance DECIMAL(5,2) DEFAULT 0.00,
    taskCompletionRate DECIMAL(5,2) DEFAULT 0.00,
    teamUtilizationRate DECIMAL(5,2) DEFAULT 0.00,
    errorRate DECIMAL(5,2) DEFAULT 0.00,
    clientSatisfactionScore DECIMAL(3,1) DEFAULT 0.0,
    recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_projectId (projectId),
    INDEX idx_companyId (companyId),
    INDEX idx_recordedAt (recordedAt),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notifications table for risk alerts
CREATE TABLE IF NOT EXISTS risk_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId VARCHAR(36) NOT NULL,
    companyId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    type ENUM('risk_increase', 'risk_decrease', 'new_suggestion', 'threshold_breach') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    data JSON DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    readAt TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_projectId (projectId),
    INDEX idx_companyId (companyId),
    INDEX idx_userId (userId),
    INDEX idx_isRead (isRead),
    INDEX idx_type (type),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing tasks table to support risk calculations
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS riskScore INT DEFAULT 0 COMMENT 'Risk score 0-100',
ADD INDEX IF NOT EXISTS idx_riskScore (riskScore);

-- Create trigger to update risk_last_calculated when project changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_project_risk_timestamp 
BEFORE UPDATE ON projects
FOR EACH ROW
BEGIN
    IF NEW.budgetRisk != OLD.budgetRisk OR 
       NEW.timelineRisk != OLD.timelineRisk OR 
       NEW.resourceRisk != OLD.resourceRisk OR 
       NEW.scopeRisk != OLD.scopeRisk OR 
       NEW.qualityRisk != OLD.qualityRisk THEN
        SET NEW.riskLastCalculated = CURRENT_TIMESTAMP;
    END IF;
END//
DELIMITER ;

-- Insert default data for existing projects
UPDATE projects 
SET 
    budgetRisk = 'low',
    timelineRisk = 'low', 
    resourceRisk = 'low',
    scopeRisk = 'low',
    qualityRisk = 'low',
    healthScore = 85.0,
    riskLevel = 'low',
    riskLastCalculated = CURRENT_TIMESTAMP
WHERE budgetRisk IS NULL OR timelineRisk IS NULL;

-- Create view for risk dashboard
CREATE OR REPLACE VIEW risk_dashboard_view AS
SELECT 
    p.id as projectId,
    p.name as projectName,
    p.companyId,
    c.name as companyName,
    p.budgetRisk,
    p.timelineRisk,
    p.resourceRisk,
    p.scopeRisk,
    p.qualityRisk,
    p.healthScore,
    p.riskLevel,
    p.riskLastCalculated,
    COUNT(DISTINCT rs.id) as suggestionCount,
    COUNT(DISTINCT CASE WHEN rs.status = 'pending' THEN rs.id END) as pendingSuggestions,
    COUNT(DISTINCT CASE WHEN rs.priority = 'critical' THEN rs.id END) as criticalSuggestions,
    COUNT(DISTINCT t.id) as totalTasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completedTasks
FROM projects p
LEFT JOIN companies c ON p.companyId = c.id
LEFT JOIN risk_suggestions rs ON p.id = rs.projectId
LEFT JOIN tasks t ON p.id = t.projectId
GROUP BY p.id, p.name, p.companyId, c.name, 
         p.budgetRisk, p.timelineRisk, p.resourceRisk, 
         p.scopeRisk, p.qualityRisk, p.healthScore, 
         p.riskLevel, p.riskLastCalculated;

-- ===== VERIFICATION QUERIES =====
-- Run these after migration to verify everything is set up correctly

-- Verify tables were created
SHOW TABLES LIKE 'risk_%';

-- Verify columns were added
DESCRIBE projects;

-- Check view creation
SHOW CREATE VIEW risk_dashboard_view;

-- Sample data check
SELECT COUNT(*) as project_count FROM projects;
SELECT COUNT(*) as suggestion_count FROM risk_suggestions;

-- Verify indexes
SHOW INDEX FROM projects WHERE Key_name LIKE 'risk%';
SHOW INDEX FROM risk_suggestions;

-- ===== CLEANUP COMMANDS (if needed) =====
-- Only run these if you need to rollback changes

-- DROP TABLE IF EXISTS risk_suggestions;
-- DROP TABLE IF EXISTS risk_metrics;
-- DROP TABLE IF EXISTS risk_notifications;
-- DROP VIEW IF EXISTS risk_dashboard_view;
-- ALTER TABLE projects DROP COLUMN IF EXISTS budgetRisk;
-- ALTER TABLE projects DROP COLUMN IF EXISTS timelineRisk;
-- ALTER TABLE projects DROP COLUMN IF EXISTS resourceRisk;
-- ALTER TABLE projects DROP COLUMN IF EXISTS scopeRisk;
-- ALTER TABLE projects DROP COLUMN IF EXISTS qualityRisk;
-- ALTER TABLE projects DROP COLUMN IF EXISTS healthScore;
-- ALTER TABLE projects DROP COLUMN IF EXISTS riskLevel;
-- ALTER TABLE projects DROP COLUMN IF EXISTS riskLastCalculated;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS riskScore;
-- DROP TRIGGER IF EXISTS update_project_risk_timestamp;

-- ===== MIGRATION COMPLETE =====