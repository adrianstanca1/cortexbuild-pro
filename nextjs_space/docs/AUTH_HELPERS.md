# Authentication Helper Refactoring

## Purpose
This document explains the new authentication helper utilities that reduce code duplication in API routes.

## Problem
Previously, every API route contained repetitive authentication code:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

This pattern was duplicated in 175+ API route files.

## Solution
Created `/lib/api-auth-helpers.ts` with reusable authentication functions.

See `/lib/api-auth-helpers.ts` for full implementation details.

## Migrated Files
- `/app/api/permits/route.ts`
- `/app/api/equipment/route.ts`
- `/app/api/materials/route.ts`

## Gradual Adoption
These helpers are designed for gradual adoption. Old patterns still work, but new routes should use these helpers.
