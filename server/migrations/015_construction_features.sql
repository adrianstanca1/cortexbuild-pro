-- Migration 015: Construction Site Features
-- Adds 8 new construction-specific modules

-- ============================================
-- 1. SITE INSPECTIONS & QUALITY CONTROL
-- ============================================

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Safety', 'Quality', 'Progress', 'Final'
  date TEXT NOT NULL,
  inspector TEXT NOT NULL,
  status TEXT DEFAULT 'Open', -- 'Open', 'Closed', 'Follow-up Required'
  findings TEXT,
  photos TEXT, -- JSON array of photo URLs
  passedCount INTEGER DEFAULT 0,
  failedCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS quality_issues (
  id TEXT PRIMARY KEY,
  inspectionId TEXT NOT NULL,
  issueType TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'Minor', 'Major', 'Critical'
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT,
  resolvedBy TEXT,
  resolvedAt TEXT,
  status TEXT DEFAULT 'Open',
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (inspectionId) REFERENCES inspections(id)
);

-- ============================================
-- 2. MATERIAL MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS material_deliveries (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  material TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  supplier TEXT NOT NULL,
  deliveryDate TEXT NOT NULL,
  receivedBy TEXT,
  receivedDate TEXT,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Received', 'Rejected', 'Partial'
  poNumber TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS material_inventory (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  material TEXT NOT NULL,
  onSite REAL DEFAULT 0,
  allocated REAL DEFAULT 0,
  available REAL DEFAULT 0,
  unit TEXT NOT NULL,
  location TEXT,
  lastUpdated TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS material_requisitions (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  requestedBy TEXT NOT NULL,
  material TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  urgency TEXT DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Critical'
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Ordered', 'Delivered', 'Rejected'
  neededBy TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- ============================================
-- 3. CHANGE ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS change_orders (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  costImpact REAL DEFAULT 0,
  scheduleDays INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Draft', -- 'Draft', 'Pending', 'Approved', 'Rejected', 'Executed'
  submittedBy TEXT,
  submittedAt TEXT,
  approvedBy TEXT,
  approvedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS change_order_items (
  id TEXT PRIMARY KEY,
  changeOrderId TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  unitCost REAL NOT NULL,
  total REAL NOT NULL,
  category TEXT,
  FOREIGN KEY (changeOrderId) REFERENCES change_orders(id)
);

-- ============================================
-- 4. SUBMITTALS
-- ============================================

CREATE TABLE IF NOT EXISTS submittals (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Shop Drawing', 'Product Data', 'Sample', 'Mix Design'
  specSection TEXT,
  submittedBy TEXT NOT NULL,
  dateSubmitted TEXT NOT NULL,
  reviewer TEXT,
  reviewedDate TEXT,
  status TEXT DEFAULT 'Pending Review', -- 'Pending Review', 'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected'
  dueDate TEXT,
  revision INTEGER DEFAULT 1,
  notes TEXT,
  documentUrl TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS submittal_revisions (
  id TEXT PRIMARY KEY,
  submittalId TEXT NOT NULL,
  revision INTEGER NOT NULL,
  dateSubmitted TEXT NOT NULL,
  submittedBy TEXT NOT NULL,
  comments TEXT,
  status TEXT NOT NULL,
  reviewedBy TEXT,
  reviewedDate TEXT,
  documentUrl TEXT,
  FOREIGN KEY (submittalId) REFERENCES submittals(id)
);

-- ============================================
-- 5. PROGRESS PHOTOS
-- ============================================

CREATE TABLE IF NOT EXISTS progress_photos (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  location TEXT NOT NULL,
  photoUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  photoType TEXT DEFAULT 'standard', -- 'standard', '360', 'panorama', 'drone'
  captureDate TEXT NOT NULL,
  tags TEXT, -- JSON array
  description TEXT,
  latitude REAL,
  longitude REAL,
  viewAngle INTEGER,
  floor TEXT,
  zone TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- ============================================
-- 6. WEATHER TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS weather_delays (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  date TEXT NOT NULL,
  weatherType TEXT NOT NULL, -- 'Rain', 'Snow', 'Wind', 'Heat', 'Cold', 'Ice', 'Fog'
  description TEXT,
  hoursLost REAL DEFAULT 0,
  costImpact REAL DEFAULT 0,
  affectedActivities TEXT, -- JSON array
  temperature REAL,
  windSpeed REAL,
  precipitation REAL,
  createdBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- ============================================
-- 7. CONCRETE MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS concrete_pours (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  pourDate TEXT NOT NULL,
  location TEXT NOT NULL,
  element TEXT, -- 'Foundation', 'Slab', 'Column', 'Beam', 'Wall'
  volume REAL NOT NULL,
  unit TEXT DEFAULT 'CY',
  mixDesign TEXT NOT NULL,
  supplier TEXT NOT NULL,
  temperature REAL,
  slump REAL,
  airContent REAL,
  water CementRatio REAL,
  truckCount INTEGER,
  startTime TEXT,
  endTime TEXT,
  weatherConditions TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS concrete_tests (
  id TEXT PRIMARY KEY,
  pourId TEXT NOT NULL,
  testDate TEXT NOT NULL,
  testAge INTEGER NOT NULL, -- Days
  strength REAL NOT NULL, -- PSI
  targetStrength REAL,
  testType TEXT DEFAULT 'Compression', -- 'Compression', 'Flexural', 'Split Tensile'
  passed BOOLEAN DEFAULT 0,
  labReportUrl TEXT,
  testLocation TEXT,
  sampleNumber TEXT,
  testedBy TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pourId) REFERENCES concrete_pours(id)
);

-- ============================================
-- 8. SUBCONTRACTOR ENHANCEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS subcontractor_insurance (
  id TEXT PRIMARY KEY,
  subcontractorId TEXT NOT NULL,
  policyType TEXT NOT NULL, -- 'General Liability', 'Workers Comp', 'Auto', 'Umbrella'
  carrier TEXT NOT NULL,
  policyNumber TEXT NOT NULL,
  coverageAmount REAL NOT NULL,
  effectiveDate TEXT NOT NULL,
  expiryDate TEXT NOT NULL,
  status TEXT DEFAULT 'Active', -- 'Active', 'Expired', 'Pending Renewal'
  certificateUrl TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (subcontractorId) REFERENCES vendors(id)
);

CREATE TABLE IF NOT EXISTS payment_applications (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  subcontractorId TEXT NOT NULL,
  applicationNumber INTEGER NOT NULL,
  period TEXT NOT NULL, -- 'YYYY-MM'
  amountRequested REAL NOT NULL,
  previouslyApproved REAL DEFAULT 0,
  currentApproved REAL DEFAULT 0,
  retainagePercent REAL DEFAULT 10,
  retainageAmount REAL DEFAULT 0,
  netPayment REAL DEFAULT 0,
  status TEXT DEFAULT 'Submitted', -- 'Submitted', 'Under Review', 'Approved', 'Paid', 'Rejected'
  submittedDate TEXT NOT NULL,
  approvedBy TEXT,
  approvedDate TEXT,
  paidDate TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (companyId) REFERENCES companies(id),
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (subcontractorId) REFERENCES vendors(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(projectId);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
CREATE INDEX IF NOT EXISTS idx_material_deliveries_project ON material_deliveries(projectId);
CREATE INDEX IF NOT EXISTS idx_material_inventory_project ON material_inventory(projectId);
CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(projectId);
CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(projectId);
CREATE INDEX IF NOT EXISTS idx_progress_photos_project ON progress_photos(projectId);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON progress_photos(captureDate);
CREATE INDEX IF NOT EXISTS idx_weather_delays_project ON weather_delays(projectId);
CREATE INDEX IF NOT EXISTS idx_concrete_pours_project ON concrete_pours(projectId);
CREATE INDEX IF NOT EXISTS idx_payment_apps_project ON payment_applications(projectId);
CREATE INDEX IF NOT EXISTS idx_payment_apps_sub ON payment_applications(subcontractorId);
