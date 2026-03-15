"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  FolderKanban,
  LayoutGrid,
  List,
  TrendingUp,
  AlertTriangle,
  PoundSterling,
  ChevronRight,
  Building2,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { isBefore, format } from "date-fns";

interface ProjectsClientProps {
  projects: any[];
}

const statusColors = {
  PLANNING: "info",
  IN_PROGRESS: "default",
  ON_HOLD: "warning",
  COMPLETED: "success",
  ARCHIVED: "secondary",
} as const;

const statusLabels = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const healthColors = {
  excellent: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  "on-track": {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  "at-risk": {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleProjectEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["project_created", "project_updated"],
    handleProjectEvent,
    [],
  );

  const portfolioKPIs = useMemo(() => {
    const activeProjects = (projects ?? []).filter(
      (p: any) => p?.status === "IN_PROGRESS" || p?.status === "PLANNING",
    );
    const completedProjects = (projects ?? []).filter(
      (p: any) => p?.status === "COMPLETED",
    );
    const totalBudget = (projects ?? []).reduce(
      (sum: number, p: any) => sum + (p?.budget ?? 0),
      0,
    );

    let totalTasks = 0,
      completedTasks = 0,
      overdueTasks = 0,
      criticalTasks = 0;

    (projects ?? []).forEach((p: any) => {
      const tasks = p?.tasks ?? [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter(
        (t: any) => t?.status === "COMPLETE",
      ).length;
      overdueTasks += tasks.filter((t: any) => {
        if (!t?.dueDate || t?.status === "COMPLETE") return false;
        return isBefore(new Date(t.dueDate), new Date());
      }).length;
      criticalTasks += tasks.filter(
        (t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE",
      ).length;
    });

    const avgCompletion =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const atRiskProjects = (projects ?? []).filter((p: any) => {
      const tasks = p?.tasks ?? [];
      return (
        tasks.some((t: any) => {
          if (!t?.dueDate || t?.status === "COMPLETE") return false;
          return isBefore(new Date(t.dueDate), new Date());
        }) ||
        tasks.some(
          (t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE",
        )
      );
    }).length;

    return {
      total: (projects ?? []).length,
      active: activeProjects.length,
      completed: completedProjects.length,
      totalBudget,
      avgCompletion,
      overdueTasks,
      criticalTasks,
      atRiskProjects,
    };
  }, [projects]);

  const projectsWithHealth = useMemo(() => {
    return (projects ?? []).map((project: any) => {
      const tasks = project?.tasks ?? [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (t: any) => t?.status === "COMPLETE",
      ).length;
      const overdueTasks = tasks.filter((t: any) => {
        if (!t?.dueDate || t?.status === "COMPLETE") return false;
        return isBefore(new Date(t.dueDate), new Date());
      }).length;
      const criticalTasks = tasks.filter(
        (t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE",
      ).length;

      const taskCompletion =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      let healthScore = 70;
      if (totalTasks > 0) healthScore = taskCompletion * 0.8 + 20;
      if (overdueTasks > 0) healthScore -= overdueTasks * 5;
      if (criticalTasks > 0) healthScore -= criticalTasks * 10;
      healthScore = Math.max(0, Math.min(100, healthScore));

      let healthLevel: string = "on-track";
      if (healthScore >= 85) healthLevel = "excellent";
      else if (healthScore >= 60) healthLevel = "on-track";
      else if (healthScore >= 40) healthLevel = "at-risk";
      else healthLevel = "critical";

      return {
        ...project,
        healthScore,
        healthLevel,
        taskCompletion,
        totalTasks,
        completedTasks,
      };
    });
  }, [projects]);

  const filteredProjects = projectsWithHealth.filter((project: any) => {
    const matchesSearch =
      (project?.name ?? "")
        ?.toLowerCase()
        ?.includes(search?.toLowerCase() ?? "") ||
      (project?.clientName ?? "")
        ?.toLowerCase()
        ?.includes(search?.toLowerCase() ?? "");
    const matchesStatus =
      statusFilter === "all" || project?.status === statusFilter;
    const matchesHealth =
      healthFilter === "all" || project?.healthLevel === healthFilter;
    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage all your construction projects in one place
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </Link>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Active Projects
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {portfolioKPIs.active}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {portfolioKPIs.completed} completed • {portfolioKPIs.total}{" "}
                total
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Avg Completion
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {portfolioKPIs.avgCompletion}%
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Across all active projects
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                At Risk
              </p>
              <p
                className={`text-3xl font-bold mt-1 ${portfolioKPIs.atRiskProjects > 0 ? "text-red-600" : "text-slate-900 dark:text-white"}`}
              >
                {portfolioKPIs.atRiskProjects}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {portfolioKPIs.overdueTasks} overdue •{" "}
                {portfolioKPIs.criticalTasks} critical
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Budget
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                £
                {portfolioKPIs.totalBudget >= 1000000
                  ? `${(portfolioKPIs.totalBudget / 1000000).toFixed(1)}M`
                  : portfolioKPIs.totalBudget >= 1000
                    ? `${(portfolioKPIs.totalBudget / 1000).toFixed(0)}K`
                    : portfolioKPIs.totalBudget.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Portfolio value
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <PoundSterling className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects by name or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 rounded-xl border-slate-200 dark:border-slate-700"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={healthFilter} onValueChange={setHealthFilter}>
          <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="on-track">On Track</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className={`rounded-none h-11 px-4 ${viewMode === "grid" ? "bg-primary text-white" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={`rounded-none h-11 px-4 ${viewMode === "list" ? "bg-primary text-white" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects?.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Get started by creating your first project.
          </p>
          <Link href="/projects/new">
            <Button className="bg-gradient-to-r from-primary to-purple-600 text-white">
              <Plus className="h-4 w-4 mr-2" /> Create Project
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects?.map((project: any, index: number) => (
            <Link key={project?.id ?? index} href={`/projects/${project?.id}`}>
              <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
                {/* Health indicator bar */}
                <div
                  className={`h-1 ${healthColors[project?.healthLevel as keyof typeof healthColors]?.dot || "bg-slate-300"}`}
                />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {project?.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                        {project?.clientName ||
                          project?.location ||
                          "No client specified"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        statusColors[
                          project?.status as keyof typeof statusColors
                        ] ?? "secondary"
                      }
                      className="ml-2"
                    >
                      {statusLabels[
                        project?.status as keyof typeof statusLabels
                      ] ?? "Unknown"}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        Progress
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {project?.taskCompletion || 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${project?.taskCompletion || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tasks
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {project?.totalTasks || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Team
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {project?._count?.teamMembers || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <PoundSterling className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Budget
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {project?.budget
                          ? `£${(project.budget / 1000).toFixed(0)}K`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${healthColors[project?.healthLevel as keyof typeof healthColors]?.bg} ${healthColors[project?.healthLevel as keyof typeof healthColors]?.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${healthColors[project?.healthLevel as keyof typeof healthColors]?.dot}`}
                      />
                      {project?.healthLevel === "excellent"
                        ? "Excellent"
                        : project?.healthLevel === "on-track"
                          ? "On Track"
                          : project?.healthLevel === "at-risk"
                            ? "At Risk"
                            : "Critical"}
                    </div>
                    <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View Project <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredProjects?.map((project: any, index: number) => (
              <Link
                key={project?.id ?? index}
                href={`/projects/${project?.id ?? ""}`}
              >
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${healthColors[project?.healthLevel as keyof typeof healthColors]?.bg}`}
                  >
                    <FolderKanban
                      className={`h-5 w-5 ${healthColors[project?.healthLevel as keyof typeof healthColors]?.text}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {project?.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {project?.clientName || project?.location}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Tasks</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {project?.totalTasks || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Progress</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {project?.taskCompletion || 0}%
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      statusColors[
                        project?.status as keyof typeof statusColors
                      ] ?? "secondary"
                    }
                  >
                    {statusLabels[
                      project?.status as keyof typeof statusLabels
                    ] ?? "Unknown"}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
