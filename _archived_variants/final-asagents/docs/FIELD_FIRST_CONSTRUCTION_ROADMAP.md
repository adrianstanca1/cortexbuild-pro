# Field‑First Construction App — Roadmap, Mindmap & Wireframes

> **Scope**: Small construction firms (5–100 field staff)  
> **Priority**: On‑site capture, offline use, and fast approvals  
> **Target**: Reduce admin time by 30%, achieve 95% daily log compliance

---

## Table of Contents

1. [Product Roadmap](#1-product-roadmap)
2. [Mindmap](#2-mindmap)
3. [Wireframes](#3-wireframes)
4. [Acceptance Criteria](#4-acceptance-criteria)
5. [Reporting & Exports](#5-reporting--exports)
6. [Next Steps](#6-next-steps)

---

## 1) Product Roadmap (phased, pragmatic)

### Goals (North Star)

- Reduce admin time for foremen by **>30%**
- Achieve **95%** daily log submission rate by Day 30 of pilot
- Cut RFI response cycle by **25%** via capture-at-source
- Convert **>80%** of signed T&M tickets into CO drafts automatically

### Assumptions

- Mixed device fleet (iOS + Android)
- Patchy connectivity on sites
- Accounting in QuickBooks Online or Xero
- Drawings come from Drive/OneDrive/Dropbox

---

### Phase 0 — Foundations (Week 0–1)

**Tech Stack**:

- React Native for mobile apps
- SQLite/WatermelonDB for offline storage
- Background sync with conflict resolution
- File CDN for plans/photos
- Push notifications

**Design System**:

- Design tokens (colors/spacing/typography)
- Tailwind baseline
- Icon set (construction-specific)

**Data Model v1**:

- Projects, Drawings+Revisions, Tasks
- RFIs, T&M, Deliveries, DailyLogs
- TimeEntries, Crews, CostCodes, Photos

**Deliverables**:

- Repository + CI/CD pipeline
- Design token file
- Clickable empty shell (Home → Project → Plans)

---

### Phase 1 — Discovery & Field Validation (Weeks 1–2)

**Activities**:

- 3–5 ride‑alongs with foremen
- Shadow field operations
- Time–motion study of daily log + T&M workflows
- Artifact audit: sample daily logs, T&M tickets, delivery slips, toolbox talks

**Deliverables**:

- Validated form templates (Daily Log, T&M, Delivery, Safety Talk)
- Workflow maps with pain points identified
- Acceptance criteria per workflow
- User personas (Foreman, Superintendent, PM, Field Engineer)

---

### Phase 2 — UX/Wireframes & Prototypes (Weeks 2–4)

**Activities**:

- Low‑fi wireframes for 6 core screens
- Mid‑fi clickable prototype
- Usability tests with 5–7 field users
- Two iteration cycles based on feedback

**Deliverables**:

- This document + interactive prototype
- Microcopy library
- Empty‑state patterns
- Offline UX patterns
- Error handling flows

---

### Phase 3 — MVP Build (Weeks 4–10)

#### Sprint A (Weeks 4–6)

**Core Infrastructure**:

- Offline framework + conflict resolution rules
- Authentication & user management
- Project/crew home screen (My Day)

**Time Tracking**:

- Clock in/out with geofence reminders
- Time entries by cost code
- Daily/weekly time summaries

**Media Capture**:

- Photo capture with auto‑tag (project/date/location)
- GPS/timestamp metadata
- Local storage with background sync

#### Sprint B (Weeks 6–8)

**Daily Logs v1**:

- Labor hours entry
- Quantities installed tracking
- Blockers/delays documentation
- Weather auto‑pull integration
- Photo attachments

**Plans Viewer**:

- PDF fast load with progressive rendering
- Sheet index navigation
- Search functionality
- Pin‑drop tasks on plans
- Simple markup tools (circles, arrows, text)
- Revision comparison

**Tasks/Punch List**:

- Create from plan pins
- Status tracking (Open → In Progress → Complete)
- Assignment & due dates
- Photo attachments
- Basic exports (CSV/PDF)

#### Sprint C (Weeks 8–10)

**T&M Tickets v1**:

- Labor + materials + equipment entry
- Cost code assignment
- Client e‑signature on device
- PDF generation with unique hash
- Auto-draft CO creation

**Deliveries/Receiving**:

- Scan QR/barcode for line items
- Quantity received vs PO (manual entry)
- Photo proof of delivery
- Discrepancy flagging
- Partial receive workflow

**Safety**:

- Toolbox Talk templates
- Attendance tracking
- Digital signatures
- Photo documentation
- Safety incident reporting (basic)

---

### Phase 4 — Pilot (Weeks 10–12)

**Deployment**:

- Roll out to 1–2 projects
- 10–20 field users
- Embedded support (daily check-ins)
- Bug‑burn down sprint
- KPI measurement

**Exit Criteria**:

- ✅ 95% daily log compliance
- ✅ <2 taps to photo‑attach
- ✅ 0 data loss offline→online
- ✅ 80% T&M signed on site
- ✅ <5% crash rate
- ✅ <3s average action completion

---

### Phase 5 — Hardening & Light Analytics (Weeks 12–15)

**Performance**:

- Optimization for large plans (50+ MB PDFs)
- Conflict edge case handling
- Audit trail for all actions
- PDF/CSV report generation

**Dashboard v1**:

- Units installed vs plan
- RFI aging report
- Safety talks completion rate
- T&M conversion metrics
- Daily log compliance trends

---

### Phase 6 — Phase‑2 Features (Weeks 15–20)

**Change Management**:

- PCE (Potential Change Event) → CO workflow
- CO PDF generation
- Approval routing
- Cost impact tracking

**Schedule & Planning**:

- 3‑week look‑ahead board
- Constraint tracking
- Resource leveling (basic)

**Equipment**:

- QR check‑in/out
- Usage hours tracking
- Maintenance reminders

**RFIs Advanced**:

- Email‑in functionality
- Due dates & SLA timers
- Status automation
- Thread history

**Client Portal**:

- Read‑only access for clients
- Document viewing
- T&M approval workflow
- Progress photos

---

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Plan file bloat | High | Incremental PDF renderer, on‑device cache, tile-based loading |
| Low adoption | High | 2‑min daily log, voice‑to‑text, big buttons, minimal typing |
| Connectivity issues | High | Offline‑first with merge previews + last‑write‑wins per field |
| Data trust concerns | Medium | Role‑based approvals, immutable signatures, audit trail, exports |
| Device fragmentation | Medium | Test matrix: iOS 14+, Android 10+, tablets + phones |
| Battery drain | Medium | Background sync optimization, location services only when needed |

---

### Team & Responsibilities

| Role | FTE | Responsibilities |
|------|-----|------------------|
| Product/UX | 1.0 | Roadmap, wireframes, user testing, acceptance criteria |
| Mobile Engineers | 2–3 | React Native app, offline sync, device features |
| Backend Engineers | 1–2 | API, sync logic, integrations, file handling |
| QA | 0.5 | Test plans, device testing, regression, pilot support |
| PM/Owner | 0.5 | Stakeholder mgmt, pilot coordination, vendor relations |
| Field Champion | 0.25 | One foreman per pilot site, feedback, training |

---

### KPIs & Instrumentation

**Primary Metrics**:

- Daily log submission % (target: 95%)
- Average taps per log (target: <15)
- RFI cycle time (target: -25% from baseline)
- T&M signed on-site rate (target: 80%)
- Delivery discrepancies flagged (track all)

**Technical Metrics**:

- Crash‑free sessions (target: >95%)
- Sync success rate (target: >99%)
- Offline action completion rate (target: 100%)
- Photo upload success (target: >98%)
- App open rate (target: 3+ times/day for field users)

---

## 2) Mindmap (Field‑First Focus)

```
Construction App (Field‑First)
├── Field Modules
│   ├── Clock In/Out (Geofence)
│   │   ├── GPS tracking
│   │   ├── Cost code selection
│   │   ├── Break management
│   │   └── Weekly summaries
│   ├── Daily Log (Weather, Photos, Voice)
│   │   ├── Auto-weather pull
│   │   ├── Labor hours
│   │   ├── Quantities installed
│   │   ├── Equipment hours
│   │   ├── Voice-to-text notes
│   │   └── Blocker documentation
│   ├── Plans Viewer (Pins, Markups)
│   │   ├── Multi-sheet navigation
│   │   ├── Search (by sheet/detail)
│   │   ├── Pin tasks/RFIs
│   │   ├── Markup tools
│   │   ├── Revision compare
│   │   └── Measurement tools
│   ├── Tasks/Punch (Statuses, Sign‑off)
│   │   ├── Create from pins
│   │   ├── Assignment routing
│   │   ├── Status workflow
│   │   ├── Photo proof
│   │   └── Completion sign-off
│   ├── RFIs (from Plan Pins)
│   │   ├── Quick capture from plans
│   │   ├── Thread management
│   │   ├── Status tracking
│   │   ├── Due date/SLA
│   │   └── Email integration
│   ├── T&M Tickets (Client E‑Sign)
│   │   ├── Labor lines
│   │   ├── Materials/equipment
│   │   ├── Cost codes
│   │   ├── E-signature capture
│   │   ├── PDF generation
│   │   └── Auto CO draft
│   ├── Deliveries/Receiving (Scan)
│   │   ├── QR/barcode scan
│   │   ├── Quantity verification
│   │   ├── Photo proof
│   │   ├── Partial receive
│   │   └── Discrepancy alerts
│   ├── Safety (Talks, JHA, Incidents)
│   │   ├── Talk templates
│   │   ├── Attendance roster
│   │   ├── Digital signatures
│   │   ├── Hazard identification
│   │   └── Incident reporting
│   └── Equipment/Tools (QR, Hours)
│       ├── Check in/out
│       ├── Usage tracking
│       ├── Maintenance logs
│       └── Inventory
├── Office Modules
│   ├── Project Overview
│   │   ├── Dashboard widgets
│   │   ├── Status summaries
│   │   ├── Open items
│   │   └── Team activity
│   ├── Document Control (Revisions)
│   │   ├── Upload/version
│   │   ├── Distribution lists
│   │   ├── Superseded tracking
│   │   └── Access control
│   ├── Change Management (PCE→CO)
│   │   ├── PCE capture
│   │   ├── Cost estimation
│   │   ├── Approval workflow
│   │   ├── CO generation
│   │   └── Budget tracking
│   └── Procurement/POs
│       ├── Requisitions
│       ├── PO creation
│       ├── Vendor management
│       └── Receiving integration
├── Cross‑Cutting
│   ├── Offline‑First + Sync
│   │   ├── SQLite local DB
│   │   ├── Background sync
│   │   ├── Conflict resolution
│   │   ├── Queue management
│   │   └── Sync indicators
│   ├── Universal Capture (+ button)
│   │   ├── Photo
│   │   ├── Task
│   │   ├── RFI
│   │   ├── T&M
│   │   ├── Delivery
│   │   └── Note
│   ├── Photos (Tags, Markup)
│   │   ├── Auto-tagging
│   │   ├── GPS/timestamp
│   │   ├── Markup tools
│   │   ├── Albums/collections
│   │   └── CDN storage
│   ├── Templates Library
│   │   ├── Daily log templates
│   │   ├── T&M templates
│   │   ├── Safety talk topics
│   │   └── Custom forms
│   ├── Approvals/Notifications
│   │   ├── Workflow routing
│   │   ├── Push notifications
│   │   ├── Email digests
│   │   └── In-app alerts
│   └── Roles & Audit Trail
│       ├── Permission matrix
│       ├── Action logging
│       ├── Immutable records
│       └── Export history
├── Integrations
│   ├── Accounting (QBO/Xero)
│   │   ├── Cost code sync
│   │   ├── Time export
│   │   ├── Invoice data
│   │   └── Budget import
│   ├── Cloud Storage (Drive/OneDrive)
│   │   ├── Plan import
│   │   ├── Document sync
│   │   └── Photo backup
│   ├── E‑Sign (DocuSign)
│   │   ├── Signature workflows
│   │   ├── Certificate chains
│   │   └── Audit trails
│   └── Weather API
│       ├── Current conditions
│       ├── Forecast
│       └── Historical data
├── Data Model
│   ├── Projects, Locations
│   │   ├── Hierarchy
│   │   ├── Addresses/coordinates
│   │   └── Geofences
│   ├── Drawings/Revisions, Specs
│   │   ├── Version control
│   │   ├── Sheet metadata
│   │   └── Distribution
│   ├── Tasks, RFIs, Submittals, COs
│   │   ├── Status workflows
│   │   ├── Assignment
│   │   └── Relationships
│   ├── DailyLogs, TimeEntries
│   │   ├── Date stamped
│   │   ├── Approval status
│   │   └── Export ready
│   ├── T&M, Deliveries, Materials
│   │   ├── Cost tracking
│   │   ├── Signatures
│   │   └── PDF generation
│   └── Photos, Vendors, Contacts
│       ├── Metadata
│       ├── Relationships
│       └── Privacy controls
└── Analytics
    ├── Field Productivity
    │   ├── Daily log compliance
    │   ├── Time by cost code
    │   └── Units installed
    ├── Schedule Health
    │   ├── Look-ahead status
    │   ├── Constraint tracking
    │   └── Milestone progress
    ├── Quality & Safety
    │   ├── Punch item trends
    │   ├── RFI velocity
    │   └── Safety talk completion
    └── Commercial (T&M→CO)
        ├── T&M signed rate
        ├── CO conversion
        └── Budget variance
```

---

## 3) Low‑Fidelity Wireframes (Mobile‑First)

> **Note**: These are lo‑fi to validate flows/tap counts. Each includes primary actions and offline cues.

### 3.1 Home / My Day

```
┌─────────────────────────────────────┐
│  My Day           [☰]     Project ▼ │
├─────────────────────────────────────┤
│ ⏱ Clock In  [Geofence ON]          │
│  Last: 07:12   Cost Code: ▽        │
├─────────────────────────────────────┤
│ Due Today                           │
│  • Daily Log (North Tower)  ▶       │
│  • Toolbox Talk 07:30        ▶      │
│  • 3 Tasks assigned           3     │
├─────────────────────────────────────┤
│ Quick Capture  [+ Photo]  [+ Task]  │
│  [+ T&M]  [+ Delivery]  [+ RFI]     │
├─────────────────────────────────────┤
│ Activity (Today)                    │
│  08:05  12 photos uploaded          │
│  08:22  Delivery: drywall partial   │
│  08:45  RFI #014 answered           │
└─────────────────────────────────────┘
```

**Primary Actions**:

- Clock in/out (1 tap)
- Quick Capture (1 tap → context menu)
- Open due items (1 tap per item)

**Offline UX**:

- Banner: "Offline — capturing locally" (yellow background)
- Greyed sync icon with pending count
- All actions functional, queued for sync

**Tap Count**:

- Clock in: 1 tap
- Add photo: 2 taps (+ Photo → capture)
- View daily log: 1 tap

---

### 3.2 Project Home

```
┌─────────────────────────────────────┐
│  North Tower        [Search 🔎]     │
├─────────────────────────────────────┤
│ [Plans]  [Tasks]  [Daily Log]       │
│ [RFIs]   [T&M]    [Deliveries]      │
│ [Safety] [Photos] [Schedule]        │
├─────────────────────────────────────┤
│ Open Items                          │
│  RFIs: 2 waiting   Punch: 5         │
│  Today's talk: Confined Space       │
│  Pending: 3 T&M signatures          │
├─────────────────────────────────────┤
│ Recent Activity                     │
│  10:15  Daily log submitted         │
│  09:42  T&M signed: Extra work      │
│  08:30  Delivery received (partial) │
└─────────────────────────────────────┘
```

**Primary Actions**:

- Navigate to module (1 tap per card)
- Search across all project data
- Quick view of open items

**Information Hierarchy**:

1. Project name + search
2. Module grid (3×3)
3. Open items summary
4. Recent activity feed

---

### 3.3 Plans Viewer (Pins + Markups + Create RFI)

```
┌─────────────────────────────────────┐
│ A‑102  Rev 5        [Sheets ▽]      │
├─────────────────────────────────────┤
│                                     │
│  [  PDF viewport with pinch‑zoom ]  │
│  [  🔵 pin at C5 ]                   │
│  [  🔴 markup circle ]               │
│                                     │
├─────────────────────────────────────┤
│  [+ Task]   [+ RFI]   [Compare]     │
│  [Markup ✏️]  [Measure 📏]           │
└─────────────────────────────────────┘
```

**Interaction Flow**:

1. **Open Plans** (from Project Home)
2. **Select Sheet** (dropdown or sheet index)
3. **Pinch/Pan** to navigate
4. **Long-press** to add pin
5. **Tap pin** to see existing task/RFI

**Create RFI from Pin**:

```
┌─────────────────────────────────────┐
│ New RFI from A‑102 @ Grid C5        │
├─────────────────────────────────────┤
│ Title: __________________________   │
│ Assignee: PM ▽   Due:  Fri ▽        │
│ Priority: High ◉ Med ◯ Low ◯        │
│ Photos/Markups: [3 attached]        │
│ Notes:  🎙 Voice to text            │
│ ________________________________    │
│ ________________________________    │
├─────────────────────────────────────┤
│ [Save Draft]        [Submit]        │
└─────────────────────────────────────┘
```

**Primary Actions**:

- Add pin (long-press on plan)
- Create task/RFI from pin (1 tap)
- Compare revisions (side-by-side)
- Markup tools (circle, arrow, text, photo)
- Measure distance/area

**Edge Cases**:

- Large PDFs: skeleton tiles while loading
- Markups: cached offline, merged by layer on sync
- Multiple pins: cluster view, tap to expand
- Revision compare: swipe between versions

**Performance**:

- Initial load: <2s (cached)
- Zoom/pan: 60 FPS
- Pin placement: instant feedback

---

### 3.4 Daily Log (2‑Minute Flow)

```
┌─────────────────────────────────────┐
│ Daily Log — North Tower  (Today)    │
├─────────────────────────────────────┤
│ Weather:  12°C  Light Rain  2 m/s   │
│ Auto-pulled at 06:00 ✓              │
├─────────────────────────────────────┤
│ Labor Hours: [ + Crew ]  Total: 18  │
│  • Crew A (6): Framing  8h          │
│  • Crew B (4): Drywall  8h          │
├─────────────────────────────────────┤
│ Quantities Installed: [ + ]         │
│  • Drywall sheets: 120 (CC-301)     │
│  • Linear ft framing: 480 (CC-201)  │
├─────────────────────────────────────┤
│ Equipment: [ + ]                    │
│  • Lift #3: 6.5h                    │
├─────────────────────────────────────┤
│ Photos: [12 attached] Add ▶         │
├─────────────────────────────────────┤
│ Blockers / Notes:  🎙 Voice         │
│  "Material delivery 2h late, rain   │
│   delay after lunch, no impact to   │
│   schedule"                         │
├─────────────────────────────────────┤
│ [Save Draft]           [Submit]     │
└─────────────────────────────────────┘
```

**Workflow** (target: 120 seconds):

1. **Auto-populated** (5s):
   - Weather pulled automatically
   - Crews pre-populated from yesterday
   - Cost codes remembered

2. **Adjust Labor** (20s):
   - Tap crew to edit hours
   - Add/remove crew members
   - Verify cost codes

3. **Add Quantities** (30s):
   - Type or voice input
   - Select cost code from recent
   - Unit auto-suggested

4. **Add Equipment** (15s):
   - Select from project list
   - Hours auto-calculated from start time

5. **Attach Photos** (20s):
   - Auto-suggested from today's captures
   - Multi-select (swipe to select)
   - Already tagged with project/date

6. **Voice Notes** (25s):
   - Tap mic, speak blockers
   - Auto-transcribed
   - Edit if needed

7. **Submit** (5s):
   - Validation warnings (if any)
   - Confirmation with summary
   - Queued for sync if offline

**Validation Rules**:

- Require either labor OR quantities
- Warn if no photos attached
- Warn if notes empty and blockers expected
- Alert if total hours seem unusual

**Auto-save**:

- Every 5 seconds to local storage
- Draft persists until submitted
- Can be completed across multiple sessions

---

### 3.5 T&M Ticket (Client E‑Sign)

```
┌─────────────────────────────────────┐
│ T&M — Extra framing at Level 3      │
│ Ticket #TM-2025-042                 │
├─────────────────────────────────────┤
│ Labor  [ + Add line ]               │
│  • 2× Carpenter  4.0h @ CC‑201      │
│    Rate: $65/h  Total: $520         │
│  • 1× Laborer    4.0h @ CC‑201      │
│    Rate: $45/h  Total: $180         │
├─────────────────────────────────────┤
│ Materials [ + ]                     │
│  • 2×6 SPF studs: 40 @ $8.50        │
│    Total: $340                      │
│  • Fasteners: 1 box @ $45           │
├─────────────────────────────────────┤
│ Equipment [ + ]                     │
│  • Compressor: 4h @ $15/h = $60     │
├─────────────────────────────────────┤
│ Subtotal: $1,145                    │
│ OH&P (18%): $206                    │
│ Total: $1,351                       │
├─────────────────────────────────────┤
│ Photos/Sketch: [4 photos] [add]     │
├─────────────────────────────────────┤
│ Client Name: _John Smith___         │
│ Title: _Site Manager________        │
│ Signature:  ✎  (capture area)       │
│ ┌─────────────────────────────────┐ │
│ │  [signature pad with stylus]    │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ Date: Oct 2, 2025  Time: 14:32      │
├─────────────────────────────────────┤
│ [Clear Sig]  [Save Draft]           │
│                    [Get Signature]  │
└─────────────────────────────────────┘
```

**Workflow**:

1. **Create Ticket**:
   - From Quick Capture or T&M module
   - Title/description required

2. **Add Labor Lines**:
   - Select craft from list
   - Enter hours (decimal or HH:MM)
   - Cost code from recent or search
   - Rates pulled from project settings
   - Running total updates

3. **Add Materials**:
   - Search catalog or manual entry
   - Quantity × unit price
   - Optional: scan barcode for item

4. **Add Equipment**:
   - Select from project equipment
   - Hours from check-in/out or manual
   - Hourly rate applied

5. **Attach Photos**:
   - Before/after work
   - Material receipts
   - Scope documentation

6. **Client Signature**:
   - Client name and title (text input)
   - Signature capture (stylus or finger)
   - Auto-timestamp + GPS
   - Clear/redo option

7. **Post-Submit**:
   - PDF generated locally (with unique hash)
   - Auto-email to PM + client
   - CO draft created (if configured)
   - Stored in project documents

**Primary Actions**:

- Add lines (1 tap → form)
- Calculate totals (auto)
- Capture signature (2 taps: field → sign)
- Generate PDF (auto on sign)

**Validation**:

- Require at least one line item
- Signature required before submit
- Client name required
- Warn if no photos attached

**Offline Handling**:

- Full functionality offline
- PDF generated locally
- Queued for email/sync
- Signature hash generated offline

---

### 3.6 Deliveries / Receiving (Scan First)

```
┌─────────────────────────────────────┐
│ Delivery — Packing Slip #PS‑1842    │
│ Vendor: ABC Supply                  │
├─────────────────────────────────────┤
│ [ 📷 Scan QR/Barcode ]              │
│        or                           │
│ [ ⌨️ Manual Entry ]                  │
├─────────────────────────────────────┤
│ Item                 Ordered  Recvd  │
│ ┌─────────────────────────────────┐ │
│ │ Drywall 5/8"       100     60 ▢ │ │
│ │ Status: Partial ⚠️              │ │
│ ├─────────────────────────────────┤ │
│ │ Fasteners (box)     10     10 ✓ │ │
│ │ Status: Complete ✓              │ │
│ ├─────────────────────────────────┤ │
│ │ Tape compound       12     12 ✓ │ │
│ │ Status: Complete ✓              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Notes / Photo: [2 photos] [add]     │
│  "40 sheets damaged, signed back    │
│   with driver. Short 40 sheets."    │
├─────────────────────────────────────┤
│ Receiver: Mike Johnson              │
│ Signature: ✎ [signed]               │
│ Date/Time: Oct 2, 14:15             │
├─────────────────────────────────────┤
│ [Partial Receive]   [Complete All]  │
└─────────────────────────────────────┘
```

**Workflow**:

1. **Scan Packing Slip**:
   - QR/barcode auto-populates delivery
   - If not found → manual entry

2. **Match to PO** (optional):
   - System suggests matching POs
   - User confirms or skips

3. **Verify Quantities**:
   - Ordered pre-populated
   - Received: tap to edit
   - Swipe row to mark complete/partial

4. **Document Issues**:
   - Photo damaged items
   - Voice or text notes
   - Flag discrepancies (auto-alerts PM)

5. **Sign & Submit**:
   - Receiver signature
   - Auto-timestamp
   - PDF receipt generated
   - Driver copy option (email/print)

**Primary Actions**:

- Scan (1 tap → camera)
- Edit quantities (tap number)
- Partial/complete (swipe or button)
- Add photo proof (quick access)

**Alerts**:

- PM auto-notified on shortages
- Procurement notified on overages
- Damaged items trigger photo requirement

**Integration**:

- Links to PO system
- Updates inventory (if enabled)
- Cost tracking for received items

---

### 3.7 RFIs — List & Detail

#### List View

```
┌─────────────────────────────────────┐
│ RFIs (North Tower)                  │
│ [+ New RFI]  [Filter ▽]  [Search]   │
├─────────────────────────────────────┤
│ Filter: ⚪ All  🔴 Open  🟢 Closed   │
│ Sort: ▽ Due Date                    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ #014 🔴 OPEN      Due: Fri ⚠️  │ │
│ │ Beam clash @ Grid C5            │ │
│ │ From: A-102 Rev 5               │ │
│ │ To: Architect  Age: 3d          │ │
│ │ [3 messages] [2 photos]         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ #013 🟢 ANSWERED  Age: 1d       │ │
│ │ Spec detail for section 07      │ │
│ │ From: Section 3                 │ │
│ │ To: PM  Response attached       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ #012 🔴 OPEN      Due: Wed      │ │
│ │ Sleeve location clarification   │ │
│ │ From: MEP coord                 │ │
│ │ To: Engineer  Age: 5d  ⚠️      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Showing 3 of 18 RFIs                │
└─────────────────────────────────────┘
```

#### Detail View

```
┌─────────────────────────────────────┐
│ ← RFI #014  🔴 OPEN    [⋮ Menu]     │
├─────────────────────────────────────┤
│ Title: Beam clash @ Grid C5         │
│ Priority: High 🔴                    │
│ From: A‑102 Rev 5 (pin linked)      │
│ Created: Sept 29  Age: 3 days       │
│ Assignee: John Smith (Architect)    │
│ Due: Oct 4 (Friday) ⚠️ 2d left      │
├─────────────────────────────────────┤
│ Description:                        │
│ "Steel beam interferes with duct    │
│  routing per MEP coordination model. │
│  Need confirmation on beam depth    │
│  reduction or duct reroute."        │
├─────────────────────────────────────┤
│ Attachments: [View plan pin]        │
│  📷 Photo 1: Beam location          │
│  📷 Photo 2: MEP coordination       │
│  📄 RFI sketch markup               │
├─────────────────────────────────────┤
│ Thread (3 messages):                │
│ ┌─────────────────────────────────┐ │
│ │ Sept 29, 08:15 - Mike (Field)   │ │
│ │ Initial RFI submitted           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Sept 30, 14:22 - John (Arch)    │ │
│ │ "Reviewing with structural.     │ │
│ │  Should have answer by EOD Fri" │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Oct 1, 09:05 - Mike (Field)     │ │
│ │ "Any update? Work area blocked" │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [+ Add Comment]  [+ Attach]         │
│ [Change Status]  [Reassign]         │
└─────────────────────────────────────┘
```

**Primary Actions**:

- Create RFI (1 tap from Plans or Quick Capture)
- Filter/search (status, assignee, age)
- Add comment (tap, type/voice)
- Attach photo/document
- Change status (Open → Answered → Closed)
- Reassign
- Link to plan pin

**Status Workflow**:

1. **Open** (created, waiting for response)
2. **In Review** (assignee acknowledged)
3. **Answered** (response provided)
4. **Closed** (field confirmed/implemented)

**SLA Tracking**:

- Due date set on creation
- Aging counter (days since creation)
- Warning indicators (<2d to due)
- Overdue highlighting

**Notifications**:

- Push on status change
- Daily digest of open RFIs
- Approaching due date reminders
- New comment notifications

---

### 3.8 Safety — Toolbox Talk

```
┌─────────────────────────────────────┐
│ Toolbox Talk — Oct 2, 2025          │
│ Topic: Confined Space Entry         │
├─────────────────────────────────────┤
│ [ Select Template ▽ ]               │
│  • Confined Space Entry ✓           │
│  • Fall Protection                  │
│  • Electrical Safety                │
│  • Heat Stress                      │
│  • PPE Requirements                 │
│  • + Custom Topic                   │
├─────────────────────────────────────┤
│ Key Points (auto-populated):        │
│  ✓ Permit required                  │
│  ✓ Atmospheric testing              │
│  ✓ Continuous monitoring            │
│  ✓ Standby person assigned          │
│  ✓ Rescue equipment ready           │
├─────────────────────────────────────┤
│ Attendance (12 workers):            │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Mike Johnson   [signed]       │ │
│ │ ✓ Sarah Smith    [signed]       │ │
│ │ ✓ Carlos Garcia  [signed]       │ │
│ │ ✓ ...           [View All 12]   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Hazards Identified Today:           │
│  • Vault entry required Level 1     │
│  • Monitor O2 levels continuously   │
│  [+ Add Hazard]                     │
├─────────────────────────────────────┤
│ Photos: [2 attached]                │
│  📷 Setup photo  📷 Monitoring      │
├─────────────────────────────────────┤
│ Trainer: John Foreman               │
│ Signature: ✎ [signed]               │
│ Duration: 15 minutes                │
├─────────────────────────────────────┤
│ [Save Draft]           [Complete]   │
└─────────────────────────────────────┘
```

**Workflow**:

1. **Select Template**:
   - Pre-populated topics
   - Custom topics allowed
   - Key points auto-loaded

2. **Check Attendance**:
   - Crew roster auto-populated
   - Tap name to sign
   - Signature capture or PIN
   - Mark absent if needed

3. **Identify Hazards**:
   - Free text or voice
   - Photo documentation
   - Link to JHA if applicable

4. **Trainer Sign-off**:
   - Foreman/supervisor signature
   - Auto-timestamp
   - Duration recorded

5. **Complete & Store**:
   - PDF generated
   - Stored in project safety records
   - Compliance tracking updated

---

## 4) Acceptance Criteria (MVP Cutline)

### Functional Requirements

#### Daily Log

- ✅ Complete in ≤120 seconds (average user)
- ✅ Auto-save every 5 seconds to local storage
- ✅ Works 100% offline (no degradation)
- ✅ Weather auto-pulled and cached
- ✅ Crew pre-populated from previous day
- ✅ Voice-to-text for notes (80%+ accuracy)
- ✅ Photo quick-select from today's captures
- ✅ Validation warnings before submit
- ✅ Draft persists across app restarts

#### Plans Viewer

- ✅ Open 20MB sheet in ≤2s after first cache
- ✅ Add pin in ≤2 taps (long-press → context)
- ✅ 60 FPS zoom/pan performance
- ✅ Search finds sheets by number/name
- ✅ Markup tools: circle, arrow, text, photo
- ✅ Revision compare side-by-side
- ✅ Pin links to tasks/RFIs bidirectionally
- ✅ Offline markup sync without data loss

#### T&M Tickets

- ✅ Signature box never scrolls off-screen
- ✅ PDF generated locally in <3 seconds
- ✅ Unique hash ID for each ticket
- ✅ Totals calculate in real-time
- ✅ Cost codes pulled from project settings
- ✅ E-signature legally compliant (timestamp + GPS)
- ✅ Auto-email PDF to PM + client
- ✅ CO draft created if configured
- ✅ Fully functional offline

#### Deliveries

- ✅ QR/barcode scan → line item recognized in ≤1s
- ✅ Partial receive allowed with notes
- ✅ Photo attachment required for discrepancies
- ✅ PM notified on shortages within 60s
- ✅ Receiver signature captured
- ✅ PDF receipt generated
- ✅ Links to PO if available

#### Clock In/Out

- ✅ Geofence reminder fires within 60s of entry/exit
- ✅ Manual override available (with reason)
- ✅ Cost code selection required
- ✅ Break tracking (start/end)
- ✅ Weekly summary view
- ✅ Export to accounting system

#### Offline Functionality

- ✅ All core features work 100% offline
- ✅ Sync queue visible with item count
- ✅ Conflict resolution preview before merge
- ✅ Zero data loss offline→online
- ✅ Background sync when connectivity restored
- ✅ Offline indicator always visible

---

### Performance Requirements

- ✅ App launch: <2 seconds (warm start)
- ✅ Module navigation: <300ms
- ✅ Photo capture: <500ms tap-to-capture
- ✅ Photo upload: background, no UI blocking
- ✅ PDF generation: <3 seconds for typical document
- ✅ Search results: <500ms for typical query
- ✅ Sync cycle: <10 seconds for typical day's work
- ✅ Crash-free sessions: >95%
- ✅ Battery usage: <10%/hour active use

---

### Usability Requirements

- ✅ Max 15 taps for daily log completion
- ✅ Max 2 taps to attach photo to any form
- ✅ Forms remember last-used values
- ✅ Voice-to-text available on all text fields
- ✅ Big touch targets (min 44×44pt)
- ✅ High contrast for outdoor visibility
- ✅ Minimal typing required (<50 characters/log)
- ✅ Undo available for destructive actions
- ✅ Empty states provide clear next actions
- ✅ Error messages actionable, not technical

---

### Data & Security Requirements

- ✅ Role-based permissions enforced
- ✅ Audit trail for all actions (who/when/what)
- ✅ Signatures immutable after submission
- ✅ Photo EXIF data preserved (GPS/timestamp)
- ✅ PDF hash verification
- ✅ Encrypted local storage
- ✅ Encrypted sync transport (TLS 1.3)
- ✅ Data retention policy configurable
- ✅ Export all user data on request
- ✅ GDPR/CCPA compliance

---

## 5) Reporting & Exports (v1)

### Daily Logs

**Format**: PDF bundle + CSV

**Filters**:

- Date range
- Project
- Crew
- Cost code

**Contents**:

- Labor summary table
- Quantities installed by cost code
- Equipment hours
- Weather conditions
- Photos (embedded in PDF)
- Notes/blockers

**Delivery**:

- Email (scheduled or on-demand)
- Cloud storage sync
- Print-ready formatting

---

### T&M Tickets

**Format**: Individual PDFs + CSV roll-up

**PDF Contents**:

- Header (project, date, ticket #)
- Line items table (labor/materials/equipment)
- Cost code breakdown
- Subtotals + OH&P + total
- Client signature + timestamp
- Photos (before/after)
- QR code (verification link)

**CSV Roll-up**:

- All tickets by date range
- Cost code totals
- Signed vs unsigned
- CO conversion status

**Automation**:

- Auto-send on signature
- Weekly digest to PM
- Monthly summary to accounting

---

### Deliveries

**Format**: CSV + exception report

**Contents**:

- Packing slip #
- Vendor
- Date received
- Line items (ordered/received)
- Discrepancies (shortages/overages/damages)
- Receiver name
- Photos

**Alerts**:

- Real-time shortage notifications
- Weekly summary of partial receives
- Monthly vendor performance report

---

### Photos

**Format**: ZIP archive + CSV index

**Organization**:

- By day (folder per date)
- By sheet (folder per plan sheet)
- By type (daily log, T&M, delivery, etc.)

**Metadata CSV**:

- Filename
- Date/time
- GPS coordinates
- Project/location
- Tagged users
- Associated records (log, ticket, RFI)

**Delivery**:

- On-demand download
- Scheduled backup to cloud storage
- Client portal access (filtered by permissions)

---

### Analytics Dashboards

#### Field Productivity

- Daily log completion rate (trend)
- Units installed vs planned (by cost code)
- Labor hours by craft (actual vs budget)
- Equipment utilization

#### Schedule Health

- Look-ahead completion rate
- Constraint removal velocity
- Milestone progress (earned value)

#### Quality & Safety

- Punch item creation rate
- RFI cycle time (avg/median)
- RFI aging report (>7d, >14d, >30d)
- Safety talk completion rate
- Incident frequency

#### Commercial

- T&M signed on-site rate
- T&M → CO conversion %
- CO approval cycle time
- Budget variance by cost code

---

## 6) Next Steps

### Immediate Actions (Week 0)

1. **Stakeholder Review** (2 days)
   - Present roadmap to executive team
   - Validate KPIs and success metrics
   - Confirm budget and timeline
   - Get sign-off on MVP scope

2. **Confirm Cutline** (1 day)
   - Finalize feature list for MVP
   - Identify Phase 2 features
   - Define pilot criteria
   - Set exit criteria for pilot

3. **Approve Wireframes** (2 days)
   - Review with field users (3–5 foremen)
   - Validate workflows and tap counts
   - Confirm terminology and labels
   - Iterate based on feedback

4. **Technical Planning** (1 week)
   - Finalize tech stack decisions
   - Set up development environment
   - Create CI/CD pipeline
   - Establish coding standards

---

### Phase 1: Discovery (Weeks 1–2)

1. **Field Observations**
   - Schedule 3–5 ride-alongs
   - Shadow foremen through full day
   - Time-motion study (daily log, T&M, deliveries)
   - Record pain points and workarounds

2. **Artifact Collection**
   - Collect 10–20 completed daily logs
   - 5–10 T&M tickets
   - 5–10 delivery slips
   - 5–10 toolbox talk records
   - Photos of current processes

3. **Stakeholder Interviews**
   - Foremen (5–7)
   - Superintendents (2–3)
   - Project Managers (2–3)
   - Office staff (2–3)
   - Clients (1–2, if available)

4. **Deliverables**
   - Validated form templates
   - Workflow maps with measurements
   - Pain point prioritization
   - User personas (detailed)
   - Acceptance criteria per workflow

---

### Phase 2: UX/Prototyping (Weeks 2–4)

1. **Build Mid-Fi Prototype**
   - Interactive clickable prototype
   - All 6 core screens
   - Realistic data in forms
   - Offline mode simulation

2. **Usability Testing Round 1** (Week 3)
   - 5–7 field users
   - Task-based scenarios
   - Think-aloud protocol
   - Measure tap counts and time

3. **Iterate Based on Feedback** (Week 3)
   - Prioritize issues (high/med/low)
   - Redesign problem areas
   - Add missing features

4. **Usability Testing Round 2** (Week 4)
   - Same users or new cohort
   - Validate improvements
   - Confirm tap counts meet targets

5. **Deliverables**
   - Final interactive prototype
   - Microcopy library (all labels, messages, errors)
   - Empty-state designs
   - Offline UX patterns documented
   - Error handling flows

---

### Phase 3: Sprint Kickoff (Week 4)

1. **Sprint Planning**
   - Break down Sprint A into user stories
   - Estimate complexity (story points)
   - Assign to developers
   - Set sprint goals

2. **Design Handoff**
   - Design specs (spacing, colors, typography)
   - Interactive prototype access
   - Component library (if applicable)
   - Icon assets

3. **Development Environment**
   - Repo access for all team members
   - CI/CD pipeline tested
   - Local development setup guide
   - Staging environment ready

4. **Daily Standups**
   - What done yesterday
   - What doing today
   - Any blockers
   - Demo ready features

---

### Success Metrics (to track throughout)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Daily log submission rate | 60% | 95% | Daily count / total projects |
| Avg time per daily log | 8 min | 2 min | Time tracking in app |
| RFI cycle time | 12 days | 9 days | Created → closed date diff |
| T&M signed on-site | 40% | 80% | Signed / total T&M |
| Field user satisfaction | TBD | 4.5/5 | Weekly survey |
| Crash-free sessions | TBD | 95% | App monitoring |
| Offline functionality | 0% | 100% | Feature audit |

---

## Appendix: Integration Specifications

### Accounting Integration (QuickBooks Online / Xero)

**Data Flow**:

- **Export**: Time entries, cost codes, labor hours, T&M amounts
- **Import**: Cost code list, budget data, employee list

**Frequency**:

- Time entries: Daily batch (end of day)
- T&M amounts: On approval
- Cost codes: Weekly sync

**API Methods**:

- OAuth 2.0 authentication
- RESTful API calls
- Webhook notifications for budget changes

---

### Cloud Storage Integration (Google Drive / OneDrive / Dropbox)

**Data Flow**:

- **Import**: Plans (PDF), specifications, photos
- **Export**: Daily logs, T&M tickets, reports

**Folder Structure**:

```
/Projects/
  /North Tower/
    /Plans/
      /Architecture/
      /Structural/
      /MEP/
    /Daily Logs/
    /T&M Tickets/
    /Photos/
```

**Sync Logic**:

- Check for new plans every 4 hours
- Upload completed forms immediately
- Batch photo uploads (wifi only by default)

---

### Weather API

**Provider**: OpenWeatherMap or NOAA

**Data Points**:

- Current temperature
- Conditions (rain, snow, clear, etc.)
- Wind speed
- Humidity

**Refresh Rate**:

- Current: every 15 minutes (cached)
- Forecast: daily

**Fallback**:

- Manual entry if API unavailable
- Last cached value shown with staleness indicator

---

### E-Signature (DocuSign)

**Use Cases**:

- T&M tickets (client signature)
- Change orders
- Subcontractor agreements

**Integration**:

- Embedded signing (in-app)
- Email signing (fallback)
- Certificate chain attached to PDF

---

## Appendix: Data Model (Simplified)

### Core Entities

```
Project
├── id, name, address, status
├── geofence (lat/long/radius)
├── start_date, end_date
└── settings (cost_codes, crew_templates)

Drawing
├── id, project_id, sheet_number, title
├── revision, upload_date, superseded_by
├── file_url, file_size, page_count
└── pins[] (x, y, type, linked_item_id)

Task
├── id, project_id, title, description
├── status (open, in_progress, complete)
├── assignee, due_date, priority
├── drawing_id, pin_id (if from plan)
└── photos[]

RFI
├── id, project_id, title, description
├── status (open, answered, closed)
├── from_user, to_user, due_date
├── drawing_id, pin_id
└── thread[] (messages + attachments)

DailyLog
├── id, project_id, date, weather
├── labor_hours[] (crew, hours, cost_code)
├── quantities[] (item, qty, unit, cost_code)
├── equipment_hours[] (equipment, hours)
├── blockers, notes
├── photos[]
└── submitted_by, submitted_at

T&M_Ticket
├── id, project_id, title, date
├── labor[] (craft, hours, rate, cost_code)
├── materials[] (item, qty, price)
├── equipment[] (item, hours, rate)
├── subtotal, markup, total
├── client_name, client_signature
├── signature_timestamp, gps_location
├── pdf_url, pdf_hash
└── co_draft_id (if created)

Delivery
├── id, project_id, packing_slip_number
├── vendor, delivery_date
├── line_items[] (item, ordered, received, status)
├── notes, photos[]
├── receiver_name, receiver_signature
└── discrepancies[] (type, description)

TimeEntry
├── id, user_id, project_id, date
├── clock_in, clock_out, breaks[]
├── cost_code, location (GPS)
└── approved_by, approved_at

Photo
├── id, project_id, file_url, thumbnail_url
├── capture_date, upload_date
├── gps_location, compass_bearing
├── tags[], related_entity (type + id)
└── created_by
```

---

## Appendix: Technical Architecture

### Mobile App Stack

**Framework**: React Native 0.72+

**State Management**: Redux Toolkit + RTK Query

**Offline Storage**: WatermelonDB (SQLite wrapper)

**File Storage**: React Native MMKV (fast key-value)

**Networking**: Axios with retry logic

**Authentication**: JWT tokens (access + refresh)

**Push Notifications**: Firebase Cloud Messaging

**Crash Reporting**: Sentry

**Analytics**: Mixpanel or Amplitude

---

### Backend Stack

**API**: Node.js + Express (existing ASAgents backend)

**Database**: MySQL (existing)

**File Storage**: AWS S3 or CloudFlare R2

**Background Jobs**: Bull (Redis-based queue)

**Email**: SendGrid or AWS SES

**PDF Generation**: Puppeteer or PDFKit

**Sync Engine**: Custom conflict resolution (last-write-wins per field)

---

### Offline-First Architecture

**Principles**:

1. All CRUD operations work offline
2. Queue mutations for sync
3. Optimistic UI updates
4. Conflict resolution on sync
5. Retry failed sync with exponential backoff

**Sync Flow**:

```
1. User action → Local DB update (immediate)
2. Add to sync queue
3. When online: Upload to server
4. Server validates + processes
5. Server returns canonical data
6. Local DB updated with server version
7. UI refreshed if needed
```

**Conflict Resolution**:

- **Daily Logs**: Last-write-wins (rarely conflicting)
- **T&M Tickets**: Immutable after signature (no conflicts)
- **Tasks/RFIs**: Field-level merge (status, assignee, comments append)
- **Photos**: Append-only (no conflicts)

---

## Glossary

**CC**: Cost Code

**CO**: Change Order

**JHA**: Job Hazard Analysis

**MEP**: Mechanical, Electrical, Plumbing

**OH&P**: Overhead & Profit

**PCE**: Potential Change Event (precursor to CO)

**PM**: Project Manager

**PO**: Purchase Order

**RFI**: Request for Information

**SLA**: Service Level Agreement

**T&M**: Time & Materials

---

**Document Version**: 1.0  
**Last Updated**: October 2, 2025  
**Next Review**: After Phase 1 Discovery (Week 2)  
**Owner**: Product Team  
**Status**: Draft - Awaiting Stakeholder Approval
