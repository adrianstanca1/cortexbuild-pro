export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Force dynamic rendering

/**
 * GET /api/audit-logs - Retrieve audit logs with filtering and pagination
 * Query params:
 *   - entity: Filter by entity type (Variation, DailyReport, Payroll, etc.)
 *   - entityId: Filter by specific entity ID
 *   - action: Filter by action (CREATE, UPDATE, DELETE, STATUS_CHANGE)
 *   - userId: Filter by user ID
 *   - startDate: Filter logs from this date
 *   - endDate: Filter logs until this date
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    const organizationId = (session.user as { organizationId?: string }).organizationId;

    // Only admins and super admins can access audit logs
    const allowedRoles = ["SUPER_ADMIN", "COMPANY_OWNER", "ADMIN", "COMPANY_ADMIN"];
    if (!allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const entity = searchParams.get("entity");
    const entityId = searchParams.get("entityId");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    // Organization scoping - users can only see logs from their organization
    if (organizationId && userRole !== "SUPER_ADMIN") {
      where.user = { organizationId };
    }

    if (entity) where.entity = { equals: entity, mode: "insensitive" };
    if (entityId) where.entityId = entityId;
    if (action) where.action = { equals: action, mode: "insensitive" };
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [logs, total, entityTypes, actionTypes] = await Promise.all([
      prisma.auditLog.findMany({
        where,
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
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupMany({
        by: ["entity"],
        _count: true,
        orderBy: { _count: { entity: "desc" } },
        take: 20,
      }),
      prisma.auditLog.groupMany({
        by: ["action"],
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        userId: log.userId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        changes: log.changes,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        user: log.user
          ? {
              id: log.user.id,
              name: log.user.name,
              email: log.user.email,
              role: log.user.role,
              organization: log.user.organization,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        entityTypes: entityTypes.map((e) => ({ entity: e.entity, count: e._count })),
        actionTypes: actionTypes.map((a) => ({ action: a.action, count: a._count })),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
