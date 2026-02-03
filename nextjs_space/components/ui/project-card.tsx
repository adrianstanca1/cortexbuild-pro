"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, _Calendar, _PoundSterling, ListTodo, FileText, Users,
  _TrendingUp, _TrendingDown, AlertTriangle, Clock, CheckCircle,
  AlertCircle, Zap, _Cloud, _Sun, _CloudRain, _Timer, Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { _differenceInDays, differenceInCalendarDays, _isAfter, isBefore, _format } from "date-fns";

interface ProjectCardProps {
  project: any;
  index?: number;
}

const statusColors = {
  PLANNING: "info",
  IN_PROGRESS: "default",
  ON_HOLD: "warning",
  COMPLETED: "success",
  ARCHIVED: "secondary"
} as const;

const statusLabels = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived"
};

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  // Calculate project health score and metrics
  const metrics = useMemo(() => {
    const tasks = project?.tasks ?? [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t?.status === "COMPLETE").length;
    const overdueTasks = tasks.filter((t: any) => {
      if (!t?.dueDate || t?.status === "COMPLETE") return false;
      return isBefore(new Date(t.dueDate), new Date());
    }).length;
    const criticalTasks = tasks.filter((t: any) => t?.priority === "CRITICAL" && t?.status !== "COMPLETE").length;
    
    // Task completion percentage
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Schedule health
    const startDate = project?.startDate ? new Date(project.startDate) : null;
    const endDate = project?.endDate ? new Date(project.endDate) : null;
    const now = new Date();
    
    let scheduleHealth = 100;
    let daysRemaining = 0;
    let isOverdue = false;
    let scheduleProgress = 0;
    
    if (startDate && endDate) {
      const totalDays = differenceInCalendarDays(endDate, startDate);
      const elapsedDays = differenceInCalendarDays(now, startDate);
      daysRemaining = differenceInCalendarDays(endDate, now);
      isOverdue = daysRemaining < 0 && project?.status !== "COMPLETED";
      scheduleProgress = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;
      
      // If schedule progress is ahead of task completion, penalize health
      if (scheduleProgress > taskCompletion + 10) {
        scheduleHealth = Math.max(0, 100 - (scheduleProgress - taskCompletion) * 2);
      }
    }
    
    // Budget tracking (simulated actual spend based on completion)
    const budget = project?.budget ?? 0;
    const estimatedSpend = budget * (taskCompletion / 100) * 1.1; // 10% variance
    const budgetHealth = budget > 0 ? Math.min(100, Math.round((budget - estimatedSpend) / budget * 100) + 50) : 100;
    
    // Overall health score (weighted average)
    let healthScore = 0;
    let weights = 0;
    
    if (totalTasks > 0) {
      healthScore += taskCompletion * 0.4;
      weights += 0.4;
    }
    healthScore += scheduleHealth * 0.3;
    weights += 0.3;
    healthScore += budgetHealth * 0.3;
    weights += 0.3;
    
    // Penalties
    if (overdueTasks > 0) healthScore -= overdueTasks * 5;
    if (criticalTasks > 0) healthScore -= criticalTasks * 10;
    if (isOverdue) healthScore -= 20;
    
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore / weights)));
    
    // Determine health level
    let healthLevel: 'critical' | 'at-risk' | 'on-track' | 'excellent' = 'on-track';
    if (healthScore >= 85) healthLevel = 'excellent';
    else if (healthScore >= 60) healthLevel = 'on-track';
    else if (healthScore >= 40) healthLevel = 'at-risk';
    else healthLevel = 'critical';
    
    return {
      taskCompletion,
      totalTasks,
      completedTasks,
      overdueTasks,
      criticalTasks,
      scheduleProgress,
      daysRemaining: Math.abs(daysRemaining),
      isOverdue,
      healthScore,
      healthLevel,
      budgetHealth,
      estimatedSpend
    };
  }, [project]);
  
  const getHealthColor = (level: string) => {
    switch (level) {
      case 'excellent': return '#10b981';
      case 'on-track': return '#3b82f6';
      case 'at-risk': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const getHealthIcon = (level: string) => {
    switch (level) {
      case 'excellent': return <CheckCircle className="h-4 w-4" style={{ color: '#10b981' }} />;
      case 'on-track': return <Activity className="h-4 w-4" style={{ color: '#3b82f6' }} />;
      case 'at-risk': return <AlertCircle className="h-4 w-4" style={{ color: '#f59e0b' }} />;
      case 'critical': return <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/projects/${project?.id ?? ""}`}>
        <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          {/* Health indicator strip */}
          <div className="h-1.5" style={{ backgroundColor: getHealthColor(metrics.healthLevel) }} />
          
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-0.5 line-clamp-1" style={{ color: '#0f172a' }}>
                  {project?.name ?? "Untitled"}
                </h3>
                {project?.clientName && (
                  <p className="text-xs line-clamp-1" style={{ color: '#64748b' }}>Client: {project.clientName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge variant={statusColors[project?.status as keyof typeof statusColors] ?? "secondary"}>
                  {statusLabels[project?.status as keyof typeof statusLabels] ?? "Unknown"}
                </Badge>
              </div>
            </div>
            
            {/* Health Score Badge */}
            <div className="flex items-center justify-between mb-3 p-2 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
              <div className="flex items-center gap-2">
                {getHealthIcon(metrics.healthLevel)}
                <span className="text-xs font-medium" style={{ color: '#334155' }}>
                  Project Health
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: getHealthColor(metrics.healthLevel) }}>
                  {metrics.healthScore}%
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: '#64748b' }}>Task Progress</span>
                <span className="font-medium" style={{ color: '#334155' }}>{metrics.taskCompletion}%</span>
              </div>
              <Progress value={metrics.taskCompletion} className="h-2" />
            </div>
            
            {/* Location & Date */}
            <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: '#64748b' }}>
              {project?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{project.location}</span>
                </div>
              )}
              {project?.endDate && (
                <div className="flex items-center gap-1">
                  {metrics.isOverdue ? (
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span style={{ color: metrics.isOverdue ? '#ef4444' : '#64748b' }}>
                    {metrics.isOverdue ? `${metrics.daysRemaining}d overdue` : `${metrics.daysRemaining}d left`}
                  </span>
                </div>
              )}
            </div>
            
            {/* Alerts Row */}
            {(metrics.overdueTasks > 0 || metrics.criticalTasks > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {metrics.overdueTasks > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                    <AlertTriangle className="h-3 w-3" /> {metrics.overdueTasks} overdue
                  </span>
                )}
                {metrics.criticalTasks > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                    <Zap className="h-3 w-3" /> {metrics.criticalTasks} critical
                  </span>
                )}
              </div>
            )}
            
            {/* Budget */}
            {project?.budget && (
              <div className="flex items-center justify-between text-xs py-2 border-t" style={{ borderColor: '#e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Budget</span>
                <span className="font-semibold" style={{ color: '#5f46e5' }}>
                  £{Number(project.budget)?.toLocaleString() ?? "0"}
                </span>
              </div>
            )}
            
            {/* Stats Footer */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                <ListTodo className="h-3.5 w-3.5" />
                <span>{metrics.completedTasks}/{metrics.totalTasks}</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                <FileText className="h-3.5 w-3.5" />
                <span>{project?._count?.documents ?? 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                <Users className="h-3.5 w-3.5" />
                <span>{project?._count?.teamMembers ?? 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{project?._count?.rfis ?? 0} RFIs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
