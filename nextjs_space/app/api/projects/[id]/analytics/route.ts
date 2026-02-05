import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const projectId = id;

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
      include: {
        manager: { select: { name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const now = new Date();

    // Parallel queries
    const [
      taskStats,
      tasksByAssignee,
      rfiStats,
      submittalStats,
      changeOrderStats,
      safetyStats,
      punchListStats,
      inspectionStats,
      equipmentUsage,
      dailyReportStats,
      activityTrend,
      teamMembers,
    ] = await Promise.all([
      // Task statistics
      prisma.task.groupBy({
        by: ['status', 'priority'],
        where: { projectId },
        _count: true,
      }),
      // Tasks by assignee
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId, assigneeId: { not: null } },
        _count: true,
      }),
      // RFI statistics
      prisma.rFI.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      // Submittal statistics
      prisma.submittal.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      // Change order statistics
      prisma.changeOrder.aggregate({
        where: { projectId },
        _sum: { costChange: true },
        _count: true,
        _avg: { costChange: true },
      }),
      // Safety statistics
      prisma.safetyIncident.groupBy({
        by: ['severity'],
        where: { projectId },
        _count: true,
      }),
      // Punch list statistics
      prisma.punchList.groupBy({
        by: ['status', 'category'],
        where: { projectId },
        _count: true,
      }),
      // Inspection statistics
      prisma.inspection.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      // Equipment usage on project
      prisma.equipmentUsageLog.findMany({
        where: { projectId },
        orderBy: { checkOutDate: 'desc' },
        take: 10,
      }),
      // Daily report statistics
      prisma.dailyReport.aggregate({
        where: { projectId },
        _count: true,
        _avg: { manpowerCount: true },
        _sum: { manpowerCount: true },
      }),
      // Activity trend (last 30 days)
      prisma.activityLog.groupBy({
        by: ['action'],
        where: {
          projectId,
          createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      }),
      // Team members count
      prisma.projectTeamMember.count({
        where: { projectId },
      }),
    ]);

    // Get assignee names
    const assigneeIds = tasksByAssignee.map(t => t.assigneeId).filter(Boolean) as string[];
    const assignees = assigneeIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true },
    }) : [];
    const assigneeMap = new Map(assignees.map(a => [a.id, a.name]));

    // Calculate progress metrics
    const totalTasks = taskStats.reduce((acc, t) => acc + t._count, 0);
    const completedTasks = taskStats.filter(t => t.status === 'COMPLETE').reduce((acc, t) => acc + t._count, 0);
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate project timeline progress
    const projectStart = project.startDate ? new Date(project.startDate) : now;
    const projectEnd = project.endDate ? new Date(project.endDate) : null;
    const totalDuration = projectEnd ? projectEnd.getTime() - projectStart.getTime() : 0;
    const elapsedDuration = now.getTime() - projectStart.getTime();
    const timelineProgress = totalDuration > 0 ? Math.min(100, Math.round((elapsedDuration / totalDuration) * 100)) : 0;

    // Calculate overdue items
    const overdueTasks = await prisma.task.count({
      where: {
        projectId,
        status: { not: 'COMPLETE' },
        dueDate: { lt: now },
      },
    });

    const analytics = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        manager: project.manager,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
      },
      progress: {
        taskCompletionRate,
        timelineProgress,
        onSchedule: taskCompletionRate >= timelineProgress - 10,
        teamSize: teamMembers,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        byStatus: taskStats.filter(t => t.status).reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + t._count;
          return acc;
        }, {} as Record<string, number>),
        byPriority: taskStats.filter(t => t.priority).reduce((acc, t) => {
          acc[t.priority] = (acc[t.priority] || 0) + t._count;
          return acc;
        }, {} as Record<string, number>),
        byAssignee: tasksByAssignee.map(t => ({
          assigneeId: t.assigneeId,
          assigneeName: assigneeMap.get(t.assigneeId || '') || 'Unassigned',
          count: t._count,
        })),
      },
      documentation: {
        rfis: {
          total: rfiStats.reduce((acc, r) => acc + r._count, 0),
          open: rfiStats.find(r => r.status === 'OPEN')?._count || 0,
          byStatus: rfiStats.reduce((acc, r) => {
            acc[r.status] = r._count;
            return acc;
          }, {} as Record<string, number>),
        },
        submittals: {
          total: submittalStats.reduce((acc, s) => acc + s._count, 0),
          pending: submittalStats.find(s => s.status === 'SUBMITTED')?._count || 0,
          byStatus: submittalStats.reduce((acc, s) => {
            acc[s.status] = s._count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
      financial: {
        changeOrders: {
          count: changeOrderStats._count,
          total: changeOrderStats._sum?.costChange || 0,
          average: changeOrderStats._avg?.costChange || 0,
        },
        budgetImpact: project.budget
          ? ((changeOrderStats._sum?.costChange || 0) / project.budget) * 100
          : 0,
      },
      safety: {
        totalIncidents: safetyStats.reduce((acc, s) => acc + s._count, 0),
        bySeverity: safetyStats.reduce((acc, s) => {
          acc[s.severity] = s._count;
          return acc;
        }, {} as Record<string, number>),
      },
      quality: {
        punchLists: {
          total: punchListStats.reduce((acc, p) => acc + p._count, 0),
          open: punchListStats.filter(p => p.status === 'OPEN').reduce((acc, p) => acc + p._count, 0),
          byCategory: punchListStats.filter(p => p.category).reduce((acc, p) => {
            if (p.category) {
              acc[p.category] = (acc[p.category] || 0) + p._count;
            }
            return acc;
          }, {} as Record<string, number>),
        },
        inspections: {
          total: inspectionStats.reduce((acc, i) => acc + i._count, 0),
          passed: inspectionStats.filter(i => i.status === 'PASSED').reduce((acc, i) => acc + i._count, 0),
          failed: inspectionStats.filter(i => i.status === 'FAILED').reduce((acc, i) => acc + i._count, 0),
          byStatus: inspectionStats.reduce((acc, i) => {
            acc[i.status] = i._count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
      resources: {
        equipmentUsageCount: equipmentUsage.length,
      },
      dailyReports: {
        count: dailyReportStats._count,
        avgWorkers: Math.round(dailyReportStats._avg?.manpowerCount || 0),
        totalWorkerDays: dailyReportStats._sum?.manpowerCount || 0,
      },
      activityTrend: activityTrend.map(a => ({
        action: a.action,
        count: a._count,
      })),
    };

    return NextResponse.json(analytics);
  } catch {
    console.error('Project analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
