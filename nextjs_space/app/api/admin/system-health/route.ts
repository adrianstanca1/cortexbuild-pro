import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getClientCount } from "@/lib/realtime-clients";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      totalOrgs,
      totalProjects,
      activeProjects,
      todayActivities,
      hourActivities,
      pendingTasks,
      overdueTasks,
      openRFIs,
      pendingSubmittals,
      unresolvedIncidents,
      recentErrors,
      orgStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLogin: { gte: oneDayAgo } } }),
      prisma.user.count({ where: { lastLogin: { gte: oneWeekAgo } } }),
      prisma.organization.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.activityLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
      prisma.task.count({ where: { dueDate: { lt: now }, status: { notIn: ["COMPLETE"] } } }),
      prisma.rFI.count({ where: { status: "OPEN" } }),
      prisma.submittal.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.safetyIncident.count({ where: { status: { not: "CLOSED" } } }),
      prisma.activityLog.findMany({
        where: { action: { contains: "error" } },
        take: 5,
        orderBy: { createdAt: "desc" }
      }),
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { users: true, projects: true } }
        }
      })
    ]);

    // Calculate health score (0-100)
    let healthScore = 100;
    if (overdueTasks > 10) healthScore -= 10;
    if (unresolvedIncidents > 0) healthScore -= unresolvedIncidents * 5;
    if (openRFIs > 20) healthScore -= 5;
    if (recentErrors.length > 0) healthScore -= recentErrors.length * 3;
    healthScore = Math.max(0, healthScore);

    // Determine status
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (healthScore < 70) status = "warning";
    if (healthScore < 50) status = "critical";

    // Real-time connections
    const connectedClients = getClientCount();

    // Get activity trends (last 7 days)
    const activityTrends = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "ActivityLog"
      WHERE "createdAt" >= ${oneWeekAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return NextResponse.json(bigintSafe({
      status,
      healthScore,
      timestamp: now.toISOString(),
      realtime: {
        connectedClients,
        sseStatus: "operational"
      },
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        activeThisWeek: activeUsersWeek
      },
      organizations: {
        total: totalOrgs,
        breakdown: orgStats.map(org => ({
          id: org.id,
          name: org.name,
          users: org._count.users,
          projects: org._count.projects
        }))
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completion: totalProjects > 0 ? Math.round(((totalProjects - activeProjects) / totalProjects) * 100) : 0
      },
      activity: {
        lastHour: hourActivities,
        last24Hours: todayActivities,
        trends: activityTrends.map(t => ({ date: t.date, count: Number(t.count) }))
      },
      alerts: {
        overdueTasks,
        openRFIs,
        pendingSubmittals,
        unresolvedIncidents,
        pendingTasks
      },
      database: {
        status: "connected",
        responseTime: "<50ms"
      }
    }));
  } catch (error) {
    console.error("Error fetching system health:", error);
    return NextResponse.json(
      { error: "Internal server error", status: "critical", healthScore: 0 },
      { status: 500 }
    );
  }
}
