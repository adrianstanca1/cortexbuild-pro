import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./_components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bigintSafe = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? Number(v) : v));


  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    projects, 
    tasks, 
    teamMembers, 
    activities,
    rfis,
    submittals,
    safetyIncidents,
    punchLists,
    inspections,
    milestones,
    changeOrders
  ] = await Promise.all([
    // Projects
    prisma.project.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: { 
        _count: { select: { tasks: true } },
        manager: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    // Tasks
    prisma.task.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { project: { select: { name: true } }, assignee: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10
    }),
    // Team members
    prisma.teamMember.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 50
    }),
    // Activities
    prisma.activityLog.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { user: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    // RFIs
    prisma.rFI.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    // Submittals
    prisma.submittal.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    // Safety Incidents (last 30 days)
    prisma.safetyIncident.findMany({
      where: {
        ...(orgId ? { project: { organizationId: orgId } } : {}),
        incidentDate: { gte: thirtyDaysAgo }
      },
      include: { project: { select: { name: true } } },
      orderBy: { incidentDate: "desc" }
    }),
    // Punch Lists
    prisma.punchList.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    // Inspections
    prisma.inspection.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { project: { select: { name: true } } },
      orderBy: { scheduledDate: "asc" },
      take: 20
    }),
    // Milestones (upcoming)
    prisma.task.findMany({
      where: {
        ...(orgId ? { project: { organizationId: orgId } } : {}),
        priority: "CRITICAL",
        dueDate: { lte: sevenDaysFromNow, gte: new Date() }
      },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5
    }),
    // Change Orders
    prisma.changeOrder.findMany({
      where: orgId ? { project: { organizationId: orgId } } : {},
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  // Calculate stats
  const stats = {
    totalProjects: projects?.length ?? 0,
    activeTasks: tasks?.filter((t: { status?: string }) => t?.status !== "COMPLETE")?.length ?? 0,
    teamMembers: teamMembers?.length ?? 0,
    pendingItems: tasks?.filter((t: { status?: string }) => t?.status === "TODO")?.length ?? 0
  };

  const projectStatusCounts = {
    PLANNING: projects?.filter((p: { status?: string }) => p?.status === "PLANNING")?.length ?? 0,
    IN_PROGRESS: projects?.filter((p: { status?: string }) => p?.status === "IN_PROGRESS")?.length ?? 0,
    ON_HOLD: projects?.filter((p: { status?: string }) => p?.status === "ON_HOLD")?.length ?? 0,
    COMPLETED: projects?.filter((p: { status?: string }) => p?.status === "COMPLETED")?.length ?? 0
  };

  // Construction-specific metrics
  type RFIType = { status?: string; dueDate?: Date | string | null };
  type SubmittalType = { status?: string };
  type SafetyType = { severity?: string };
  type PunchType = { status?: string; priority?: string };
  type InspectionType = { status?: string; scheduledDate?: Date | string | null };
  type ChangeOrderType = { status?: string; costImpact?: number | string | null };
  type ProjectType = { budget?: number | string | null };

  const constructionMetrics = {
    // RFI metrics
    openRFIs: rfis?.filter((r: RFIType) => r?.status === "OPEN" || r?.status === "DRAFT")?.length ?? 0,
    overdueRFIs: rfis?.filter((r: RFIType) => r?.dueDate && new Date(r.dueDate) < new Date() && r.status !== "CLOSED")?.length ?? 0,
    
    // Submittal metrics
    pendingSubmittals: submittals?.filter((s: SubmittalType) => s?.status === "SUBMITTED" || s?.status === "UNDER_REVIEW")?.length ?? 0,
    
    // Safety metrics
    safetyIncidentsThisMonth: safetyIncidents?.length ?? 0,
    criticalIncidents: safetyIncidents?.filter((i: SafetyType) => i?.severity === "CRITICAL" || i?.severity === "HIGH")?.length ?? 0,
    
    // Punch list metrics  
    openPunchItems: punchLists?.filter((p: PunchType) => p?.status !== "COMPLETED" && p?.status !== "VERIFIED")?.length ?? 0,
    criticalPunchItems: punchLists?.filter((p: PunchType) => p?.priority === "CRITICAL" && p?.status !== "COMPLETED")?.length ?? 0,
    
    // Inspection metrics
    upcomingInspections: inspections?.filter((i: InspectionType) => i?.status === "SCHEDULED" && new Date(i?.scheduledDate ?? 0) >= new Date())?.length ?? 0,
    failedInspections: inspections?.filter((i: InspectionType) => i?.status === "FAILED")?.length ?? 0,
    
    // Change order metrics
    pendingChangeOrders: changeOrders?.filter((c: ChangeOrderType) => c?.status === "PENDING_APPROVAL" || c?.status === "DRAFT")?.length ?? 0,
    changeOrderValue: changeOrders?.filter((c: ChangeOrderType) => c?.status === "APPROVED")?.reduce((sum: number, c: ChangeOrderType) => sum + (Number(c?.costImpact) || 0), 0) ?? 0,
    
    // Budget impact (from projects)
    totalBudget: projects?.reduce((sum: number, p: ProjectType) => sum + (Number(p?.budget) || 0), 0) ?? 0
  };

  return (
    <DashboardClient
      stats={stats}
      projects={bigintSafe(projects ?? [])}
      tasks={bigintSafe(tasks ?? [])}
      activities={bigintSafe(activities ?? [])}
      teamMembers={bigintSafe(teamMembers ?? [])}
      projectStatusCounts={projectStatusCounts}
      constructionMetrics={constructionMetrics}
      rfis={bigintSafe(rfis ?? [])}
      submittals={bigintSafe(submittals ?? [])}
      safetyIncidents={bigintSafe(safetyIncidents ?? [])}
      punchLists={bigintSafe(punchLists ?? [])}
      upcomingMilestones={bigintSafe(milestones ?? [])}
      changeOrders={bigintSafe(changeOrders ?? [])}
    />
  );
}
