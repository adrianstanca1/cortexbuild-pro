"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ProjectHealth {
  projectId: string;
  projectName: string;
  overallScore: number;
  categories: {
    safety: number;
    compliance: number;
    progress: number;
    budget: number;
  };
  metrics: {
    openIssues: number;
    overdueTasks: number;
    completionRate: number;
    budgetUtilization: number;
  };
}

interface OrganizationAnalytics {
  projectCount: number;
  averageHealthScore: number;
  projectsAtRisk: number;
  projectsHealthy: number;
  projects: ProjectHealth[];
}

export function AnalyticsDashboardClient() {
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/overview");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.projectCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{analytics.averageHealthScore}%</div>
              {analytics.averageHealthScore >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : analytics.averageHealthScore < 60 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-500">
                {analytics.projectsAtRisk}
              </div>
              {analytics.projectsAtRisk > 0 && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Healthy Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {analytics.projectsHealthy}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.projects.map((project) => (
              <div
                key={project.projectId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{project.projectName}</span>
                    <Badge
                      variant={
                        project.overallScore >= 80
                          ? "default"
                          : project.overallScore >= 60
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {project.overallScore >= 80
                        ? "Healthy"
                        : project.overallScore >= 60
                        ? "At Risk"
                        : "Critical"}
                    </Badge>
                  </div>
                  <Progress value={project.overallScore} className="h-2" />
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold">{project.overallScore}%</div>
                  <div className="text-sm text-muted-foreground">
                    {project.metrics.overdueTasks} overdue
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
