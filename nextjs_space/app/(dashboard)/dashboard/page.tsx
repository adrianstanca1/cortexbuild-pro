import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./_components/dashboard-client";
import { CisWidget } from "../../../../components/dashboard/widgets/CisWidget";
import { DayworksWidget } from "../../../../components/dashboard/widgets/DayworksWidget";
import { VariationsWidget } from "../../../../components/dashboard/widgets/VariationsWidget";
import { PayrollWidget } from "../../../../components/dashboard/widgets/PayrollWidget";
import { RamsWidget } from "../../../../components/dashboard/widgets/RamsWidget";
import { DeploymentWidget } from "../../../../components/dashboard/widgets/DeploymentWidget";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const orgId = (session.user as { organizationId?: string })?.organizationId;
  if (!orgId) redirect("/login");

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
    upcomingMilestones,
    changeOrders,
    dayworks,
    payroll,
    riskAssessments,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { tasks: true } },
        manager: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: { project: { organizationId: orgId } },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.teamMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 50,
    }),
    prisma.activityLog.findMany({
      where: { project: { organizationId: orgId } },
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.rFI.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.submittal.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.safetyIncident.findMany({
      where: {
        project: { organizationId: orgId },
        incidentDate: { gte: thirtyDaysAgo },
      },
      include: { project: { select: { name: true } } },
      orderBy: { incidentDate: "desc" },
    }),
    prisma.punchList.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.inspection.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { scheduledDate: "asc" },
      take: 20,
    }),
    prisma.task.findMany({
      where: {
        project: { organizationId: orgId },
        priority: "CRITICAL",
        dueDate: { lte: sevenDaysFromNow, gte: new Date() },
      },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.changeOrder.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Dayworks (last 7 days)
    prisma.dailyReport.findMany({
      where: {
        project: { organizationId: orgId },
        reportDate: { gte: thirtyDaysAgo },
      },
      include: { project: { select: { name: true } } },
      orderBy: { reportDate: "desc" },
      take: 10,
    }),
    // Payroll
    prisma.payroll.findMany({
      where: { organizationId: orgId },
      include: {
        employee: {
          select: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { period: "desc" },
      take: 10,
    }),
    // Risk Assessments
    prisma.riskAssessment.findMany({
      where: {
        project: { organizationId: orgId },
      },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = {
    totalProjects: projects.length,
    activeTasks: tasks.filter((t) => t.status !== "COMPLETE").length,
    teamMembers: teamMembers.length,
    pendingItems: tasks.filter((t) => t.status === "TODO").length,
  };

  const projectStatusCounts = {
    PLANNING: projects.filter((p) => p.status === "PLANNING").length,
    IN_PROGRESS: projects.filter((p) => p.status === "IN_PROGRESS").length,
    ON_HOLD: projects.filter((p) => p.status === "ON_HOLD").length,
    COMPLETED: projects.filter((p) => p.status === "COMPLETED").length,
  };

  const constructionMetrics = {
    openRFIs: rfis.filter((r) => r.status === "OPEN" || r.status === "DRAFT")
      .length,
    overdueRFIs: rfis.filter(
      (r) =>
        r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "CLOSED",
    ).length,
    pendingSubmittals: submittals.filter(
      (s) => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW",
    ).length,
    safetyIncidentsThisMonth: safetyIncidents.length,
    criticalIncidents: safetyIncidents.filter(
      (i) => i.severity === "CRITICAL" || i.severity === "HIGH",
    ).length,
    openPunchItems: punchLists.filter(
      (p) => p.status !== "COMPLETED" && p.status !== "VERIFIED",
    ).length,
    criticalPunchItems: punchLists.filter(
      (p) => p.priority === "CRITICAL" && p.status !== "COMPLETED",
    ).length,
    upcomingInspections: inspections.filter(
      (i) =>
        i.status === "SCHEDULED" &&
        new Date(i.scheduledDate ?? 0) >= new Date(),
    ).length,
    failedInspections: inspections.filter((i) => i.status === "FAILED").length,
    pendingChangeOrders: changeOrders.filter(
      (c) => c.status === "PENDING_APPROVAL" || c.status === "DRAFT",
    ).length,
    changeOrderValue: changeOrders
      .filter((c) => c.status === "APPROVED")
      .reduce((sum, c) => sum + (Number(c.costChange) || 0), 0),
    totalBudget: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
    dayworksCount: dayworks.length,
    payrollEntries: payroll.length,
    riskAssessmentsCount: riskAssessments.length,
  };

  // Construction features summary for widgets
  const featuresSummary = {
    cis: {
      totalProjects: projects.length,
      totalGross: payroll.reduce((sum, p) => sum + (Number(p.grossPay) || 0), 0),
      totalDeductions: payroll.reduce((sum, p) => sum + (Number(p.cisDeduction) || 0), 0),
    },
    dayworks: {
      count7Days: dayworks.length,
      avgCrewSize: dayworks.length > 0
        ? Math.round(dayworks.reduce((sum, d) => sum + (d.manpowerCount || 0), 0) / dayworks.length)
        : 0,
    },
    variations: {
      pending: changeOrders.filter((c) => c.status === "PENDING_APPROVAL").length,
      totalCostChange: changeOrders.reduce((sum, c) => sum + (Number(c.costChange) || 0), 0),
    },
    payroll: {
      draft: payroll.filter((p) => p.status === "draft").length,
      totalNetPay: payroll.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0),
    },
    rams: {
      totalDocuments: riskAssessments.length,
      documentsThisMonth: riskAssessments.filter(
        (r) => new Date(r.createdAt).getMonth() === new Date().getMonth() &&
               new Date(r.createdAt).getFullYear() === new Date().getFullYear()
      ).length,
    },
    deployment: {
      healthStatus: "healthy" as "healthy" | "warning" | "error",
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialize = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-6">
      {/* Construction Features Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <CisWidget />
        <DayworksWidget />
        <VariationsWidget />
        <PayrollWidget />
        <RamsWidget />
        <DeploymentWidget />
      </div>

      <DashboardClient
        stats={stats}
        projects={serialize(projects)}
        tasks={serialize(tasks)}
        activities={serialize(activities)}
        teamMembers={serialize(teamMembers)}
        projectStatusCounts={projectStatusCounts}
        constructionMetrics={constructionMetrics}
        rfis={serialize(rfis)}
        submittals={serialize(submittals)}
        safetyIncidents={serialize(safetyIncidents)}
        punchLists={serialize(punchLists)}
        upcomingMilestones={serialize(upcomingMilestones)}
        changeOrders={serialize(changeOrders)}
        dayworks={serialize(dayworks)}
        payroll={serialize(payroll)}
        riskAssessments={serialize(riskAssessments)}
        featuresSummary={serialize(featuresSummary)}
      />
    </div>
  );
}
