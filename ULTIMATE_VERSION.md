# CortexBuild Pro - ULTIMATE VERSION

## Version 3.0.0 - The Most Advanced Construction Management Platform

**Date:** March 22, 2026  
**Status:** ULTIMATE (Merged from all construction projects)

---

## Overview

CortexBuild Pro ULTIMATE is the culmination of all construction management projects, combining:
- **CortexBuild Pro** - Core platform (base)
- **CortexBuild Unified** - AI agents & domain services
- **CortexBuild Pro Deploy** - Advanced AI services & views

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| **Database** | PostgreSQL with Prisma 6 ORM |
| **Auth** | NextAuth.js v4, JWT, GitHub OAuth |
| **AI Providers** | Ollama, OpenAI, Google Gemini, Anthropic Claude |
| **Real-time** | WebSocket, SSE, Socket.io |
| **Queue** | BullMQ + Redis |
| **Payments** | Stripe |
| **Storage** | AWS S3 |
| **Charts** | Recharts, Chart.js, Plotly |
| **Maps** | Mapbox GL |
| **State** | Zustand, React Query, Jotai |
| **PDF** | PDFKit, jsPDF |

---

## Features

### Core Modules (40+)

| Module | Description |
|--------|-------------|
| **Projects** | Full project lifecycle management |
| **Tasks** | Kanban boards, assignees, priorities |
| **RFIs** | Request for Information workflow |
| **Submittals** | Document submission tracking |
| **Change Orders** | Budget/schedule impact tracking |
| **Daily Reports** | Site daily reports with weather |
| **Documents** | Document repository & templates |
| **Equipment** | Equipment tracking & status |
| **Inspections** | Inspection scheduling & results |
| **Materials** | Material management & waste tracking |
| **Meetings** | Meeting minutes |
| **Budget** | Budget tracking & cost codes |
| **Subcontractors** | Subcontractor management |
| **Payroll** | Payroll management |
| **Milestones** | Project milestones |
| **Timesheets** | Time entry tracking |

### UK Compliance & Safety

| Feature | Description |
|---------|-------------|
| **Toolbox Talks** | Safety meeting records with attendance |
| **Tool Checks** | PAT testing records |
| **MEWP Checks** | Mobile Elevated Work Platform daily checks |
| **Risk Assessments** | RAMS (Risk Assessment & Method Statements) |
| **Hot Work Permits** | Hot work permit management |
| **Confined Space Permits** | Confined space entry permits |
| **Lifting Operations** | Crane/lifting operation tracking |
| **Safety Incidents** | Incident reporting with severity |

### AI-Powered Features

#### AI Agents (4 Specialized)
| Agent | Capability |
|-------|------------|
| **Safety Agent** | Incident analysis, pattern detection, risk prediction |
| **RFI Analyzer** | Question analysis, batch processing, trends |
| **Change Order Agent** | Impact analysis, negotiation strategy |
| **Daily Report Agent** | Report summarization, productivity trends |

#### AI Services
| Service | Description |
|---------|-------------|
| **Ollama Client** | Local LLM with streaming, vision support |
| **Gemini Service** | Advanced Gemini 2 with TTS, image generation |
| **Multi-Provider AI** | Provider-agnostic interface (Ollama, OpenAI, Gemini, Claude) |

### Enterprise Features

| Feature | Description |
|---------|-------------|
| **Multi-tenancy** | Organization-based isolation |
| **RBAC** | 6 roles with granular permissions |
| **Stripe Billing** | Subscriptions, invoices, usage tracking |
| **Webhooks** | Event-driven integrations |
| **Audit Logs** | Full activity tracking |
| **Notifications** | In-app & email alerts |
| **Automation Rules** | Trigger-based automations |
| **Predictive Signals** | AI-powered risk detection |
| **Custom Reports** | Report builder |
| **Document Templates** | Template management |
| **Invitations** | Team invitation system |
| **Entitlements** | Module & feature access control |

---

## Project Structure

```
cortexbuild-pro/
├── nextjs_space/                    # Main Next.js application
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/               # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/           # Dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── rfis/
│   │   │   └── ... (20+ pages)
│   │   ├── (admin)/              # Admin pages
│   │   │   └── admin/
│   │   ├── (company)/            # Company pages
│   │   ├── api/                   # API routes (60+ endpoints)
│   │   │   ├── ai/
│   │   │   ├── analytics/
│   │   │   ├── projects/
│   │   │   ├── safety/
│   │   │   └── ... (50+ routes)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── views/                # Merged views
│   │   │   ├── ImagineView.tsx
│   │   │   ├── SafetyView.tsx
│   │   │   ├── IntelligenceHubView.tsx
│   │   │   └── ... (11 views)
│   │   ├── ui/                   # shadcn/ui components
│   │   └── dashboard/            # Dashboard components
│   ├── lib/
│   │   ├── agents/              # AI Agents
│   │   │   ├── safety-agent.ts
│   │   │   ├── rfi-analyzer.ts
│   │   │   ├── change-order-agent.ts
│   │   │   ├── daily-report-agent.ts
│   │   │   └── index.ts
│   │   ├── ai/                  # AI Library
│   │   │   ├── index.ts
│   │   │   ├── ollama.ts
│   │   │   └── prompts.ts
│   │   ├── services/            # Domain Services
│   │   │   ├── project-service.ts
│   │   │   ├── task-service.ts
│   │   │   ├── rfi-service.ts
│   │   │   ├── safety-service.ts
│   │   │   ├── notification-service.ts
│   │   │   ├── subscription-service.ts
│   │   │   ├── daily-report-service.ts
│   │   │   ├── aiService.ts
│   │   │   ├── geminiService.ts
│   │   │   ├── ollamaClient.ts
│   │   │   ├── githubAuth.ts
│   │   │   └── worker.ts
│   │   ├── queue/               # BullMQ Jobs
│   │   ├── realtime/            # WebSocket/SSE
│   │   ├── auth-options.ts      # NextAuth config
│   │   ├── db.ts                # Prisma client
│   │   ├── stripe.ts            # Stripe integration
│   │   └── ... (20+ utilities)
│   └── prisma/
│       └── schema.prisma        # Database schema (80+ models)
├── deployment/                    # VPS deployment
│   ├── docker-compose.vps.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ... (deployment scripts)
├── .github/workflows/            # CI/CD
│   └── deploy-vps.yml
├── App.tsx                       # Main React app (legacy)
├── MERGE_COMPLETE.md            # Merge documentation
└── README.md
```

---

## Database Models (80+)

### Core
- Organization, User, TeamMember, Invitation

### Project Management
- Project, Task, Milestone

### Documents & Communication
- Document, DocumentTemplate, RFI, Submittal, ChangeOrder

### Daily Operations
- DailyReport, SiteDiary, MeetingMinutes

### Safety & Compliance
- SafetyIncident, ToolboxTalk, ToolCheck, MEWPCheck
- RiskAssessment, HotWorkPermit, ConfinedSpacePermit, LiftingOperation

### Financial
- CostCode, CostItem, Invoice, Payroll, TimeEntry

### Equipment & Materials
- Equipment, Material, Subcontractor

### Enterprise
- Webhook, Notification, AuditLog, AutomationRule, PredictiveSignal
- Subscription, WorkerCertification, Drawing, Inspection, Defect

---

## API Endpoints (60+)

### Core APIs
- `GET/POST /api/projects`
- `GET/POST /api/tasks`
- `GET/POST /api/rfis`
- `GET/POST /api/submittals`
- `GET/POST /api/change-orders`
- `GET/POST /api/daily-reports`

### Safety APIs
- `GET/POST /api/safety/incidents`
- `GET/POST /api/safety/toolbox-talks`
- `GET/POST /api/safety/mewp-checks`
- `GET/POST /api/safety/risk-assessments`

### AI APIs
- `POST /api/ai/chat`
- `POST /api/ai/analyze/rfi`
- `POST /api/ai/analyze/safety`
- `POST /api/ai/generate/image`

### Supporting APIs
- Analytics, Budget, Documents, Equipment, Export, Health
- Inspections, Invitations, Materials, Meetings, Organizations
- Subscriptions, Team, Timesheets, Users, Webhooks

---

## Deployment

### VPS (Docker)
```bash
cd deployment
docker compose -f docker-compose.vps.yml up -d
```

### GitHub Actions
Push to `main` branch triggers auto-deploy to VPS.

### Environment Variables
See `.env.example` for required variables:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Auth secret
- `NEXTAUTH_URL` - App URL
- `STRIPE_*` - Stripe keys
- `AWS_*` - S3 storage
- `OLLAMA_URL` - Local LLM endpoint
- `GEMINI_API_KEY` - Google AI key

---

## Getting Started

### Local Development
```bash
cd nextjs_space
npm install
npm run dev
```

### Database Setup
```bash
cd nextjs_space
npx prisma migrate dev
npm run prisma:seed
```

### Build for Production
```bash
cd nextjs_space
npm run build
```

---

## Documentation

- [README.md](./README.md) - Main documentation
- [MERGE_COMPLETE.md](./MERGE_COMPLETE.md) - Merge summary
- [CLAUDE.md](./CLAUDE.md) - AI coding assistant context

---

## License

Proprietary - All rights reserved

---

**CortexBuild Pro ULTIMATE** - The most advanced AI-powered construction management platform for UK contractors.
