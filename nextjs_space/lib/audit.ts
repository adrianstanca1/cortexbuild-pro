import { PrismaClient } from "@prisma/client";
import { ApiContext } from "./api-utils";

interface AuditLogData {
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: {
    projectId?: string;
    organizationId?: string;
    previousStatus?: string;
    newStatus?: string;
  };
}

/**
 * Create an audit log entry for construction feature operations
 */
export async function createAuditLog(
  prisma: PrismaClient,
  context: ApiContext,
  data: AuditLogData
): Promise<void> {
  try {
    // Build changes object showing what fields changed
    const changes: Record<string, { old: any; new: any }> = {};

    if (data.oldValues && data.newValues) {
      const allKeys = new Set([
        ...Object.keys(data.oldValues || {}),
        ...Object.keys(data.newValues || {}),
      ]);

      for (const key of allKeys) {
        const oldVal = data.oldValues?.[key];
        const newVal = data.newValues?.[key];

        if (oldVal !== newVal) {
          changes[key] = { old: oldVal, new: newVal };
        }
      }
    }

    // Get request info from headers if available
    const ipAddress = context.metadata?.ipAddress;
    const userAgent = context.metadata?.userAgent;

    await prisma.auditLog.create({
      data: {
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        userId: context.userId,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        changes: Object.keys(changes).length > 0 ? changes : null,
        ipAddress,
        userAgent,
        metadata: {
          ...data.metadata,
          organizationId: context.organizationId,
          userName: context.userName,
          userEmail: context.userEmail,
          userRole: context.userRole,
        },
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw - audit logging should not block main operation
  }
}

/**
 * Extract field changes between two objects
 */
export function extractChanges(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];

    if (oldVal !== newVal) {
      changes[key] = { old: oldVal, new: newVal };
    }
  }

  return changes;
}

/**
 * Format audit log changes for display
 */
export function formatChangeDescription(
  action: string,
  entity: string,
  changes?: Record<string, any>
): string {
  if (!changes || Object.keys(changes).length === 0) {
    return `${action} ${entity}`;
  }

  const fieldChanges = Object.entries(changes).map(([field, change]) => {
    if (change?.old === undefined) {
      return `${field} added: ${change.new}`;
    }
    if (change?.new === undefined) {
      return `${field} removed: ${change.old}`;
    }
    return `${field}: ${change.old} → ${change.new}`;
  });

  return `${action} ${entity}: ${fieldChanges.join(", ")}`;
}
