"use client";

import { useEffect, useState } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./_components/dashboard-client";
import { 
  LoadingSkeleton, 
  LoadingGrid, 
  LoadingCard,
  ErrorBoundary,
  useAsyncData
} from "./_components/ui";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [session, setSession] = useState<null | any>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getServerSession(authOptions);
      setSession(sessionData);
      setOrgId(sessionData?.user?.organizationId ?? null);
    };

    fetchSession();
  }, []);

  // If not authenticated, redirect or show login prompt
  if (!session || !orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please sign in to access the dashboard.</p>
          {/* In a real app, this would redirect to sign-in page */}
        </div>
      </div>
    );
  }

  // Define date ranges for queries
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Use async data hook for each data fetching operation
  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
    retry: retryProjects
  } = useAsyncData(() => 
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { tasks: true } },
        manager: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  );

  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
    retry: retryTasks
  } = useAsyncData(() => 
    prisma.task.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } }, assignee: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10
    })
  );

  const {
    data: teamMembers,
    isLoading: teamMembersLoading,
    isError: teamMembersError,
    retry: retryTeamMembers
  } = useAsyncData(() => 
    prisma.teamMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 50
    })
  );

  const {
    data: activities,
    isLoading: activitiesLoading,
    isError: activitiesError,
    retry: retryActivities
  } = useAsyncData(() => 
    prisma.activityLog.findMany({
      where: { project: { organizationId: orgId } },
      include: { user: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  );

  const {
    data: rfis,
    isLoading: rfisLoading,
    isError: rfisError,
    retry: retryRfis
  } = useAsyncData(() => 
    prisma.rFI.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    )
  );

  const {
    data: submittals,
    isLoading: submittalsLoading,
    isError: submittalsError,
    retry: retrySubmittals
  } = useAsyncData(() => 
    prisma.submittal.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    )
  );

  const {
    data: safetyIncidents,
    isLoading: safetyIncidentsLoading,
    isError: safetyIncidentsError,
    retry: retrySafetyIncidents
  } = useAsyncData(() => 
    prisma.safetyIncident.findMany({
      where: {
        project: { organizationId: orgId },
        incidentDate: { gte: thirtyDaysAgo }
      },
      include: { project: { select: { name: true } } },
      orderBy: { incidentDate: "desc" }
    })
  );

  const {
    data: punchLists,
    isLoading: punchListsLoading,
    isError: punchListsError,
    retry: retryPunchLists
  } = useAsyncData(() => 
    prisma.punchList.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    )
  );

  const {
    data: inspections,
    isLoading: inspectionsLoading,
    isError: inspectionsError,
    retry: retryInspections
  } = useAsyncData(() => 
    prisma.inspection.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { scheduledDate: "asc" },
      take: 20
    )
  );

  const {
    data: milestones,
    isLoading: milestonesLoading,
    isError: milestonesError,
    retry: retryMilestones
  } = useAsyncData(() => 
    prisma.task.findMany({
      where: {
        project: { organizationId: orgId },
        priority: "CRITICAL",
        dueDate: { lte: sevenDaysFromNow, gte: new Date() }
      },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5
    })
  );

  const {
    data: changeOrders,
    isLoading: changeOrdersLoading,
    isError: changeOrdersError,
    retry: retryChangeOrders
  } = useAsyncData(() => 
    prisma.changeOrder.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  );

  // Calculate stats with loading states
  const stats = {
    totalProjects: projectsLoading ? 0 : (projects?.length ?? 0),
    activeTasks: tasksLoading ? 0 : (tasks?.filter((t: any) => t?.status !== "COMPLETE")?.length ?? 0),
    teamMembers: teamMembersLoading ? 0 : (teamMembers?.length ?? 0),
    pendingItems: tasksLoading ? 0 : (tasks?.filter((t: any) => t?.status === "TODO")?.length ?? 0)
  };

  const projectStatusCounts = {
    PLANNING: projectsLoading ? 0 : (projects?.filter((p: any) => p?.status === "PLANNING")?.length ?? 0),
    IN_PROGRESS: projectsLoading ? 0 : (projects?.filter((p: any) => p?.status === "IN_PROGRESS")?.length ?? 0),
    ON_HOLD: projectsLoading ? 0 : (projects?.filter((p: any) => p?.status === "ON_HOLD")?.length ?? 0),
    COMPLETED: projectsLoading ? 0 : (projects?.filter((p: any) => p?.status === "COMPLETED")?.length ?? 0)
  };

  // Construction-specific metrics with loading states
  const constructionMetrics = {
    // RFI metrics
    openRFIs: rfisLoading || rfisError ? 0 : (rfis?.filter((r: any) => r?.status === "OPEN" || r?.status === "DRAFT")?.length ?? 0),
    overdueRFIs: rfisLoading || rfisError ? 0 : (rfis?.filter((r: any) => r?.dueDate && new Date(r.dueDate) < new Date() && r.status !== "CLOSED")?.length ?? 0),

    // Submittal metrics
    pendingSubmittals: submittalsLoading || submittalsError ? 0 : (submittals?.filter((s: any) => s?.status === "SUBMITTED" || s?.status === "UNDER_REVIEW")?.length ?? 0),

    // Safety metrics
    safetyIncidentsThisMonth: safetyIncidentsLoading || safetyIncidentsError ? 0 : (safetyIncidents?.length ?? 0),
    criticalIncidents: safetyIncidentsLoading || safetyIncidentsError ? 0 : (safetyIncidents?.filter((i: any) => i?.severity === "CRITICAL" || i?.severity === "HIGH")?.length ?? 0),

    // Punch list metrics  
    openPunchItems: punchListsLoading || punchListsError ? 0 : (punchLists?.filter((p: any) => p?.status !== "COMPLETED" && p?.status !== "VERIFIED")?.length ?? 0),
    criticalPunchItems: punchListsLoading || punchListsError ? 0 : (punchLists?.filter((p: any) => p?.priority === "CRITICAL" && p?.status !== "COMPLETED")?.length ?? 0),

    // Inspection metrics
    upcomingInspections: inspectionsLoading || inspectionsError ? 0 : (inspections?.filter((i: any) => i?.status === "SCHEDULED" && new Date(i?.scheduledDate ?? 0) >= new Date())?.length ?? 0),
    failedInspections: inspectionsLoading || inspectionsError ? 0 : (inspections?.filter((i: any) => i?.status === "FAILED")?.length ?? 0),

    // Change order metrics
    pendingChangeOrders: changeOrdersLoading || changeOrdersError ? 0 : (changeOrders?.filter((c: any) => c?.status === "PENDING_APPROVAL" || c?.status === "DRAFT")?.length ?? 0),
    changeOrderValue: changeOrdersLoading || changeOrdersError ? 0 : 
      (changeOrders?.filter((c: any) => c?.status === "APPROVED")?.reduce((sum: number, c: any) => sum + (Number((c as any)?.costImpact) || 0), 0) ?? 0),

    // Budget impact (from projects)
    totalBudget: projectsLoading || projectsError ? 0 : 
      (projects?.reduce((sum: number, p: any) => sum + (Number(p?.budget) || 0), 0) ?? 0)
  };

  // Show loading skeleton while data is fetching
  const isLoading = 
    projectsLoading || 
    tasksLoading || 
    teamMembersLoading || 
    activitiesLoading ||
    rfisLoading ||
    submittalsLoading ||
    safetyIncidentsLoading ||
    punchListsLoading ||
    inspectionsLoading ||
    milestonesLoading ||
    changeOrdersLoading;

  // Show error if any data fetch failed
  const hasError = 
    projectsError ||
    tasksError ||
    teamMembersError ||
    activitiesError ||
    rfisError ||
    submittalsError ||
    safetyIncidentsError ||
    punchListsError ||
    inspectionsError ||
    milestonesError ||
    changeOrdersError;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <LoadingCard title={true} content={true} actions={false} className="mb-6" />
          <LoadingGrid cols={2} gap={4} rows={2} className="mb-6" />
          <LoadingCard title={true} content={true} actions={true} />
        </div>
      </ErrorBoundary>
    );
  }

  if (hasError) {
    return (
      <ErrorBoundary 
        fallback={({ error, resetError }) => (
          <div className="p-6 text-center">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Dashboard Error
              </h2>
              <p className="mb-4">
                {error.message}
              </p>
              <button 
                onClick={resetError} 
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Retry Loading
              </button>
            </div>
            <div className="space-x-3">
              {projectsError && <button onClick={retryProjects} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Projects</button>}
              {tasksError && <button onClick={retryTasks} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Tasks</button>}
              {teamMembersError && <button onClick={retryTeamMembers} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Team</button>}
              {activitiesError && <button onClick={retryActivities} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Activities</button>}
              {rfisError && <button onClick={retryRfis} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">RFIs</button>}
              {submittalsError && <button onClick={retrySubmittals} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Submittals</button>}
              {safetyIncidentsError && <button onClick={retrySafetyIncidents} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Safety</button>}
              {punchListsError && <button onClick={retryPunchLists} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Punch Lists</button>}
              {inspectionsError && <button onClick={retryInspections} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Inspections</button>}
              {milestonesError && <button onClick={retryMilestones} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Milestones</button>}
              {changeOrdersError && <button onClick={retryChangeOrders} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">Change Orders</button>}
            </div>
          </div>
        )}
      >
        <div className="space-y-6">
          {!projectsError && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Projects ({stats.totalProjects})</h3>
              <div className="grid gap-4">
                {projects?.map((project) => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Status: {project.status} | Budget: ${project.budget?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                )) || Array(4).fill(null).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <LoadingSkeleton className="w-32 h-4" />
                    <LoadingSkeleton className="w-48 h-4 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!tasksError && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Active Tasks ({stats.activeTasks})</h3>
              <div className="space-y-3">
                {tasks?.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">{task.title}</span>
                      <span className="px-2 py-1 text-xs rounded 
                        {task.status === 'TODO' ? 'bg-blue-100 text-blue-800' :
                         task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                         'bg-green-100 text-green-800'}
                      ">
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.project?.name} | {task.assignee?.name}
                    </p>
                  </div>
                )) || Array(4).fill(null).map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <LoadingSkeleton className="w-full h-4" />
                    <LoadingSkeleton className="w-full h-4 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional sections would go here in a similar pattern */}
        </div>
      </ErrorBoundary>
    );
  }

  // Success state - show actual data
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Projects</h3>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <div className="h-6 w-6 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Active Tasks</h3>
                <p className="text-2xl font-bold">{stats.activeTasks}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <div className="h-6 w-6 bg-green-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
                <p className="text-2xl font-bold">{stats.teamMembers}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <div className="h-6 w-6 bg-purple-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Pending Items</h3>
                <p className="text-2xl font-bold">{stats.pendingItems}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <div className="h-6 w-6 bg-yellow-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project status distribution */}
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Project Status Distribution</h3>
          <div className="grid gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span>Planning</span>
                <span className="font-medium">{projectStatusCounts.PLANNING}</span>
              </div>
              <div className="h-4 w-full bg-blue-200 rounded-md relative overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: Math.min((projectStatusCounts.PLANNING / Math.max(1, stats.totalProjects)) * 100, 100) }} 
                ></div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span>In Progress</span>
                <span className="font-medium">{projectStatusCounts.IN_PROGRESS}</span>
              </div>
              <div className="h-4 w-full bg-green-200 rounded-md relative overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: Math.min((projectStatusCounts.IN_PROGRESS / Math.max(1, stats.totalProjects)) * 100, 100) }} 
                ></div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span>On Hold</span>
                <span className="font-medium">{projectStatusCounts.ON_HOLD}</span>
              </div>
              <div className="h-4 w-full bg-yellow-200 rounded-md relative overflow-hidden">
                <div 
                  className="h-full bg-yellow-500" 
                  style={{ width: Math.min((projectStatusCounts.ON_HOLD / Math.max(1, stats.totalProjects)) * 100, 100) }} 
                ></div>
              </div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span>Completed</span>
                <span className="font-medium">{projectStatusCounts.COMPLETED}</span>
              </div>
              <div className="h-4 w-full bg-red-200 rounded-md relative overflow-hidden">
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: Math.min((projectStatusCounts.COMPLETED / Math.max(1, stats.totalProjects)) * 100, 100) }} 
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Construction metrics cards */}
        <div className="grid gap-4">
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">RFI Management</h3>
            <div className="grid gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Open RFIs</span>
                  <span className="font-medium">{constructionMetrics.openRFIs}</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Overdue RFIs</span>
                  <span className="font-medium text-red-600">{constructionMetrics.overdueRFIs}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Safety & Compliance</h3>
            <div className="grid gap-3">
              <div className="p-3 bg-green-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Incidents This Month</span>
                  <span className="font-medium">{constructionMetrics.safetyIncidentsThisMonth}</span>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Critical/High Incidents</span>
                  <span className="font-medium text-red-600">{constructionMetrics.criticalIncidents}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Change Orders</h3>
            <div className="grid gap-3">
              <div className="p-3 bg-purple-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Pending Approval</span>
                  <span className="font-medium">{constructionMetrics.pendingChangeOrders}</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Approved Value</span>
                  <span className="font-medium">${constructionMetrics.changeOrderValue?.toLocaleString() ?? '0'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Inspections & Punch Lists</h3>
            <div className="grid gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span>Upcoming Inspections</span>
                  <span className="font-medium">{constructionMetrics.upcomingInspections}</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border">
                <div className="flex_items-center justify-between">
                  <span>Failed Inspections</span>
                  <span className="font-medium text-red-600">{constructionMetrics.failedInspections}</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <div className="flex_items-center justify-between">
                  <span>Open Punch Items</span>
                  <span className="font-medium">{constructionMetrics.openPunchItems}</span>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border">
                <div className="flex_items-center justify-between">
                  <span>Critical Punch Items</span>
                  <span className="font-medium text-red-600">{constructionMetrics.criticalPunchItems}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent activity feed */}
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities?.map((activity) => (
              <div key={activity.id} className="p-3 border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.project?.name} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    {activity.user?.name}
                  </span>
                </div>
              </div>
            )) || Array(3).fill(null).map((_, i) => (
              <div key={i} className="p-3 border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <LoadingSkeleton className="w-48 h-4" />
                    <LoadingSkeleton className="w-full h-4 mt-2" />
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    Activity
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}