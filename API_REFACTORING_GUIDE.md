# API Route Refactoring Pattern

This document describes the standardized pattern for API routes that eliminates code duplication.

## Overview

Previously, every API route had ~30-50 lines of boilerplate code for:
- Authentication checking
- Session management
- Error handling
- Activity logging
- Real-time broadcasting

Now, routes use centralized utilities to reduce duplication by 60%.

## Pattern: Before vs After

### Before (Old Pattern)
```typescript
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const items = await prisma.item.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      // ... includes
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get items error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
```

### After (New Pattern)
```typescript
export const GET = withAuth(async (request: NextRequest, context) => {
  const items = await prisma.item.findMany({
    where: { project: { organizationId: context.organizationId } },
    // ... includes
  });

  return successResponse({ items });
});
```

## Available Utilities

### From `@/lib/api-utils`

#### `withAuth(handler)`
Middleware that:
- Authenticates the request
- Extracts user context
- Handles errors automatically
- Returns 401 if unauthorized

```typescript
export const GET = withAuth(async (request: NextRequest, context) => {
  // context contains: userId, organizationId, userRole, userName, userEmail
  // Your code here
});
```

#### `successResponse(data, message?, pagination?)`
Standard success response format:
```typescript
return successResponse({ items }, "Items fetched successfully");
// Returns: { success: true, data: { items }, message: "..." }
```

#### `errorResponse(error, details?)`
Standard error response:
```typescript
return errorResponse("BAD_REQUEST", "Missing required field");
// Returns: { success: false, error: "...", message: "..." } with status 400
```

Available error types:
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `BAD_REQUEST` (400)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)

### From `@/lib/query-builders`

#### `logAndBroadcast(context, action, entityType, entity, projectId?)`
Combines activity logging and real-time broadcasting:
```typescript
const project = await prisma.project.create({ ... });
await logAndBroadcast(context, "created project", "Project", project, project.id);
```

#### `broadcastEntityChange(organizationId, action, entityType, entity, userId)`
Broadcast entity changes to organization:
```typescript
await broadcastEntityChange(
  context.organizationId,
  "created",
  "task",
  task,
  context.userId
);
```

## Migration Checklist

When refactoring a route:

1. **Change imports:**
   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import { withAuth, successResponse, errorResponse } from "@/lib/api-utils";
   import { logAndBroadcast } from "@/lib/query-builders";
   ```

2. **Replace function declaration:**
   ```typescript
   // Old: export async function GET()
   // New: export const GET = withAuth(async (request: NextRequest, context) => {
   ```

3. **Remove auth boilerplate:**
   - Delete `getServerSession` check
   - Delete `if (!session?.user)` check
   - Use `context.userId` and `context.organizationId`

4. **Replace error handling:**
   - Delete `try/catch` wrapper (handled by middleware)
   - Replace `NextResponse.json({ error })` with `errorResponse()`
   - Replace `NextResponse.json({ data })` with `successResponse()`

5. **Simplify activity logging:**
   - Replace separate `prisma.activityLog.create()` and `broadcastToOrganization()` calls
   - Use single `logAndBroadcast()` call

6. **Test the route:**
   - Verify authentication still works
   - Verify error responses are correct
   - Verify activity logging works

## Benefits

- **60% less code** per route
- **Consistent error handling** across all routes
- **Standardized response format**
- **Easier to maintain** - changes in one place affect all routes
- **Better type safety** with TypeScript
- **Reduced bugs** from copy-paste errors

## Routes Refactored

- ✅ `/api/projects`
- ✅ `/api/tasks`
- ✅ `/api/documents`
- ✅ `/api/defects`
- 🔲 141 routes remaining

## Example: Complete Refactored Route

```typescript
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { logAndBroadcast } from "@/lib/query-builders";

export const GET = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  
  const items = await prisma.item.findMany({
    where: {
      project: { organizationId: context.organizationId },
      ...(status && { status }),
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse({ items });
});

export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const { name, projectId } = body;

  if (!name || !projectId) {
    return errorResponse("BAD_REQUEST", "Name and project ID are required");
  }

  const item = await prisma.item.create({
    data: {
      name,
      projectId,
      createdById: context.userId,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  await logAndBroadcast(context, "created item", "Item", item, projectId);

  return successResponse({ item }, "Item created successfully");
});
```
