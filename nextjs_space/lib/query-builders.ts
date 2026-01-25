import { prisma } from './db';
import { ApiContext } from './api-utils';
import { broadcastToOrganization } from './realtime-clients';

/**
 * Standard query builder for fetching resources with organization filtering
 */
export async function queryWithOrgFilter<T>(
  model: keyof typeof prisma,
  context: ApiContext,
  options?: {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    skip?: number;
    take?: number;
  }
) {
  const prismaModel = prisma[model] as {
    findMany: (args: unknown) => Promise<T[]>;
  };

  return prismaModel.findMany({
    where: {
      project: { organizationId: context.organizationId },
      ...options?.where,
    },
    include: options?.include,
    orderBy: options?.orderBy || { createdAt: 'desc' },
    skip: options?.skip,
    take: options?.take,
  });
}

/**
 * Log activity with standard pattern
 */
export async function logActivity(
  context: ApiContext,
  action: string,
  entityType: string,
  entityId: string,
  entityName?: string,
  projectId?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName: entityName || null,
        userId: context.userId,
        projectId: projectId || null,
        details: `${action} ${entityType}`,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Broadcast entity change to organization
 */
export async function broadcastEntityChange(
  organizationId: string,
  action: 'created' | 'updated' | 'deleted',
  entityType: string,
  entity: Record<string, unknown>,
  userId: string
): Promise<void> {
  try {
    broadcastToOrganization(organizationId, {
      type: `${entityType}_${action}`,
      timestamp: new Date().toISOString(),
      payload: { [entityType]: entity, userId },
    });
  } catch (error) {
    console.error('Failed to broadcast change:', error);
  }
}

/**
 * Combined helper for activity logging and broadcasting
 */
export async function logAndBroadcast(
  context: ApiContext,
  action: string,
  entityType: string,
  entity: { id: string; name?: string; [key: string]: unknown },
  projectId?: string
): Promise<void> {
  await Promise.all([
    logActivity(
      context,
      action,
      entityType,
      entity.id,
      entity.name as string,
      projectId
    ),
    broadcastEntityChange(
      context.organizationId,
      action.includes('create') ? 'created' : action.includes('update') ? 'updated' : 'deleted',
      entityType,
      entity,
      context.userId
    ),
  ]);
}
