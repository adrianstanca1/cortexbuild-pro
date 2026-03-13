import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; name?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const body = await request.json();
    const { reportType, projectId, dateRange, format } = body;

    if (!reportType) {
      return NextResponse.json({ error: 'Report type required' }, { status: 400 });
    }

    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    let reportData: Record<string, unknown> = {
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: user.name,
      dateRange: { start: startDate, end: endDate },
    };

    const projectFilter = projectId ? { id: projectId } : { organizationId: user.organizationId };
    const projectIds = projectId
      ? [projectId]
      : (await prisma.project.findMany({ where: { organizationId: user.organizationId }, select: { id: true } })).map(p => p.id);

    switch (reportType) {
      case 'executive_summary': {
        const [projects, tasks, rfis, submittals, changeOrders, incidents] = await Promise.all([
          prisma.project.findMany({
            where: projectFilter,
            select: { id: true, name: true, status: true, budget: true, startDate: true, endDate: true },
          }),
          prisma.task.groupBy({
            by: ['status'],
            where: { projectId: { in: projectIds } },
            _count: true,
          }),
          prisma.rFI.groupBy({
            by: ['status'],
            where: { projectId: { in: projectIds } },
            _count: true,
          }),
          prisma.submittal.groupBy({
            by: ['status'],
            where: { projectId: { in: projectIds } },
            _count: true,
          }),
          prisma.changeOrder.aggregate({
            where: { projectId: { in: projectIds } },
            _sum: { costChange: true },
            _count: true,
          }),
          prisma.safetyIncident.count({
            where: { projectId: { in: projectIds }, incidentDate: { gte: startDate, lte: endDate } },
          }),
        ]);

        reportData = {
          ...reportData,
          projects,
          taskSummary: tasks.reduce((acc, t) => { acc[t.status] = t._count; return acc; }, {} as Record<string, number>),
          rfiSummary: rfis.reduce((acc, r) => { acc[r.status] = r._count; return acc; }, {} as Record<string, number>),
          submittalSummary: submittals.reduce((acc, s) => { acc[s.status] = s._count; return acc; }, {} as Record<string, number>),
          changeOrderSummary: { count: changeOrders._count, total: changeOrders._sum?.costChange || 0 },
          safetyIncidentCount: incidents,
        };
        break;
      }

      case 'project_status': {
        if (!projectId) {
          return NextResponse.json({ error: 'Project ID required for status report' }, { status: 400 });
        }

        const [project, tasks, milestones, team] = await Promise.all([
          prisma.project.findUnique({
            where: { id: projectId },
            include: { manager: { select: { name: true } } },
          }),
          prisma.task.findMany({
            where: { projectId },
            select: { id: true, title: true, status: true, priority: true, dueDate: true, assignee: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
          }),
          prisma.task.findMany({
            where: { projectId, priority: 'CRITICAL' },
            select: { id: true, title: true, status: true, dueDate: true },
          }),
          prisma.projectTeamMember.findMany({
            where: { projectId },
            include: { teamMember: { include: { user: { select: { name: true } } } } },
          }),
        ]);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETE').length;

        reportData = {
          ...reportData,
          project,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          tasks,
          milestones,
          team: team.map(t => ({ name: t.teamMember.user.name, jobTitle: t.teamMember.jobTitle })),
        };
        break;
      }

      case 'safety': {
        const incidents = await prisma.safetyIncident.findMany({
          where: {
            projectId: { in: projectIds },
            incidentDate: { gte: startDate, lte: endDate },
          },
          include: {
            project: { select: { name: true } },
            reportedBy: { select: { name: true } },
          },
          orderBy: { incidentDate: 'desc' },
        });

        const bySeverity = await prisma.safetyIncident.groupBy({
          by: ['severity'],
          where: { projectId: { in: projectIds }, incidentDate: { gte: startDate, lte: endDate } },
          _count: true,
        });

        reportData = {
          ...reportData,
          incidents,
          summary: {
            total: incidents.length,
            bySeverity: bySeverity.reduce((acc, s) => { acc[s.severity] = s._count; return acc; }, {} as Record<string, number>),
          },
        };
        break;
      }

      case 'financial': {
        const [changeOrders, projectBudgets] = await Promise.all([
          prisma.changeOrder.findMany({
            where: { projectId: { in: projectIds }, createdAt: { gte: startDate, lte: endDate } },
            include: { project: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true, budget: true },
          }),
        ]);

        const coByStatus = await prisma.changeOrder.groupBy({
          by: ['status'],
          where: { projectId: { in: projectIds } },
          _sum: { costChange: true },
          _count: true,
        });

        reportData = {
          ...reportData,
          changeOrders,
          projectBudgets,
          summary: {
            totalChangeOrders: changeOrders.length,
            totalAmount: changeOrders.reduce((sum, co) => sum + (co.costChange || 0), 0),
            byStatus: coByStatus.reduce((acc, s) => {
              acc[s.status] = { count: s._count, amount: s._sum?.costChange || 0 };
              return acc;
            }, {} as Record<string, { count: number; amount: number }>),
          },
        };
        break;
      }

      case 'daily_log': {
        const reports = await prisma.dailyReport.findMany({
          where: {
            projectId: { in: projectIds },
            reportDate: { gte: startDate, lte: endDate },
          },
          include: {
            project: { select: { name: true } },
            createdBy: { select: { name: true } },
          },
          orderBy: { reportDate: 'desc' },
        });

        const avgWorkers = reports.length > 0
          ? Math.round(reports.reduce((sum, r) => sum + (r.manpowerCount || 0), 0) / reports.length)
          : 0;

        reportData = {
          ...reportData,
          reports,
          summary: {
            totalReports: reports.length,
            averageWorkersPerDay: avgWorkers,
            totalWorkerDays: reports.reduce((sum, r) => sum + (r.manpowerCount || 0), 0),
          },
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Format response
    if (format === 'csv' && reportType === 'daily_log') {
      const reports = reportData.reports as { reportDate: Date; project: { name: string }; manpowerCount: number; weather: string }[];
      const csv = [
        'Date,Project,Workers,Weather',
        ...reports.map(r => `${new Date(r.reportDate).toISOString().split('T')[0]},"${r.project?.name || 'N/A'}",${r.manpowerCount || 0},${r.weather || 'N/A'}`),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_report.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
