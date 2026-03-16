import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/summary - Comprehensive dashboard summary with all key metrics
 * Returns aggregated data for all 6 construction features:
 * - Dayworks
 * - Variations/Change Orders
 * - Payroll
 * - RAMS/Risk Assessments
 * - Projects
 * - Tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const orgId = user.organizationId;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for all features
    const [
      projects,
      tasks,
      dayworks,
      variations,
      payroll,
      riskAssessments,
      rfis,
      submittals,
      safetyIncidents,
      punchLists,
      inspections,
      teamMembers,
      recentActivities,
      criticalTasks,
    ] = await Promise.all([
      // Projects
      prisma.project.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { tasks: true, changeOrders: true } },
          manager: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Tasks
      prisma.task.findMany({
        where: { project: { organizationId: orgId } },
        include: {
          project: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // Dayworks (last 7 days)
      prisma.dailyReport.findMany({
        where: {
          project: { organizationId: orgId },
          reportDate: { gte: sevenDaysAgo },
        },
        include: {
          project: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { reportDate: 'desc' },
        take: 10,
      }),
      // Variations/Change Orders
      prisma.changeOrder.findMany({
        where: { project: { organizationId: orgId } },
        include: {
          project: { select: { name: true } },
          requestedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Payroll
      prisma.payroll.findMany({
        where: {
          organizationId: orgId,
          period: { gte: sevenDaysAgo.toISOString().slice(0, 7) },
        },
        include: {
          employee: {
            select: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { period: 'desc' },
        take: 10,
      }),
      // Risk Assessments
      prisma.riskAssessment.findMany({
        where: {
          project: { organizationId: orgId },
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          project: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // RFIs
      prisma.rFI.findMany({
        where: { project: { organizationId: orgId } },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Submittals
      prisma.submittal.findMany({
        where: { project: { organizationId: orgId } },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Safety Incidents (last 30 days)
      prisma.safetyIncident.findMany({
        where: {
          project: { organizationId: orgId },
          incidentDate: { gte: thirtyDaysAgo },
        },
        include: { project: { select: { name: true } } },
        orderBy: { incidentDate: 'desc' },
        take: 5,
      }),
      // Punch Lists
      prisma.punchList.findMany({
        where: { project: { organizationId: orgId } },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Inspections (upcoming)
      prisma.inspection.findMany({
        where: {
          project: { organizationId: orgId },
          status: 'SCHEDULED',
          scheduledDate: { gte: now },
        },
        include: { project: { select: { name: true } } },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
      }),
      // Team Members
      prisma.teamMember.findMany({
        where: { organizationId: orgId },
        include: { user: { select: { id: true, name: true, email: true } } },
        take: 20,
      }),
      // Recent Activities
      prisma.activityLog.findMany({
        where: { project: { organizationId: orgId } },
        include: {
          user: { select: { name: true } },
          project: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Critical Tasks (due within 7 days)
      prisma.task.findMany({
        where: {
          project: { organizationId: orgId },
          priority: 'CRITICAL',
          dueDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          status: { not: 'COMPLETE' },
        },
        include: { project: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
    ]);

    // Calculate summary stats
    const stats = {
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === 'IN_PROGRESS').length,
        completed: projects.filter((p) => p.status === 'COMPLETED').length,
        onHold: projects.filter((p) => p.status === 'ON_HOLD').length,
      },
      tasks: {
        total: tasks.length,
        critical: criticalTasks.length,
        overdue: tasks.filter((t) => new Date(t.dueDate!) < now && t.status !== 'COMPLETE').length,
      },
      dayworks: {
        count7Days: dayworks.length,
        totalManpower: dayworks.reduce((sum, d) => sum + (d.manpowerCount || 0), 0),
        avgCrewSize: dayworks.length > 0
          ? Math.round(dayworks.reduce((sum, d) => sum + (d.manpowerCount || 0), 0) / dayworks.length)
          : 0,
        lastReportDate: dayworks.length > 0 ? dayworks[0].reportDate.toISOString() : null,
      },
      variations: {
        total: variations.length,
        pending: variations.filter((v) => v.status === 'PENDING_APPROVAL').length,
        approved: variations.filter((v) => v.status === 'APPROVED').length,
        rejected: variations.filter((v) => v.status === 'REJECTED').length,
        totalValue: variations.reduce((sum, v) => sum + (Number(v.costChange) || 0), 0),
      },
      payroll: {
        entries: payroll.length,
        totalNet: payroll.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0),
        processed: payroll.filter((p) => p.status === 'processed').length,
        paid: payroll.filter((p) => p.status === 'paid').length,
        draft: payroll.filter((p) => p.status === 'draft').length,
      },
      safety: {
        incidents30Days: safetyIncidents.length,
        critical: safetyIncidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length,
      },
      quality: {
        openRFIs: rfis.filter((r) => r.status === 'OPEN' || r.status === 'DRAFT').length,
        pendingSubmittals: submittals.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length,
        openPunchItems: punchLists.filter((p) => p.status !== 'COMPLETED' && p.status !== 'VERIFIED').length,
        upcomingInspections: inspections.length,
      },
      team: {
        total: teamMembers.length,
      },
      cis: {
        totalProjects: projects.length,
        totalGross: payroll.reduce((sum, p) => sum + (Number(p.grossPay) || 0), 0),
        totalDeductions: payroll.reduce((sum, p) => sum + (Number(p.cisDeduction) || 0), 0),
        averageRate: payroll.length > 0 && payroll.reduce((sum, p) => sum + (Number(p.grossPay) || 0), 0) > 0
          ? Math.round((payroll.reduce((sum, p) => sum + (Number(p.cisDeduction) || 0), 0) /
              payroll.reduce((sum, p) => sum + (Number(p.grossPay) || 0), 0)) * 100)
          : 0,
      },
      rams: {
        totalDocuments: riskAssessments.length,
        documentsThisMonth: riskAssessments.filter(
          (r) => new Date(r.createdAt).getMonth() === now.getMonth() &&
                 new Date(r.createdAt).getFullYear() === now.getFullYear()
        ).length,
        activeProjects: new Set(riskAssessments.map((r) => r.projectId)).size,
        lastGeneratedDate: riskAssessments.length > 0 ? riskAssessments[0].createdAt.toISOString() : null,
      },
      deployment: {
        pm2Processes: 0,
        pm2Running: 0,
        dockerContainers: 0,
        dockerRunning: 0,
        healthStatus: 'healthy' as 'healthy' | 'warning' | 'error',
      },
    };

    const summary = {
      stats,
      recentItems: {
        projects: projects.map((p) => ({
          id: p.id,
          type: 'project',
          title: p.name,
          status: p.status,
          date: p.createdAt.toISOString(),
        })),
        tasks: tasks.map((t) => ({
          id: t.id,
          type: 'task',
          title: t.title,
          status: t.status,
          priority: t.priority,
          date: t.dueDate?.toISOString() || t.createdAt.toISOString(),
        })),
        dayworks: dayworks.map((d) => ({
          id: d.id,
          type: 'daywork',
          title: `${d.project.name} - ${d.weather}`,
          date: d.reportDate.toISOString(),
        })),
        variations: variations.map((v) => ({
          id: v.id,
          type: 'variation',
          title: v.title,
          status: v.status,
          costChange: v.costChange,
          date: v.createdAt.toISOString(),
        })),
        payroll: payroll.map((p) => ({
          id: p.id,
          type: 'payroll',
          title: `${p.employee?.user?.name} - ${p.period}`,
          status: p.status,
          netPay: p.netPay,
          date: p.createdAt.toISOString(),
        })),
        riskAssessments: riskAssessments.map((r) => ({
          id: r.id,
          type: 'risk_assessment',
          title: r.activityName || 'Risk Assessment',
          status: r.status,
          date: r.createdAt.toISOString(),
        })),
      },
      activities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        details: a.details,
        userName: a.user?.name || 'System',
        projectName: a.project?.name || null,
        createdAt: a.createdAt,
      })),
      alerts: {
        criticalTasks: criticalTasks.map((t) => ({
          type: 'critical_task',
          title: t.title,
          project: t.project.name,
          dueDate: t.dueDate,
        })),
        failedInspections: inspections.filter((i) => i.status === 'FAILED').length,
        overdueRFIs: rfis.filter((r) => r.dueDate && new Date(r.dueDate) < now && r.status !== 'CLOSED').length,
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
