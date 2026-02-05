"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, Archive, ArrowRight, BarChart3, Boxes, Building2, CheckCircle2, ChevronDown, ChevronRight, Clock, Copy, Edit, ExternalLink, Eye, FileCheck, FileText, FolderClosed, FolderKanban, FolderOpen, FolderPlus, FolderSearch, FolderTree, Gauge, Grid3X3, Home, LayoutList, MapPin, MoreVertical, Network, PoundSterling, Shield, SortAsc, SortDesc, Target, TrendingUp, User, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { isBefore, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { ProjectWithRelations } from "@/lib/types";

interface ProjectsClientProps {
  projects: ProjectWithRelations[];
}

const statusConfig = {
  PLANNING: { 
    label: "Planning", 
    color: "bg-blue-500", 
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: Target
  },
  IN_PROGRESS: { 
    label: "In Progress", 
    color: "bg-emerald-500", 
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    icon: Activity
  },
  ON_HOLD: { 
    label: "On Hold", 
    color: "bg-amber-500", 
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: Clock
  },
  COMPLETED: { 
    label: "Completed", 
    color: "bg-slate-500", 
    bgColor: "bg-slate-50 dark:bg-slate-800/50",
    textColor: "text-slate-700 dark:text-slate-300",
    borderColor: "border-slate-200 dark:border-slate-700",
    icon: CheckCircle2
  },
  ARCHIVED: { 
    label: "Archived", 
    color: "bg-slate-400", 
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-300 dark:border-slate-600",
    icon: Archive
  }
};

const healthConfig = {
  excellent: { 
    label: "Excellent",
    color: "bg-emerald-500", 
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500"
  },
  "on-track": { 
    label: "On Track",
    color: "bg-blue-500", 
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-500"
  },
  "at-risk": { 
    label: "At Risk",
    color: "bg-amber-500", 
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
    gradient: "from-amber-500 to-orange-500"
  },
  critical: { 
    label: "Critical",
    color: "bg-red-500", 
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
    gradient: "from-red-500 to-rose-500"
  }
};

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "tree">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "budget" | "health">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [expandedInTree, setExpandedInTree] = useState<Set<string>>(new Set());
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  const toggleTreeExpand = (id: string) => {
    setExpandedInTree(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleProjectEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['project_created', 'project_updated'],
    handleProjectEvent,
    []
  );

  // Calculate portfolio KPIs
  const portfolioKPIs = useMemo(() => {
    const activeProjects = (projects ?? []).filter((p: any) => 
      p?.status === "IN_PROGRESS" || p?.status === "PLANNING"
    );
    const completedProjects = (projects ?? []).filter((p: any) => p?.status === "COMPLETED");
    const totalBudget = (projects ?? []).reduce((sum: number, p: any) => sum + (p?.budget ?? 0), 0);
    
    let totalTasks = 0, completedTasks = 0, overdueTasks = 0, criticalTasks = 0;
    
    (projects ?? []).forEach((p: any) => {
      const tasks = p?.tasks ?? [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t: any) => t?.status === "COMPLETE").length;
      overdueTasks += tasks.filter((t: any) => {
        if (!t?.dueDate || t?.status === "COMPLETE") return false;
        return isBefore(new Date(t.dueDate), new Date());
      }).length;
      criticalTasks += tasks.filter((t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE").length;
    });
    
    const avgCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const atRiskProjects = (projects ?? []).filter((p: any) => {
      const tasks = p?.tasks ?? [];
      return tasks.some((t: any) => {
        if (!t?.dueDate || t?.status === "COMPLETE") return false;
        return isBefore(new Date(t.dueDate), new Date());
      }) || tasks.some((t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE");
    }).length;
    
    return {
      total: (projects ?? []).length,
      active: activeProjects.length,
      completed: completedProjects.length,
      totalBudget,
      avgCompletion,
      overdueTasks,
      criticalTasks,
      atRiskProjects
    };
  }, [projects]);

  // Calculate health scores for projects
  const projectsWithHealth = useMemo(() => {
    return (projects ?? []).map((project: any) => {
      const tasks = project?.tasks ?? [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t?.status === "COMPLETE").length;
      const overdueTasks = tasks.filter((t: any) => {
        if (!t?.dueDate || t?.status === "COMPLETE") return false;
        return isBefore(new Date(t.dueDate), new Date());
      }).length;
      const criticalTasks = tasks.filter((t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE").length;
      
      const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      let healthScore = 70;
      if (totalTasks > 0) healthScore = taskCompletion * 0.8 + 20;
      if (overdueTasks > 0) healthScore -= overdueTasks * 5;
      if (criticalTasks > 0) healthScore -= criticalTasks * 10;
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      let healthLevel: string = 'on-track';
      if (healthScore >= 85) healthLevel = 'excellent';
      else if (healthScore >= 60) healthLevel = 'on-track';
      else if (healthScore >= 40) healthLevel = 'at-risk';
      else healthLevel = 'critical';
      
      return { 
        ...project, 
        healthScore, 
        healthLevel, 
        taskCompletion, 
        totalTasks, 
        completedTasks,
        overdueTasks,
        criticalTasks
      };
    });
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const filtered = projectsWithHealth.filter((project: any) => {
      const matchesSearch = (project?.name ?? "")?.toLowerCase()?.includes(search?.toLowerCase() ?? "") ||
        (project?.clientName ?? "")?.toLowerCase()?.includes(search?.toLowerCase() ?? "");
      const matchesStatus = statusFilter === "all" || project?.status === statusFilter;
      const matchesHealth = healthFilter === "all" || project?.healthLevel === healthFilter;
      return matchesSearch && matchesStatus && matchesHealth;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a?.name ?? "").localeCompare(b?.name ?? "");
          break;
        case "date":
          comparison = new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime();
          break;
        case "budget":
          comparison = (b?.budget ?? 0) - (a?.budget ?? 0);
          break;
        case "health":
          comparison = (b?.healthScore ?? 0) - (a?.healthScore ?? 0);
          break;
      }
      return sortOrder === "desc" ? comparison : -comparison;
    });

    return filtered;
  }, [projectsWithHealth, search, statusFilter, healthFilter, sortBy, sortOrder]);

  const formatBudget = (budget: number) => {
    if (budget >= 1000000) return `£${(budget / 1000000).toFixed(1)}M`;
    if (budget >= 1000) return `£${(budget / 1000).toFixed(0)}K`;
    return `£${budget.toLocaleString()}`;
  };

  // Project Card Component - Enhanced Folder Style with Quick Actions
  const ProjectCard = ({ project, index }: { project: any; index: number }) => {
    const status = statusConfig[project?.status as keyof typeof statusConfig] || statusConfig.PLANNING;
    const health = healthConfig[project?.healthLevel as keyof typeof healthConfig] || healthConfig["on-track"];
    const isHovered = hoveredProject === project?.id;
    const showActions = showQuickActions === project?.id;
    const StatusIcon = status.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        onMouseEnter={() => setHoveredProject(project?.id)}
        onMouseLeave={() => { setHoveredProject(null); setShowQuickActions(null); }}
        className="relative"
      >
        <Link href={`/projects/${project?.id}`}>
          <div className={`
            group relative overflow-hidden rounded-2xl 
            bg-white dark:bg-slate-900/80 backdrop-blur-sm
            border-2 transition-all duration-300
            ${isHovered 
              ? 'border-primary shadow-2xl shadow-primary/20 -translate-y-2 scale-[1.02]' 
              : 'border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
            }
          `}>
            {/* Folder Tab Header with 3D effect */}
            <div className="relative">
              {/* Folder tab shape - 3D look */}
              <div className={`
                absolute -top-1 left-4 w-28 h-5 rounded-t-xl
                bg-gradient-to-r ${health.gradient}
                transform -skew-x-12 shadow-sm
              `} />
              <div className={`
                absolute -top-1 left-4 w-28 h-5 rounded-t-xl
                bg-gradient-to-r ${health.gradient} opacity-60
                transform skew-x-12 translate-x-4 shadow-sm
              `} />
              {/* Folder edge highlight */}
              <div className={`
                absolute -top-1 left-4 w-28 h-1 rounded-t-xl
                bg-white/30
                transform -skew-x-12
              `} />
              
              {/* Main header bar */}
              <div className={`
                relative h-14 flex items-center justify-between px-4
                bg-gradient-to-r ${health.gradient}
              `}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white/90 text-[10px] font-semibold uppercase tracking-widest">
                      Project Folder
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                      <span className="text-white/70 text-[9px]">Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`
                    ${status.bgColor} ${status.textColor} border-0
                    text-[10px] font-semibold px-2.5 py-1 shadow-sm
                  `}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  {/* Quick actions trigger */}
                  <button
                    onClick={(e) => { e.preventDefault(); setShowQuickActions(showActions ? null : project?.id); }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Quick Actions Dropdown */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-14 right-2 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[160px]"
                    onClick={(e) => e.preventDefault()}
                  >
                    <div className="py-1">
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <Eye className="h-4 w-4" /> View Details
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <Edit className="h-4 w-4" /> Edit Project
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <Copy className="h-4 w-4" /> Duplicate
                      </button>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                      <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                        <Archive className="h-4 w-4" /> Archive
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Main Content */}
            <div className="p-5">
              {/* Project Name & Client */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {project?.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  {project?.clientName && (
                    <>
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{project?.clientName}</span>
                    </>
                  )}
                  {project?.location && (
                    <>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{project?.location}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar with Health Indicator - Enhanced */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${health.dotColor} animate-pulse shadow-lg shadow-${health.dotColor}/50`} />
                    <span className={`text-xs font-semibold ${health.textColor}`}>
                      {health.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {project?.taskCompletion || 0}%
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project?.taskCompletion || 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${health.gradient} rounded-full relative`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats Grid - Enhanced */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-2 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30 hover:scale-105 transition-transform cursor-default">
                        <FileText className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{project?.totalTasks || 0}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tasks</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{project?.completedTasks || 0} completed, {project?.overdueTasks || 0} overdue</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-2 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800/30 hover:scale-105 transition-transform cursor-default">
                        <Users className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{project?._count?.teamMembers || 0}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Team</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Team members assigned</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30 hover:scale-105 transition-transform cursor-default">
                        <FileCheck className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{project?._count?.documents || 0}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Docs</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Documents &amp; files</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30 hover:scale-105 transition-transform cursor-default">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{project?._count?.rfis || 0}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">RFIs</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Requests for Information</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Footer - Budget & Date with enhanced styling */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 shadow-sm">
                    <PoundSterling className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">Budget</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatBudget(project?.budget || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Updated</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {project?.updatedAt 
                        ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className={`
                    p-2 rounded-xl transition-all duration-300
                    ${isHovered 
                      ? 'bg-primary text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }
                  `}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  // List View Row
  const ProjectRow = ({ project, index }: { project: any; index: number }) => {
    const status = statusConfig[project?.status as keyof typeof statusConfig] || statusConfig.PLANNING;
    const health = healthConfig[project?.healthLevel as keyof typeof healthConfig] || healthConfig["on-track"];
    const StatusIcon = status.icon;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Link href={`/projects/${project?.id}`}>
          <div className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-lg transition-all">
            {/* Folder Icon */}
            <div className={`p-3 rounded-xl bg-gradient-to-br ${health.gradient} shadow-lg`}>
              <FolderOpen className="h-6 w-6 text-white" />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                  {project?.name}
                </h3>
                <Badge className={`${status.bgColor} ${status.textColor} border-0 text-[10px]`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                {project?.clientName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {project?.clientName}
                  </span>
                )}
                {project?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {project?.location}
                  </span>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="w-32">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${health.textColor}`}>{health.label}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{project?.taskCompletion || 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${health.gradient} rounded-full`}
                  style={{ width: `${project?.taskCompletion || 0}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{project?.totalTasks || 0}</p>
                <p className="text-[10px] text-slate-500 uppercase">Tasks</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-white">{project?._count?.teamMembers || 0}</p>
                <p className="text-[10px] text-slate-500 uppercase">Team</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatBudget(project?.budget || 0)}</p>
                <p className="text-[10px] text-slate-500 uppercase">Budget</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-primary group-hover:text-white transition-all">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
              <FolderKanban className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Project Portfolio</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your construction projects in one place</p>
            </div>
          </div>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all gap-2">
            <FolderPlus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 group hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderOpen className="h-16 w-16 text-blue-500" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Boxes className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Projects</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{portfolioKPIs.active}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {portfolioKPIs.completed} completed • {portfolioKPIs.total} total
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 group hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Progress</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{portfolioKPIs.avgCompletion}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all active projects</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 group hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">At Risk</span>
            </div>
            <p className={`text-3xl font-bold ${portfolioKPIs.atRiskProjects > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
              {portfolioKPIs.atRiskProjects}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {portfolioKPIs.overdueTasks} overdue • {portfolioKPIs.criticalTasks} critical
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 group hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <PoundSterling className="h-16 w-16 text-violet-500" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <PoundSterling className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Portfolio Value</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatBudget(portfolioKPIs.totalBudget)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total budget across all</p>
          </div>
        </motion.div>
      </div>

      {/* Filters & View Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FolderSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search projects by name or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
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
            <SelectTrigger className="w-[140px] h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
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

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[130px] h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="health">Health</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-700"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          {/* View Mode Toggle - Enhanced with Tree View */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-12 px-4 rounded-none ${viewMode === 'grid' ? 'bg-primary text-white' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Grid View</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-12 px-4 rounded-none ${viewMode === 'list' ? 'bg-primary text-white' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>List View</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-12 px-4 rounded-none ${viewMode === 'tree' ? 'bg-primary text-white' : ''}`}
                    onClick={() => setViewMode('tree')}
                  >
                    <FolderTree className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Tree View</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {search || statusFilter !== "all" || healthFilter !== "all"
              ? "Try adjusting your filters to find what you're looking for."
              : "Get started by creating your first construction project folder."
            }
          </p>
          <Link href="/projects/new">
            <Button className="bg-gradient-to-r from-primary to-purple-600 text-white gap-2">
              <FolderPlus className="h-4 w-4" />
              Create First Project
            </Button>
          </Link>
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects?.map((project: any, index: number) => (
              <ProjectCard key={project?.id} project={project} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredProjects?.map((project: any, index: number) => (
              <ProjectRow key={project?.id} project={project} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Tree View - Professional Folder Schema */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Tree Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Explorer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Navigate your project folders</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Network className="h-3 w-3 mr-1" />
                  {filteredProjects?.length} Projects
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Tree Content */}
          <div className="p-4">
            <div className="relative">
              {/* Root indicator line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-slate-300 dark:via-slate-600 to-transparent" />
              
              {filteredProjects?.map((project: any, index: number) => {
                const status = statusConfig[project?.status as keyof typeof statusConfig] || statusConfig.PLANNING;
                const health = healthConfig[project?.healthLevel as keyof typeof healthConfig] || healthConfig["on-track"];
                const isExpanded = expandedInTree.has(project?.id);
                const isLast = index === filteredProjects.length - 1;
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={project?.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative"
                  >
                    {/* Horizontal branch line */}
                    <div className={`absolute left-[18px] top-[24px] w-5 h-px bg-slate-300 dark:bg-slate-600 ${isLast ? 'hidden' : ''}`} />
                    
                    {/* Tree node connector */}
                    <div className="absolute left-[14px] top-[20px] w-2.5 h-2.5 rounded-full border-2 border-primary bg-white dark:bg-slate-800 z-10" />
                    
                    {/* Project Folder Item */}
                    <div className="ml-10 mb-2">
                      <div
                        onClick={() => toggleTreeExpand(project?.id)}
                        className={`
                          group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                          hover:bg-slate-50 dark:hover:bg-slate-800/50
                          ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : ''}
                        `}
                      >
                        {/* Expand/Collapse indicator */}
                        <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                        
                        {/* Folder Icon */}
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${health.gradient} shadow-md transition-transform group-hover:scale-110`}>
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-white" />
                          ) : (
                            <FolderClosed className="h-5 w-5 text-white" />
                          )}
                        </div>
                        
                        {/* Project Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                              {project?.name}
                            </span>
                            <Badge className={`${status.bgColor} ${status.textColor} border-0 text-[9px] px-1.5 py-0`}>
                              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {project?.clientName && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {project?.clientName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {project?.totalTasks || 0} tasks
                            </span>
                          </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="hidden md:flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${health.dotColor}`} />
                            <span className={`${health.textColor} font-medium`}>{project?.taskCompletion || 0}%</span>
                          </div>
                          <div className="text-slate-700 dark:text-slate-300 font-semibold">
                            {formatBudget(project?.budget || 0)}
                          </div>
                        </div>
                        
                        {/* Open Link */}
                        <Link 
                          href={`/projects/${project?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                      
                      {/* Expanded Content - Project Sub-folders */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-6 mt-1 overflow-hidden"
                          >
                            <div className="relative pl-6 py-2 space-y-1">
                              {/* Vertical connector */}
                              <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
                              
                              {/* Sub-folder items */}
                              {[
                                { icon: FileText, label: 'Tasks', count: project?.totalTasks || 0, color: 'blue', href: `/projects/${project?.id}?tab=tasks` },
                                { icon: Users, label: 'Team', count: project?._count?.teamMembers || 0, color: 'violet', href: `/projects/${project?.id}?tab=team` },
                                { icon: FileCheck, label: 'Documents', count: project?._count?.documents || 0, color: 'emerald', href: `/projects/${project?.id}?tab=documents` },
                                { icon: AlertTriangle, label: 'RFIs', count: project?._count?.rfis || 0, color: 'amber', href: `/projects/${project?.id}?tab=rfis` },
                                { icon: Shield, label: 'Safety', count: project?._count?.safetyIncidents || 0, color: 'red', href: `/projects/${project?.id}?tab=safety` },
                              ].map((subItem, subIndex) => (
                                <Link 
                                  key={subIndex}
                                  href={subItem.href}
                                  className="group relative flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  {/* Branch connector */}
                                  <div className="absolute -left-4 top-1/2 w-4 h-px bg-slate-200 dark:bg-slate-700" />
                                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                  
                                  <subItem.icon className={`h-3.5 w-3.5 text-${subItem.color}-500`} />
                                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                                    {subItem.label}
                                  </span>
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
                                    {subItem.count}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {filteredProjects?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-slate-500 dark:text-slate-400"
        >
          Showing {filteredProjects.length} of {projects?.length || 0} projects
        </motion.div>
      )}
    </div>
  );
}
