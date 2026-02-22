/**
 * Resource-specific middleware helpers for API routes
 * Consolidates common patterns for resource access validation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Session } from 'next-auth';

/**
 * Validates that a resource belongs to the user's organization
 * @param resourceOrganizationId The organization ID from the resource
 * @param session The user's session
 * @returns NextResponse with 403 error if unauthorized, null if authorized
 */
export function validateOrganizationAccess(
  resourceOrganizationId: string,
  session: Session
): NextResponse | null {
  if (resourceOrganizationId !== session.user.organizationId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You do not have permission to access resources from this organization' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Creates a standardized 404 response for a resource
 * @param resourceType The type of resource (e.g., 'RFI', 'Change Order')
 * @returns NextResponse with 404 error
 */
export function notFoundResponse(resourceType: string): NextResponse {
  return NextResponse.json(
    { error: `${resourceType} not found` },
    { status: 404 }
  );
}

/**
 * Generic helper to fetch and validate a resource with organization access
 * @param resourceType The type of resource (for error messages)
 * @param findFn Function that fetches the resource from the database
 * @param session User session
 * @param getOrgId Function to extract organizationId from the resource
 * @returns Object with resource or error response
 */
export async function fetchAndValidateResource<T>(
  resourceType: string,
  findFn: () => Promise<T | null>,
  session: Session,
  getOrgId: (resource: T) => string
): Promise<{ resource: T; error: null } | { resource: null; error: NextResponse }> {
  const resource = await findFn();
  
  if (!resource) {
    return { resource: null, error: notFoundResponse(resourceType) };
  }
  
  const orgId = getOrgId(resource);
  const accessError = validateOrganizationAccess(orgId, session);
  
  if (accessError) {
    return { resource: null, error: accessError };
  }
  
  return { resource, error: null };
}

/**
 * Common pattern: Fetch resource with project and validate organization access
 * Works for resources that have a project relation with organizationId
 */
export async function fetchResourceWithProjectAccess<T extends { project: { organizationId: string } }>(
  resourceType: string,
  resourceId: string,
  session: Session,
  modelName: keyof typeof prisma,
  includeOptions?: any
): Promise<{ resource: T; error: null } | { resource: null; error: NextResponse }> {
  const model = prisma[modelName] as any;
  
  const resource = await model.findUnique({
    where: { id: resourceId },
    include: includeOptions || {
      project: { select: { id: true, name: true, organizationId: true } },
    },
  }) as T | null;
  
  if (!resource) {
    return { resource: null, error: notFoundResponse(resourceType) };
  }
  
  const accessError = validateOrganizationAccess(resource.project.organizationId, session);
  
  if (accessError) {
    return { resource: null, error: accessError };
  }
  
  return { resource, error: null };
}
