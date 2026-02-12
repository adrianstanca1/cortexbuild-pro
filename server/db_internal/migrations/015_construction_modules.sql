-- Construction Modules Schema

-- 1. Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  date VARCHAR(50) NOT NULL,
  inspector VARCHAR(255),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  findings TEXT, -- JSON
  photos TEXT, -- JSON
  passedCount INT DEFAULT 0,
  failedCount INT DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 2. Quality Issues (Linked to Inspections or Standalone)
CREATE TABLE IF NOT EXISTS quality_issues (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  inspectionId VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  assignedTo VARCHAR(255),
  dueDate VARCHAR(50),
  location VARCHAR(255),
  photos TEXT, -- JSON
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 3. Submittals
CREATE TABLE IF NOT EXISTS submittals (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  specSection VARCHAR(50),
  type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  revision VARCHAR(10) DEFAULT '0',
  receivedDate VARCHAR(50),
  dueDate VARCHAR(50),
  assignedTo VARCHAR(255),
  attachments TEXT, -- JSON
  workflow TEXT, -- JSON
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 4. Concrete Pours
CREATE TABLE IF NOT EXISTS concrete_pours (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  startDateTime TEXT NOT NULL,
  endDateTime TEXT,
  location VARCHAR(255) NOT NULL,
  supplier VARCHAR(255),
  mixDesign VARCHAR(100),
  volumePlanned DECIMAL(10, 2),
  volumeActual DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'scheduled',
  weatherConditions TEXT, -- JSON
  trucks TEXT, -- JSON
  tests TEXT, -- JSON
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 5. Concrete Tests
CREATE TABLE IF NOT EXISTS concrete_tests (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  pourId VARCHAR(255) NOT NULL, -- FK to concrete_pours
  testDate TEXT NOT NULL,
  specimenType VARCHAR(50), -- cylinder, beam
  ageDays INT,
  strengthPsi DECIMAL(10, 2),
  requiredStrengthPsi DECIMAL(10, 2),
  result VARCHAR(50), -- pass, fail
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 6. RFIs (Request for Information)
CREATE TABLE IF NOT EXISTS rfis (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  number INT,
  subject VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status VARCHAR(50) DEFAULT 'open',
  assignedTo VARCHAR(255),
  dueDate VARCHAR(50),
  costImpact BOOLEAN DEFAULT 0,
  scheduleImpact BOOLEAN DEFAULT 0,
  attachments TEXT, -- JSON
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 7. Daily Logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  weather TEXT, -- JSON
  notes TEXT,
  manpower TEXT, -- JSON
  equipment TEXT, -- JSON
  status VARCHAR(50) DEFAULT 'completed',
  createdBy VARCHAR(255),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 8. Safety Incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  type VARCHAR(50),
  description TEXT NOT NULL,
  severity VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open',
  involvedPeople TEXT, -- JSON
  actionsTaken TEXT,
  witnesses TEXT,
  photos TEXT, -- JSON
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 9. Inventory / Materials
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255) NOT NULL,
  itemName VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50),
  location VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  lastUpdated TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
