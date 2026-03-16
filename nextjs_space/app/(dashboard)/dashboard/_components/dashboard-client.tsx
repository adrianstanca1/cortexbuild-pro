"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  ListTodo,
  Users,
  Clock,
  Plus,
  Activity,
  FileQuestion,
  Shield,
  ClipboardCheck,
  PoundSterling,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Building2,
  Briefcase,
  Sparkles,
  Zap,
  HardHat,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  KPICard,
  QuickAction,
  AlertBanner,
  ProgressRing,
} from "@/components/ui/kpi-dashboard";
import { TodayAgenda } from "./today-agenda";
import { PortfolioIntelligence } from "@/components/ui/portfolio-intelligence";
import { PredictiveAnalytics } from "@/components/ui/predictive-analytics";
import { SmartAlerts } from "@/components/ui/smart-alerts";
import { ResourceIntelligence } from "@/components/ui/resource-intelligence";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
import { useRealtimeSubscription } from "@/components/realtime-provider";

interface ConstructionMetrics {
  openRFIs: number;
  overdueRFIs: number;
  pendingSubmittals: number;
  safetyIncidentsThisMonth: number;
  criticalIncidents: number;
  openPunchItems: number;
  criticalPunchItems: number;
  upcomingInspections: number;
  failedInspections: number;
  pendingChangeOrders: number;
  changeOrderValue: number;
  totalBudget: number;
}

interface DashboardClientProps {
  stats: {
    totalProjects: number;
    activeTasks: number;
    teamMembers: number;
    pendingItems: number;
  };
  projects: any[];
  tasks: any[];
  activities: any[];
  teamMembers?: any[];
  projectStatusCounts: {
    PLANNING: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    COMPLETED: number;
  };
  constructionMetrics?: ConstructionMetrics;
  rfis?: any[];
  submittals?: any[];
  safetyIncidents?: any[];
  punchLists?: any[];
  upcomingMilestones?: any[];
  changeOrders?: any[];
}

const priorityColors = {
  LOW: "secondary",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "destructive",
} as const;

const statusColors = {
  TODO: "secondary",
  IN_PROGRESS: "info",
  REVIEW: "warning",
  COMPLETE: "success",
} as const;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardClient({
  stats,
  projects,
  tasks,
  activities,
  teamMembers = [],
  projectStatusCounts,
  constructionMetrics,
  rfis: _rfis = [],
  submittals: _submittals = [],
  safetyIncidents: _safetyIncidents = [],
  punchLists: _punchLists = [],
  upcomingMilestones: _upcomingMilestones = [],
  changeOrders: _changeOrders = [],
}: DashboardClientProps) {
  const router = useRouter();

  const handleDashboardEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    [
      "task_created",
      "task_updated",
      "project_created",
      "project_updated",
      "team_member_added",
      "document_uploaded",
      "rfi_created",
      "submittal_created",
      "safety_incident_reported",
    ],
    handleDashboardEvent,
    [],
  );

  // Calculate completion percentage
  const totalProjects = Object.values(projectStatusCounts).reduce(
    (a, b) => a + b,
    0,
  );
  const completionRate =
    totalProjects > 0
      ? Math.round((projectStatusCounts.COMPLETED / totalProjects) * 100)
      : 0;

  // Check for critical alerts
  const criticalAlerts: string[] = [];
  if (
    constructionMetrics?.criticalIncidents &&
    constructionMetrics.criticalIncidents > 0
  ) {
    criticalAlerts.push(
      `${constructionMetrics.criticalIncidents} critical safety incident(s)`,
    );
  }
  if (constructionMetrics?.overdueRFIs && constructionMetrics.overdueRFIs > 3) {
    criticalAlerts.push(`${constructionMetrics.overdueRFIs} overdue RFIs`);
  }
  if (
    constructionMetrics?.failedInspections &&
    constructionMetrics.failedInspections > 0
  ) {
    criticalAlerts.push(
      `${constructionMetrics.failedInspections} failed inspection(s)`,
    );
  }

  // Calculate urgency metrics
  const urgentTasks =
    tasks?.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETE") return false;
      const dueDate = new Date(t.dueDate);
      return isPast(dueDate) || isToday(dueDate);
    }).length ?? 0;

  const criticalTasks =
    tasks?.filter((t) => t.priority === "CRITICAL" && t.status !== "COMPLETE")
      .length ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Dashboard
            </h1>
            <Badge
              variant="outline"
              className="hidden sm:flex items-center gap-1 text-xs bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 text-primary font-medium"
            >
              <Sparkles className="h-3 w-3" /> AI-Enhanced
            </Badge>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Your construction portfolio at a glance
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/projects/new">
            <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
              <Plus className="h-4 w-4 mr-2" /> New Project
            </Button>
          </Link>
          <Link href="/reports">
            <Button
              variant="outline"
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <BarChart3 className="h-4 w-4 mr-2" /> View Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <AlertBanner
          type="danger"
          title="Immediate Action Required"
          message={criticalAlerts.join(", ")}
          action={{ label: "Review Now", href: "/safety" }}
        />
      )}

      {/* Main Stats Grid - Redesigned */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Active Projects
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {stats?.totalProjects ?? 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="info" className="text-xs font-medium">
                    {projectStatusCounts.IN_PROGRESS} in progress
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Active Tasks
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {stats?.activeTasks ?? 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {criticalTasks > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-xs font-medium"
                    >
                      <Flame className="h-3 w-3 mr-1" />
                      {criticalTasks} critical
                    </Badge>
                  )}
                  {urgentTasks > 0 && !criticalTasks && (
                    <Badge variant="warning" className="text-xs font-medium">
                      {urgentTasks} due today
                    </Badge>
                  )}
                  {!criticalTasks && !urgentTasks && (
                    <Badge variant="success" className="text-xs font-medium">
                      On track
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Team Members
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {stats?.teamMembers ?? 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                  >
                    Active this week
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Score */}
        <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Safety Status
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {constructionMetrics?.criticalIncidents === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ✓
                    </span>
                  ) : (
                    constructionMetrics?.criticalIncidents
                  )}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {constructionMetrics?.criticalIncidents === 0 ? (
                    <Badge variant="success" className="text-xs font-medium">
                      No critical issues
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="text-xs font-medium"
                    >
                      Needs attention
                    </Badge>
                  )}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl shadow-lg ${
                  constructionMetrics?.criticalIncidents === 0
                    ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25"
                    : "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25"
                }`}
              >
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Agenda - Prominent Position */}
      <TodayAgenda />

      {/* Portfolio Intelligence */}
      <PortfolioIntelligence
        projects={projects}
        constructionMetrics={constructionMetrics}
      />

      {/* AI Intelligence Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predictive Analytics */}
        <PredictiveAnalytics projects={projects} compact />

        {/* Smart Alerts */}
        <SmartAlerts
          projects={projects}
          tasks={tasks}
          teamMembers={teamMembers}
          compact
        />
      </div>

      {/* Resource Intelligence - Full Width */}
      {teamMembers && teamMembers.length > 0 && (
        <ResourceIntelligence
          teamMembers={teamMembers}
          projects={projects}
          tasks={tasks}
          compact
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Charts & Projects */}
        <div className="xl:col-span-2 space-y-6">
          {/* Project Status Overview */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                  <Building2 className="h-5 w-5 text-primary" />
                  Project Overview
                </CardTitle>
                <Link
                  href="/projects"
                  className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Progress Ring */}
                <div className="flex flex-col items-center justify-center">
                  <ProgressRing
                    value={completionRate}
                    size={160}
                    strokeWidth={12}
                    label="Complete"
                    color="stroke-emerald-500"
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 text-center font-medium">
                    {projectStatusCounts.COMPLETED} of {totalProjects} projects
                    completed
                  </p>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                    Status Breakdown
                  </h4>
                  {[
                    {
                      label: "In Progress",
                      value: projectStatusCounts.IN_PROGRESS,
                      color: "bg-blue-500",
                      total: totalProjects,
                    },
                    {
                      label: "Planning",
                      value: projectStatusCounts.PLANNING,
                      color: "bg-amber-500",
                      total: totalProjects,
                    },
                    {
                      label: "On Hold",
                      value: projectStatusCounts.ON_HOLD,
                      color: "bg-slate-400",
                      total: totalProjects,
                    },
                    {
                      label: "Completed",
                      value: projectStatusCounts.COMPLETED,
                      color: "bg-emerald-500",
                      total: totalProjects,
                    },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{
                            width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects - Enhanced Design */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Recent Projects
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {projects?.slice(0, 5)?.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-purple-500/20 transition-colors">
                        <FolderKanban className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                          <span className="flex items-center gap-1">
                            <ListTodo className="h-3.5 w-3.5" />
                            {project._count?.tasks ?? 0} tasks
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {project.manager?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          project.status === "COMPLETED"
                            ? "success"
                            : project.status === "IN_PROGRESS"
                              ? "info"
                              : project.status === "ON_HOLD"
                                ? "warning"
                                : "secondary"
                        }
                        className="font-medium"
                      >
                        {project.status?.replace("_", " ")}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
                {(!projects || projects.length === 0) && (
                  <div className="p-8 text-center">
                    <FolderKanban className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      No projects yet
                    </p>
                    <Link href="/projects/new">
                      <Button variant="outline" size="sm" className="mt-3">
                        <Plus className="h-4 w-4 mr-2" /> Create Project
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - KPIs & Activity */}
        <div className="space-y-6">
          {/* Quick Actions - Enhanced */}
          <Card className="border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction
                icon={<Plus className="h-5 w-5" />}
                label="New Task"
                href="/tasks"
                variant="primary"
              />
              <QuickAction
                icon={<FileQuestion className="h-5 w-5" />}
                label="Submit RFI"
                href="/rfis"
              />
              <QuickAction
                icon={<ClipboardCheck className="h-5 w-5" />}
                label="Daily Report"
                href="/daily-reports"
              />
              <QuickAction
                icon={<Shield className="h-5 w-5" />}
                label="Safety Check"
                href="/safety"
              />
              <QuickAction
                icon={<HardHat className="h-5 w-5" />}
                label="Site Diary"
                href="/site-diary"
              />
            </CardContent>
          </Card>

          {/* Construction KPIs - Enhanced */}
          {constructionMetrics && (
            <>
              <KPICard
                title="Safety & Quality"
                icon={<Shield className="h-5 w-5" />}
                variant={
                  constructionMetrics.criticalIncidents > 0
                    ? "alert"
                    : "default"
                }
                metrics={[
                  {
                    label: "Safety Incidents (30d)",
                    value: constructionMetrics.safetyIncidentsThisMonth,
                    status:
                      constructionMetrics.safetyIncidentsThisMonth > 0
                        ? "danger"
                        : "success",
                  },
                  {
                    label: "Critical Incidents",
                    value: constructionMetrics.criticalIncidents,
                    status:
                      constructionMetrics.criticalIncidents > 0
                        ? "danger"
                        : "success",
                  },
                  {
                    label: "Failed Inspections",
                    value: constructionMetrics.failedInspections,
                    status:
                      constructionMetrics.failedInspections > 0
                        ? "warning"
                        : "success",
                  },
                  {
                    label: "Open Punch Items",
                    value: constructionMetrics.openPunchItems,
                    status: "neutral",
                  },
                ]}
                link={{ href: "/safety", label: "View Safety Dashboard" }}
              />

              <KPICard
                title="RFIs & Submittals"
                icon={<FileQuestion className="h-5 w-5" />}
                metrics={[
                  {
                    label: "Open RFIs",
                    value: constructionMetrics.openRFIs,
                    status:
                      constructionMetrics.openRFIs > 5 ? "warning" : "neutral",
                  },
                  {
                    label: "Overdue RFIs",
                    value: constructionMetrics.overdueRFIs,
                    status:
                      constructionMetrics.overdueRFIs > 0
                        ? "danger"
                        : "success",
                  },
                  {
                    label: "Pending Submittals",
                    value: constructionMetrics.pendingSubmittals,
                    status: "neutral",
                  },
                  {
                    label: "Upcoming Inspections",
                    value: constructionMetrics.upcomingInspections,
                    status: "info",
                  },
                ]}
                link={{ href: "/rfis", label: "Manage RFIs" }}
              />

              <KPICard
                title="Financial"
                icon={<PoundSterling className="h-5 w-5" />}
                metrics={[
                  {
                    label: "Total Budget",
                    value: formatCurrency(constructionMetrics.totalBudget),
                    status: "neutral",
                  },
                  {
                    label: "Pending Change Orders",
                    value: constructionMetrics.pendingChangeOrders,
                    status:
                      constructionMetrics.pendingChangeOrders > 0
                        ? "warning"
                        : "success",
                  },
                  {
                    label: "Approved CO Value",
                    value: formatCurrency(constructionMetrics.changeOrderValue),
                    status: "neutral",
                  },
                ]}
                link={{ href: "/budget", label: "View Budget" }}
              />
            </>
          )}

          {/* Recent Activity - Enhanced */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {activities?.slice(0, 8)?.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-100">
                          <span className="font-semibold">
                            {activity.user?.name || "System"}
                          </span>{" "}
                          {activity.action?.toLowerCase()}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                          {activity.project?.name || "System"} •{" "}
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!activities || activities.length === 0) && (
                  <div className="p-6 text-center">
                    <Activity className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      No recent activity
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Tasks Section - Enhanced */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
              <ListTodo className="h-5 w-5 text-primary" />
              Upcoming Tasks
            </CardTitle>
            <Link
              href="/tasks"
              className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-4 py-3">
                    Task
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-4 py-3">
                    Project
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-4 py-3">
                    Assignee
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-4 py-3">
                    Due Date
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-4 py-3">
                    Priority
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {tasks?.slice(0, 6)?.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    isPast(new Date(task.dueDate)) &&
                    task.status !== "COMPLETE";
                  const isDueToday =
                    task.dueDate && isToday(new Date(task.dueDate));

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isOverdue ? "bg-red-50/50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tasks`}
                          className="font-semibold text-slate-800 dark:text-slate-100 hover:text-primary"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {task.project?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {task.assignee?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm flex items-center gap-1.5 font-medium ${
                            isOverdue
                              ? "text-red-600 dark:text-red-400"
                              : isDueToday
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
                          {isDueToday && <Clock className="h-3.5 w-3.5" />}
                          {task.dueDate
                            ? format(new Date(task.dueDate), "MMM d, yyyy")
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            priorityColors[
                              task.priority as keyof typeof priorityColors
                            ] || "secondary"
                          }
                          className="font-medium"
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            statusColors[
                              task.status as keyof typeof statusColors
                            ] || "secondary"
                          }
                          className="font-medium"
                        >
                          {task.status?.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!tasks || tasks.length === 0) && (
              <div className="p-8 text-center">
                <ListTodo className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  No tasks yet
                </p>
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="h-4 w-4 mr-2" /> Create Task
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
