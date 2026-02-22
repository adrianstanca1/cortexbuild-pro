// Permission checking utilities
import { prisma } from '@/lib/db';
import { PermissionAction, PermissionResource, UserRole } from '@prisma/client';

export async function checkPermission(
  userId: string,
  resource: PermissionResource,
  action: PermissionAction,
  options?: {
    organizationId?: string;
    projectId?: string;
  }
): Promise<boolean> {
  // Check for explicit permission grants
  const grants = await prisma.permissionGrant.findMany({
    where: {
      AND: [
        {
          OR: [
            { userId },
            { role: { in: await getUserRoles(userId) } }
          ]
        },
        {
          permission: {
            OR: [
              { resource, action },
              { resource, action: 'ALL' },
              { resource: 'ALL', action },
              { resource: 'ALL', action: 'ALL' }
            ]
          }
        },
        ...(options?.organizationId ? [{ organizationId: options.organizationId }] : []),
        ...(options?.projectId ? [{ projectId: options.projectId }] : []),
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    },
    include: { permission: true }
  });

  return grants.length > 0;
}

async function getUserRoles(userId: string): Promise<UserRole[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user ? [user.role] : [];
}

export async function hasAnyPermission(
  userId: string,
  permissions: { resource: PermissionResource; action: PermissionAction }[]
): Promise<boolean> {
  for (const perm of permissions) {
    if (await checkPermission(userId, perm.resource, perm.action)) {
      return true;
    }
  }
  return false;
}

export async function getUserPermissions(userId: string) {
  const grants = await prisma.permissionGrant.findMany({
    where: {
      AND: [
        {
          OR: [
            { userId },
            { role: { in: await getUserRoles(userId) } }
          ]
        },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    },
    include: {
      permission: true
    }
  });

  return grants.map(g => ({
    resource: g.permission.resource,
    action: g.permission.action,
    conditions: g.permission.conditions
  }));
}
