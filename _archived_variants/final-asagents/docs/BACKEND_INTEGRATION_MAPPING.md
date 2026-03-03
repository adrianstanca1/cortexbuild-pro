# Backend Integration Mapping — Field-First to ASAgents

> **Purpose**: Map field-first construction app features to existing ASAgents Node.js backend  
> **Backend**: `/Users/admin/Desktop/final/server` (Express + TypeScript + MySQL)  
> **Status**: Integration-ready with identified gaps  

---

## Table of Contents

1. [Existing Backend Architecture](#existing-backend-architecture)
2. [Feature Mapping](#feature-mapping)
3. [Gap Analysis](#gap-analysis)
4. [Required New Routes](#required-new-routes)
5. [Database Schema Extensions](#database-schema-extensions)
6. [Integration Strategy](#integration-strategy)

---

## Existing Backend Architecture

### Current Backend Stack

```
/Users/admin/Desktop/final/server/
├── src/
│   ├── index.ts              # Main server (port 3001 dev / 5001 prod)
│   ├── managers/
│   │   └── ManagersIntegration.ts  # 5-manager pattern (API, Config, Monitoring, Secrets, Security)
│   ├── routes/
│   │   ├── auth.ts           # ✅ JWT authentication
│   │   ├── projects.ts       # ✅ Project management
│   │   ├── timeTracking.ts   # ✅ Time entries
│   │   ├── tasks.ts          # ✅ Task management
│   │   ├── invoices.ts       # ⚠️ Can extend for T&M
│   │   ├── documents.ts      # ⚠️ Can extend for photos/plans
│   │   ├── users.ts          # ✅ User management
│   │   ├── companies.ts      # ✅ Multi-tenant
│   │   ├── dashboard.ts      # ⚠️ Can extend for field dashboards
│   │   ├── notifications.ts  # ✅ Push notifications
│   │   ├── analytics.ts      # ⚠️ Can extend for field analytics
│   │   └── integration.ts    # ✅ Backend integration (newly added)
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   └── validation.ts     # Request validation
│   ├── services/
│   │   ├── UnifiedIntegrationService.ts  # Backend routing
│   │   └── AIIntegrationService.ts       # AI features
│   └── database/
│       └── connection.ts     # MySQL connection pool
└── migrations/               # Database migrations
```

### Available API Endpoints

**Authentication** (`/api/auth`):

- ✅ `POST /login` - Email/password authentication
- ✅ `POST /refresh` - Token refresh
- ✅ `POST /logout` - Token invalidation
- ✅ `GET /validate` - Token validation
- ✅ `POST /change-password` - Password change

**Projects** (`/api/projects`):

- ✅ `GET /` - List user's projects
- ✅ `GET /:id` - Project details
- ✅ `POST /` - Create project
- ✅ `PUT /:id` - Update project
- ✅ `DELETE /:id` - Delete project

**Time Tracking** (`/api/time-tracking`):

- ✅ `GET /entries` - List time entries
- ✅ `POST /entries` - Create time entry
- ✅ `GET /entries/:id` - Entry details
- ✅ `PUT /entries/:id` - Update entry
- ✅ `DELETE /entries/:id` - Delete entry

**Tasks** (`/api/tasks`):

- ✅ `GET /` - List tasks
- ✅ `POST /` - Create task
- ✅ `GET /:id` - Task details
- ✅ `PUT /:id` - Update task
- ✅ `DELETE /:id` - Delete task

**Users** (`/api/users`):

- ✅ `GET /` - List users
- ✅ `GET /:id` - User details
- ✅ `GET /me` - Current user profile

**Notifications** (`/api/notifications`):

- ✅ `GET /` - List notifications
- ✅ `POST /` - Create notification
- ✅ `PUT /:id/read` - Mark as read

**Integration** (`/api/integration`):

- ✅ `GET /health/unified` - All services health
- ✅ `POST /route/*` - Auto-route requests
- ✅ `POST /aggregate` - Multi-backend aggregation

---

## Feature Mapping

### 1. Authentication & User Management

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Login (email/password) | `POST /api/auth/login` | ✅ **Exists** | Returns JWT access + refresh tokens |
| Biometric login | Client-side only | ✅ **Ready** | Uses stored tokens, no backend change |
| Token refresh | `POST /api/auth/refresh` | ✅ **Exists** | Automatic refresh flow |
| Logout | `POST /api/auth/logout` | ✅ **Exists** | Token invalidation |
| User profile | `GET /api/users/me` | ✅ **Exists** | Current user details |
| Change password | `POST /api/auth/change-password` | ✅ **Exists** | Requires old password |

**Integration**: ✅ **100% Ready** - No backend changes needed

---

### 2. Clock In/Out & Time Tracking

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Clock in | `POST /api/time-tracking/clock-in` | ⚠️ **Needs Extension** | Add GPS location, geofence validation |
| Clock out | `POST /api/time-tracking/clock-out` | ⚠️ **Needs Extension** | Add GPS location, duration calc |
| Current time entry | `GET /api/time-tracking/current` | 🔴 **Missing** | New endpoint needed |
| Break start/end | `POST /api/time-tracking/breaks` | 🔴 **Missing** | New endpoint for break tracking |
| Daily summary | `GET /api/time-tracking/daily?date=` | ⚠️ **Needs Extension** | Extend existing entries endpoint |
| Weekly summary | `GET /api/time-tracking/weekly?start=` | 🔴 **Missing** | New endpoint for aggregation |
| Cost code selection | Extends entries | ✅ **Exists** | Already supports cost codes |
| Geofence validation | Server-side validation | 🔴 **Missing** | New validation logic needed |

**Required Changes**:

```typescript
// server/src/routes/timeTracking.ts

// NEW: Clock in with GPS
router.post('/clock-in', authenticate, async (req, res) => {
  const { project_id, cost_code, location, device_id } = req.body;
  
  // Validate geofence
  const project = await getProject(project_id);
  const inside_geofence = isInsideGeofence(location, project.geofence);
  
  const entry = await db.timeEntries.create({
    user_id: req.user.id,
    project_id,
    cost_code,
    clock_in: new Date(),
    clock_in_location: location,
    inside_geofence_in: inside_geofence,
    device_id,
  });
  
  res.json({ success: true, data: entry });
});

// NEW: Get current active entry
router.get('/current', authenticate, async (req, res) => {
  const entry = await db.timeEntries.findOne({
    user_id: req.user.id,
    clock_out: null,
  });
  
  res.json({ success: true, data: entry });
});

// NEW: Break management
router.post('/breaks', authenticate, async (req, res) => {
  const { entry_id, action } = req.body; // 'start' | 'end'
  
  const entry = await db.timeEntries.findById(entry_id);
  const breaks = entry.breaks || [];
  
  if (action === 'start') {
    breaks.push({ start: new Date(), end: null });
  } else {
    breaks[breaks.length - 1].end = new Date();
  }
  
  await db.timeEntries.update(entry_id, { breaks });
  res.json({ success: true, data: entry });
});
```

**Database Schema Extension**:

```sql
ALTER TABLE time_entries ADD COLUMN clock_in_location POINT;
ALTER TABLE time_entries ADD COLUMN clock_out_location POINT;
ALTER TABLE time_entries ADD COLUMN inside_geofence_in BOOLEAN;
ALTER TABLE time_entries ADD COLUMN inside_geofence_out BOOLEAN;
ALTER TABLE time_entries ADD COLUMN breaks JSONB DEFAULT '[]';
ALTER TABLE time_entries ADD COLUMN device_id VARCHAR(255);
```

**Integration**: ⚠️ **70% Ready** - Extend existing routes, add 3 new endpoints

---

### 3. Photo Capture & Management

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Photo upload | `POST /api/photos/upload` | 🔴 **Missing** | New route (can extend `/api/documents`) |
| Batch upload | `POST /api/photos/batch` | 🔴 **Missing** | Accept multiple files |
| Photo list | `GET /api/photos?project_id=&date=` | 🔴 **Missing** | Filtered list with pagination |
| Photo details | `GET /api/photos/:id` | 🔴 **Missing** | Metadata + signed URL |
| Photo delete | `DELETE /api/photos/:id` | 🔴 **Missing** | Soft delete |
| Auto-tagging | Server-side processing | 🔴 **Missing** | Extract EXIF, GPS, generate tags |
| Thumbnail generation | Background job | 🔴 **Missing** | 150x150, 300x300 thumbnails |
| CDN storage | S3/CloudFlare R2 | 🔴 **Missing** | Upload to cloud storage |

**New Route File Required**:

```typescript
// server/src/routes/photos.ts
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import exifParser from 'exif-parser';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  const file = req.file;
  const { project_id, tags, related_type, related_id, notes } = req.body;
  
  // Extract EXIF data
  const exif = exifParser.create(file.buffer).parse();
  const gps = exif.tags.GPSLatitude ? {
    lat: exif.tags.GPSLatitude,
    lng: exif.tags.GPSLongitude,
  } : null;
  
  // Generate thumbnails
  const thumbnail150 = await sharp(file.buffer)
    .resize(150, 150, { fit: 'cover' })
    .toBuffer();
  const thumbnail300 = await sharp(file.buffer)
    .resize(300, 300, { fit: 'cover' })
    .toBuffer();
  
  // Upload to S3
  const s3Key = `${req.user.company_id}/${project_id}/${Date.now()}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: 'asagents-photos',
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  
  // Save metadata to DB
  const photo = await db.photos.create({
    filename: file.originalname,
    s3_key: s3Key,
    size_bytes: file.size,
    mime_type: file.mimetype,
    project_id,
    user_id: req.user.id,
    gps_location: gps,
    captured_at: exif.tags.DateTimeOriginal || new Date(),
    tags: tags || [],
    related_type,
    related_id,
    notes,
  });
  
  res.json({ success: true, data: photo });
});

router.get('/', authenticate, async (req, res) => {
  const { project_id, date, tags } = req.query;
  
  const photos = await db.photos.find({
    project_id,
    ...(date && { captured_at: { $gte: new Date(date) } }),
    ...(tags && { tags: { $in: tags.split(',') } }),
  });
  
  res.json({ success: true, data: photos });
});

export default router;
```

**Database Schema**:

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  gps_location POINT,
  captured_at TIMESTAMP NOT NULL,
  tags TEXT[] DEFAULT '{}',
  related_type VARCHAR(50), -- 'daily_log', 'task', 'rfi', 't_m'
  related_id UUID,
  notes TEXT,
  synced_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_photos_project (project_id),
  INDEX idx_photos_date (captured_at),
  INDEX idx_photos_tags (tags)
);
```

**Integration**: 🔴 **0% Ready** - Completely new feature, requires new route file

---

### 4. Daily Logs

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Create daily log | `POST /api/daily-logs` | 🔴 **Missing** | New route entirely |
| Get daily log | `GET /api/daily-logs?project_id=&date=` | 🔴 **Missing** | Filtered by project + date |
| Update daily log | `PUT /api/daily-logs/:id` | 🔴 **Missing** | Draft updates |
| Submit daily log | `POST /api/daily-logs/:id/submit` | 🔴 **Missing** | Approval workflow |
| Weather auto-pull | External API integration | 🔴 **Missing** | OpenWeatherMap/NOAA |
| Labor hours | Nested within log | 🔴 **Missing** | Array of crew entries |
| Quantities installed | Nested within log | 🔴 **Missing** | Array of quantity entries |
| Equipment hours | Nested within log | 🔴 **Missing** | Array of equipment entries |

**New Route File Required**:

```typescript
// server/src/routes/dailyLogs.ts
import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { project_id, date, labor_hours, quantities, equipment, blockers, notes } = req.body;
  
  // Auto-pull weather
  const project = await db.projects.findById(project_id);
  const weather = await fetchWeather(project.lat, project.lng, date);
  
  const log = await db.dailyLogs.create({
    project_id,
    date,
    weather,
    labor_hours,
    quantities,
    equipment,
    blockers,
    notes,
    submitted_by: req.user.id,
    status: 'draft',
  });
  
  res.json({ success: true, data: log });
});

router.post('/:id/submit', authenticate, async (req, res) => {
  const log = await db.dailyLogs.findById(req.params.id);
  
  // Validation
  if (!log.labor_hours?.length && !log.quantities?.length) {
    throw new Error('Daily log must include labor or quantities');
  }
  
  await db.dailyLogs.update(req.params.id, {
    status: 'submitted',
    submitted_at: new Date(),
  });
  
  // Notify PM
  await notificationService.send({
    user_id: log.project.pm_id,
    type: 'daily_log_submitted',
    message: `Daily log submitted for ${log.project.name}`,
  });
  
  res.json({ success: true });
});

async function fetchWeather(lat: number, lng: number, date: string) {
  const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { lat, lon: lng, appid: process.env.OPENWEATHER_API_KEY },
  });
  
  return {
    temp_c: response.data.main.temp - 273.15,
    conditions: response.data.weather[0].description,
    wind_speed_ms: response.data.wind.speed,
    humidity: response.data.main.humidity,
  };
}

export default router;
```

**Database Schema**:

```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  date DATE NOT NULL,
  weather JSONB, -- {temp_c, conditions, wind_speed_ms}
  labor_hours JSONB DEFAULT '[]', -- [{crew, hours, cost_code}]
  quantities JSONB DEFAULT '[]', -- [{item, qty, unit, cost_code}]
  equipment JSONB DEFAULT '[]', -- [{equipment, hours}]
  blockers TEXT,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft | submitted | approved
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, date)
);
```

**Integration**: 🔴 **0% Ready** - Completely new feature

---

### 5. Plans Viewer & RFIs

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Upload plan (PDF) | `POST /api/plans/upload` | ⚠️ **Extend `/api/documents`** | PDF storage + metadata |
| List plans | `GET /api/plans?project_id=` | ⚠️ **Extend `/api/documents`** | Filter by project |
| Plan details | `GET /api/plans/:id` | ⚠️ **Extend `/api/documents`** | Include revisions |
| Pin management | `POST /api/plans/:id/pins` | 🔴 **Missing** | Add pins to plans |
| Create RFI | `POST /api/rfis` | 🔴 **Missing** | New route |
| List RFIs | `GET /api/rfis?project_id=` | 🔴 **Missing** | Filtered list |
| RFI details | `GET /api/rfis/:id` | 🔴 **Missing** | Include thread |
| RFI thread | `POST /api/rfis/:id/comments` | 🔴 **Missing** | Add comments |
| Update RFI status | `PUT /api/rfis/:id/status` | 🔴 **Missing** | Status workflow |

**Extend Existing Route**:

```typescript
// server/src/routes/documents.ts (extend existing)

// Add plan-specific endpoints
router.post('/plans/upload', authenticate, upload.single('file'), async (req, res) => {
  const { project_id, sheet_number, title, revision } = req.body;
  
  // Upload to S3
  // Generate preview images (first page thumbnail)
  // Extract metadata (page count, size)
  
  const plan = await db.documents.create({
    type: 'plan',
    project_id,
    sheet_number,
    title,
    revision,
    file_url: s3Url,
    page_count,
    // ...
  });
  
  res.json({ success: true, data: plan });
});

router.post('/plans/:id/pins', authenticate, async (req, res) => {
  const { x, y, type, title, description } = req.body; // type: 'task' | 'rfi'
  
  const pin = await db.planPins.create({
    plan_id: req.params.id,
    x_percent: x,
    y_percent: y,
    type,
    title,
    description,
    created_by: req.user.id,
  });
  
  res.json({ success: true, data: pin });
});
```

**New Route File for RFIs**:

```typescript
// server/src/routes/rfis.ts
import { Router } from 'express';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { project_id, title, description, assignee_id, due_date, priority, plan_id, pin_id } = req.body;
  
  const rfi = await db.rfis.create({
    project_id,
    title,
    description,
    assignee_id,
    due_date,
    priority,
    plan_id,
    pin_id,
    created_by: req.user.id,
    status: 'open',
  });
  
  // Notify assignee
  await notificationService.send({
    user_id: assignee_id,
    type: 'rfi_assigned',
    message: `New RFI: ${title}`,
  });
  
  res.json({ success: true, data: rfi });
});

router.get('/', authenticate, async (req, res) => {
  const { project_id, status, assignee_id } = req.query;
  
  const rfis = await db.rfis.find({ project_id, status, assignee_id });
  res.json({ success: true, data: rfis });
});

router.post('/:id/comments', authenticate, async (req, res) => {
  const { message, attachments } = req.body;
  
  const comment = await db.rfiComments.create({
    rfi_id: req.params.id,
    user_id: req.user.id,
    message,
    attachments,
  });
  
  res.json({ success: true, data: comment });
});

export default router;
```

**Database Schema**:

```sql
CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open | answered | closed
  priority VARCHAR(20) DEFAULT 'medium', -- low | medium | high
  assignee_id UUID REFERENCES users(id),
  due_date DATE,
  plan_id UUID REFERENCES documents(id),
  pin_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  answered_at TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE TABLE rfi_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfi_id UUID NOT NULL REFERENCES rfis(id),
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE plan_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES documents(id),
  x_percent DECIMAL(5,2) NOT NULL,
  y_percent DECIMAL(5,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'task' | 'rfi'
  linked_id UUID, -- task_id or rfi_id
  title VARCHAR(255),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration**: ⚠️ **30% Ready** - Extend documents route, create RFI route

---

### 6. T&M Tickets

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Create T&M ticket | `POST /api/tm-tickets` | 🔴 **Missing** | New route |
| List tickets | `GET /api/tm-tickets?project_id=` | 🔴 **Missing** | Filtered list |
| Ticket details | `GET /api/tm-tickets/:id` | 🔴 **Missing** | Full details |
| Add line items | `POST /api/tm-tickets/:id/lines` | 🔴 **Missing** | Labor/materials/equipment |
| Client signature | `POST /api/tm-tickets/:id/sign` | 🔴 **Missing** | E-signature capture |
| Generate PDF | `GET /api/tm-tickets/:id/pdf` | 🔴 **Missing** | PDF generation |
| Create CO draft | `POST /api/tm-tickets/:id/co` | 🔴 **Missing** | Auto-generate change order |

**New Route File Required**:

```typescript
// server/src/routes/tmTickets.ts
import { Router } from 'express';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { project_id, title, description } = req.body;
  
  const ticket = await db.tmTickets.create({
    project_id,
    title,
    description,
    ticket_number: await generateTicketNumber(project_id),
    created_by: req.user.id,
    status: 'draft',
  });
  
  res.json({ success: true, data: ticket });
});

router.post('/:id/lines', authenticate, async (req, res) => {
  const { type, item, quantity, unit_price, cost_code } = req.body;
  // type: 'labor' | 'material' | 'equipment'
  
  const line = await db.tmLines.create({
    ticket_id: req.params.id,
    type,
    item,
    quantity,
    unit_price,
    cost_code,
    total: quantity * unit_price,
  });
  
  // Recalculate ticket totals
  await recalculateTicketTotals(req.params.id);
  
  res.json({ success: true, data: line });
});

router.post('/:id/sign', authenticate, async (req, res) => {
  const { client_name, client_title, signature_data, gps_location } = req.body;
  
  // Store signature image to S3
  const signatureUrl = await uploadSignature(signature_data);
  
  // Generate unique hash for verification
  const hash = crypto
    .createHash('sha256')
    .update(`${req.params.id}${client_name}${Date.now()}`)
    .digest('hex');
  
  await db.tmTickets.update(req.params.id, {
    status: 'signed',
    client_name,
    client_title,
    signature_url: signatureUrl,
    signature_hash: hash,
    signed_at: new Date(),
    signed_location: gps_location,
  });
  
  // Generate PDF
  const pdf = await generateTMPdf(req.params.id);
  
  // Auto-create CO draft
  await createCODraft(req.params.id);
  
  res.json({ success: true, data: { hash, pdf_url: pdf } });
});

router.get('/:id/pdf', authenticate, async (req, res) => {
  const ticket = await db.tmTickets.findById(req.params.id);
  const lines = await db.tmLines.find({ ticket_id: req.params.id });
  
  const doc = new PDFDocument();
  
  // Generate PDF content
  doc.fontSize(20).text(`T&M Ticket ${ticket.ticket_number}`);
  doc.fontSize(12).text(`Project: ${ticket.project.name}`);
  // ... full PDF generation
  
  doc.end();
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
});

export default router;
```

**Database Schema**:

```sql
CREATE TABLE tm_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  ticket_number VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft | signed | approved
  subtotal DECIMAL(12,2) DEFAULT 0,
  markup_percent DECIMAL(5,2) DEFAULT 18.0,
  markup_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  client_name VARCHAR(255),
  client_title VARCHAR(255),
  signature_url VARCHAR(500),
  signature_hash VARCHAR(64),
  signed_at TIMESTAMP,
  signed_location POINT,
  pdf_url VARCHAR(500),
  co_draft_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tm_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tm_tickets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- labor | material | equipment
  item VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(10,2) NOT NULL,
  cost_code VARCHAR(50),
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration**: 🔴 **0% Ready** - Completely new feature

---

### 7. Deliveries & Receiving

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Create delivery | `POST /api/deliveries` | 🔴 **Missing** | New route |
| List deliveries | `GET /api/deliveries?project_id=` | 🔴 **Missing** | Filtered list |
| Delivery details | `GET /api/deliveries/:id` | 🔴 **Missing** | Full details |
| Add line items | `POST /api/deliveries/:id/lines` | 🔴 **Missing** | Ordered vs received |
| Partial receive | `POST /api/deliveries/:id/receive` | 🔴 **Missing** | Update quantities |
| Complete delivery | `POST /api/deliveries/:id/complete` | 🔴 **Missing** | Close delivery |
| Discrepancy report | `GET /api/deliveries/:id/discrepancies` | 🔴 **Missing** | Shortage/overage list |

**New Route File Required**:

```typescript
// server/src/routes/deliveries.ts
import { Router } from 'express';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { project_id, vendor, packing_slip_number, delivery_date } = req.body;
  
  const delivery = await db.deliveries.create({
    project_id,
    vendor,
    packing_slip_number,
    delivery_date,
    status: 'pending',
    created_by: req.user.id,
  });
  
  res.json({ success: true, data: delivery });
});

router.post('/:id/receive', authenticate, async (req, res) => {
  const { lines, notes, receiver_signature } = req.body;
  // lines: [{ item, ordered_qty, received_qty }]
  
  // Update line items
  for (const line of lines) {
    await db.deliveryLines.update(line.id, {
      received_qty: line.received_qty,
      status: line.received_qty === line.ordered_qty ? 'complete' : 'partial',
    });
  }
  
  // Check for discrepancies
  const hasDiscrepancies = lines.some(l => l.received_qty !== l.ordered_qty);
  
  await db.deliveries.update(req.params.id, {
    status: hasDiscrepancies ? 'partial' : 'complete',
    received_at: new Date(),
    receiver_signature,
    notes,
  });
  
  // Notify PM of discrepancies
  if (hasDiscrepancies) {
    await notificationService.send({
      user_id: delivery.project.pm_id,
      type: 'delivery_discrepancy',
      message: `Delivery ${packing_slip_number} has discrepancies`,
    });
  }
  
  res.json({ success: true });
});

export default router;
```

**Database Schema**:

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  vendor VARCHAR(255) NOT NULL,
  packing_slip_number VARCHAR(100) NOT NULL,
  delivery_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | partial | complete
  received_at TIMESTAMP,
  receiver_id UUID REFERENCES users(id),
  receiver_signature VARCHAR(500),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  item VARCHAR(255) NOT NULL,
  ordered_qty DECIMAL(10,2) NOT NULL,
  received_qty DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- pending | partial | complete | damaged
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration**: 🔴 **0% Ready** - Completely new feature

---

### 8. Safety & Toolbox Talks

| Field Feature | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| Create talk | `POST /api/safety/talks` | 🔴 **Missing** | New route (may extend existing) |
| List talks | `GET /api/safety/talks?project_id=` | 🔴 **Missing** | Filtered list |
| Talk templates | `GET /api/safety/talk-templates` | 🔴 **Missing** | Pre-defined topics |
| Record attendance | `POST /api/safety/talks/:id/attendance` | 🔴 **Missing** | Signature capture |
| Complete talk | `POST /api/safety/talks/:id/complete` | 🔴 **Missing** | Trainer sign-off |
| Safety incidents | `POST /api/safety/incidents` | 🔴 **Missing** | Incident reporting |

**Check Existing Safety Routes**:

```bash
# Check if safety routes exist
ls -la /Users/admin/Desktop/final/server/src/routes/safety.ts
```

**If exists, extend; if not, create**:

```typescript
// server/src/routes/safety.ts (new or extend)
import { Router } from 'express';

const router = Router();

router.get('/talk-templates', authenticate, async (req, res) => {
  const templates = [
    { id: 1, topic: 'Confined Space Entry', key_points: [...] },
    { id: 2, topic: 'Fall Protection', key_points: [...] },
    { id: 3, topic: 'Electrical Safety', key_points: [...] },
    // ... more templates
  ];
  
  res.json({ success: true, data: templates });
});

router.post('/talks', authenticate, async (req, res) => {
  const { project_id, topic, template_id, key_points, hazards } = req.body;
  
  const talk = await db.safetyTalks.create({
    project_id,
    topic,
    template_id,
    key_points,
    hazards,
    trainer_id: req.user.id,
    status: 'in_progress',
    date: new Date(),
  });
  
  res.json({ success: true, data: talk });
});

router.post('/talks/:id/attendance', authenticate, async (req, res) => {
  const { attendees } = req.body;
  // attendees: [{ user_id, signature_data }]
  
  for (const attendee of attendees) {
    await db.talkAttendance.create({
      talk_id: req.params.id,
      user_id: attendee.user_id,
      signature_url: await uploadSignature(attendee.signature_data),
      signed_at: new Date(),
    });
  }
  
  res.json({ success: true });
});

export default router;
```

**Database Schema**:

```sql
CREATE TABLE safety_talks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  topic VARCHAR(255) NOT NULL,
  template_id INTEGER,
  key_points JSONB DEFAULT '[]',
  hazards TEXT,
  duration_minutes INTEGER,
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress | completed
  trainer_id UUID REFERENCES users(id),
  trainer_signature VARCHAR(500),
  date DATE NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE talk_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talk_id UUID NOT NULL REFERENCES safety_talks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  signature_url VARCHAR(500),
  signed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration**: 🔴 **0% Ready** - Check if safety routes exist, likely needs full implementation

---

## Gap Analysis Summary

### ✅ Fully Ready (No Changes)

- Authentication (JWT, refresh tokens, biometric client-side)
- User management
- Multi-tenant (companies)
- Notifications

### ⚠️ Partially Ready (Extend Existing)

- **Time Tracking** (70% ready):
  - ✅ Has time entries endpoints
  - 🔴 Add: GPS location fields, geofence validation, break tracking, current entry endpoint
  
- **Projects** (80% ready):
  - ✅ Has CRUD endpoints
  - 🔴 Add: Geofence data, project summary endpoint
  
- **Documents** (30% ready):
  - ✅ Has document upload/list
  - 🔴 Add: Plan-specific metadata, pin management

### 🔴 Completely Missing (New Routes Needed)

- **Photos** - 0% ready, full implementation needed
- **Daily Logs** - 0% ready, full implementation needed
- **RFIs** - 0% ready, full implementation needed
- **T&M Tickets** - 0% ready, full implementation needed
- **Deliveries** - 0% ready, full implementation needed
- **Safety Talks** - 0% ready (check if safety routes exist)

---

## Required New Routes

### Priority 1 (Sprint A)

1. ✅ Extend `/api/time-tracking` with GPS + geofence
2. 🔴 Create `/api/photos` with upload/list/metadata
3. ⚠️ Extend `/api/projects` with geofence data

### Priority 2 (Sprint B)

4. 🔴 Create `/api/daily-logs` with weather integration
5. ⚠️ Extend `/api/documents` for plan pins
6. 🔴 Create `/api/rfis` with comments/thread

### Priority 3 (Sprint C)

7. 🔴 Create `/api/tm-tickets` with PDF generation
8. 🔴 Create `/api/deliveries` with receiving workflow
9. 🔴 Create/extend `/api/safety` for toolbox talks

---

## Database Schema Extensions

### Sprint A

```sql
-- Time tracking extensions
ALTER TABLE time_entries ADD COLUMN clock_in_location POINT;
ALTER TABLE time_entries ADD COLUMN clock_out_location POINT;
ALTER TABLE time_entries ADD COLUMN inside_geofence_in BOOLEAN;
ALTER TABLE time_entries ADD COLUMN inside_geofence_out BOOLEAN;
ALTER TABLE time_entries ADD COLUMN breaks JSONB DEFAULT '[]';
ALTER TABLE time_entries ADD COLUMN device_id VARCHAR(255);

-- Project extensions
ALTER TABLE projects ADD COLUMN geofence_lat DECIMAL(10,8);
ALTER TABLE projects ADD COLUMN geofence_lng DECIMAL(11,8);
ALTER TABLE projects ADD COLUMN geofence_radius_meters INTEGER DEFAULT 100;

-- Photos (new table)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  gps_location POINT,
  captured_at TIMESTAMP NOT NULL,
  tags TEXT[] DEFAULT '{}',
  related_type VARCHAR(50),
  related_id UUID,
  notes TEXT,
  synced_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Sprint B

```sql
-- Daily logs (new table)
CREATE TABLE daily_logs (...);

-- Plan pins (new table)
CREATE TABLE plan_pins (...);

-- RFIs (new table)
CREATE TABLE rfis (...);
CREATE TABLE rfi_comments (...);
```

### Sprint C

```sql
-- T&M tickets (new tables)
CREATE TABLE tm_tickets (...);
CREATE TABLE tm_lines (...);

-- Deliveries (new tables)
CREATE TABLE deliveries (...);
CREATE TABLE delivery_lines (...);

-- Safety talks (new tables)
CREATE TABLE safety_talks (...);
CREATE TABLE talk_attendance (...);
```

---

## Integration Strategy

### Phase 1: Setup & Discovery (Week 1)

1. ✅ Review existing backend codebase
2. ✅ Map existing endpoints to field features
3. ✅ Identify gaps and create this document
4. 🔴 Set up development database with test data
5. 🔴 Configure S3/CloudFlare R2 for file storage
6. 🔴 Set up OpenWeatherMap API key

### Phase 2: Sprint A Extensions (Week 2-3)

1. Extend `/api/time-tracking` routes
2. Create `/api/photos` routes
3. Extend `/api/projects` routes
4. Run database migrations
5. Test with mobile app prototype

### Phase 3: Sprint B Extensions (Week 4-5)

1. Create `/api/daily-logs` routes
2. Extend `/api/documents` for plans
3. Create `/api/rfis` routes
4. Integrate weather API
5. Test daily log workflow

### Phase 4: Sprint C Extensions (Week 6-7)

1. Create `/api/tm-tickets` routes
2. Create `/api/deliveries` routes
3. Create `/api/safety` routes
4. Implement PDF generation
5. Test full workflows

### Phase 5: Testing & Hardening (Week 8)

1. End-to-end integration tests
2. Load testing (100+ concurrent users)
3. Offline sync testing
4. Performance optimization
5. Security audit

---

## Backend Development Checklist

### Sprint A

- [ ] Extend time tracking with GPS/geofence
- [ ] Add `GET /api/time-tracking/current`
- [ ] Add `POST /api/time-tracking/breaks`
- [ ] Extend projects with geofence data
- [ ] Add `GET /api/projects/:id/summary`
- [ ] Create photos route (`/api/photos`)
- [ ] Set up S3/CloudFlare R2 bucket
- [ ] EXIF extraction service
- [ ] Thumbnail generation service
- [ ] Run Sprint A migrations

### Sprint B

- [ ] Create daily logs route (`/api/daily-logs`)
- [ ] Weather API integration
- [ ] Auto-pull weather on log creation
- [ ] Extend documents for plan pins
- [ ] Create RFI route (`/api/rfis`)
- [ ] RFI comment threading
- [ ] RFI status workflow
- [ ] Run Sprint B migrations

### Sprint C

- [ ] Create T&M tickets route (`/api/tm-tickets`)
- [ ] Signature capture and storage
- [ ] PDF generation (PDFKit)
- [ ] Hash generation for verification
- [ ] Auto CO draft creation
- [ ] Create deliveries route (`/api/deliveries`)
- [ ] Partial receive workflow
- [ ] Discrepancy notifications
- [ ] Create/extend safety route (`/api/safety`)
- [ ] Toolbox talk templates
- [ ] Attendance signatures
- [ ] Run Sprint C migrations

---

## API Documentation

Once routes are implemented, generate API documentation with:

```bash
# Using Swagger/OpenAPI
npm install swagger-jsdoc swagger-ui-express
```

**Example**:

```typescript
// server/src/index.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ASAgents Field API',
      version: '1.0.0',
      description: 'Field-first construction management API',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.asagents.com', description: 'Production' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## Environment Variables

Add to `.env`:

```bash
# Existing
DATABASE_HOST=localhost
DATABASE_USER=asagents
DATABASE_PASSWORD=***
DATABASE_NAME=asagents
JWT_SECRET=***
JWT_REFRESH_SECRET=***

# New for Field App
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
AWS_S3_BUCKET=asagents-photos
AWS_REGION=us-east-1

OPENWEATHER_API_KEY=***
OPENWEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Optional: CloudFlare R2 (S3-compatible)
R2_ACCOUNT_ID=***
R2_ACCESS_KEY_ID=***
R2_SECRET_ACCESS_KEY=***
R2_BUCKET=asagents-photos
```

---

## Summary

**Total Backend Work**:

- ✅ **0 routes ready** (authentication/users already complete)
- ⚠️ **3 routes to extend** (time-tracking, projects, documents)
- 🔴 **6 new routes to create** (photos, daily-logs, rfis, tm-tickets, deliveries, safety)

**Estimated Backend Development Time**:

- Sprint A extensions: 3-5 days
- Sprint B new routes: 5-7 days
- Sprint C new routes: 5-7 days
- **Total**: 13-19 days of backend engineering

**Integration Readiness**:

- **Authentication**: ✅ 100% ready
- **Time Tracking**: ⚠️ 70% ready
- **Projects**: ⚠️ 80% ready
- **Photos**: 🔴 0% ready
- **Daily Logs**: 🔴 0% ready
- **Plans/RFIs**: 🔴 30% ready
- **T&M/Deliveries/Safety**: 🔴 0% ready

**Overall Backend Integration**: **~35% ready**, **~65% new development required**

---

**Document Version**: 1.0  
**Last Updated**: October 2, 2025  
**Owner**: Backend Team Lead  
**Next Review**: After Sprint A Implementation
