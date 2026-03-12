import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek } from "date-fns";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper function to group items by projectId for O(1) lookups
function groupByProjectId<T extends { projectId: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  items.forEach(item => {
    if (!map.has(item.projectId)) map.set(item.projectId, []);
    map.get(item.projectId)!.push(item);
  });
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const period = searchParams.get('period') || '6months'; // 6months, 12months, all

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '12months':
        startDate = subMonths(now, 12);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate = subMonths(now, 6);
    }

    const projectFilter = projectId 
      ? { projectId } 
      : { project: { organizationId: orgId } };

    // Fetch all safety data in parallel
    const [
      toolboxTalks,
      mewpChecks,
      toolChecks,
      safetyIncidents,
      inspections,
      projects
    ] = await Promise.all([
      // Toolbox talks
      prisma.toolboxTalk.findMany({
        where: {
          ...projectFilter,
          date: { gte: startDate }
        },
        include: {
          project: { select: { id: true, name: true } },
          presenter: { select: { name: true } },
          _count: { select: { attendees: true } }
        },
        orderBy: { date: 'desc' }
      }),
      // MEWP checks
      prisma.mEWPCheck.findMany({
        where: {
          ...projectFilter,
          checkDate: { gte: startDate }
        },
        include: {
          project: { select: { id: true, name: true } },
          operator: { select: { name: true } }
        },
        orderBy: { checkDate: 'desc' }
      }),
      // Tool checks
      prisma.toolCheck.findMany({
        where: {
          ...projectFilter,
          checkDate: { gte: startDate }
        },
        include: {
          project: { select: { id: true, name: true } },
          inspector: { select: { name: true } }
        },
        orderBy: { checkDate: 'desc' }
      }),
      // Safety incidents
      prisma.safetyIncident.findMany({
        where: {
          ...projectFilter,
          incidentDate: { gte: startDate }
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { incidentDate: 'desc' }
      }),
      // Inspections
      prisma.inspection.findMany({
        where: {
          ...projectFilter,
          scheduledDate: { gte: startDate }
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { scheduledDate: 'desc' }
      }),
      // Projects for filtering
      prisma.project.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true }
      })
    ]);

    // Calculate summary stats with single-pass reduce operations
    const summary = {
      toolboxTalks: {
        total: toolboxTalks.length,
        completed: toolboxTalks.filter(t => t.status === 'COMPLETED').length,
        totalAttendees: toolboxTalks.reduce((sum, t) => sum + (t._count?.attendees || 0), 0),
        thisWeek: toolboxTalks.filter(t => {
          const talkDate = new Date(t.date);
          return talkDate >= startOfWeek(now) && talkDate <= endOfWeek(now);
        }).length
      },
      mewpChecks: (() => {
        const stats = mewpChecks.reduce((acc, c) => {
          if (c.overallStatus === 'PASS') acc.passed++;
          else if (c.overallStatus === 'FAIL') acc.failed++;
          else if (c.overallStatus === 'NEEDS_ATTENTION') acc.needsAttention++;
          if (c.isSafeToUse) acc.safeToUse++;
          return acc;
        }, { passed: 0, failed: 0, needsAttention: 0, safeToUse: 0 });
        
        return {
          total: mewpChecks.length,
          passed: stats.passed,
          failed: stats.failed,
          needsAttention: stats.needsAttention,
          safeToUse: stats.safeToUse,
          passRate: mewpChecks.length > 0 ? Math.round((stats.passed / mewpChecks.length) * 100) : 0
        };
      })(),
      toolChecks: (() => {
        const stats = toolChecks.reduce((acc, c) => {
          if (c.overallStatus === 'PASS') acc.passed++;
          else if (c.overallStatus === 'FAIL') acc.failed++;
          else if (c.overallStatus === 'NEEDS_ATTENTION') acc.needsAttention++;
          if (c.isSafeToUse) acc.safeToUse++;
          
          // Track by type
          if (c.toolType === 'POWER_TOOL') acc.byType.POWER_TOOL++;
          else if (c.toolType === 'HAND_TOOL') acc.byType.HAND_TOOL++;
          else if (c.toolType === 'LADDER') acc.byType.LADDER++;
          else if (c.toolType === 'SCAFFOLD') acc.byType.SCAFFOLD++;
          else if (c.toolType === 'OTHER') acc.byType.OTHER++;
          
          return acc;
        }, { 
          passed: 0, 
          failed: 0, 
          needsAttention: 0, 
          safeToUse: 0,
          byType: { POWER_TOOL: 0, HAND_TOOL: 0, LADDER: 0, SCAFFOLD: 0, OTHER: 0 }
        });
        
        return {
          total: toolChecks.length,
          passed: stats.passed,
          failed: stats.failed,
          needsAttention: stats.needsAttention,
          safeToUse: stats.safeToUse,
          passRate: toolChecks.length > 0 ? Math.round((stats.passed / toolChecks.length) * 100) : 0,
          byType: stats.byType
        };
      })(),
      safetyIncidents: (() => {
        const stats = safetyIncidents.reduce((acc, i) => {
          if (i.severity === 'CRITICAL') acc.critical++;
          else if (i.severity === 'HIGH') acc.high++;
          else if (i.severity === 'MEDIUM') acc.medium++;
          else if (i.severity === 'LOW') acc.low++;
          if (i.status === 'RESOLVED' || i.status === 'CLOSED') acc.resolved++;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0, resolved: 0 });
        
        return {
          total: safetyIncidents.length,
          critical: stats.critical,
          high: stats.high,
          medium: stats.medium,
          low: stats.low,
          resolved: stats.resolved
        };
      })(),
      inspections: (() => {
        const stats = inspections.reduce((acc, i) => {
          if (i.status === 'PASSED') { acc.passed++; acc.completed++; }
          else if (i.status === 'FAILED') { acc.failed++; acc.completed++; }
          else if (i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS') acc.pending++;
          return acc;
        }, { passed: 0, failed: 0, pending: 0, completed: 0 });
        
        return {
          total: inspections.length,
          passed: stats.passed,
          failed: stats.failed,
          pending: stats.pending,
          passRate: stats.completed > 0 ? Math.round((stats.passed / stats.completed) * 100) : 0
        };
      })(),
      complianceScore: 0
    };

    // Calculate overall compliance score
    const weights = {
      toolboxTalks: 0.25,
      mewpChecks: 0.25,
      toolChecks: 0.25,
      inspections: 0.25
    };

    const toolboxScore = summary.toolboxTalks.total > 0 
      ? (summary.toolboxTalks.completed / summary.toolboxTalks.total) * 100 : 100;
    const mewpScore = summary.mewpChecks.passRate;
    const toolScore = summary.toolChecks.passRate;
    const inspectionScore = summary.inspections.passRate;

    summary.complianceScore = Math.round(
      toolboxScore * weights.toolboxTalks +
      mewpScore * weights.mewpChecks +
      toolScore * weights.toolChecks +
      inspectionScore * weights.inspections
    );

    // Generate monthly trend data
    const monthlyData: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthLabel = format(monthStart, 'MMM yyyy');

      monthlyData.push({
        month: monthLabel,
        toolboxTalks: toolboxTalks.filter(t => {
          const d = new Date(t.date);
          return d >= monthStart && d <= monthEnd;
        }).length,
        mewpChecks: mewpChecks.filter(c => {
          const d = new Date(c.checkDate);
          return d >= monthStart && d <= monthEnd;
        }).length,
        toolChecks: toolChecks.filter(c => {
          const d = new Date(c.checkDate);
          return d >= monthStart && d <= monthEnd;
        }).length,
        incidents: safetyIncidents.filter(i => {
          const d = new Date(i.incidentDate);
          return d >= monthStart && d <= monthEnd;
        }).length,
        inspectionsPassed: inspections.filter(i => {
          if (!i.scheduledDate) return false;
          const d = new Date(i.scheduledDate);
          return d >= monthStart && d <= monthEnd && i.status === 'PASSED';
        }).length,
        inspectionsFailed: inspections.filter(i => {
          if (!i.scheduledDate) return false;
          const d = new Date(i.scheduledDate);
          return d >= monthStart && d <= monthEnd && i.status === 'FAILED';
        }).length
      });
    }

    // Project breakdown - use Map for O(1) lookups instead of O(n) filters
    // Create index maps for each data type by projectId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ToolboxTalk = typeof toolboxTalks[number];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type MewpCheck = typeof mewpChecks[number];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ToolCheck = typeof toolChecks[number];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type SafetyIncident = typeof safetyIncidents[number];
    
    const toolboxByProject = groupByProjectId(toolboxTalks);
    const mewpByProject = groupByProjectId(mewpChecks);
    const toolByProject = groupByProjectId(toolChecks);
    const incidentsByProject = groupByProjectId(safetyIncidents);

    const projectBreakdown = projects.map(p => {
      const pToolbox = toolboxByProject.get(p.id) || [];
      const pMewp = mewpByProject.get(p.id) || [];
      const pTool = toolByProject.get(p.id) || [];
      const pIncidents = incidentsByProject.get(p.id) || [];

      // Calculate stats with single-pass reduce instead of multiple filters
      const toolboxCompleted = pToolbox.reduce((sum, t) => sum + (t.status === 'COMPLETED' ? 1 : 0), 0);
      const mewpPassed = pMewp.reduce((sum, c) => sum + (c.overallStatus === 'PASS' ? 1 : 0), 0);
      const toolPassed = pTool.reduce((sum, c) => sum + (c.overallStatus === 'PASS' ? 1 : 0), 0);
      const criticalIncidents = pIncidents.reduce((sum, i) => sum + (i.severity === 'CRITICAL' || i.severity === 'HIGH' ? 1 : 0), 0);

      return {
        id: p.id,
        name: p.name,
        toolboxTalks: pToolbox.length,
        toolboxCompleted,
        mewpChecks: pMewp.length,
        mewpPassRate: pMewp.length > 0 
          ? Math.round((mewpPassed / pMewp.length) * 100) 
          : 0,
        toolChecks: pTool.length,
        toolPassRate: pTool.length > 0 
          ? Math.round((toolPassed / pTool.length) * 100) 
          : 0,
        incidents: pIncidents.length,
        criticalIncidents
      };
    }).filter(p => p.toolboxTalks > 0 || p.mewpChecks > 0 || p.toolChecks > 0 || p.incidents > 0);

    // Recent activity
    const recentActivity = [
      ...toolboxTalks.slice(0, 5).map(t => ({
        type: 'toolbox_talk',
        title: t.title,
        project: t.project.name,
        date: t.date,
        status: t.status,
        details: `${t._count?.attendees || 0} attendees`
      })),
      ...mewpChecks.slice(0, 5).map(c => ({
        type: 'mewp_check',
        title: c.equipmentName || 'MEWP Check',
        project: c.project.name,
        date: c.checkDate,
        status: c.overallStatus,
        details: c.operator?.name || 'Unknown operator'
      })),
      ...toolChecks.slice(0, 5).map(c => ({
        type: 'tool_check',
        title: c.toolName || 'Tool Check',
        project: c.project.name,
        date: c.checkDate,
        status: c.overallStatus,
        details: c.toolType
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    // Equipment with issues (failed or needs attention)
    const equipmentWithIssues = [
      ...mewpChecks
        .filter(c => c.overallStatus !== 'PASS')
        .map(c => ({
          type: 'MEWP',
          name: c.equipmentName,
          serialNumber: c.equipmentSerial,
          project: c.project.name,
          status: c.overallStatus,
          defects: c.defectsFound,
          checkDate: c.checkDate
        })),
      ...toolChecks
        .filter(c => c.overallStatus !== 'PASS')
        .map(c => ({
          type: c.toolType,
          name: c.toolName,
          serialNumber: c.toolSerial,
          project: c.project.name,
          status: c.overallStatus,
          defects: c.defectsFound,
          checkDate: c.checkDate
        }))
    ].sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime());

    return NextResponse.json({
      summary,
      monthlyData,
      projectBreakdown,
      recentActivity,
      equipmentWithIssues,
      projects
    });
  } catch (error) {
    console.error('Error fetching safety analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
