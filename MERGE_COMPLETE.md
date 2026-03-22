# CortexBuild Merge Complete - CortexBuild Pro + CortexBuild Unified

## Date: 2026-03-22

## Overview

This document summarizes the merge between **CortexBuild Pro** (deployed at cortexbuildpro.com) and **CortexBuild Unified**.

The merge was performed using **CortexBuild Pro's `nextjs_space`** as the base, with features ported from **CortexBuild Unified**.

---

## Changes Applied

### 1. Prisma Schema Updates

**File:** `nextjs_space/prisma/schema.prisma`

**Added Enum Values:**
```prisma
// UserRole - Added VIEWER
enum UserRole {
  SUPER_ADMIN
  COMPANY_OWNER
  ADMIN
  PROJECT_MANAGER
  FIELD_WORKER
  VIEWER  // NEW
}

// TaskStatus - Added BLOCKED
enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  COMPLETE
  BLOCKED  // NEW
}

// DocumentType - Added RAMS
enum DocumentType {
  PLANS
  DRAWINGS
  PERMITS
  PHOTOS
  REPORTS
  SPECIFICATIONS
  CONTRACTS
  RAMS  // NEW
  OTHER
}
```

**Note:** The `nextjs_space` schema was already more complete than the unified schema. No additional models were needed - all unified models already existed with enhanced fields.

---

### 2. API Routes Added

**Source:** `cortexbuild-unified/app/api/`
**Destination:** `nextjs_space/app/api/`

| Route | Description |
|-------|-------------|
| `analytics/route.ts` | Project and safety analytics |
| `organizations/[id]/route.ts` | Organization management |
| `subscriptions/route.ts` | Stripe subscription management |
| `users/me/route.ts` | Current user endpoint |

**Existing Routes (Already Present):**
- `/api/safety/` - Safety incidents, toolbox talks, MEWP checks
- `/api/ai/` - AI chat and analysis
- `/api/daily-reports/` - Daily reports
- `/api/change-orders/` - Change orders
- `/api/submittals/` - Submittals
- `/api/tasks/` - Task management
- `/api/projects/` - Project management
- `/api/rfis/` - RFI management

---

### 3. Library Files Added

**Source:** `cortexbuild-unified/lib/`
**Destination:** `nextjs_space/lib/`

| Directory | Contents |
|-----------|----------|
| `queue/` | BullMQ job queues (`index.ts`, `jobs.ts`) |
| `realtime/` | WebSocket and SSE handlers (`sse.ts`, `websocket.ts`) |

---

### 4. Dependencies Added

**File:** `nextjs_space/package.json`

```json
{
  "bullmq": "^5.71.0",  // Job queue processing
  "ioredis": "^5.10.0",  // Redis client
  "ws": "^8.18.0",       // WebSocket support
  "@types/ws": "^8.18.0" // TypeScript types (dev)
}
```

---

## Pre-existing Features (No Changes Needed)

### Core Modules (Already Present)
- Project Management
- Task Management
- RFI (Request for Information)
- Submittals
- Change Orders
- Daily Reports
- Safety Incidents
- Equipment Tracking
- Inspections
- Materials Management
- Meetings
- Documents
- Subcontractors
- Budget/Cost Codes
- Team Management
- Organization Settings
- Stripe Billing
- NextAuth Authentication
- Multi-tenancy with Organizations

### Safety/Compliance Features (Enhanced)
- Toolbox Talks
- Tool Checks (PAT Testing)
- MEWP Daily Checks
- Risk Assessments (RAMS)
- Hot Work Permits
- Confined Space Permits
- Lifting Operations

### AI Features (Present)
- Ollama Integration
- Gemini Integration
- Multiple AI Providers
- Real-time AI Chat

---

## Deployment

### To Deploy These Changes:

1. **Commit the changes:**
```bash
cd /tmp/merge-work/cortexbuild-pro
git add .
git commit -m "Merge: Combine cortexbuild-pro with cortexbuild-unified features"
git push
```

2. **Or deploy manually:**
```bash
# SSH to VPS
ssh user@cortexbuildpro.com

# Pull latest changes
cd /var/www/cortexbuildpro
git pull

# Rebuild Docker image
docker compose -f docker-compose.vps.yml build app

# Restart
docker compose -f docker-compose.vps.yml up -d app
```

3. **Run database migrations (if needed):**
```bash
cd /tmp/merge-work/cortexbuild-pro/nextjs_space
npx prisma migrate deploy
```

---

## Next Steps

1. **Test the build:**
```bash
cd /tmp/merge-work/cortexbuild-pro/nextjs_space
npm run build
```

2. **Test login flow:**
   - Navigate to /login
   - Test signup flow
   - Test dashboard access

3. **Verify new features:**
   - Check analytics endpoint
   - Test subscriptions
   - Verify queue system

4. **Monitor for errors:**
   - Check server logs
   - Monitor error boundaries
   - Review console for warnings

---

## Notes

- **Auth System:** Uses NextAuth with Prisma adapter (unchanged)
- **Database:** PostgreSQL via Supabase-hosted instance (unchanged)
- **Deployment:** Docker container on VPS (unchanged)
- **SSL:** Let's Encrypt via Certbot (unchanged)

---

## Previous Fixes Applied

### 1. React Hooks Error ✅
Fixed in main `App.tsx` - moved `useMemo` and `useCallback` before early return blocks.

### 2. Login/Registration Auth ✅
Fixed `direct-login` route to set both `auth-token` and `next-auth.session-token` cookies.

### 3. Known Issues ✅
Updated `KNOWN_ISSUES.md` with fixes applied.

---

**Version:** 2.3.1 (merged)
**Last Updated:** 2026-03-22
