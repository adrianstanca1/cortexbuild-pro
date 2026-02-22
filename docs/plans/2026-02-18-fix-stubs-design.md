# Fix Stubs & Incomplete Implementations — Design Doc

**Date:** 2026-02-18
**Scope:** Wire up existing stubs found via codebase audit; no new features.

---

## Problem Summary

An audit of `/nextjs_space` found 13 stub implementations where code exists in the schema or lib layer but is not connected:

- **Notification system**: All DB writes commented out with stale TODOs despite `Notification` model existing. SSE dispatch never called. API reads activity logs instead of Notification table.
- **AI routing**: 5 of 6 AI routes bypass `lib/ai-service.ts` unified provider, hardcoding Abacus AI directly — Gemini fallback silently never activates.
- **Async execution stubs**: Backup, restore, custom report generation, and scheduled task execution all create DB records with status PENDING then do nothing.

---

## Group 1 — Notification Persistence + SSE Dispatch

### Files
- `lib/realtime-notifications.ts`
- `app/api/notifications/route.ts` (new: PATCH endpoints)
- `components/dashboard/notifications-dropdown.tsx`

### Changes
1. **`realtime-notifications.ts`**: Uncomment all `prisma.notification.create()` and `prisma.$transaction()` blocks. After each DB write, call `broadcastEvent()` from `lib/realtime-clients.ts` to push the notification via SSE. Remove stale TODO comments.
2. **`/api/notifications/route.ts`**: Rewrite GET to query `prisma.notification.findMany()` filtered by `userId` with unread count. Add:
   - `PATCH /api/notifications/[id]/read` — mark single notification read
   - `PATCH /api/notifications/read-all` — bulk mark all as read for user
3. **Notification dropdown**: Wire `markAllAsRead()` to call `PATCH /api/notifications/read-all`.

### Constraints
- Notification model fields: `id, userId, projectId, title, message, type, data, read, readAt, createdAt`
- Realtime dispatch uses `broadcastEvent(organizationId, eventType, payload)` from `lib/realtime-clients.ts`
- Must fetch `organizationId` via `prisma.user.findUnique()` before broadcasting

---

## Group 2 — AI Routing Unified

### Files (5 routes to update)
- `app/api/ai/route.ts`
- `app/api/ai/analyze-document/route.ts`
- `app/api/ai/risk-prediction/route.ts`
- `app/api/ai/document-intelligence/route.ts`
- `app/api/ai/cost-analysis/route.ts`
- `app/api/ai/photo-analysis/route.ts`

### Changes
Replace direct `fetch('https://apps.abacus.ai/v1/chat/completions', {...})` with `generateAIResponse()` from `lib/ai-service.ts`. For streaming routes, pass `stream: true`. The unified service handles provider selection, fallback, and error formatting.

### Constraints
- `generateAIResponse` returns `{ success, provider, response?, stream?, error? }`
- Streaming routes need to extract `result.stream` and return a streaming `Response`
- Photo analysis routes use image content arrays — `ai-service.ts` already supports content arrays in `AIMessage`

---

## Group 3 — Inline Async Execution

### Backup (`app/api/backup-restore/records/route.ts`)
On POST:
1. Create `BackupRecord` with status PENDING
2. Query all org data from key tables via Prisma (projects, tasks, team members, etc.)
3. Serialize to JSON, write to `/backups/backup-{timestamp}.json`
4. Update record: status=COMPLETED, filename, size
5. Return completed record

### Restore (`app/api/backup-restore/[id]/restore/route.ts`)
On POST:
1. Update status to IN_PROGRESS
2. Read backup file, parse JSON
3. Upsert records back into DB using Prisma transactions
4. Update status to COMPLETED (or FAILED with error)

### Custom Report Generation (`app/api/custom-reports/[id]/generate/route.ts`)
On POST:
1. Create `ReportExecution` with status PENDING
2. Fetch report config from `CustomReport` record (report type, filters, date range)
3. Query relevant DB tables based on report type
4. Build structured result JSON
5. Update execution: status=COMPLETED, result=JSON

### Scheduled Task Execution (`app/api/scheduled-tasks/[id]/execute/route.ts`)
On POST:
1. Create `ScheduledTaskExecution` with status PENDING
2. Read task config (taskType, parameters from task record)
3. Execute corresponding logic based on taskType
4. Update execution: status=COMPLETED, result

---

## Success Criteria
- Notifications are persisted to DB and pushed via SSE on creation
- Mark-as-read persists to DB; unread count reflects real data
- All AI routes use `lib/ai-service.ts`; Gemini fallback activates when `AI_PROVIDER=gemini`
- Backup creates a real JSON file and record shows COMPLETED status
- Restore reads file and upserts data, record shows COMPLETED status
- Report generation returns real data and execution shows COMPLETED status
- Task execution runs task logic and execution shows COMPLETED status
