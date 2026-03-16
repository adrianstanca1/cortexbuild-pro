export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * GET /api/audit-logs/[id] - Get specific audit log with full change details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    const organizationId = (session.user as { organizationId?: string }).organizationId;

    const allowedRoles = ["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN", "COMPANY_ADMIN"];
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!auditLog) {
      return NextResponse.json({ error: "Audit log not found" }, { status: 404 });
    }

    // Organization scoping check
    if (userRole !== "SUPER_ADMIN") {
      const userOrg = await prisma.user.findUnique({
        where: { id: auditLog.userId },
        select: { organizationId: true },
      });
      if (!userOrg || userOrg.organizationId !== organizationId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Build detailed change history
    const changeHistory = buildChangeHistory(auditLog);

    return NextResponse.json({
      id: auditLog.id,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      action: auditLog.action,
      userId: auditLog.userId,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      changes: auditLog.changes,
      timestamp: auditLog.timestamp,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      metadata: auditLog.metadata,
      user: auditLog.user
        ? {
            id: auditLog.user.id,
            name: auditLog.user.name,
            email: auditLog.user.email,
            role: auditLog.user.role,
            organization: auditLog.user.organization,
          }
        : null,
      changeHistory,
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Build detailed change history from audit log
 */
function buildChangeHistory(auditLog: any) {
  const changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: "added" | "removed" | "modified";
  }> = [];

  if (auditLog.changes && typeof auditLog.changes === "object") {
    const entries = Object.entries(auditLog.changes as Record<string, any>);
    for (const [field, change] of entries) {
      if (change && typeof change === "object" && "old" in change && "new" in change) {
        changes.push({
          field,
          oldValue: change.old,
          newValue: change.new,
          changeType:
            change.old === undefined
              ? "added"
              : change.new === undefined
              ? "removed"
              : "modified",
        });
      }
    }
  }

  return changes;
}
