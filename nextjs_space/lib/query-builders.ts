import { prisma } from './db';
import { ApiContext } from './api-utils';
import { broadcastToOrganization } from './realtime-clients';

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
  // Map action string to broadcast action type
  let broadcastAction: 'created' | 'updated' | 'deleted' = 'updated';
  const lowerAction = action.toLowerCase();
  
  if (lowerAction.includes('create') || lowerAction === 'created') {
    broadcastAction = 'created';
  } else if (lowerAction.includes('delete') || lowerAction === 'deleted') {
    broadcastAction = 'deleted';
  }

  await Promise.all([
    logActivity(
      context,
      action,
      entityType,
      entity.id,
      entity.name as string,
      projectId
    ),
    ...(context.organizationId ? [broadcastEntityChange(
      context.organizationId,
      broadcastAction,
      entityType,
      entity,
      context.userId
    )] : []),
  ]);
}
