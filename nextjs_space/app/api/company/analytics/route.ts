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

    // Fetch comprehensive company analytics
    const [
      organization,
      projects,
      teamMembers,
      tasks,
      rfis,
      submittals,
      safetyIncidents,
      costItems,
      timeEntries,
      activities
    ] = await Promise.all([
      // Organization info
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: { _count: { select: { projects: true, teamMembers: true, users: true } } }
      }),
      // All projects
      prisma.project.findMany({
        where: { organizationId: user.organizationId },
        include: {
          _count: { select: { tasks: true, documents: true, teamMembers: true } },
          manager: { select: { name: true } }
        }
      }),
      // Team members with activity
      prisma.teamMember.findMany({
        where: { organizationId: user.organizationId },
        include: {
          user: { select: { name: true, email: true, lastLogin: true } },
          _count: { select: { projectAssignments: true } }
        }
      }),
      // All tasks for productivity metrics (limited to recent 10000)
      prisma.task.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, status: true, priority: true, completedAt: true, createdAt: true, assigneeId: true },
        orderBy: { createdAt: 'desc' },
        take: 10000
      }),
      // RFIs
      prisma.rFI.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, status: true, createdAt: true, answeredAt: true }
      }),
      // Submittals
      prisma.submittal.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, status: true, createdAt: true, reviewedAt: true }
      }),
      // Safety incidents
      prisma.safetyIncident.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, severity: true, status: true, incidentDate: true }
      }),
      // Cost items (limited to recent 5000)
      prisma.costItem.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, estimatedAmount: true, actualAmount: true, committedAmount: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 5000
      }),
      // Time entries (recent)
      prisma.timeEntry.findMany({
        where: { project: { organizationId: user.organizationId }, date: { gte: startDate } },
        select: { id: true, hours: true, date: true, userId: true, status: true }
      }),
      // Recent activities
      prisma.activityLog.findMany({
        where: { project: { organizationId: user.organizationId }, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    // Calculate comprehensive metrics
    const analytics = {
      organization: {
        name: organization?.name,
        totalProjects: organization?._count.projects || 0,
        totalUsers: organization?._count.users || 0,
        totalTeamMembers: organization?._count.teamMembers || 0
      },
      projectMetrics: {
        total: projects.length,
        byStatus: projects.reduce((acc: Record<string, number>, p: { status: string }) => {
          const status = p.status.toLowerCase().replace('_', '');
          const statusKey = status === 'inprogress' ? 'inProgress' : status === 'onhold' ? 'onHold' : status;
          acc[statusKey] = (acc[statusKey] || 0) + 1;
          return acc;
        }, { planning: 0, inProgress: 0, onHold: 0, completed: 0 }),
        totalBudget: projects.reduce((sum: number, p: { budget?: number | null }) => sum + (p.budget || 0), 0),
        avgTeamSize: projects.length > 0
          ? Math.round(projects.reduce((sum: number, p: { _count: { teamMembers: number } }) => sum + p._count.teamMembers, 0) / projects.length)
          : 0
      },
      taskMetrics: (() => {
        const metrics = tasks.reduce((acc: { total: number; completed: number; inProgress: number; criticalTasks: number }, t: { status: string; priority: string }) => {
          acc.total++;
          if (t.status === 'COMPLETE') acc.completed++;
          if (t.status === 'IN_PROGRESS') acc.inProgress++;
          if (t.priority === 'CRITICAL' && t.status !== 'COMPLETE') acc.criticalTasks++;
          return acc;
        }, { total: 0, completed: 0, inProgress: 0, criticalTasks: 0 });
        metrics.completionRate = metrics.total > 0
          ? Math.round((metrics.completed / metrics.total) * 100)
          : 0;
        return metrics;
      })(),
      financialMetrics: {
        totalEstimated: costItems.reduce((sum: number, c: any) => sum + (c.estimatedAmount || 0), 0),
        totalActual: costItems.reduce((sum: number, c: any) => sum + (c.actualAmount || 0), 0),
        totalCommitted: costItems.reduce((sum: number, c: any) => sum + (c.committedAmount || 0), 0),
        variance: costItems.reduce((sum: number, c: any) => sum + ((c.estimatedAmount || 0) - (c.actualAmount || 0)), 0),
        byCategory: Object.entries(
          costItems.reduce((acc: Record<string, number>, c: any) => {
            acc[c.category] = (acc[c.category] || 0) + (c.actualAmount || 0);
            return acc;
          }, {})
        ).map(([category, amount]) => ({ category, amount }))
      },
      safetyMetrics: (() => {
        const metrics = safetyIncidents.reduce((acc: any, i: any) => {
          acc.totalIncidents++;
          if (i.status === 'OPEN' || i.status === 'INVESTIGATING') acc.openIncidents++;
          if (i.severity === 'CRITICAL' || i.severity === 'HIGH') acc.criticalIncidents++;
          return acc;
        }, { totalIncidents: 0, openIncidents: 0, criticalIncidents: 0 });
        metrics.incidentRate = projects.length > 0 ? (metrics.totalIncidents / projects.length).toFixed(2) : 0;
        return metrics;
      })(),
      rfiMetrics: {
        total: rfis.length,
        open: rfis.reduce((count: number, r: any) => count + ((r.status === 'OPEN' || r.status === 'DRAFT') ? 1 : 0), 0),
        avgResponseDays: calculateAvgDays(rfis, 'createdAt', 'answeredAt')
      },
      submittalMetrics: submittals.reduce((acc: any, s: any) => {
        acc.total++;
        if (s.status === 'APPROVED') acc.approved++;
        if (s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW') acc.pending++;
        return acc;
      }, { total: 0, approved: 0, pending: 0 }),
      teamProductivity: {
        totalHoursLogged: timeEntries.reduce((sum: number, t: any) => sum + (t.hours || 0), 0),
        activeUsers: new Set(timeEntries.map((t: any) => t.userId)).size,
        avgHoursPerDay: timeEntries.length > 0
          ? (timeEntries.reduce((sum: number, t: any) => sum + (t.hours || 0), 0) / timeRange).toFixed(1)
          : 0,
        topPerformers: getTopPerformers(tasks, teamMembers)
      },
      activityTrend: getActivityTrend(activities, timeRange),
      recentProjects: projects.slice(0, 5).map((p: any) => ({
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

function calculateAvgDays(items: any[], startField: string, endField: string): number {
  const completed = items.filter(i => i[endField]);
  if (completed.length === 0) return 0;
  const totalDays = completed.reduce((sum: number, i: any) => {
    const diff = new Date(i[endField]).getTime() - new Date(i[startField]).getTime();
    return sum + (diff / (1000 * 60 * 60 * 24));
  }, 0);
  return Math.round(totalDays / completed.length);
}

function getTopPerformers(tasks: any[], teamMembers: any[]) {
  const tasksByUser = tasks.reduce((acc: Record<string, number>, t: any) => {
    if (t.status === 'COMPLETE' && t.assigneeId) {
      acc[t.assigneeId] = (acc[t.assigneeId] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(tasksByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userId, count]) => {
      const member = teamMembers.find(m => m.userId === userId);
      return { name: member?.user?.name || 'Unknown', tasksCompleted: count };
    });
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
