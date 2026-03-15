-- Free Trial System Migration
-- Adds trial support with storage quotas and trial period tracking

-- Add trial columns to companies table
ALTER TABLE companies ADD COLUMN trialStartedAt TEXT;
ALTER TABLE companies ADD COLUMN trialEndsAt TEXT;
ALTER TABLE companies ADD COLUMN storageQuotaBytes BIGINT DEFAULT 5368709120; -- 5GB
ALTER TABLE companies ADD COLUMN storageUsedBytes BIGINT DEFAULT 0;
ALTER TABLE companies ADD COLUMN databaseQuotaBytes BIGINT DEFAULT 5368709120; -- 5GB
ALTER TABLE companies ADD COLUMN databaseUsedBytes BIGINT DEFAULT 0;

-- Update existing companies with trial defaults (for companies created in last 14 days)
UPDATE companies 
SET 
  plan = 'trial',
  status = 'trial',
  trialStartedAt = createdAt,
  trialEndsAt = datetime(createdAt, '+14 days'),
  storageQuotaBytes = 5368709120,
  storageUsedBytes = 0,
  databaseQuotaBytes = 5368709120,
  databaseUsedBytes = 0
WHERE 
  (plan = 'free' OR plan = 'Free Beta' OR plan IS NULL)
  AND createdAt > datetime('now', '-14 days');

-- Mark older free accounts as expired
UPDATE companies
SET status = 'expired'
WHERE 
  (plan = 'free' OR plan = 'Free Beta')
  AND createdAt <= datetime('now', '-14 days');

-- Create storage usage tracking table
CREATE TABLE IF NOT EXISTS storage_usage (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  filePath TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  uploadedBy TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  deletedAt TEXT,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadedBy) REFERENCES users(id)
);

-- Create indexes for storage tracking
CREATE INDEX IF NOT EXISTS idx_storage_companyId ON storage_usage(companyId);
CREATE INDEX IF NOT EXISTS idx_storage_deletedAt ON storage_usage(deletedAt);
CREATE INDEX IF NOT EXISTS idx_storage_createdAt ON storage_usage(createdAt);

-- Create indexes for trial queries
CREATE INDEX IF NOT EXISTS idx_companies_trial_end ON companies(trialEndsAt);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Log migration
INSERT INTO system_settings (key, value, updatedAt)
VALUES ('migration_trial_system', 'completed', datetime('now'))
ON CONFLICT(key) DO UPDATE SET value = 'completed', updatedAt = datetime('now');
