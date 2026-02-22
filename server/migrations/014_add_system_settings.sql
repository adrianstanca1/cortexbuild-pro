-- System Settings Table (Global Config)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updatedAt TEXT,
  updatedBy TEXT
);

-- Initial Seed
INSERT INTO system_settings (key, value, updatedAt, updatedBy) VALUES 
('maintenance_mode', 'false', CURRENT_TIMESTAMP, 'system'),
('allow_registrations', 'true', CURRENT_TIMESTAMP, 'system'),
('global_beta', 'true', CURRENT_TIMESTAMP, 'system')
ON CONFLICT(key) DO NOTHING;
