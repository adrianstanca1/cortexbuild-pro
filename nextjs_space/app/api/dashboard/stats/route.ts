import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const orgId = user.organizationId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      projects,
      tasks,
      rfis,
      submittals,
      changeOrders,
      safetyIncidents,
      punchLists,
      inspections,
      equipment,
      meetings,
      dailyReports,
      teamMembers,
      recentActivities,
    ] = await Promise.all([
      // Projects stats
      prisma.project.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: true,
      }),
      // Tasks stats
      prisma.task.groupBy({
        by: ["status", "priority"],
        where: { project: { organizationId: orgId } },
        _count: true,
      }),
      // RFIs stats
      prisma.rFI.groupBy({
        by: ["status"],
        where: { project: { organizationId: orgId } },
        _count: true,
      }),
      // Submittals stats
      prisma.submittal.groupBy({
        by: ["status"],
        where: { project: { organizationId: orgId } },
        _count: true,
      }),
      // Change orders stats
      prisma.changeOrder.aggregate({
        where: { project: { organizationId: orgId } },
        _sum: { costChange: true },
        _count: true,
      }),
      // Safety incidents (last 30 days)
      prisma.safetyIncident.groupBy({
        by: ["severity"],
        where: {
          project: { organizationId: orgId },
          incidentDate: { gte: thirtyDaysAgo },
        },
        _count: true,
      }),
      // Punch lists stats
      prisma.punchList.groupBy({
        by: ["status", "priority"],
        where: { project: { organizationId: orgId } },
        _count: true,
      }),
      // Inspections stats
      prisma.inspection.groupBy({
        by: ["status"],
        where: { project: { organizationId: orgId } },
        _count: true,
      }),
      // Equipment stats
      prisma.equipment.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: true,
      }),
      // Meetings (last 7 days)
      prisma.meetingMinutes.count({
        where: {
          project: { organizationId: orgId },
          meetingDate: { gte: sevenDaysAgo },
        },
      }),
      // Daily reports (last 7 days)
      prisma.dailyReport.aggregate({
        where: {
          project: { organizationId: orgId },
          reportDate: { gte: sevenDaysAgo },
        },
        _count: true,
        _sum: { manpowerCount: true },
      }),
      // Team members
      prisma.teamMember.count({
        where: { organizationId: orgId },
      }),
      // Recent activities
      prisma.activityLog.findMany({
        where: { project: { organizationId: orgId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
    ]);

    // Calculate overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        project: { organizationId: orgId },
        status: { not: "COMPLETE" },
        dueDate: { lt: now },
      },
    });

    // Calculate upcoming inspections
    const upcomingInspections = await prisma.inspection.count({
      where: {
        project: { organizationId: orgId },
        status: "SCHEDULED",
        scheduledDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Calculate equipment needing maintenance
    const equipmentMaintenance = await prisma.equipment.count({
      where: {
        organizationId: orgId,
        OR: [
          { status: "MAINTENANCE" },
          {
            nextServiceDate: {
              lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    // Weekly trend data — tasks completed per day over last 7 days
    const weeklyTrends = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const dayStart = new Date(
          now.getTime() - (6 - i) * 24 * 60 * 60 * 1000,
        );
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        return Promise.all([
          prisma.task.count({
            where: {
              project: { organizationId: orgId },
              status: "COMPLETE",
              updatedAt: { gte: dayStart, lte: dayEnd },
            },
          }),
          prisma.task.count({
            where: {
              project: { organizationId: orgId },
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
          prisma.activityLog.count({
            where: {
              project: { organizationId: orgId },
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
        ]).then(([completed, created, activities]) => ({
          date: dayStart.toISOString().slice(0, 10),
          dayLabel: dayStart.toLocaleDateString("en-GB", { weekday: "short" }),
          tasksCompleted: completed,
          tasksCreated: created,
          activities,
        }));
      }),
    );

    // Previous week comparison for percentage change
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const [tasksCompletedThisWeek, tasksCompletedLastWeek] = await Promise.all([
      prisma.task.count({
        where: {
          project: { organizationId: orgId },
          status: "COMPLETE",
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.task.count({
        where: {
          project: { organizationId: orgId },
          status: "COMPLETE",
          updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
    ]);

    const productivityChange =
      tasksCompletedLastWeek > 0
        ? Math.round(
            ((tasksCompletedThisWeek - tasksCompletedLastWeek) /
              tasksCompletedLastWeek) *
              100,
          )
        : tasksCompletedThisWeek > 0
          ? 100
          : 0;

    // Budget utilization across all active projects
    const projectBudgets = await prisma.project.findMany({
      where: { organizationId: orgId, status: "IN_PROGRESS" },
      select: {
        id: true,
        name: true,
        budget: true,
        costItems: { select: { actualAmount: true } },
      },
    });

    const budgetSummary = projectBudgets.map((p) => {
      const spent = p.costItems.reduce(
        (sum, ci) => sum + (ci.actualAmount || 0),
        0,
      );
      const budget = p.budget || 0;
      return {
        projectId: p.id,
        projectName: p.name,
        budget,
        spent,
        remaining: budget - spent,
        utilization: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      };
    });

    // Format response
    const stats = {
      overview: {
        totalProjects: projects.reduce((acc, p) => acc + p._count, 0),
        activeProjects:
          projects.find((p) => p.status === "IN_PROGRESS")?._count || 0,
        completedProjects:
          projects.find((p) => p.status === "COMPLETED")?._count || 0,
        teamMembers,
      },
      tasks: {
        total: tasks.reduce((acc, t) => acc + t._count, 0),
        byStatus: tasks
          .filter((t) => t.status)
          .reduce(
            (acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + t._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
        byPriority: tasks
          .filter((t) => t.priority)
          .reduce(
            (acc, t) => {
              acc[t.priority] = (acc[t.priority] || 0) + t._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
        overdue: overdueTasks,
      },
      documents: {
        rfis: {
          total: rfis.reduce((acc, r) => acc + r._count, 0),
          byStatus: rfis.reduce(
            (acc, r) => {
              acc[r.status] = r._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
        submittals: {
          total: submittals.reduce((acc, s) => acc + s._count, 0),
          byStatus: submittals.reduce(
            (acc, s) => {
              acc[s.status] = s._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
      },
      financial: {
        changeOrders: {
          count: changeOrders._count,
          totalAmount: changeOrders._sum?.costChange || 0,
        },
      },
      safety: {
        incidents30Days: safetyIncidents.reduce((acc, s) => acc + s._count, 0),
        bySeverity: safetyIncidents.reduce(
          (acc, s) => {
            acc[s.severity] = s._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      quality: {
        punchLists: {
          total: punchLists.reduce((acc, p) => acc + p._count, 0),
          byStatus: punchLists.reduce(
            (acc, p) => {
              if (p.status) acc[p.status] = (acc[p.status] || 0) + p._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
          critical: punchLists.reduce(
            (acc, p) => acc + (p.priority === "CRITICAL" ? p._count : 0),
            0,
          ),
        },
        inspections: {
          total: inspections.reduce(
            (acc, i) => acc + (typeof i._count === "number" ? i._count : 0),
            0,
          ),
          byStatus: inspections.reduce(
            (acc, i) => {
              if (i.status) {
                const count = typeof i._count === "number" ? i._count : 0;
                acc[i.status] = (acc[i.status] || 0) + count;
              }
              return acc;
            },
            {} as Record<string, number>,
          ),
          upcoming: upcomingInspections,
        },
      },
      resources: {
        equipment: {
          total: equipment.reduce((acc, e) => acc + e._count, 0),
          byStatus: equipment.reduce(
            (acc, e) => {
              acc[e.status] = e._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
          needingMaintenance: equipmentMaintenance,
        },
      },
      activity: {
        meetings7Days: meetings,
        dailyReports7Days: dailyReports._count,
        totalManpowerDays: dailyReports._sum?.manpowerCount || 0,
        recentActivities: recentActivities.map((a) => ({
          id: a.id,
          action: a.action,
          details: a.details,
          userName: a.user?.name || "System",
          projectName: a.project?.name || null,
          createdAt: a.createdAt,
        })),
      },
    };

    return NextResponse.json({
      ...stats,
      trends: {
        weekly: weeklyTrends,
        tasksCompletedThisWeek,
        tasksCompletedLastWeek,
        productivityChange,
      },
      budgetSummary: {
        projects: budgetSummary,
        totalBudget: budgetSummary.reduce((sum, p) => sum + p.budget, 0),
        totalSpent: budgetSummary.reduce((sum, p) => sum + p.spent, 0),
        overallUtilization: (() => {
          const totalBudget = budgetSummary.reduce(
            (sum, p) => sum + p.budget,
            0,
          );
          const totalSpent = budgetSummary.reduce((sum, p) => sum + p.spent, 0);
          return totalBudget > 0
            ? Math.round((totalSpent / totalBudget) * 100)
            : 0;
        })(),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
