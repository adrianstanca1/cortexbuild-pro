import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const orgId = user.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Only COMPANYOWNER, ADMIN, or SUPER_ADMIN can access
    if (!["COMPANY_OWNER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalRFIs,
      openRFIs,
      totalSubmittals,
      pendingSubmittals,
      totalChangeOrders,
      totalSafetyIncidents,
      openIncidents,
      totalDocuments,
      recentActivities,
      tasksByStatus,
      projectsByStatus,
      membersByRole,
      weeklyActivity,
      topProjects
    ] = await Promise.all([
      prisma.teamMember.count({ where: { organizationId: orgId } }),
      prisma.project.count({ where: { organizationId: orgId } }),
      prisma.project.count({ where: { organizationId: orgId, status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
      prisma.task.count({ where: { project: { organizationId: orgId } } }),
      prisma.task.count({ where: { project: { organizationId: orgId }, status: "COMPLETE" } }),
      prisma.task.count({
        where: {
          project: { organizationId: orgId },
          status: { notIn: ["COMPLETE"] },
          dueDate: { lt: now }
        }
      }),
      prisma.rFI.count({ where: { project: { organizationId: orgId } } }),
      prisma.rFI.count({ where: { project: { organizationId: orgId }, status: "OPEN" } }),
      prisma.submittal.count({ where: { project: { organizationId: orgId } } }),
      prisma.submittal.count({ where: { project: { organizationId: orgId }, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.changeOrder.count({ where: { project: { organizationId: orgId } } }),
      prisma.safetyIncident.count({ where: { project: { organizationId: orgId } } }),
      prisma.safetyIncident.count({ where: { project: { organizationId: orgId }, status: { not: "CLOSED" } } }),
      prisma.document.count({ where: { project: { organizationId: orgId } } }),
      prisma.activityLog.count({ where: { user: { organizationId: orgId }, createdAt: { gte: oneWeekAgo } } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { project: { organizationId: orgId } },
        _count: true
      }),
      prisma.project.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: true
      }),
      prisma.user.groupBy({
        by: ["role"],
        where: { organizationId: orgId },
        _count: true
      }),
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "ActivityLog"
        WHERE "userId" IN (SELECT id FROM "User" WHERE "organizationId" = ${orgId})
        AND "createdAt" >= ${oneWeekAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      prisma.project.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          name: true,
          status: true,
          budget: true,
          _count: { select: { tasks: true, teamMembers: true } }
        },
        take: 5,
        orderBy: { updatedAt: "desc" }
      })
    ]);

    // Convert all BigInt values to Numbers
    const totalMembersNum = Number(totalMembers);
    const totalProjectsNum = Number(totalProjects);
    const activeProjectsNum = Number(activeProjects);
    const completedProjectsNum = Number(completedProjects);
    const totalTasksNum = Number(totalTasks);
    const completedTasksNum = Number(completedTasks);
    const overdueTasksNum = Number(overdueTasks);

    // Calculate completion rate
    const taskCompletionRate = totalTasksNum > 0 ? Math.round((completedTasksNum / totalTasksNum) * 100) : 0;
    const projectCompletionRate = totalProjectsNum > 0 ? Math.round((completedProjectsNum / totalProjectsNum) * 100) : 0;

    return NextResponse.json({
      overview: {
        totalMembers: totalMembersNum,
        totalProjects: totalProjectsNum,
        activeProjects: activeProjectsNum,
        completedProjects: completedProjectsNum,
        totalTasks: totalTasksNum,
        completedTasks: completedTasksNum,
        overdueTasks: overdueTasksNum,
        taskCompletionRate,
        projectCompletionRate
      },
      modules: {
        rfis: { total: Number(totalRFIs), open: Number(openRFIs) },
        submittals: { total: Number(totalSubmittals), pending: Number(pendingSubmittals) },
        changeOrders: { total: Number(totalChangeOrders) },
        safety: { total: Number(totalSafetyIncidents), open: Number(openIncidents) },
        documents: { total: Number(totalDocuments) }
      },
      activity: {
        recentCount: Number(recentActivities),
        weeklyTrend: weeklyActivity.map(w => ({ date: w.date, count: Number(w.count) }))
      },
      charts: {
        tasksByStatus: tasksByStatus.map(t => ({ status: t.status, count: Number(t._count) })),
        projectsByStatus: projectsByStatus.map(p => ({ status: p.status, count: Number(p._count) })),
        membersByRole: membersByRole.map(m => ({ role: m.role, count: Number(m._count) }))
      },
      topProjects: topProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        budget: Number(p.budget || 0),
        taskCount: Number(p._count.tasks),
        teamSize: Number(p._count.teamMembers)
      }))
    });
  } catch (error) {
    console.error("Error fetching company stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
