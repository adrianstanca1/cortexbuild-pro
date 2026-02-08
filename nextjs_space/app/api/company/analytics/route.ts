import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    
    // Only company owners/admins can access company analytics
    if (!['COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Fetch comprehensive company analytics with optimized queries
    const [
      organization,
      projectMetrics,
      teamMembers,
      taskMetrics,
      rfiMetrics,
      submittalMetrics,
      safetyMetrics,
      costMetrics,
      timeMetrics,
      activities
    ] = await Promise.all([
      // Organization info
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: { _count: { select: { projects: true, teamMembers: true, users: true } } }
      }),
      // Project metrics using aggregation
      prisma.project.groupBy({
        by: ['status'],
        where: { organizationId: user.organizationId },
        _count: { id: true },
        _sum: { budget: true }
      }).then(async (grouped) => {
        // Get total count and sample projects
        const [total, sampleProjects] = await Promise.all([
          prisma.project.count({ where: { organizationId: user.organizationId } }),
          prisma.project.findMany({
            where: { organizationId: user.organizationId },
            select: {
              id: true,
              name: true,
              status: true,
              budget: true,
              manager: { select: { name: true } },
              _count: { select: { tasks: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          })
        ]);
        return { grouped, total, sampleProjects };
      }),
      // Team members - only essential fields
      prisma.teamMember.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          userId: true,
          user: { select: { name: true, email: true, lastLogin: true } },
          _count: { select: { projectAssignments: true } }
        }
      }),
      // Task metrics using aggregation
      prisma.task.groupBy({
        by: ['status', 'priority'],
        where: { project: { organizationId: user.organizationId } },
        _count: { id: true }
      }),
      // RFI metrics using aggregation
      prisma.rFI.groupBy({
        by: ['status'],
        where: { project: { organizationId: user.organizationId } },
        _count: { id: true }
      }),
      // Submittal metrics using aggregation
      prisma.submittal.groupBy({
        by: ['status'],
        where: { project: { organizationId: user.organizationId } },
        _count: { id: true }
      }),
      // Safety metrics using aggregation
      prisma.safetyIncident.groupBy({
        by: ['severity', 'status'],
        where: { project: { organizationId: user.organizationId } },
        _count: { id: true }
      }),
      // Cost metrics using aggregation
      prisma.costItem.groupBy({
        by: ['category'],
        where: { project: { organizationId: user.organizationId } },
        _sum: {
          estimatedAmount: true,
          actualAmount: true,
          committedAmount: true
        },
        _count: { id: true }
      }),
      // Time metrics using aggregation
      prisma.timeEntry.groupBy({
        by: ['userId', 'status'],
        where: { project: { organizationId: user.organizationId }, date: { gte: startDate } },
        _sum: { hours: true },
        _count: { id: true }
      }),
      // Recent activities
      prisma.activityLog.findMany({
        where: { project: { organizationId: user.organizationId }, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, action: true, createdAt: true }
      })
    ]);

    // Calculate comprehensive metrics using aggregated data
    const taskTotals = taskMetrics.reduce((acc, t) => {
      acc.total += t._count.id;
      if (t.status === 'COMPLETE') acc.completed += t._count.id;
      if (t.status === 'IN_PROGRESS') acc.inProgress += t._count.id;
      if ((t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'COMPLETE') {
        acc.critical += t._count.id;
      }
      return acc;
    }, { total: 0, completed: 0, inProgress: 0, critical: 0 });

    const rfiTotals = rfiMetrics.reduce((acc, r) => {
      acc.total += r._count.id;
      if (r.status === 'OPEN' || r.status === 'DRAFT') acc.open += r._count.id;
      return acc;
    }, { total: 0, open: 0 });

    const submittalTotals = submittalMetrics.reduce((acc, s) => {
      acc.total += s._count.id;
      if (s.status === 'APPROVED') acc.approved += s._count.id;
      if (s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW') acc.pending += s._count.id;
      return acc;
    }, { total: 0, approved: 0, pending: 0 });

    const safetyTotals = safetyMetrics.reduce((acc, s) => {
      acc.total += s._count.id;
      if (s.status === 'OPEN' || s.status === 'INVESTIGATING') acc.open += s._count.id;
      if (s.severity === 'CRITICAL' || s.severity === 'HIGH') acc.critical += s._count.id;
      return acc;
    }, { total: 0, open: 0, critical: 0 });

    const costTotals = costMetrics.reduce((acc, c) => {
      acc.estimated += c._sum.estimatedAmount || 0;
      acc.actual += c._sum.actualAmount || 0;
      acc.committed += c._sum.committedAmount || 0;
      return acc;
    }, { estimated: 0, actual: 0, committed: 0 });

    const timeTotals = timeMetrics.reduce((acc, t) => {
      acc.totalHours += t._sum.hours || 0;
      acc.uniqueUsers.add(t.userId);
      return acc;
    }, { totalHours: 0, uniqueUsers: new Set<string>() });

    const analytics = {
      organization: {
        name: organization?.name,
        totalProjects: organization?._count.projects || 0,
        totalUsers: organization?._count.users || 0,
        totalTeamMembers: organization?._count.teamMembers || 0
      },
      projectMetrics: {
        total: projectMetrics.total,
        byStatus: projectMetrics.grouped.reduce((acc, g) => {
          acc[g.status.toLowerCase()] = g._count.id;
          return acc;
        }, {} as Record<string, number>),
        totalBudget: projectMetrics.grouped.reduce((sum, g) => sum + (g._sum.budget || 0), 0),
        avgTeamSize: 0 // This would require a separate query; omitted for performance
      },
      taskMetrics: {
        total: taskTotals.total,
        completed: taskTotals.completed,
        inProgress: taskTotals.inProgress,
        completionRate: taskTotals.total > 0 
          ? Math.round((taskTotals.completed / taskTotals.total) * 100)
          : 0,
        criticalTasks: taskTotals.critical
      },
      financialMetrics: {
        totalEstimated: costTotals.estimated,
        totalActual: costTotals.actual,
        totalCommitted: costTotals.committed,
        variance: costTotals.estimated - costTotals.actual,
        byCategory: costMetrics.map(c => ({
          category: c.category,
          amount: c._sum.actualAmount || 0
        }))
      },
      safetyMetrics: {
        totalIncidents: safetyTotals.total,
        openIncidents: safetyTotals.open,
        criticalIncidents: safetyTotals.critical,
        incidentRate: projectMetrics.total > 0 ? (safetyTotals.total / projectMetrics.total).toFixed(2) : '0'
      },
      rfiMetrics: {
        total: rfiTotals.total,
        open: rfiTotals.open,
        avgResponseDays: 0 // This would require raw data; omitted for performance
      },
      submittalMetrics: {
        total: submittalTotals.total,
        approved: submittalTotals.approved,
        pending: submittalTotals.pending
      },
      teamProductivity: {
        totalHoursLogged: timeTotals.totalHours,
        activeUsers: timeTotals.uniqueUsers.size,
        avgHoursPerDay: timeRange > 0
          ? (timeTotals.totalHours / timeRange).toFixed(1)
          : '0',
        topPerformers: [] // This would require raw data; omitted for performance
      },
      activityTrend: getActivityTrend(activities, timeRange),
      recentProjects: projectMetrics.sampleProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        manager: p.manager?.name,
        tasks: p._count.tasks,
        budget: p.budget
      }))
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Company analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function getActivityTrend(activities: any[], days: number) {
  const trend: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    trend[key] = 0;
  }
  activities.forEach(a => {
    const key = new Date(a.createdAt).toISOString().split('T')[0];
    if (trend[key] !== undefined) trend[key]++;
  });
  return Object.entries(trend).map(([date, count]) => ({ date, count })).reverse();
}
