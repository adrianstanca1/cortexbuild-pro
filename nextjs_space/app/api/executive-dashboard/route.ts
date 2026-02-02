import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Fetch all key metrics in parallel
    const [projects, tasks, risks, changeOrders, incidents, defects, forecasts, signals] = await Promise.all([
      // Projects summary
      prisma.project.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          status: true,
          budget: true,
          startDate: true,
          endDate: true,
          phase: true,
          _count: {
            select: {
              tasks: true,
              changeOrders: true,
              riskRegister: true,
              safetyIncidents: true
            }
          }
        }
      }),
      // Tasks summary
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { organizationId } },
        _count: true
      }),
      // Risks summary
      prisma.riskRegisterEntry.groupBy({
        by: ['riskLevel', 'status'],
        where: { project: { organizationId } },
        _count: true,
        _sum: { costImpactMostLikely: true }
      }),
      // Change orders summary
      prisma.changeOrder.groupBy({
        by: ['status'],
        where: { project: { organizationId } },
        _count: true,
        _sum: { costChange: true }
      }),
      // Safety incidents
      prisma.safetyIncident.findMany({
        where: {
          project: { organizationId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        },
        select: {
          id: true,
          severity: true,
          status: true,
          injuryOccurred: true
        }
      }),
      // Defects summary
      prisma.defect.groupBy({
        by: ['status'],
        where: { project: { organizationId } },
        _count: true
      }),
      // Latest forecasts (one per project)
      prisma.forecastEntry.findMany({
        where: { project: { organizationId } },
        orderBy: { forecastDate: 'desc' },
        distinct: ['projectId'],
        select: {
          id: true,
          projectId: true,
          forecastAtCompletion: true,
          costPerformanceIndex: true,
          schedulePerformanceIndex: true,
          varianceAtCompletion: true
        }
      }),
      // Active signals
      prisma.predictiveSignal.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        orderBy: { severity: 'desc' },
        take: 10
      })
    ]);

    // Calculate aggregated metrics
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
    const delayedProjects = projects.filter(p => p.endDate && new Date(p.endDate) < new Date() && p.status !== 'COMPLETED').length;

    // Task metrics
    const taskCounts: Record<string, number> = {};
    tasks.forEach(t => { taskCounts[t.status] = t._count; });

    // Risk metrics
    const openRisks = risks.filter(r => r.status === 'OPEN' || r.status === 'MITIGATING');
    const criticalRisks = openRisks.filter(r => r.riskLevel === 'CRITICAL');
    const highRisks = openRisks.filter(r => r.riskLevel === 'HIGH');
    const riskExposure = openRisks.reduce((sum, r) => sum + (r._sum?.costImpactMostLikely || 0), 0);

    // Change order metrics
    const pendingCOs = changeOrders.find(c => c.status === 'PENDING_APPROVAL');
    const approvedCOs = changeOrders.find(c => c.status === 'APPROVED');
    const totalCOValue = changeOrders.reduce((sum, c) => sum + (c._sum?.costChange || 0), 0);

    // Safety metrics
    const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
    const ltiCount = incidents.filter(i => i.injuryOccurred).length;

    // Defect metrics
    const openDefects = defects.filter(d => d.status !== 'VERIFIED').reduce((sum, d) => sum + d._count, 0);

    // Earned value metrics from forecasts
    const avgCPI = forecasts.length > 0 
      ? forecasts.reduce((sum, f) => sum + (f.costPerformanceIndex || 1), 0) / forecasts.length
      : 1;
    const avgSPI = forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + (f.schedulePerformanceIndex || 1), 0) / forecasts.length
      : 1;

    const dashboardData = {
      summary: {
        totalProjects: projects.length,
        activeProjects,
        delayedProjects,
        totalBudget,
        totalProjectValue: totalBudget
      },
      schedule: {
        projectsOnSchedule: projects.length - delayedProjects,
        projectsDelayed: delayedProjects,
        schedulePerformanceIndex: avgSPI,
        tasksTotal: Object.values(taskCounts).reduce((a, b) => a + b, 0),
        tasksCompleted: taskCounts['COMPLETE'] || 0,
        tasksInProgress: taskCounts['IN_PROGRESS'] || 0
      },
      cost: {
        totalBudget,
        costPerformanceIndex: avgCPI,
        changeOrderValue: totalCOValue,
        pendingChangeOrders: pendingCOs?._count || 0,
        approvedChangeOrders: approvedCOs?._count || 0
      },
      risk: {
        openRisks: openRisks.reduce((sum, r) => sum + r._count, 0),
        criticalRisks: criticalRisks.reduce((sum, r) => sum + r._count, 0),
        highRisks: highRisks.reduce((sum, r) => sum + r._count, 0),
        riskExposure
      },
      safety: {
        openIncidents,
        incidentsThisMonth: incidents.length,
        lostTimeInjuries: ltiCount
      },
      quality: {
        openDefects,
        defectRate: projects.length > 0 ? openDefects / projects.length : 0
      },
      signals: signals.map(s => ({
        id: s.id,
        type: s.signalType,
        name: s.signalName,
        severity: s.severity,
        projectId: s.projectId
      })),
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        phase: p.phase,
        budget: p.budget,
        tasksCount: p._count.tasks,
        risksCount: p._count.riskRegister,
        changeOrdersCount: p._count.changeOrders
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching executive dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
