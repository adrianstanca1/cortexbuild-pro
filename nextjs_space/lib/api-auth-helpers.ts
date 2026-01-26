/**
 * Simple Authentication Helpers for API Routes
 * 
 * These helpers reduce boilerplate in API routes while maintaining
 * compatibility with existing code patterns.
 * 
 * Usage Example:
 * ```typescript
 * import { requireAuth, requireOrganization } from '@/lib/api-auth-helpers';
 * 
 * export async function GET() {
 *   const { session, error } = await requireAuth();
 *   if (error) return error;
 *   
 *   // Your logic here with session
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  organizationId?: string;
}

export interface AuthResult {
  session: { user: SessionUser } | null;
  error: NextResponse | null;
}

export interface OrgAuthResult extends AuthResult {
  organizationId: string | null;
}

/**
 * Require authentication for an API route
 * Returns session and error (null if authenticated)
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
  
  return { session: session as { user: SessionUser }, error: null };
}

/**
 * Require authentication AND organization membership
 * Returns session, organizationId, and error (null if valid)
 */
export async function requireOrganization(): Promise<OrgAuthResult> {
  const { session, error } = await requireAuth();
  
  if (error) {
    return { session: null, organizationId: null, error };
  }
  
  const organizationId = session?.user?.organizationId;
  
  if (!organizationId) {
    return {
      session,
      organizationId: null,
      error: NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      ),
    };
  }
  
  return { session, organizationId, error: null };
}

/**
 * Require specific role(s) for access
 * Returns session and error (null if authorized)
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const { session, error } = await requireAuth();
  
  if (error) {
    return { session: null, error };
  }
  
  const userRole = session?.user?.role;
  
  // Security: Deny access if role is undefined rather than defaulting
  if (!userRole) {
    return {
      session,
      error: NextResponse.json(
        { error: 'User role not defined' },
        { status: 403 }
      ),
    };
  }
  
  if (!allowedRoles.includes(userRole)) {
    return {
      session,
      error: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }
  
  return { session, error: null };
}

/**
 * Check if resource belongs to user's organization
 * Useful for authorization checks on specific resources
 */
export function checkOrganizationAccess(
  resourceOrgId: string | null | undefined,
  sessionOrgId: string | null | undefined
): { allowed: boolean; error: NextResponse | null } {
  if (!resourceOrgId || !sessionOrgId) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Organization mismatch' },
        { status: 403 }
      ),
    };
  }
  
  if (resourceOrgId !== sessionOrgId) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Unauthorized access to resource' },
        { status: 403 }
      ),
    };
  }
  
  return { allowed: true, error: null };
}
