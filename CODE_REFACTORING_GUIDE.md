# Code Refactoring Guide

This document describes the refactoring patterns applied to reduce code duplication in the CortexBuild Pro codebase.

## Overview

We've identified and refactored several common duplication patterns:

1. **Realtime subscription pattern** - Duplicated across 20+ components
2. **Status/type configurations** - Duplicated across 15+ components  
3. **API authentication/authorization** - Duplicated across 100+ routes
4. **Organization filtering** - Duplicated across 40+ database queries
5. **Error handling** - Similar patterns across all routes

## New Utilities

### 1. Realtime Subscription Hook

**Location**: `hooks/use-entity-subscription.ts`

**Purpose**: Consolidates the duplicated pattern of subscribing to entity events and refreshing the router.

**Before**:
```typescript
import { useRealtimeSubscription } from '@/components/realtime-provider';

const handleProjectEvent = useCallback(() => {
  router.refresh();
}, [router]);

useRealtimeSubscription(
  ['project_created', 'project_updated'],
  handleProjectEvent,
  []
);
```

**After**:
```typescript
import { useEntitySubscription } from '@/hooks/use-entity-subscription';

useEntitySubscription('project');
```

**Multi-entity subscriptions**:
```typescript
import { useMultiEntitySubscription } from '@/hooks/use-entity-subscription';

useMultiEntitySubscription(['project', 'task', 'document']);
```

### 2. Shared Status Configurations

**Location**: `lib/constants/status-configs.ts`

**Purpose**: Centralize all status/type configurations for consistent styling and behavior.

**Available Configs**:
- `DOCUMENT_TYPE_CONFIG` - Document types (PLANS, DRAWINGS, PERMITS, PHOTOS, etc.)
- `EQUIPMENT_STATUS_CONFIG` - Equipment status (AVAILABLE, IN_USE, MAINTENANCE, etc.)
- `MATERIAL_STATUS_CONFIG` - Material status (AVAILABLE, IN_USE, LOW_STOCK, etc.)
- `PROJECT_STATUS_CONFIG` - Project statuses (PLANNING, IN_PROGRESS, etc.)
- `PROJECT_HEALTH_CONFIG` - Project health indicators (excellent, on-track, at-risk, critical)
- `TASK_PRIORITY_CONFIG` - Task priorities (LOW, MEDIUM, HIGH, URGENT)
- `TASK_STATUS_CONFIG` - Task statuses (TODO, IN_PROGRESS, IN_REVIEW, etc.)

**Before**:
```typescript
const typeConfig = {
  PLANS: { 
    label: 'Plans', 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-400', 
    icon: FileText 
  },
  // ... repeated in multiple files
};
```

**After**:
```typescript
import { DOCUMENT_TYPE_CONFIG } from '@/lib/constants/status-configs';

// Use directly
const config = DOCUMENT_TYPE_CONFIG[docType];
```

### 3. API Utility Helpers

**Location**: `lib/api-utils.ts`

**Purpose**: Standardize common API patterns.

#### Authentication & Context

**Before**:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userId = (session.user as { id?: string })?.id || '';
const orgId = (session.user as { organizationId?: string })?.organizationId;

if (!orgId) {
  return NextResponse.json({ error: "Organization not found" }, { status: 400 });
}
```

**After**:
```typescript
import { getApiContext } from '@/lib/api-utils';

const { context, error } = await getApiContext();
if (error) return error;

// Use context.userId, context.organizationId, etc.
```

#### Organization Filtering

**Before**:
```typescript
// Direct scope
where: orgId ? { organizationId: orgId } : {}

// Indirect scope (through project)
where: orgId ? { project: { organizationId: orgId } } : {}
```

**After**:
```typescript
import { buildOrgFilter } from '@/lib/api-utils';

// Direct scope (e.g., Project model)
where: buildOrgFilter(context!.organizationId, true)

// Indirect scope (e.g., Task model through project)
where: buildOrgFilter(context!.organizationId, false)
```

#### Error Handling

**Before**:
```typescript
} catch (error) {
  console.error("Get projects error:", error);
  return NextResponse.json(
    { error: "Failed to fetch projects" }, 
    { status: 500 }
  );
}
```

**After**:
```typescript
import { handleApiError } from '@/lib/api-utils';

} catch (error) {
  return handleApiError(error, "fetch projects");
}
```

#### Success Responses

**Before**:
```typescript
return NextResponse.json({ projects });
```

**After**:
```typescript
import { successResponse } from '@/lib/api-utils';

return successResponse({ projects });
// or with message
return successResponse({ project }, "Project created successfully");
```

#### Error Responses

**Before**:
```typescript
return NextResponse.json(
  { error: "Project name is required" }, 
  { status: 400 }
);
```

**After**:
```typescript
import { errorResponse } from '@/lib/api-utils';

return errorResponse("BAD_REQUEST", "Project name is required");
```

## Migration Guide

### Migrating a Component

1. **Replace realtime subscription**:
   - Remove `useCallback` and `handleEvent` functions
   - Remove `useRealtimeSubscription` import
   - Add `import { useEntitySubscription } from '@/hooks/use-entity-subscription'`
   - Replace subscription code with `useEntitySubscription('entityType')`

2. **Replace status configs**:
   - Remove local config objects
   - Add `import { CONFIG_NAME } from '@/lib/constants/status-configs'`
   - Replace all references to local config with imported config

### Migrating an API Route

1. **Replace authentication**:
   ```typescript
   import { getApiContext } from '@/lib/api-utils';
   
   const { context, error } = await getApiContext();
   if (error) return error;
   ```

2. **Replace organization filtering**:
   ```typescript
   import { buildOrgFilter } from '@/lib/api-utils';
   
   where: buildOrgFilter(context!.organizationId, directScope)
   ```

3. **Replace error handling**:
   ```typescript
   import { handleApiError, errorResponse } from '@/lib/api-utils';
   
   // For caught errors
   } catch (error) {
     return handleApiError(error, "action description");
   }
   
   // For validation errors
   if (!name) {
     return errorResponse("BAD_REQUEST", "Name is required");
   }
   ```

4. **Replace success responses**:
   ```typescript
   import { successResponse } from '@/lib/api-utils';
   
   return successResponse({ data }, "Optional message");
   ```

## Examples

### Complete Component Example

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEntitySubscription } from "@/hooks/use-entity-subscription";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants/status-configs";

export function TasksClient({ tasks }: { tasks: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  // Centralized subscription - replaces manual useRealtimeSubscription
  useEntitySubscription('task');

  return (
    <div>
      {tasks.map(task => {
        const statusConfig = TASK_STATUS_CONFIG[task.status];
        const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
        
        return (
          <div key={task.id} className={statusConfig.bg}>
            <span className={statusConfig.text}>{statusConfig.label}</span>
            <span className={priorityConfig.bg}>{priorityConfig.label}</span>
          </div>
        );
      })}
    </div>
  );
}
```

### Complete API Route Example

```typescript
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { 
  getApiContext, 
  buildOrgFilter, 
  handleApiError,
  successResponse,
  errorResponse
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { context, error } = await getApiContext();
    if (error) return error;

    const items = await prisma.item.findMany({
      where: buildOrgFilter(context!.organizationId, true),
      orderBy: { createdAt: "desc" }
    });

    return successResponse({ items });
  } catch (error) {
    return handleApiError(error, "fetch items");
  }
}

export async function POST(request: Request) {
  try {
    const { context, error } = await getApiContext();
    if (error) return error;

    const body = await request.json();
    if (!body.name?.trim()) {
      return errorResponse("BAD_REQUEST", "Name is required");
    }

    const item = await prisma.item.create({
      data: {
        name: body.name.trim(),
        organizationId: context!.organizationId,
        createdById: context!.userId
      }
    });

    return successResponse({ item }, "Item created successfully");
  } catch (error) {
    return handleApiError(error, "create item");
  }
}
```

## Benefits

1. **Reduced Code**: ~300 lines removed in sample refactoring
2. **Single Source of Truth**: Update once, applies everywhere
3. **Type Safety**: TypeScript types for all utilities
4. **Consistency**: Same patterns across entire codebase
5. **Easier Maintenance**: Centralized logic is easier to update
6. **Fewer Bugs**: Less duplication = fewer places for bugs to hide

## Next Steps

Apply these patterns to:
- ✅ 4 components (completed)
- ✅ 2 API routes (completed)
- 🔄 95+ remaining API routes
- 🔄 15+ remaining components with realtime subscriptions
- 🔄 All [id]/route.ts files with similar patterns

## Questions?

Refer to the refactored files for examples:
- `hooks/use-entity-subscription.ts`
- `lib/constants/status-configs.ts`
- `lib/api-utils.ts`
- `app/(dashboard)/projects/_components/projects-client.tsx`
- `app/api/projects/route.ts`
