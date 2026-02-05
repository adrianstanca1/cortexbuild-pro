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
      // All tasks for productivity metrics
      prisma.task.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, status: true, priority: true, completedAt: true, createdAt: true, assigneeId: true }
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
      // Cost items
      prisma.costItem.findMany({
        where: { project: { organizationId: user.organizationId } },
        select: { id: true, estimatedAmount: true, actualAmount: true, committedAmount: true, category: true }
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
        byStatus: {
          planning: projects.filter(p => p.status === 'PLANNING').length,
          inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
          onHold: projects.filter(p => p.status === 'ON_HOLD').length,
          completed: projects.filter(p => p.status === 'COMPLETED').length
        },
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        avgTeamSize: projects.length > 0 
          ? Math.round(projects.reduce((sum, p) => sum + p._count.teamMembers, 0) / projects.length)
          : 0
      },
      taskMetrics: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'COMPLETE').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completionRate: tasks.length > 0 
          ? Math.round((tasks.filter(t => t.status === 'COMPLETE').length / tasks.length) * 100)
          : 0,
        criticalTasks: tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'COMPLETE').length
      },
      financialMetrics: {
        totalEstimated: costItems.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0),
        totalActual: costItems.reduce((sum, c) => sum + (c.actualAmount || 0), 0),
        totalCommitted: costItems.reduce((sum, c) => sum + (c.committedAmount || 0), 0),
        variance: costItems.reduce((sum, c) => sum + ((c.estimatedAmount || 0) - (c.actualAmount || 0)), 0),
        byCategory: Object.entries(
          costItems.reduce((acc: Record<string, number>, c) => {
            acc[c.category] = (acc[c.category] || 0) + (c.actualAmount || 0);
            return acc;
          }, {})
        ).map(([category, amount]) => ({ category, amount }))
      },
      safetyMetrics: {
        totalIncidents: safetyIncidents.length,
        openIncidents: safetyIncidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length,
        criticalIncidents: safetyIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length,
        incidentRate: projects.length > 0 ? (safetyIncidents.length / projects.length).toFixed(2) : 0
      },
      rfiMetrics: {
        total: rfis.length,
        open: rfis.filter(r => r.status === 'OPEN' || r.status === 'DRAFT').length,
        avgResponseDays: calculateAvgDays(rfis, 'createdAt', 'answeredAt')
      },
      submittalMetrics: {
        total: submittals.length,
        approved: submittals.filter(s => s.status === 'APPROVED').length,
        pending: submittals.filter(s => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length
      },
      teamProductivity: {
        totalHoursLogged: timeEntries.reduce((sum, t) => sum + (t.hours || 0), 0),
        activeUsers: new Set(timeEntries.map(t => t.userId)).size,
        avgHoursPerDay: timeEntries.length > 0
          ? (timeEntries.reduce((sum, t) => sum + (t.hours || 0), 0) / timeRange).toFixed(1)
          : 0,
        topPerformers: getTopPerformers(tasks, teamMembers)
      },
      activityTrend: getActivityTrend(activities, timeRange),
      recentProjects: projects.slice(0, 5).map(p => ({
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
  const totalDays = completed.reduce((sum, i) => {
    const diff = new Date(i[endField]).getTime() - new Date(i[startField]).getTime();
    return sum + (diff / (1000 * 60 * 60 * 24));
  }, 0);
  return Math.round(totalDays / completed.length);
}

function getTopPerformers(tasks: any[], teamMembers: any[]) {
  const tasksByUser: Record<string, number> = {};
  tasks.filter(t => t.status === 'COMPLETE' && t.assigneeId).forEach(t => {
    tasksByUser[t.assigneeId] = (tasksByUser[t.assigneeId] || 0) + 1;
  });
  
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
