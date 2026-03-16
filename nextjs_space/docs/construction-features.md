# CortexBuild Pro - Construction Features Documentation

**Version:** 1.0.0
**Last Updated:** 2026-03-16
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Feature 1: Payroll Management with CIS](#feature-1-payroll-management-with-cis)
4. [Feature 2: Dayworks Manager](#feature-2-dayworks-manager)
5. [Feature 3: Variations/Change Orders](#feature-3-variationschange-orders)
6. [Feature 4: RAMS Generator (AI-Powered)](#feature-4-rams-generator-ai-powered)
7. [Feature 5: Toolbox Talks](#feature-5-toolbox-talks)
8. [Feature 6: Risk Assessments](#feature-6-risk-assessments)
9. [Database Schema Reference](#database-schema-reference)
10. [Testing Instructions](#testing-instructions)

---

## Overview

CortexBuild Pro is a comprehensive multi-tenant construction management SaaS platform. This document covers six core construction-specific features:

| Feature | Purpose | Primary Users |
|---------|---------|---------------|
| Payroll Management | CIS deduction calculations, payment tracking | Admins, Company Owners |
| Dayworks Manager | Daily site reports, labor/material tracking | Project Managers |
| Variations | Change order management, scope tracking | Project Managers, Admins |
| RAMS Generator | AI-powered Risk Assessment Method Statements | Safety Officers, PMs |
| Toolbox Talks | Safety briefing scheduling and attendance | Safety Officers, PMs |
| Risk Assessments | Hazard identification, risk scoring | Safety Officers, PMs |

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v4
- **Real-time:** SSE (Server-Sent Events) + Socket.IO fallback
- **AI:** Local LLM (Ollama) with cloud fallback

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORTEXBUILD PRO ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────────┐
│   Client Layer  │     │   Server Layer  │     │      Data/Service Layer       │
│                 │     │                 │     │                             │
│ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌─────────────────────────┐ │
│ │Payroll Client│ │────▶│ │Payroll API  │ │────▶│ │ Prisma ORM              │ │
│ └─────────────┘ │     │ │/api/payroll │ │     │ │ - Payroll model         │ │
│                 │     │ └─────────────┘ │     │ │ - TeamMember model      │ │
│ ┌─────────────┐ │     │                 │     │ └─────────────────────────┘ │
│ │Dayworks UI  │ │────▶│ ┌─────────────┐ │     │                             │
│ └─────────────┘ │     │ │Dayworks API │ │────▶│ ┌─────────────────────────┐ │
│                 │     │ │/api/dayworks│ │     │ │ Prisma ORM              │ │
│ ┌─────────────┐ │     │ └─────────────┘ │     │ │ - DailyReport model     │ │
│ │Variations   │ │────▶│                 │     │ │ - DailyReportLabor      │ │
│ │Client       │ │     │ ┌─────────────┐ │     │ │ - DailyReportEquipment  │ │
│ └─────────────┘ │     │ │Variations   │ │────▶│ │ - DailyReportMaterial   │ │
│                 │     │ │API          │ │     │ └─────────────────────────┘ │
│ ┌─────────────┐ │     │ │/api/        │ │     │                             │
│ │RAMS         │ │────▶│ │variations   │ │     │ ┌─────────────────────────┐ │
│ │Generator    │ │     │ └─────────────┘ │     │ │ Prisma ORM              │ │
│ └─────────────┘ │     │                 │     │ │ - Variation model       │ │
│                 │     │ ┌─────────────┐ │     │ │ - Project model         │ │
│ ┌─────────────┐ │     │ │RAMS API     │ │────▶│ └─────────────────────────┘ │
│ │ToolboxTalks │ │────▶│ │/api/rams/   │ │     │                             │
│ │Client       │ │     │ │generate     │ │     │ ┌─────────────────────────┐ │
│ └─────────────┘ │     │ └─────────────┘ │     │ │ AI Service (Ollama)     │ │
│                 │     │                 │     │ │ - llama3.1 model        │ │
│ ┌─────────────┐ │     │ ┌─────────────┐ │     │ └─────────────────────────┘ │
│ │Risk         │ │────▶│ │ToolboxTalks │ │────▶│                             │
│ │Assessments  │ │     │ │API          │ │     │ ┌─────────────────────────┐ │
│ └─────────────┘ │     │ │/api/toolbox │ │     │ │ Prisma ORM              │ │
│                 │     │ │-talks       │ │     │ │ - ToolboxTalk model     │ │
│                 │     │ └─────────────┘ │     │ │ - ToolboxTalkAttendee   │ │
│                 │     │                 │     │ └─────────────────────────┘ │
│                 │     │ ┌─────────────┐ │     │                             │
│                 │     │ │Risk         │ │────▶│ ┌─────────────────────────┐ │
│                 │     │ │Assessments  │ │     │ │ Prisma ORM              │ │
│                 │     │ │API          │ │     │ │ - RiskAssessment model  │ │
│                 │     │ │/api/risk-   │ │     │ │ - RiskHazard model      │ │
│                 │     │ │assessments  │ │     │ └─────────────────────────┘ │
│                 │     │ └─────────────┘ │     │
└─────────────────┘     └─────────────────┘     └─────────────────────────────┘

                              ┌──────────────────┐
                              │  Real-time Layer │
                              │                  │
                              │ ┌──────────────┐ │
                              │ │SSE Broadcast │ │
                              │ │Socket.IO     │ │
                              │ └──────────────┘ │
                              └──────────────────┘
                                      ▲
                                      │
                              ┌──────────────┐
                              │ Auth Layer   │
                              │              │
                              │ NextAuth.js  │
                              │ RBAC Checks  │
                              └──────────────┘
```

---

## Feature 1: Payroll Management with CIS

### Purpose

Manage employee payroll calculations with UK Construction Industry Scheme (CIS) deductions. Supports multiple deduction types including National Insurance, pension contributions, and overtime tracking.

### Component Location

| Type | Path |
|------|------|
| Page | `/app/(dashboard)/payroll/page.tsx` |
| Client Component | `/app/(dashboard)/payroll/_components/payroll-client.tsx` |
| CIS Calculator | `/components/dashboard/CisCalculator.tsx` |

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/payroll` | GET | List payroll records (filtered by org) | Yes |
| `/api/payroll` | POST | Create new payroll entry | Yes |
| `/api/payroll/[id]` | GET | Get single payroll record | Yes |
| `/api/payroll/[id]` | PATCH | Update payroll (status changes) | Yes |
| `/api/payroll/[id]` | DELETE | Delete payroll record | Yes |
| `/api/payroll/calculate` | POST | Calculate CIS deductions | Yes |
| `/api/payroll/bulk` | POST | Bulk payroll operations | Yes |

### Request/Response Examples

#### GET /api/payroll
```bash
curl -X GET "http://localhost:3000/api/payroll?period=2024-01&status=DRAFT" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": "pay_abc123",
    "employeeId": "tm_xyz789",
    "period": "2024-01",
    "baseSalary": 5000.00,
    "overtime": 500.00,
    "cisDeduction": 1100.00,
    "niContribution": 200.00,
    "pension": 100.00,
    "netPay": 4100.00,
    "status": "DRAFT",
    "notes": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "employee": {
      "id": "tm_xyz789",
      "user": {
        "id": "user_123",
        "name": "John Smith",
        "role": "FIELD_WORKER"
      }
    }
  }
]
```

#### POST /api/payroll
```bash
curl -X POST "http://localhost:3000/api/payroll" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "tm_xyz789",
    "period": "2024-01",
    "baseSalary": 5000,
    "overtime": 500,
    "cisRate": 20,
    "niContribution": 200,
    "pension": 100,
    "status": "DRAFT"
  }'
```

### Database Models

```prisma
model Payroll {
  id             String        @id @default(cuid())
  employeeId     String        // TeamMember ID
  employee       TeamMember    @relation(fields: [employeeId], references: [id])
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])
  period         String        // YYYY-MM format
  baseSalary     Float
  overtime       Float         @default(0)
  cisDeduction   Float
  niContribution Float         @default(0)
  pension        Float         @default(0)
  netPay         Float
  status         PayrollStatus @default(DRAFT)
  notes          String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([organizationId])
  @@index([employeeId])
  @@index([period])
}

enum PayrollStatus {
  DRAFT
  PROCESSED
  PAID
  CANCELLED
}
```

### RBAC Permissions

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_ADMIN | ✓ | ✓ | ✓ | ✓ |
| PROJECT_MANAGER | ✗ | ✗ | ✗ | ✗ |
| FIELD_WORKER | ✗ | ✗ | ✗ | ✗ |

### Key Business Logic

1. **CIS Calculation:** `cisDeduction = (baseSalary + overtime) × (cisRate / 100)`
   - Standard rate: 20% (registered subcontractors)
   - Higher rate: 30% (unverified subcontractors)
   - Zero rate: 0% (gross payment status)

2. **Net Pay Formula:** `netPay = baseSalary + overtime - cisDeduction - niContribution - pension`

3. **Period Validation:** Must be unique per employee per period (YYYY-MM format)

4. **Organization Isolation:** All queries filtered by `organizationId`

### Test Coverage Summary

| Test Area | Coverage | Tests |
|-----------|----------|-------|
| Authentication | 100% | 2 tests |
| RBAC Permissions | 100% | 7 tests |
| CRUD Operations | 100% | 15 tests |
| CIS Calculations | 100% | 6 tests |
| Data Validation | 100% | 5 tests |
| Error Handling | 100% | 4 tests |
| **Total** | **100%** | **39 tests** |

**Test File:** `/tests/integration/payroll.api.test.ts`

---

## Feature 2: Dayworks Manager

### Purpose

Create and manage daily site reports (dayworks) documenting work performed, weather conditions, labor hours, equipment usage, and materials used. Essential for construction project tracking and compliance.

### Component Location

| Type | Path |
|------|------|
| Page | `/app/(dashboard)/dayworks/page.tsx` |
| Client Component | `/components/dashboard/DayworkManager.tsx` |

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/dayworks` | GET | List dayworks with pagination | Yes |
| `/api/dayworks` | POST | Create new daily report | Yes |
| `/api/dayworks/[id]` | GET | Get single daywork | Yes |
| `/api/dayworks/[id]` | PATCH | Update daywork | Yes |
| `/api/dayworks/[id]` | DELETE | Delete daywork | Yes |

### Request/Response Examples

#### GET /api/dayworks
```bash
curl -X GET "http://localhost:3000/api/dayworks?projectId=proj_123&page=1&pageSize=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "dayworks": [
    {
      "id": "dw_abc123",
      "date": "2024-01-15",
      "project_id": "proj_123",
      "project": { "id": "proj_123", "name": "Building A" },
      "weather": "sunny",
      "crew_size": "8",
      "work_description": "Foundation excavation and concrete pouring",
      "materials": [
        { "name": "Cement", "quantity": 50, "unit": "bags" }
      ],
      "equipment": [
        { "name": "Excavator", "hours": 4 }
      ],
      "labor": [
        {
          "trade": "Groundworker",
          "company": "ABC Ltd",
          "classification": "Senior",
          "regularHours": 8,
          "headcount": 3
        }
      ],
      "createdAt": "2024-01-15T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 45,
    "totalPages": 3
  }
}
```

#### POST /api/dayworks
```bash
curl -X POST "http://localhost:3000/api/dayworks" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "project_id": "proj_123",
    "weather": "cloudy",
    "crew_size": 5,
    "work_description": "Steel reinforcement installation",
    "materials": [{"name": "Rebar", "quantity": 100, "unit": "pieces"}],
    "equipment": [{"name": "Crane", "hours": 3}],
    "labor": [{"trade": "Steel Fixer", "headcount": 2, "regularHours": 8}]
  }'
```

### Database Models

```prisma
model DailyReport {
  id               String                 @id @default(cuid())
  reportDate       DateTime               @db.Date
  weather          WeatherCondition       @default(SUNNY)
  workPerformed    String?                @db.Text
  manpowerCount    Int                    @default(0)
  projectId        String
  project          Project                @relation(fields: [projectId], references: [id])
  createdById      String
  createdBy        User                   @relation(fields: [createdById], references: [id])
  materialEntries  DailyReportMaterial[]
  equipmentEntries DailyReportEquipment[]
  laborEntries     DailyReportLabor[]
  photos           DailyReportPhoto[]
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt

  @@unique([projectId, reportDate])
}

enum WeatherCondition {
  SUNNY
  CLOUDY
  RAINY
  STORMY
  SNOWY
  WINDY
}

model DailyReportMaterial {
  id            String      @id @default(cuid())
  dailyReportId String
  dailyReport   DailyReport @relation(fields: [dailyReportId], references: [id])
  materialName  String
  quantityUsed  Float       @default(0)
  unit          String      @default("each")
}

model DailyReportEquipment {
  id            String      @id @default(cuid())
  dailyReportId String
  dailyReport   DailyReport @relation(fields: [dailyReportId], references: [id])
  equipmentName String
  hoursUsed     Float       @default(0)
}

model DailyReportLabor {
  id            String      @id @default(cuid())
  dailyReportId String
  dailyReport   DailyReport @relation(fields: [dailyReportId], references: [id])
  trade         String?
  company       String?
  classification String?
  regularHours  Float       @default(0)
  overtimeHours Float       @default(0)
  headcount     Int         @default(1)
}
```

### RBAC Permissions

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_ADMIN | ✓ | ✓ | ✓ | ✓ |
| PROJECT_MANAGER | ✓ | ✓ | ✓ | ✓ |
| FIELD_WORKER | ✓ | ✗ | ✗ | ✗ |

### Key Business Logic

1. **Duplicate Prevention:** Unique constraint on `projectId + reportDate` prevents multiple reports per day per project

2. **Weather Mapping:** String input mapped to enum:
   - "sunny" → SUNNY
   - "cloudy"/"overcast" → CLOUDY
   - "rain"/"drizzle" → RAINY
   - "snow" → SNOWY
   - "windy" → WINDY

3. **Organization Scoping:** Projects filtered by user's organization

4. **Nested Entries:** Materials, equipment, and labor created as child records

### Test Coverage Summary

| Test Area | Coverage | Tests |
|-----------|----------|-------|
| Authentication | 100% | 2 tests |
| RBAC Permissions | 100% | 4 tests |
| CRUD Operations | 100% | 8 tests |
| Weather Mapping | 100% | 1 test |
| Data Validation | 100% | 4 tests |
| Error Handling | 100% | 4 tests |
| **Total** | **100%** | **23 tests** |

**Test File:** `/tests/integration/dayworks.api.test.ts`

---

## Feature 3: Variations/Change Orders

### Purpose

Track and manage project scope changes, cost variations, and change orders. Provides approval workflow and financial impact tracking.

### Component Location

| Type | Path |
|------|------|
| Page | `/app/(dashboard)/variations/page.tsx` |
| Client Component | `/app/(dashboard)/variations/_components/variations-manager-client.tsx` |

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/variations` | GET | List variations (optional projectId filter) | Yes |
| `/api/variations` | POST | Create new variation | Yes |
| `/api/variations/[id]` | GET | Get single variation | Yes |
| `/api/variations/[id]` | PATCH | Update variation | Yes |
| `/api/variations/[id]` | DELETE | Delete variation | Yes |
| `/api/variations/[id]/status` | POST | Update status (approve/reject) | Yes |

### Request/Response Examples

#### GET /api/variations
```bash
curl -X GET "http://localhost:3000/api/variations?projectId=proj_123" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": "var_abc123",
    "title": "Foundation Depth Increase",
    "description": "Additional excavation required due to unexpected soil conditions",
    "total": 25000.00,
    "status": "PENDING",
    "projectId": "proj_123",
    "project": {
      "id": "proj_123",
      "name": "Commercial Building A",
      "status": "ACTIVE"
    },
    "createdBy": {
      "id": "user_456",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "createdAt": "2024-01-10T09:00:00Z",
    "updatedAt": "2024-01-12T14:30:00Z"
  }
]
```

#### POST /api/variations
```bash
curl -X POST "http://localhost:3000/api/variations" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Additional Flooring",
    "description": "Upgrade to premium flooring in executive offices",
    "total": 15000,
    "projectId": "proj_123",
    "status": "PENDING"
  }'
```

### Database Models

```prisma
model Variation {
  id          String          @id @default(cuid())
  title       String
  description String?         @db.Text
  total       Float           @default(0)
  status      VariationStatus @default(PENDING)
  projectId   String
  project     Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User            @relation("VariationCreator", fields: [createdById], references: [id])
  approvedAt  DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum VariationStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### RBAC Permissions

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_ADMIN | ✓ | ✓ | ✓ | ✓ |
| PROJECT_MANAGER | ✓ | ✓ | ✓ | ✗ |
| FIELD_WORKER | ✗ | ✗ | ✗ | ✗ |

### Key Business Logic

1. **Project Validation:** Verifies project exists and belongs to user's organization

2. **Status Workflow:** PENDING → APPROVED or PENDING → REJECTED

3. **Financial Tracking:** Total can be positive (additional cost) or negative (credit)

4. **Audit Trail:** All changes logged via activity log

### Test Coverage Summary

| Test Area | Coverage | Tests |
|-----------|----------|-------|
| Authentication | 100% | 2 tests |
| RBAC Permissions | 100% | 5 tests |
| CRUD Operations | 100% | 12 tests |
| Data Validation | 100% | 5 tests |
| Error Handling | 100% | 5 tests |
| **Total** | **100%** | **29 tests** |

**Test File:** `/tests/integration/variations.api.test.ts`

---

## Feature 4: RAMS Generator (AI-Powered)

### Purpose

Generate Risk Assessment Method Statement (RAMS) documents using AI. Analyzes work activity descriptions to identify hazards, recommend controls, and produce comprehensive safety documentation.

### Component Location

| Type | Path |
|------|------|
| Page | `/app/(dashboard)/safety/rams/page.tsx` |
| Client Component | `/components/dashboard/RamsGenerator.tsx` |
| API Route | `/app/api/rams/generate/route.ts` |

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/rams/generate` | POST | Generate RAMS using AI | Yes |
| `/api/risk-assessments` | GET | List risk assessments | Yes |
| `/api/risk-assessments` | POST | Create risk assessment | Yes |
| `/api/risk-assessments/[id]` | GET | Get single assessment | Yes |
| `/api/risk-assessments/[id]` | PATCH | Update assessment | Yes |
| `/api/risk-assessments/[id]/acknowledge` | POST | Worker acknowledgment | Yes |

### Request/Response Examples

#### POST /api/rams/generate
```bash
curl -X POST "http://localhost:3000/api/rams/generate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "activity": "Installing metal roofing panels at height on commercial building",
    "location": "Building A - Roof Level",
    "duration": "2 days",
    "personnel": "2 roofers, 1 supervisor, 1 ground assistant",
    "projectId": "proj_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "rams": {
    "activity": "Installing metal roofing panels at height on commercial building",
    "hazards": [
      "Fall from height",
      "Falling objects",
      "Weather exposure",
      "Manual handling injuries"
    ],
    "riskLevel": "HIGH",
    "controls": [
      "Use full body harness with lanyard",
      "Install edge protection",
      "Tool tethers required",
      "Weather monitoring"
    ],
    "residualRisk": "LOW",
    "methodStatement": "1. Set up edge protection\n2. Inspect all PPE\n3. Lift panels using crane...\n",
    "ppe": ["Safety helmet", "Safety harness", "Safety boots", "Gloves", "High-visibility vest"],
    "emergencyProcedures": "In case of fall, activate rescue procedure. Call 999 for serious injuries.",
    "generatedAt": "2024-01-15T10:30:00Z"
  },
  "savedRecord": { "id": "rams_xyz789" }
}
```

### Database Models

```prisma
model RiskAssessment {
  id       String     @id @default(cuid())
  number   Int
  title    String
  revision String     @default("A")
  status   RAMSStatus @default(DRAFT)
  activityDescription String    @db.Text
  location            String?
  startDate           DateTime?
  endDate             DateTime?
  methodStatement     String?   @db.Text
  sequence            String[]  @default([])
  requiredPPE         String[]  @default([])
  emergencyProcedures String?
  nearestFirstAid     String?
  assemblyPoint       String?
  projectId           String
  project             Project   @relation(fields: [projectId], references: [id])
  createdById         String
  createdBy           User      @relation("RAMSCreator", fields: [createdById], references: [id])
  hazards             RiskHazard[]
  acknowledgements    RAMSAcknowledgement[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([projectId, number, revision])
}

enum RAMSStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  REJECTED
  SUPERSEDED
}

model RiskHazard {
  id                String           @id @default(cuid())
  riskAssessmentId  String
  riskAssessment    RiskAssessment   @relation(fields: [riskAssessmentId], references: [id])
  hazardDescription String           @db.Text
  personsAtRisk     String[]         @default([])
  initialSeverity   Int              @default(3)
  initialLikelihood Int              @default(3)
  initialRiskScore  Int
  controlMeasures   String[]         @default([])
  residualSeverity  Int              @default(1)
  residualLikelihood Int             @default(1)
  residualRiskScore Int
  sortOrder         Int              @default(0)
}
```

### RBAC Permissions

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_ADMIN | ✓ | ✓ | ✓ | ✓ |
| PROJECT_MANAGER | ✓ | ✓ | ✓ | ✗ |
| FIELD_WORKER | ✓ | ✗ | ✗ | ✗ |

### Key Business Logic

1. **AI Integration:** Uses local LLM (Ollama/llama3.1) with cloud fallback

2. **Risk Scoring:** `riskScore = severity × likelihood` (1-25 scale)
   - 1-4: LOW
   - 5-9: MEDIUM
   - 10-16: HIGH
   - 17-25: EXTREME

3. **Auto-increment Number:** RAMS number auto-increments per project

4. **Revision Control:** Same number can have revisions A, B, C...

5. **Response Parsing:** Extracts structured data from AI text output using regex patterns

### Test Coverage Summary

| Test Area | Coverage | Tests |
|-----------|----------|-------|
| Authentication | 100% | 2 tests |
| AI Generation | 100% | 8 tests |
| Response Parsing | 100% | 8 tests |
| RBAC Permissions | 100% | 5 tests |
| Data Validation | 100% | 9 tests |
| Error Handling | 100% | 6 tests |
| Risk Calculations | 100% | 4 tests |
| **Total** | **100%** | **42 tests** |

**Test File:** `/tests/integration/rams.api.test.ts`

---

## Feature 5: Toolbox Talks

### Purpose

Schedule, conduct, and track safety toolbox talks (briefings). Manage attendance, capture digital signatures, and maintain safety compliance records.

### Component Location

| Type | Path |
|------|------|
| Page | `/app/(dashboard)/toolbox-talks/page.tsx` |
| Client Component | `/app/(dashboard)/toolbox-talks/_components/toolbox-talks-client.tsx` |

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/toolbox-talks` | GET | List toolbox talks | Yes |
| `/api/toolbox-talks` | POST | Create new toolbox talk | Yes |
| `/api/toolbox-talks/[id]` | GET | Get single talk | Yes |
| `/api/toolbox-talks/[id]` | PATCH | Update talk | Yes |
| `/api/toolbox-talks/[id]` | DELETE | Delete talk | Yes |
| `/api/toolbox-talks/[id]/sign` | POST | Sign attendance | Yes |
| `/api/toolbox-talks/[id]/pdf` | GET | Generate PDF | Yes |

### Request/Response Examples

#### GET /api/toolbox-talks
```bash
curl -X GET "http://localhost:3000/api/toolbox-talks?projectId=proj_123&status=SCHEDULED" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "toolboxTalks": [
    {
      "id": "tt_abc123",
      "title": "Working at Height Safety",
      "topic": "Fall Prevention",
      "description": "Briefing on proper use of fall protection equipment",
      "date": "2024-01-20T08:00:00Z",
      "startTime": "2024-01-20T08:00:00Z",
      "endTime": "2024-01-20T08:30:00Z",
      "location": "Site Office",
      "status": "SCHEDULED",
      "keyPoints": ["Harness inspection", "Anchor points", "Rescue procedures"],
      "hazardsDiscussed": ["Fall from height", "Equipment failure"],
      "safetyMeasures": ["100% tie-off rule", "Daily equipment checks"],
      "project": { "id": "proj_123", "name": "Building A" },
      "presenter": { "id": "user_456", "name": "Safety Officer" },
      "attendees": {
        "count": 12,
        "data": [
          { "id": "att_1", "name": "John Smith", "signedAt": null }
        ]
      }
    }
  ]
}
```

#### POST /api/toolbox-talks
```bash
curl -X POST "http://localhost:3000/api/toolbox-talks" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Manual Handling Techniques",
    "topic": "Manual Handling",
    "description": "Proper lifting techniques to prevent injuries",
    "date": "2024-01-20",
    "startTime": "2024-01-20T08:00:00Z",
    "location": "Site Office",
    "projectId": "proj_123",
    "keyPoints": ["Assess load", "Plan lift", "Keep load close"],
    "hazardsDiscussed": ["Back injury", "Muscle strain"],
    "safetyMeasures": ["Team lifting", "Mechanical aids"]
  }'
```

### Database Models

```prisma
model ToolboxTalk {
  id          String            @id @default(cuid())
  title       String
  topic       String
  description String?           @db.Text
  date        DateTime
  startTime   DateTime?
  endTime     DateTime?
  location    String?
  status      ToolboxTalkStatus @default(SCHEDULED)
  keyPoints        String[]     @default([])
  hazardsDiscussed String[]     @default([])
  safetyMeasures   String[]     @default([])
  presenterId   String
  presenter     User            @relation("ToolboxTalkPresenter", fields: [presenterId], references: [id])
  projectId     String
  project       Project         @relation(fields: [projectId], references: [id])
  attendees     ToolboxTalkAttendee[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

enum ToolboxTalkStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ToolboxTalkAttendee {
  id            String      @id @default(cuid())
  toolboxTalkId String
  toolboxTalk   ToolboxTalk @relation(fields: [toolboxTalkId], references: [id])
  userId        String?
  user          User?       @relation("ToolboxTalkAttendance", fields: [userId], references: [id])
  name          String
  company       String?
  trade         String?
  signedAt      DateTime?
  signatureData String?     @db.Text
  signatureIp   String?
  acknowledged  Boolean     @default(false)
  createdAt     DateTime    @default(now())
}
```

### RBAC Permissions

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| COMPANY_ADMIN | ✓ | ✓ | ✓ | ✓ |
| PROJECT_MANAGER | ✓ | ✓ | ✓ | ✓ |
| FIELD_WORKER | ✓ | ✗ | ✗ | ✗ |

### Key Business Logic

1. **Status Workflow:** SCHEDULED → IN_PROGRESS → COMPLETED

2. **Attendance Tracking:** Workers sign digitally (base64 signature data)

3. **IP Capture:** Records IP address of signature for audit

4. **PDF Generation:** Server-side PDF export for compliance records

### Test Coverage Summary

| Test Area | Coverage | Tests |
|-----------|----------|-------|
| Authentication | 100% | 2 tests |
| RBAC Permissions | 100% | 4 tests |
| CRUD Operations | 100% | 8 tests |
| Attendance Tracking | 100% | 3 tests |
| Status Workflow | 100% | 3 tests |
| Error Handling | 100% | 3 tests |
| **Total** | **100%** | **23 tests** |

**Test File:** (Included in integration test suite)

---

## Feature 6: Risk Assessments

### Purpose

Create, manage, and track formal risk assessments. Includes hazard identification, risk scoring, control measures, and worker acknowledgment tracking.

### Component Location

| Type | Path |
|------|------|
| Page | `/app/(dashboard)/risk-assessments/page.tsx` |
| Client Component | `/app/(dashboard)/risk-assessments/_components/risk-assessments-client.tsx` |

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/risk-assessments` | GET | List risk assessments | Yes |
| `/api/risk-assessments` | POST | Create risk assessment | Yes |
| `/api/risk-assessments/[id]` | GET | Get single assessment | Yes |
| `/api/risk-assessments/[id]` | PATCH | Update assessment | Yes |
| `/api/risk-assessments/[id]` | DELETE | Delete assessment | Yes |
| `/api/risk-assessments/[id]/acknowledge` | POST | Worker acknowledgment | Yes |
| `/api/risk-assessments/[id]/approve` | POST | Approve assessment | Yes |

### Request/Response Examples

#### GET /api/risk-assessments
```bash
curl -X GET "http://localhost:3000/api/risk-assessments?projectId=proj_123&status=APPROVED" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": "ra_abc123",
    "number": 1,
    "title": "Excavation Works",
    "revision": "A",
    "status": "APPROVED",
    "activityDescription": "Deep excavation for foundation works",
    "location": "Grid Reference A1-A5",
    "startDate": "2024-01-15",
    "endDate": "2024-01-25",
    "hazards": [
      {
        "id": "haz_1",
        "hazardDescription": "Trench collapse",
        "personsAtRisk": ["Excavator operators", "Ground workers"],
        "initialSeverity": 5,
        "initialLikelihood": 3,
        "initialRiskScore": 15,
        "controlMeasures": ["Benching", "Shoring", "Barricades"],
        "residualSeverity": 2,
        "residualLikelihood": 2,
        "residualRiskScore": 4
      }
    ],
    "requiredPPE": ["Safety boots", "Hard hat", "High-vis vest", "Gloves"],
    "emergencyProcedures": "Call site emergency number. Evacuate area.",
    "nearestFirstAid": "Site office first aid room",
    "assemblyPoint": "Car park",
    "project": { "id": "proj_123", "name": "Building A" },
    "createdBy": { "id": "user_456", "name": "Safety Manager" },
    "acknowledgements": { "count": 15 },
    "createdAt": "2024-01-10T09:00:00Z"
  }
]
```

#### POST /api/risk-assessments
```bash
curl -X POST "http://localhost:3000/api/risk-assessments" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hot Works - Welding",
    "activityDescription": "Welding steel beams at height",
    "location": "Level 3, Grid B2",
    "startDate": "2024-01-20",
    "endDate": "2024-01-22",
    "methodStatement": "1. Set up fire watch\n2. Prepare welding equipment...\n",
    "sequence": ["Prepare area", "Set up equipment", "Begin welding", "Inspect welds"],
    "requiredPPE": ["Welding helmet", "Fire-resistant clothing", "Gloves", "Safety boots"],
    "emergencyProcedures": "Fire extinguisher on standby. Hot work permit required.",
    "nearestFirstAid": "First aid room - Building A",
    "assemblyPoint": "North car park",
    "projectId": "proj_123",
    "hazards": [
      {
        "hazardDescription": "Fire from sparks",
        "personsAtRisk": ["Welders", "Nearby workers"],
        "initialSeverity": 5,
        "initialLikelihood": 3,
        "controlMeasures": ["Fire blanket", "Fire watch", "Extinguisher"]
      }
    ]
  }'
```

### Database Models

```prisma
model RiskAssessment {
  id       String     @id @default(cuid())
  number   Int
  title    String
  revision String     @default("A")
  status   RAMSStatus @default(DRAFT)
  activityDescription String    @db.Text
  location            String?
  startDate           DateTime?
  endDate             DateTime?
  methodStatement     String?   @db.Text
  sequence            String[]  @default([])
  requiredPPE         String[]  @default([])
  emergencyProcedures String?
  nearestFirstAid     String?
  assemblyPoint       String?
  projectId           String
  project             Project   @relation(fields: [projectId], references: [id])
  createdById         String
  createdBy           User      @relation("RAMSCreator", fields: [createdById], references: [id])
  reviewedById        String?
  reviewedBy          User?     @relation("RAMSReviewer", fields: [reviewedById], references: [id])
  approvedById        String?
  approvedBy          User?     @relation("RAMSApprover", fields: [approvedById], references: [id])
  approvedAt          DateTime?
  hazards             RiskHazard[]
  acknowledgements    RAMSAcknowledgement[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([projectId, number, revision])
}

model RAMSAcknowledgement {
  id               String         @id @default(cuid())
  riskAssessmentId String
  riskAssessment   RiskAssessment @relation(fields: [riskAssessmentId], references: [id])
  workerId         String?
  worker           User?          @relation("RAMSAcknowledger", fields: [workerId], references: [id])
  workerName       String
  company          String?
  acknowledgedAt   DateTime       @default(now())
  signatureData    String?        @db.Text
  signatureIp      String?

  @@unique([riskAssessmentId, workerId])
  @@index([riskAssessmentId])
}
```

### RBAC Permissions

| Role | Read | Create | Update | Delete | Approve |
|------|------|--------|--------|--------|---------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| COMPANY_OWNER | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| COMPANY_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| PROJECT_MANAGER | ✓ | ✓ | ✓ | ✗ | ✓ |
| FIELD_WORKER | ✓ | ✗ | ✗ | ✗ | ✗ |

### Key Business Logic

1. **Risk Score Calculation:** `riskScore = severity × likelihood`
   - Scale: 1-5 for each
   - Range: 1-25

2. **Approval Workflow:** DRAFT → PENDING_REVIEW → APPROVED

3. **Acknowledgment Tracking:** Workers must acknowledge reading RAMS

4. **Revision Control:** Same number can have revisions (A, B, C...)

5. **Unique Constraint:** `projectId + number + revision` must be unique

### Test Coverage Summary

| Test Area | Coverage | Tests |
|-----------|----------|-------|
| Authentication | 100% | 2 tests |
| RBAC Permissions | 100% | 6 tests |
| CRUD Operations | 100% | 10 tests |
| Hazard Operations | 100% | 5 tests |
| Acknowledgment Tracking | 100% | 3 tests |
| Data Validation | 100% | 7 tests |
| Error Handling | 100% | 6 tests |
| **Total** | **100%** | **39 tests** |

**Test File:** `/tests/integration/rams.api.test.ts` (shared with RAMS Generator)

---

## Database Schema Reference

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│  Organization   │         │     Project     │
├─────────────────┤         ├─────────────────┤
│ id              │◀───────▶│ id              │
│ name            │         │ organizationId  │
│ slug            │         │ name            │
└─────────────────┘         │ status          │
                            │ budget          │
                            └─────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Payroll      │         │   DailyReport   │         │   Variation     │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id              │         │ id              │         │ id              │
│ employeeId      │         │ projectId       │         │ projectId       │
│ period          │         │ reportDate      │         │ title           │
│ baseSalary      │         │ weather         │         │ total           │
│ cisDeduction    │         │ workPerformed   │         │ status          │
│ netPay          │         │ manpowerCount   │         └─────────────────┘
│ status          │         └─────────────────┘
└─────────────────┘                  │
        │                            │
        │                    ┌───────┴───────┐
        │                    │               │
        │                    ▼               ▼
        │           ┌───────────────┐ ┌───────────────┐
        │           │ ReportMaterial│ │ ReportLabor   │
        │           └───────────────┘ └───────────────┘
        │
        │         ┌─────────────────┐         ┌─────────────────┐
        │         │ RiskAssessment  │         │  ToolboxTalk    │
        │         ├─────────────────┤         ├─────────────────┤
        └────────▶│ id              │         │ id              │
                  │ projectId       │         │ projectId       │
                  │ number          │         │ title           │
                  │ title           │         │ topic           │
                  │ status          │         │ date            │
                  │ hazards         │         │ presenterId     │
                  │ acknowledgements│         │ attendees       │
                  └─────────────────┘         └─────────────────┘
```

### Key Tables Summary

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| Payroll | Employee payment records | TeamMember, Organization |
| DailyReport | Daily site reports | Project, User |
| DailyReportMaterial | Materials used | DailyReport |
| DailyReportEquipment | Equipment used | DailyReport |
| DailyReportLabor | Labor hours | DailyReport |
| Variation | Change orders | Project, User |
| RiskAssessment | Safety assessments | Project, User |
| RiskHazard | Hazard details | RiskAssessment |
| RAMSAcknowledgement | Worker sign-offs | RiskAssessment, User |
| ToolboxTalk | Safety briefings | Project, User |
| ToolboxTalkAttendee | Attendance records | ToolboxTalk, User |

---

## Testing Instructions

### Prerequisites

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up test database
# Create .env.test with test database URL
DATABASE_URL="postgresql://user:password@localhost:5432/cortexbuild_test"
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific feature tests
npm test -- payroll.api.test.ts
npm test -- dayworks.api.test.ts
npm test -- variations.api.test.ts
npm test -- rams.api.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Manual Testing Checklist

#### Payroll Management
- [ ] Create payroll entry with all fields
- [ ] Verify CIS calculation (20%, 30%, 0% rates)
- [ ] Test period filtering
- [ ] Test status workflow (DRAFT → PROCESSED → PAID)
- [ ] Verify RBAC (FIELD_WORKER denied)
- [ ] Test duplicate period prevention

#### Dayworks Manager
- [ ] Create daily report with nested entries
- [ ] Verify weather mapping
- [ ] Test duplicate date prevention
- [ ] Test pagination
- [ ] Test project filtering
- [ ] Verify material/equipment/labor entries

#### Variations
- [ ] Create variation with project
- [ ] Test status changes (PENDING → APPROVED/REJECTED)
- [ ] Verify project ownership check
- [ ] Test negative totals (credits)
- [ ] Test filtering by project

#### RAMS Generator
- [ ] Generate RAMS with AI
- [ ] Verify hazard extraction
- [ ] Verify risk level normalization
- [ ] Test method statement parsing
- [ ] Test PPE extraction
- [ ] Verify database save option

#### Toolbox Talks
- [ ] Schedule new talk
- [ ] Track attendance
- [ ] Test digital signature capture
- [ ] Verify status workflow
- [ ] Test PDF generation
- [ ] Test acknowledgment tracking

#### Risk Assessments
- [ ] Create assessment with hazards
- [ ] Verify risk score calculation
- [ ] Test approval workflow
- [ ] Test worker acknowledgment
- [ ] Verify revision control
- [ ] Test unique constraint

### Integration Testing

```bash
# Start test server
npm run dev

# Test API endpoints with curl
# See examples in each feature section above

# Test real-time updates
# Open two browser windows, make changes in one,
# verify updates appear in other via SSE
```

---

## Appendix: Quick Reference

### Environment Variables

```bash
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Optional (AI)
NEXT_PUBLIC_OLLAMA_URL="http://localhost:11434"
ABACUSAI_API_KEY="..."  # Fallback
```

### Role Constants

```typescript
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_OWNER: 'COMPANY_OWNER',
  ADMIN: 'ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  FIELD_WORKER: 'FIELD_WORKER'
};
```

### Status Enums

```typescript
// PayrollStatus
DRAFT | PROCESSED | PAID | CANCELLED

// VariationStatus
PENDING | APPROVED | REJECTED

// RAMSStatus
DRAFT | PENDING_REVIEW | APPROVED | REJECTED | SUPERSEDED

// ToolboxTalkStatus
SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED

// WeatherCondition
SUNNY | CLOUDY | RAINY | STORMY | SNOWY | WINDY
```

---

**Document End**

For questions or issues, refer to the project's main README.md or contact the development team.
