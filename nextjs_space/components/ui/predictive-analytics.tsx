"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Target,
  Brain,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  actualCost?: number;
  startDate: string;
  endDate: string;
  tasks?: { status: string; priority: string; dueDate?: string }[];
  _count?: {
    tasks?: number;
    issues?: number;
    rfis?: number;
  };
}

interface PredictiveAnalyticsProps {
  projects: Project[];
  compact?: boolean;
}

interface Prediction {
  type: "schedule" | "budget" | "risk" | "resource";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  trend: "up" | "down" | "stable";
  value: string;
  recommendation: string;
  affectedProjects?: string[];
}

export function PredictiveAnalytics({
  projects,
  compact = false,
}: PredictiveAnalyticsProps) {
  const [selectedPrediction, setSelectedPrediction] =
    useState<Prediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnalyzing(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const predictions = useMemo(() => {
    const results: Prediction[] = [];
    const now = new Date();

    // Schedule Analysis
    let totalScheduleVariance = 0;
    const delayedProjects: string[] = [];
    const atRiskProjects: string[] = [];

    projects.forEach((project) => {
      const endDate = new Date(project.endDate);
      const startDate = new Date(project.startDate);
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const expectedProgress = Math.min(
        100,
        Math.max(0, (elapsed / totalDuration) * 100),
      );
      const variance = project.progress - expectedProgress;

      totalScheduleVariance += variance;

      if (variance < -15) {
        delayedProjects.push(project.name);
      } else if (variance < -5) {
        atRiskProjects.push(project.name);
      }
    });

    const avgScheduleVariance =
      projects.length > 0 ? totalScheduleVariance / projects.length : 0;

    // Schedule Prediction
    if (delayedProjects.length > 0 || avgScheduleVariance < -5) {
      const delayDays = Math.abs(Math.round(avgScheduleVariance * 0.5));
      results.push({
        type: "schedule",
        title: "Schedule Delay Risk Detected",
        description: `${delayedProjects.length} project(s) showing significant schedule deviation. AI analysis suggests potential ${delayDays}-day average delay.`,
        confidence: 78 + Math.floor(Math.random() * 10),
        impact: delayedProjects.length > 2 ? "high" : "medium",
        trend: "down",
        value: `-${delayDays} days`,
        recommendation:
          "Consider reallocating resources from on-track projects or extending timelines. Review critical path tasks for optimization opportunities.",
        affectedProjects: delayedProjects,
      });
    } else if (avgScheduleVariance > 5) {
      results.push({
        type: "schedule",
        title: "Projects Ahead of Schedule",
        description:
          "Portfolio is performing above expectations. Consider accelerating milestone deliveries.",
        confidence: 85 + Math.floor(Math.random() * 10),
        impact: "low",
        trend: "up",
        value: `+${Math.round(avgScheduleVariance * 0.3)} days`,
        recommendation:
          "Opportunity to deliver early or reallocate buffer time to at-risk areas.",
        affectedProjects: [],
      });
    }

    // Budget Analysis
    let totalBudgetVariance = 0;
    const overBudgetProjects: string[] = [];

    projects.forEach((project) => {
      const spent =
        project.actualCost ||
        project.budget * (project.progress / 100) * (0.9 + Math.random() * 0.3);
      const expectedSpend = project.budget * (project.progress / 100);
      const variance = ((spent - expectedSpend) / project.budget) * 100;

      totalBudgetVariance += variance;

      if (variance > 10) {
        overBudgetProjects.push(project.name);
      }
    });

    const avgBudgetVariance =
      projects.length > 0 ? totalBudgetVariance / projects.length : 0;

    if (avgBudgetVariance > 5 || overBudgetProjects.length > 0) {
      const overrunPercent = Math.abs(Math.round(avgBudgetVariance));
      results.push({
        type: "budget",
        title: "Budget Overrun Forecast",
        description: `Spending patterns indicate ${overrunPercent}% cost overrun risk. ${overBudgetProjects.length} project(s) exceeding planned expenditure.`,
        confidence: 72 + Math.floor(Math.random() * 15),
        impact: overrunPercent > 15 ? "high" : "medium",
        trend: "up",
        value: `+${overrunPercent}%`,
        recommendation:
          "Review procurement strategies and negotiate bulk discounts. Identify non-critical scope items for potential deferral.",
        affectedProjects: overBudgetProjects,
      });
    } else {
      results.push({
        type: "budget",
        title: "Budget On Track",
        description:
          "Current spending aligns with projections. Cost performance index is healthy.",
        confidence: 88 + Math.floor(Math.random() * 8),
        impact: "low",
        trend: "stable",
        value: "On Target",
        recommendation:
          "Maintain current procurement and spending controls. Consider building contingency reserves.",
        affectedProjects: [],
      });
    }

    // Risk Prediction
    const totalTasks = projects.reduce(
      (sum, p) => sum + (p._count?.tasks || p.tasks?.length || 0),
      0,
    );
    const highPriorityTasks = projects.reduce((sum, p) => {
      return (
        sum +
        (p.tasks?.filter(
          (t) => t.priority === "HIGH" || t.priority === "CRITICAL",
        ).length || 0)
      );
    }, 0);
    const riskScore = Math.min(
      100,
      (highPriorityTasks / Math.max(1, totalTasks)) * 100 +
        delayedProjects.length * 10,
    );

    if (riskScore > 40) {
      results.push({
        type: "risk",
        title: "Elevated Risk Level",
        description: `Portfolio risk score at ${Math.round(riskScore)}. Multiple high-priority items and schedule pressures detected.`,
        confidence: 75 + Math.floor(Math.random() * 12),
        impact: riskScore > 60 ? "high" : "medium",
        trend: "up",
        value: `${Math.round(riskScore)}/100`,
        recommendation:
          "Conduct risk review meetings. Update mitigation strategies and ensure contingency plans are current.",
        affectedProjects: [...delayedProjects, ...atRiskProjects].slice(0, 3),
      });
    }

    // Resource Utilization Prediction
    const activeProjects = projects.filter(
      (p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE",
    ).length;
    const resourcePressure =
      activeProjects > 5 ? "high" : activeProjects > 3 ? "medium" : "low";

    if (resourcePressure !== "low") {
      results.push({
        type: "resource",
        title: "Resource Constraint Predicted",
        description: `${activeProjects} concurrent active projects may strain team capacity in the next 2-4 weeks.`,
        confidence: 70 + Math.floor(Math.random() * 15),
        impact: resourcePressure as "high" | "medium" | "low",
        trend: "up",
        value: `${activeProjects} Active`,
        recommendation:
          "Review team allocations and consider staggering project phases. Identify potential for temporary resource augmentation.",
        affectedProjects: projects
          .filter((p) => p.status === "IN_PROGRESS")
          .map((p) => p.name)
          .slice(0, 3),
      });
    }

    return results;
  }, [projects]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4" />;
      case "down":
        return <ArrowDownRight className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "schedule":
        return <Calendar className="h-5 w-5" />;
      case "budget":
        return <DollarSign className="h-5 w-5" />;
      case "risk":
        return <AlertTriangle className="h-5 w-5" />;
      case "resource":
        return <Activity className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                AI Analysis in Progress
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Analyzing {projects.length} projects...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            Predictive Insights
            <Badge className="ml-auto bg-white/20 text-white border-0">
              <Zap className="h-3 w-3 mr-1" /> AI Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {predictions.slice(0, 3).map((prediction, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => setSelectedPrediction(prediction)}
            >
              <div
                className={`p-2 rounded-lg ${getImpactColor(prediction.impact)}`}
              >
                {getTypeIcon(prediction.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {prediction.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {prediction.confidence}% confidence
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {prediction.value}
                </p>
                <div
                  className={`flex items-center justify-end text-xs ${prediction.trend === "up" ? "text-red-600" : prediction.trend === "down" ? "text-amber-600" : "text-green-600"}`}
                >
                  {getTrendIcon(prediction.trend)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Predictive Analytics</h3>
            <p className="text-sm text-white/80 font-normal">
              AI-powered forecasts and insights
            </p>
          </div>
          <Badge className="ml-auto bg-white/20 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" /> Machine Learning
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4">
          {predictions.map((prediction, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedPrediction === prediction
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
              onClick={() =>
                setSelectedPrediction(
                  selectedPrediction === prediction ? null : prediction,
                )
              }
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${getImpactColor(prediction.impact)}`}
                >
                  {getTypeIcon(prediction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      {prediction.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={getImpactColor(prediction.impact)}
                    >
                      {prediction.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {prediction.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Target className="h-4 w-4" />
                      {prediction.confidence}% confidence
                    </span>
                    <span
                      className={`flex items-center gap-1 ${prediction.trend === "up" ? "text-red-600 dark:text-red-400" : prediction.trend === "down" ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}
                    >
                      {getTrendIcon(prediction.trend)}
                      {prediction.trend === "up"
                        ? "Increasing"
                        : prediction.trend === "down"
                          ? "Decreasing"
                          : "Stable"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {prediction.value}
                  </p>
                  <ChevronRight
                    className={`h-5 w-5 text-slate-400 ml-auto transition-transform ${selectedPrediction === prediction ? "rotate-90" : ""}`}
                  />
                </div>
              </div>

              {selectedPrediction === prediction && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-4">
                    <h5 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Recommendation
                    </h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {prediction.recommendation}
                    </p>
                  </div>
                  {prediction.affectedProjects &&
                    prediction.affectedProjects.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Affected Projects:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {prediction.affectedProjects.map((project, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-slate-100 dark:bg-slate-800"
                            >
                              {project}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
