"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Shield,
  HardHat,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  ChevronRight,
  BarChart3,
  Target,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SafetyAnalytics {
  summary: {
    toolboxTalks: {
      total: number;
      completed: number;
      totalAttendees: number;
      thisWeek: number;
    };
    mewpChecks: {
      total: number;
      passed: number;
      failed: number;
      needsAttention: number;
      safeToUse: number;
      passRate: number;
    };
    toolChecks: {
      total: number;
      passed: number;
      failed: number;
      needsAttention: number;
      safeToUse: number;
      passRate: number;
      byType: Record<string, number>;
    };
    safetyIncidents: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      resolved: number;
    };
    inspections: {
      total: number;
      passed: number;
      failed: number;
      pending: number;
      passRate: number;
    };
    complianceScore: number;
  };
  monthlyData: Array<{
    month: string;
    toolboxTalks: number;
    mewpChecks: number;
    toolChecks: number;
    incidents: number;
    inspectionsPassed: number;
    inspectionsFailed: number;
  }>;
  projectBreakdown: Array<{
    id: string;
    name: string;
    toolboxTalks: number;
    toolboxCompleted: number;
    mewpChecks: number;
    mewpPassRate: number;
    toolChecks: number;
    toolPassRate: number;
    incidents: number;
    criticalIncidents: number;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    project: string;
    date: string;
    status: string;
    details: string;
  }>;
  equipmentWithIssues: Array<{
    type: string;
    name: string;
    serialNumber?: string;
    project: string;
    status: string;
    defects?: string;
    checkDate: string;
  }>;
  projects: Array<{ id: string; name: string }>;
}

export function SafetyComplianceDashboard() {
  const [data, setData] = useState<SafetyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6months");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedProject]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (selectedProject !== "all") {
        params.append("projectId", selectedProject);
      }
      const res = await fetch(`/api/safety/analytics?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch safety analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceBg = (score: number) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 70) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No safety data available</p>
      </div>
    );
  }

  const {
    summary,
    monthlyData,
    projectBreakdown,
    recentActivity,
    equipmentWithIssues,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Safety Compliance
          </h2>
          <p className="text-muted-foreground">
            Monitor safety performance across all projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {data.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Compliance Score Card */}
      <Card
        className={`${getComplianceBg(summary.complianceScore)} border-none`}
      >
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-full ${summary.complianceScore >= 90 ? "bg-green-200" : summary.complianceScore >= 70 ? "bg-yellow-200" : "bg-red-200"}`}
              >
                <Target
                  className={`h-8 w-8 ${getComplianceColor(summary.complianceScore)}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Compliance Score
                </p>
                <p
                  className={`text-4xl font-bold ${getComplianceColor(summary.complianceScore)}`}
                >
                  {summary.complianceScore}%
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {summary.mewpChecks.passRate}%
                </p>
                <p className="text-sm text-muted-foreground">MEWP Pass Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {summary.toolChecks.passRate}%
                </p>
                <p className="text-sm text-muted-foreground">Tool Pass Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {summary.inspections.passRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Inspection Pass Rate
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toolbox Talks
                </p>
                <p className="text-2xl font-bold">
                  {summary.toolboxTalks.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.toolboxTalks.completed} completed •{" "}
                  {summary.toolboxTalks.totalAttendees} attendees
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={
                  (summary.toolboxTalks.completed /
                    Math.max(summary.toolboxTalks.total, 1)) *
                  100
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  MEWP Checks
                </p>
                <p className="text-2xl font-bold">{summary.mewpChecks.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">
                    {summary.mewpChecks.passed} passed
                  </span>{" "}
                  •
                  <span className="text-red-600 ml-1">
                    {summary.mewpChecks.failed} failed
                  </span>
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <HardHat className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={summary.mewpChecks.passRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tool Checks
                </p>
                <p className="text-2xl font-bold">{summary.toolChecks.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">
                    {summary.toolChecks.passed} passed
                  </span>{" "}
                  •
                  <span className="text-red-600 ml-1">
                    {summary.toolChecks.failed} failed
                  </span>
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={summary.toolChecks.passRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Safety Incidents
                </p>
                <p className="text-2xl font-bold">
                  {summary.safetyIncidents.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-red-600">
                    {summary.safetyIncidents.critical +
                      summary.safetyIncidents.high}{" "}
                    high priority
                  </span>
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex gap-1">
              {summary.safetyIncidents.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {summary.safetyIncidents.critical} Critical
                </Badge>
              )}
              {summary.safetyIncidents.high > 0 && (
                <Badge className="text-xs bg-orange-500">
                  {summary.safetyIncidents.high} High
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart (Simple version) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Safety Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Month</th>
                  <th className="text-center py-2 px-3 font-medium">
                    Toolbox Talks
                  </th>
                  <th className="text-center py-2 px-3 font-medium">
                    MEWP Checks
                  </th>
                  <th className="text-center py-2 px-3 font-medium">
                    Tool Checks
                  </th>
                  <th className="text-center py-2 px-3 font-medium">
                    Incidents
                  </th>
                  <th className="text-center py-2 px-3 font-medium">
                    Inspections
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{month.month}</td>
                    <td className="text-center py-2 px-3">
                      <Badge variant="outline">{month.toolboxTalks}</Badge>
                    </td>
                    <td className="text-center py-2 px-3">
                      <Badge variant="outline" className="bg-orange-50">
                        {month.mewpChecks}
                      </Badge>
                    </td>
                    <td className="text-center py-2 px-3">
                      <Badge variant="outline" className="bg-purple-50">
                        {month.toolChecks}
                      </Badge>
                    </td>
                    <td className="text-center py-2 px-3">
                      <Badge
                        variant={
                          month.incidents > 0 ? "destructive" : "outline"
                        }
                      >
                        {month.incidents}
                      </Badge>
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className="text-green-600">
                        {month.inspectionsPassed}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-600">
                        {month.inspectionsFailed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Equipment with Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Equipment Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipmentWithIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                <p>All equipment checks passed!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {equipmentWithIssues.slice(0, 10).map((eq, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className="p-2 bg-red-100 rounded">
                      {eq.type === "MEWP" ? (
                        <HardHat className="h-4 w-4 text-red-600" />
                      ) : (
                        <Wrench className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {eq.name}
                        </p>
                        <Badge
                          variant={
                            eq.status === "FAIL" ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          {eq.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {eq.project}
                      </p>
                      {eq.defects && (
                        <p className="text-xs text-red-600 mt-1 line-clamp-2">
                          {eq.defects}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(eq.checkDate), "dd/MM")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Safety Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div
                    className={`p-2 rounded ${
                      activity.type === "toolbox_talk"
                        ? "bg-indigo-100"
                        : activity.type === "mewp_check"
                          ? "bg-orange-100"
                          : "bg-purple-100"
                    }`}
                  >
                    {activity.type === "toolbox_talk" ? (
                      <Users className="h-4 w-4 text-indigo-600" />
                    ) : activity.type === "mewp_check" ? (
                      <HardHat className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Wrench className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {activity.title}
                      </p>
                      <Badge
                        variant={
                          activity.status === "PASS" ||
                          activity.status === "COMPLETED"
                            ? "default"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.project} • {activity.details}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.date), "dd/MM HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Project Safety Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3 font-medium">Project</th>
                  <th className="text-center py-3 px-3 font-medium">
                    Toolbox Talks
                  </th>
                  <th className="text-center py-3 px-3 font-medium">
                    MEWP Pass Rate
                  </th>
                  <th className="text-center py-3 px-3 font-medium">
                    Tool Pass Rate
                  </th>
                  <th className="text-center py-3 px-3 font-medium">
                    Incidents
                  </th>
                  <th className="text-center py-3 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectBreakdown.map((project) => {
                  const avgPassRate =
                    (project.mewpPassRate + project.toolPassRate) / 2;
                  return (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-3 font-medium">{project.name}</td>
                      <td className="text-center py-3 px-3">
                        <span className="text-green-600">
                          {project.toolboxCompleted}
                        </span>
                        <span className="text-muted-foreground">
                          /{project.toolboxTalks}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span
                          className={
                            project.mewpPassRate >= 90
                              ? "text-green-600"
                              : project.mewpPassRate >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {project.mewpPassRate}%
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({project.mewpChecks})
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span
                          className={
                            project.toolPassRate >= 90
                              ? "text-green-600"
                              : project.toolPassRate >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {project.toolPassRate}%
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({project.toolChecks})
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        {project.criticalIncidents > 0 ? (
                          <Badge variant="destructive">
                            {project.incidents} ({project.criticalIncidents}{" "}
                            critical)
                          </Badge>
                        ) : (
                          <Badge variant="outline">{project.incidents}</Badge>
                        )}
                      </td>
                      <td className="text-center py-3 px-3">
                        {avgPassRate >= 90 ? (
                          <Badge className="bg-green-100 text-green-700">
                            Excellent
                          </Badge>
                        ) : avgPassRate >= 70 ? (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            Good
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            Needs Attention
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {projectBreakdown.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No project data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
