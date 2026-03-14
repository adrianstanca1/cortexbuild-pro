-- IoT Device Management Tables for CortexBuild Pro
-- Migration: 001_iot_tables.sql

-- IoT Devices Table
CREATE TABLE IF NOT EXISTS iot_devices (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT,
  name TEXT NOT NULL,
  deviceType TEXT NOT NULL, -- 'SENSOR', 'GATEWAY', 'CONTROLLER', 'CAMERA'
  sensorTypes TEXT, -- JSON array: ['temperature', 'humidity', 'vibration']
  status TEXT DEFAULT 'OFFLINE', -- 'ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'
  serialNumber TEXT UNIQUE,
  model TEXT,
  manufacturer TEXT,
  firmwareVersion TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  mqttTopic TEXT,
  apiKey TEXT,
  lastSeenAt TEXT,
  lastDataAt TEXT,
  batteryLevel INTEGER, -- percentage 0-100
  signalStrength INTEGER, -- dBm
  metadata TEXT, -- JSON for additional device-specific data
  alertThresholds TEXT, -- JSON for anomaly detection thresholds
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(companyId) REFERENCES companies(id),
  FOREIGN KEY(projectId) REFERENCES projects(id)
);

-- IoT Sensor Data Table (Time-series data)
CREATE TABLE IF NOT EXISTS iot_sensor_data (
  id TEXT PRIMARY KEY,
  deviceId TEXT NOT NULL,
  companyId TEXT NOT NULL,
  projectId TEXT,
  sensorType TEXT NOT NULL, -- 'temperature', 'humidity', 'vibration', 'pressure', 'motion'
  value REAL NOT NULL,
  unit TEXT, -- 'celsius', 'percent', 'g', 'psi', etc.
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  latitude REAL,
  longitude REAL,
  metadata TEXT, -- JSON for additional readings
  FOREIGN KEY(deviceId) REFERENCES iot_devices(id),
  FOREIGN KEY(companyId) REFERENCES companies(id)
);

-- IoT Alerts Table
CREATE TABLE IF NOT EXISTS iot_alerts (
  id TEXT PRIMARY KEY,
  deviceId TEXT NOT NULL,
  companyId TEXT NOT NULL,
  projectId TEXT,
  alertType TEXT NOT NULL, -- 'THRESHOLD_EXCEEDED', 'DEVICE_OFFLINE', 'ANOMALY_DETECTED', 'BATTERY_LOW', 'SIGNAL_WEAK'
  severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  message TEXT NOT NULL,
  sensorType TEXT,
  thresholdValue REAL,
  actualValue REAL,
  unit TEXT,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
  acknowledgedBy TEXT,
  acknowledgedAt TEXT,
  resolvedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(deviceId) REFERENCES iot_devices(id),
  FOREIGN KEY(companyId) REFERENCES companies(id),
  FOREIGN KEY(acknowledgedBy) REFERENCES team(id)
);

-- Equipment Monitoring Table (Links IoT devices to equipment)
CREATE TABLE IF NOT EXISTS equipment_monitoring (
  id TEXT PRIMARY KEY,
  equipmentId TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  companyId TEXT NOT NULL,
  monitoringType TEXT NOT NULL, -- 'USAGE', 'LOCATION', 'CONDITION', 'PERFORMANCE'
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(equipmentId) REFERENCES equipment(id),
  FOREIGN KEY(deviceId) REFERENCES iot_devices(id),
  FOREIGN KEY(companyId) REFERENCES companies(id)
);

-- IoT Dashboard Configurations
CREATE TABLE IF NOT EXISTS iot_dashboards (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT,
  name TEXT NOT NULL,
  description TEXT,
  layout TEXT, -- JSON for dashboard layout configuration
  widgets TEXT, -- JSON array of widget configurations
  isDefault INTEGER DEFAULT 0,
  createdBy TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(companyId) REFERENCES companies(id),
  FOREIGN KEY(createdBy) REFERENCES team(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_iot_devices_company ON iot_devices(companyId);
CREATE INDEX IF NOT EXISTS idx_iot_devices_project ON iot_devices(projectId);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_sensor_data_device ON iot_sensor_data(deviceId);
CREATE INDEX IF NOT EXISTS idx_sensor_data_company ON iot_sensor_data(companyId);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON iot_sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_type ON iot_sensor_data(sensorType);
CREATE INDEX IF NOT EXISTS idx_iot_alerts_company ON iot_alerts(companyId);
CREATE INDEX IF NOT EXISTS idx_iot_alerts_status ON iot_alerts(status);
CREATE INDEX IF NOT EXISTS idx_iot_alerts_device ON iot_alerts(deviceId);
CREATE INDEX IF NOT EXISTS idx_equipment_monitoring_equipment ON equipment_monitoring(equipmentId);

-- Insert sample IoT devices for testing
INSERT OR IGNORE INTO iot_devices (id, companyId, projectId, name, deviceType, sensorTypes, status, serialNumber, model, manufacturer, location, mqttTopic, alertThresholds, createdAt) VALUES
('iot-1', 'comp-1', 'proj-1', 'Site Temp Sensor A1', 'SENSOR', '[temperature, humidity]', 'ONLINE', 'TEMP001', 'DHT22', 'Adafruit', 'Building A - Floor 1', 'cortexbuild/comp-1/proj-1/temp001', '{temperature: {min: 10, max: 35}, humidity: {min: 20, max: 80}}', CURRENT_TIMESTAMP),
('iot-2', 'comp-1', 'proj-1', 'Vibration Monitor B1', 'SENSOR', '[vibration, temperature]', 'ONLINE', 'VIB001', 'ADXL345', 'Analog Devices', 'Crane Base - Site B', 'cortexbuild/comp-1/proj-1/vib001', '{vibration: {max: 5.0}, temperature: {max: 60}}', CURRENT_TIMESTAMP),
('iot-3', 'comp-1', 'proj-2', 'Environmental Station', 'GATEWAY', '[temperature, humidity, pressure]', 'ONLINE', 'ENV001', 'BME280', 'Bosch', 'Site Office', 'cortexbuild/comp-1/proj-2/env001', '{temperature: {min: 5, max: 40}, humidity: {min: 10, max: 90}}', CURRENT_TIMESTAMP);

-- Insert sample sensor data
INSERT OR IGNORE INTO iot_sensor_data (id, deviceId, companyId, projectId, sensorType, value, unit, timestamp) VALUES
('data-1', 'iot-1', 'comp-1', 'proj-1', 'temperature', 24.5, 'celsius', datetime('now', '-1 hour')),
('data-2', 'iot-1', 'comp-1', 'proj-1', 'humidity', 65.0, 'percent', datetime('now', '-1 hour')),
('data-3', 'iot-1', 'comp-1', 'proj-1', 'temperature', 25.2, 'celsius', datetime('now', '-30 minutes')),
('data-4', 'iot-1', 'comp-1', 'proj-1', 'humidity', 62.0, 'percent', datetime('now', '-30 minutes')),
('data-5', 'iot-2', 'comp-1', 'proj-1', 'vibration', 0.8, 'g', datetime('now', '-1 hour')),
('data-6', 'iot-2', 'comp-1', 'proj-1', 'temperature', 45.2, 'celsius', datetime('now', '-1 hour')),
('data-7', 'iot-3', 'comp-1', 'proj-2', 'temperature', 22.0, 'celsius', datetime('now')),
('data-8', 'iot-3', 'comp-1', 'proj-2', 'humidity', 58.0, 'percent', datetime('now'));

SELECT 'IoT tables created successfully' as status;
