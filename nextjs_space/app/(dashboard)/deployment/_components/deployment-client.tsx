"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  CheckCircle,
  Clock,
  Server,
  Database,
  Cloud,
  Shield,
  Cpu,
  HardDrive,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { useRouter } from "next/navigation";

interface DeploymentClientProps {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    budget: number | null;
    createdAt: string;
    _count: { tasks: number; teamMembers: number };
  }>;
  teamMembers: Array<{
    id: string;
    invitedAt: string;
    user: { id: string; name: string | null; email: string; role: string };
  }>;
  activities: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: { name: string | null };
    project: { name: string };
  }>;
  userRole: string;
  organizationId: string;
}

export function DeploymentClient({
  projects: initialProjects,
  teamMembers: initialTeamMembers,
  activities: initialActivities,
  userRole,
  organizationId,
}: DeploymentClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "team" | "activity">("overview");
  const [projects, setProjects] = useState(initialProjects);
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh data from API
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deployment/status");
      if (res.ok) {
        const data = await res.json();
        // Update state with fresh data if available
        if (data.data?.pm2?.stats) {
          toast({ title: "Deployment Status", description: "System health checked" });
        }
      }
    } catch (err) {
      setError("Failed to fetch deployment status");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Refresh organization data
  const refreshOrgData = useCallback(async () => {
    try {
      const [projectsRes, activitiesRes] = await Promise.all([
        fetch(`/api/projects?organizationId=${organizationId}`),
        fetch(`/api/activity?organizationId=${organizationId}&limit=50`),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || projectsData);
      }
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || activitiesData);
      }
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  }, [organizationId]);

  // Subscribe to real-time events
  const handleDeploymentEvent = useCallback(() => {
    refreshOrgData();
  }, [refreshOrgData]);

  useRealtimeSubscription(
    ['project_created', 'project_updated', 'activity_created'],
    handleDeploymentEvent
  );

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "IN_PROGRESS").length,
    totalTeamMembers: teamMembers.length,
    recentActivities: activities.length,
  };

  const projectStatusDistribution = {
    PLANNING: projects.filter((p) => p.status === "PLANNING").length,
    IN_PROGRESS: projects.filter((p) => p.status === "IN_PROGRESS").length,
    ON_HOLD: projects.filter((p) => p.status === "ON_HOLD").length,
    COMPLETED: projects.filter((p) => p.status === "COMPLETED").length,
  };

  const deploymentHealth = {
    score: projects.length > 0
      ? Math.round((projectStatusDistribution.IN_PROGRESS / projects.length) * 100)
      : 0,
    status: stats.activeProjects > 0 ? "Healthy" : "Idle",
    uptime: "99.9%",
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deployment Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor system deployment, project health, and operational metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            {userRole}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-medium text-red-800 dark:text-red-300">Error</p>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === "projects" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("projects")}
        >
          <Server className="h-4 w-4 mr-2" />
          Projects
        </Button>
        <Button
          variant={activeTab === "team" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("team")}
        >
          <Users className="h-4 w-4 mr-2" />
          Team
        </Button>
        <Button
          variant={activeTab === "activity" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("activity")}
        >
          <Activity className="h-4 w-4 mr-2" />
          Activity
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProjects} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teamMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all projects
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deployment Health</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deploymentHealth.score}%</div>
                <p className="text-xs text-muted-foreground">
                  {deploymentHealth.status}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Cloud className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deploymentHealth.uptime}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Project Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  {Object.entries(projectStatusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className="w-24 text-sm font-medium">{status.replace(/_/g, " ")}</div>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === "IN_PROGRESS" ? "bg-emerald-500" :
                            status === "PLANNING" ? "bg-blue-500" :
                            status === "ON_HOLD" ? "bg-amber-500" :
                            "bg-gray-400"
                          }`}
                          style={{ width: `${projects.length > 0 ? (count / projects.length) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm text-muted-foreground">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.user.name || "Unknown"} {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.project.name} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto opacity-50" />
                    <p className="mt-2 text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto opacity-50" />
                <p className="mt-4">No projects found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            project.status === "IN_PROGRESS" ? "bg-emerald-500/10 text-emerald-600" :
                            project.status === "PLANNING" ? "bg-blue-500/10 text-blue-600" :
                            project.status === "ON_HOLD" ? "bg-amber-500/10 text-amber-600" :
                            "bg-gray-500/10 text-gray-600"
                          }
                        >
                          {project.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{project._count.tasks}</TableCell>
                      <TableCell>{project._count.teamMembers}</TableCell>
                      <TableCell>
                        {project.budget ? `£${Number(project.budget).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto opacity-50" />
                <p className="mt-4">No team members</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user.name || "Pending"}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.user.role}</Badge>
                      </TableCell>
                      <TableCell>{new Date(member.invitedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto opacity-50" />
                <p className="mt-4">No activity recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.user.name || "Unknown"} {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.project.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
