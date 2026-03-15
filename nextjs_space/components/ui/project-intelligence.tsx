"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  ChevronRight,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react";

interface ProjectData {
  id: string;
  name: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  _count?: {
    tasks?: number;
    rfis?: number;
    changeOrders?: number;
    safetyIncidents?: number;
    defects?: number;
    punchLists?: number;
  };
  tasks?: Array<{ status: string; priority: string; dueDate?: string }>;
  rfis?: Array<{ status: string; createdAt: string }>;
  changeOrders?: Array<{ status: string; costChange: number }>;
  costItems?: Array<{ actualCost: number; estimatedCost: number }>;
  milestones?: Array<{
    status: string;
    targetDate: string;
    percentComplete: number;
  }>;
  safetyIncidents?: Array<{ severity: string; status: string }>;
}

interface Insight {
  id: string;
  type: "warning" | "success" | "info" | "critical";
  category: "schedule" | "budget" | "quality" | "safety" | "resources";
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

interface ProjectMetrics {
  healthScore: number;
  schedulePerformance: number; // SPI
  costPerformance: number; // CPI
  riskLevel: "low" | "medium" | "high" | "critical";
  completionPrediction: string;
  insights: Insight[];
}

function calculateProjectMetrics(project: ProjectData): ProjectMetrics {
  const insights: Insight[] = [];
  let healthScore = 100;

  // Task Analysis
  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETE").length;
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "COMPLETE") return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  const criticalTasks = tasks.filter(
    (t) => t.priority === "CRITICAL" && t.status !== "COMPLETE",
  ).length;

  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (overdueTasks > 0) {
    healthScore -= overdueTasks * 5;
    insights.push({
      id: "overdue-tasks",
      type: overdueTasks > 5 ? "critical" : "warning",
      category: "schedule",
      title: `${overdueTasks} Overdue Task${overdueTasks > 1 ? "s" : ""}`,
      description: `There are ${overdueTasks} tasks past their due date that need immediate attention.`,
      metric: `${overdueTasks} tasks`,
      action: "Review and reassign overdue tasks",
    });
  }

  if (criticalTasks > 3) {
    healthScore -= 10;
    insights.push({
      id: "critical-tasks",
      type: "warning",
      category: "schedule",
      title: "High Critical Task Backlog",
      description: `${criticalTasks} critical priority tasks are pending completion.`,
      metric: `${criticalTasks} critical`,
      action: "Prioritize critical task completion",
    });
  }

  // RFI Analysis
  const rfis = project.rfis || [];
  const openRfis = rfis.filter((r) => r.status === "OPEN").length;
  const avgRfiAge =
    rfis
      .filter((r) => r.status === "OPEN")
      .reduce((acc, r) => {
        const age =
          (Date.now() - new Date(r.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return acc + age;
      }, 0) / (openRfis || 1);

  if (openRfis > 10) {
    healthScore -= 8;
    insights.push({
      id: "open-rfis",
      type: "warning",
      category: "quality",
      title: "High Volume of Open RFIs",
      description: `${openRfis} RFIs are awaiting response, which may cause project delays.`,
      metric: `${openRfis} open RFIs`,
      action: "Schedule RFI review meeting",
    });
  }

  if (avgRfiAge > 14) {
    healthScore -= 5;
    insights.push({
      id: "rfi-aging",
      type: "warning",
      category: "quality",
      title: "RFI Response Time Concern",
      description: `Average RFI age is ${Math.round(avgRfiAge)} days. Industry best practice is under 7 days.`,
      metric: `${Math.round(avgRfiAge)} days avg`,
      action: "Expedite RFI responses",
    });
  }

  // Budget/Cost Analysis
  const costItems = project.costItems || [];
  const totalEstimated = costItems.reduce(
    (acc, c) => acc + (c.estimatedCost || 0),
    0,
  );
  const totalActual = costItems.reduce(
    (acc, c) => acc + (c.actualCost || 0),
    0,
  );
  const costVariance =
    totalEstimated > 0
      ? ((totalActual - totalEstimated) / totalEstimated) * 100
      : 0;
  const cpi =
    totalActual > 0 && totalEstimated > 0 ? totalEstimated / totalActual : 1;

  const changeOrders = project.changeOrders || [];
  const _approvedCOValue = changeOrders
    .filter((co) => co.status === "APPROVED")
    .reduce((acc, co) => acc + (co.costChange || 0), 0);
  const pendingCOValue = changeOrders
    .filter((co) => co.status === "PENDING" || co.status === "SUBMITTED")
    .reduce((acc, co) => acc + (co.costChange || 0), 0);

  if (costVariance > 10) {
    healthScore -= 15;
    insights.push({
      id: "cost-overrun",
      type: "critical",
      category: "budget",
      title: "Budget Overrun Detected",
      description: `Project is ${costVariance.toFixed(1)}% over budget. Immediate cost control measures recommended.`,
      metric: `+${costVariance.toFixed(1)}%`,
      action: "Review cost control measures",
    });
  } else if (costVariance > 5) {
    healthScore -= 5;
    insights.push({
      id: "cost-warning",
      type: "warning",
      category: "budget",
      title: "Budget Variance Warning",
      description: `Project is ${costVariance.toFixed(1)}% over estimated costs.`,
      metric: `+${costVariance.toFixed(1)}%`,
      action: "Monitor spending closely",
    });
  }

  if (pendingCOValue > (project.budget || 0) * 0.05) {
    insights.push({
      id: "pending-cos",
      type: "info",
      category: "budget",
      title: "Pending Change Orders",
      description: `£${pendingCOValue.toLocaleString()} in change orders awaiting approval.`,
      metric: `£${(pendingCOValue / 1000).toFixed(0)}k pending`,
      action: "Review pending change orders",
    });
  }

  // Safety Analysis
  const safetyIncidents = project.safetyIncidents || [];
  const openIncidents = safetyIncidents.filter(
    (s) => s.status === "OPEN" || s.status === "INVESTIGATING",
  ).length;
  const criticalIncidents = safetyIncidents.filter(
    (s) => s.severity === "CRITICAL" || s.severity === "HIGH",
  ).length;

  if (criticalIncidents > 0) {
    healthScore -= criticalIncidents * 10;
    insights.push({
      id: "safety-critical",
      type: "critical",
      category: "safety",
      title: "Critical Safety Incidents",
      description: `${criticalIncidents} high/critical severity safety incident${criticalIncidents > 1 ? "s" : ""} require immediate attention.`,
      metric: `${criticalIncidents} critical`,
      action: "Conduct safety review immediately",
    });
  }

  if (openIncidents > 0 && criticalIncidents === 0) {
    insights.push({
      id: "safety-open",
      type: "warning",
      category: "safety",
      title: "Open Safety Incidents",
      description: `${openIncidents} safety incident${openIncidents > 1 ? "s are" : " is"} currently under investigation.`,
      metric: `${openIncidents} open`,
      action: "Follow up on investigations",
    });
  }

  // Schedule Analysis
  const milestones = project.milestones || [];
  const upcomingMilestones = milestones.filter((m) => {
    const target = new Date(m.targetDate);
    const now = new Date();
    const daysUntil =
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 14 && daysUntil > 0 && m.status !== "COMPLETED";
  });

  const overdueMilestones = milestones.filter((m) => {
    return new Date(m.targetDate) < new Date() && m.status !== "COMPLETED";
  });

  // Calculate SPI (Schedule Performance Index)
  const plannedProgress =
    milestones.length > 0
      ? (milestones.filter((m) => new Date(m.targetDate) <= new Date()).length /
          milestones.length) *
        100
      : taskProgress;
  const actualProgress =
    milestones.length > 0
      ? (milestones.filter((m) => m.status === "COMPLETED").length /
          milestones.length) *
        100
      : taskProgress;
  const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

  if (overdueMilestones.length > 0) {
    healthScore -= overdueMilestones.length * 8;
    insights.push({
      id: "overdue-milestones",
      type: "critical",
      category: "schedule",
      title: "Milestone Delays",
      description: `${overdueMilestones.length} milestone${overdueMilestones.length > 1 ? "s are" : " is"} past the target date.`,
      metric: `${overdueMilestones.length} delayed`,
      action: "Update project schedule",
    });
  }

  if (upcomingMilestones.length > 0) {
    insights.push({
      id: "upcoming-milestones",
      type: "info",
      category: "schedule",
      title: "Upcoming Milestones",
      description: `${upcomingMilestones.length} milestone${upcomingMilestones.length > 1 ? "s" : ""} due in the next 2 weeks.`,
      metric: `${upcomingMilestones.length} upcoming`,
      action: "Prepare for milestone review",
    });
  }

  // Positive insights
  if (taskProgress >= 80 && overdueTasks === 0) {
    insights.push({
      id: "good-progress",
      type: "success",
      category: "schedule",
      title: "Excellent Task Progress",
      description: `${taskProgress.toFixed(0)}% of tasks completed with no overdue items.`,
      metric: `${taskProgress.toFixed(0)}% complete`,
    });
  }

  if (cpi >= 0.95 && cpi <= 1.05 && totalActual > 0) {
    insights.push({
      id: "budget-on-track",
      type: "success",
      category: "budget",
      title: "Budget On Track",
      description:
        "Project spending is within acceptable variance of estimates.",
      metric: `CPI: ${cpi.toFixed(2)}`,
    });
  }

  if (
    safetyIncidents.length === 0 ||
    (openIncidents === 0 && criticalIncidents === 0)
  ) {
    insights.push({
      id: "safety-good",
      type: "success",
      category: "safety",
      title: "Strong Safety Record",
      description:
        "No open safety incidents. Maintain current safety protocols.",
      metric: "0 incidents",
    });
  }

  // Calculate risk level
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (healthScore < 50) riskLevel = "critical";
  else if (healthScore < 70) riskLevel = "high";
  else if (healthScore < 85) riskLevel = "medium";

  // Predict completion
  let completionPrediction = "On schedule";
  if (project.endDate) {
    const endDate = new Date(project.endDate);
    if (spi < 0.9) {
      const delay = Math.round(
        (1 / spi - 1) *
          ((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      );
      completionPrediction = `~${delay} days behind schedule`;
    } else if (spi > 1.1) {
      completionPrediction = "Ahead of schedule";
    }
  }

  return {
    healthScore: Math.max(0, Math.min(100, healthScore)),
    schedulePerformance: spi,
    costPerformance: cpi,
    riskLevel,
    completionPrediction,
    insights: insights.sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2, success: 3 };
      return priority[a.type] - priority[b.type];
    }),
  };
}

interface ProjectIntelligenceProps {
  project: ProjectData;
  compact?: boolean;
}

export function ProjectIntelligence({
  project,
  compact = false,
}: ProjectIntelligenceProps) {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Simulate analysis time for UX
    setLoading(true);
    const timer = setTimeout(() => {
      setMetrics(calculateProjectMetrics(project));
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [project]);

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="py-10 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-xl" />
            <Brain className="h-8 w-8 text-primary animate-pulse relative" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Analyzing project data...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const getHealthColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 dark:text-emerald-300";
    if (score >= 70) return "text-amber-700 dark:text-amber-300";
    if (score >= 50) return "text-orange-700 dark:text-orange-300";
    return "text-red-700 dark:text-red-300";
  };

  const getHealthBg = (score: number) => {
    if (score >= 85)
      return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50";
    if (score >= 70)
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50";
    if (score >= 50)
      return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50";
  };

  const getRiskBadge = (level: string) => {
    const styles: Record<string, string> = {
      low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      medium:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[level] || styles.medium;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "critical":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10";
      case "success":
        return "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10";
      default:
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10";
    }
  };

  const displayedInsights = expanded
    ? metrics.insights
    : metrics.insights.slice(0, 3);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl border ${getHealthBg(metrics.healthScore)}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <span
              className={`text-2xl font-bold ${getHealthColor(metrics.healthScore)}`}
            >
              {metrics.healthScore}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Health Score
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <Badge className={`${getRiskBadge(metrics.riskLevel)} font-medium`}>
            {metrics.riskLevel.toUpperCase()} RISK
          </Badge>
          <p className="text-xs text-slate-600 dark:text-slate-300 hidden sm:block font-medium">
            {metrics.completionPrediction}
          </p>
        </div>
        {metrics.insights.filter(
          (i) => i.type === "critical" || i.type === "warning",
        ).length > 0 && (
          <Badge
            variant="outline"
            className="text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-600 font-medium"
          >
            {
              metrics.insights.filter(
                (i) => i.type === "critical" || i.type === "warning",
              ).length
            }{" "}
            alerts
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-purple-600">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          Project Intelligence
          <Badge
            variant="outline"
            className="ml-auto text-xs font-medium bg-white dark:bg-slate-700 border-primary/30 text-primary"
          >
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Health Score & KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Health Score */}
          <div
            className={`text-center p-3 rounded-xl border ${getHealthBg(metrics.healthScore)}`}
          >
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-slate-200 dark:text-slate-600"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${metrics.healthScore * 1.5} 999`}
                  className={getHealthColor(metrics.healthScore)}
                />
              </svg>
              <span
                className={`absolute text-lg font-bold ${getHealthColor(metrics.healthScore)}`}
              >
                {metrics.healthScore}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">
              Health
            </div>
          </div>

          {/* SPI */}
          <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-center justify-center gap-1">
              {metrics.schedulePerformance >= 1 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {metrics.schedulePerformance.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Schedule (SPI)
            </div>
          </div>

          {/* CPI */}
          <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
            <div className="flex items-center justify-center gap-1">
              {metrics.costPerformance >= 1 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {metrics.costPerformance.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Cost (CPI)
            </div>
          </div>

          {/* Risk Level */}
          <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50">
            <Badge
              className={`${getRiskBadge(metrics.riskLevel)} text-xs font-medium`}
            >
              {metrics.riskLevel.toUpperCase()}
            </Badge>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Risk Level
            </div>
          </div>
        </div>

        {/* Completion Prediction */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Forecast:{" "}
            <strong className="text-slate-800 dark:text-slate-100">
              {metrics.completionPrediction}
            </strong>
          </span>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              AI Insights
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {metrics.insights.length} generated
            </span>
          </div>
          {displayedInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border-l-4 ${getInsightBg(insight.type)} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {insight.title}
                    </span>
                    {insight.metric && (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500"
                      >
                        {insight.metric}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1 font-semibold">
                      <ChevronRight className="h-3 w-3" />
                      {insight.action}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {metrics.insights.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs mt-2 font-medium"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? "Show Less"
                : `Show ${metrics.insights.length - 3} More Insights`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
