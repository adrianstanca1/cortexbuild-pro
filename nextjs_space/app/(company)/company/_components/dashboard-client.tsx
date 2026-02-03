"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  HardDrive,
  Mail,
  Activity,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ListTodo,
  FileQuestion,
  PackageCheck,
  ShieldAlert,
  FileText,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Shield
} from "lucide-react";
import { SafetyComplianceDashboard } from "./safety-compliance-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Entitlements } from "@/lib/entitlements";
import { formatCurrency } from "@/lib/utils";

interface CompanyStats {
  overview: {
    totalMembers: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    projectCompletionRate: number;
  };
  modules: {
    rfis: { total: number; open: number };
    submittals: { total: number; pending: number };
    changeOrders: { total: number };
    safety: { total: number; open: number };
    documents: { total: number };
  };
  activity: {
    recentCount: number;
    weeklyTrend: { date: string; count: number }[];
  };
  charts: {
    tasksByStatus: { status: string; count: number }[];
    projectsByStatus: { status: string; count: number }[];
    membersByRole: { role: string; count: number }[];
  };
  topProjects: {
    id: string;
    name: string;
    status: string;
    budget: number | null;
    taskCount: number;
    teamSize: number;
  }[];
}

interface CompanyDashboardClientProps {
  organization: any;
  entitlements: Entitlements;
  stats: {
    totalMembers: number;
    totalProjects: number;
    storageUsedGB: number;
    maxUsers: number;
    maxProjects: number;
    storageGB: number;
    pendingInvitations: number;
  };
  teamMembers: any[];
  projects: any[];
  recentActivity: any[];
}

export function CompanyDashboardClient({
  organization,
  entitlements,
  stats,
  teamMembers,
  projects,
  recentActivity
}: CompanyDashboardClientProps) {
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [_loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/company/stats");
      if (res.ok) {
        setCompanyStats(await res.json());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchStats]);

  const usagePercent = {
    users: Math.round((stats.totalMembers / stats.maxUsers) * 100),
    projects: Math.round((stats.totalProjects / stats.maxProjects) * 100),
    storage: Math.round((stats.storageUsedGB / stats.storageGB) * 100),
  };

  const statusColors: Record<string, string> = {
    PLANNING: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    ON_HOLD: "bg-gray-100 text-gray-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    ARCHIVED: "bg-purple-100 text-purple-700",
    TODO: "bg-slate-100 text-slate-700",
    REVIEW: "bg-orange-100 text-orange-700",
    COMPLETE: "bg-green-100 text-green-700",
  };

  const taskStatusColors: Record<string, string> = {
    TODO: "#64748b",
    IN_PROGRESS: "#f59e0b",
    REVIEW: "#f97316",
    COMPLETE: "#10b981"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here&apos;s an overview of {organization?.name || "your organization"}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/company/invitations">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Mail className="h-4 w-4 mr-2" />
              Invite Team Members
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="overview" onClick={() => setActiveTab('overview')} className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
            <BarChart3 className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => setActiveTab('analytics')} className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
            <PieChart className="h-4 w-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" onClick={() => setActiveTab('activity')} className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
            <Activity className="h-4 w-4 mr-2" /> Activity
          </TabsTrigger>
          <TabsTrigger value="safety" onClick={() => setActiveTab('safety')} className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
            <Shield className="h-4 w-4 mr-2" /> Safety
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-l-4 border-l-emerald-500 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                <CardContent className="p-5 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#6b7280' }}>Team Members</p>
                      <p className="text-2xl font-bold" style={{ color: '#111827' }}>
                        {stats.totalMembers}
                        <span className="text-sm font-normal" style={{ color: '#6b7280' }}>/{stats.maxUsers}</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <Progress value={usagePercent.users} className="mt-3 h-1.5" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-l-4 border-l-blue-500 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                <CardContent className="p-5 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#6b7280' }}>Projects</p>
                      <p className="text-2xl font-bold" style={{ color: '#111827' }}>
                        {companyStats?.overview.activeProjects || 0}
                        <span className="text-sm font-normal" style={{ color: '#6b7280' }}> active</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FolderKanban className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">{companyStats?.overview.completedProjects || 0} completed</span>
                    <span style={{ color: '#6b7280' }}>•</span>
                    <span style={{ color: '#4b5563' }}>{companyStats?.overview.totalProjects || 0} total</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-l-4 border-l-purple-500 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                <CardContent className="p-5 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#4b5563', fontWeight: 500 }}>Tasks</p>
                      <p className="text-2xl font-bold" style={{ color: '#111827' }}>
                        {companyStats?.overview.taskCompletionRate || 0}%
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span style={{ color: '#059669', fontWeight: 500 }}>{companyStats?.overview.completedTasks || 0} done</span>
                    <span style={{ color: '#6b7280' }}>•</span>
                    {(companyStats?.overview.overdueTasks || 0) > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {companyStats?.overview.overdueTasks} overdue
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-l-4 border-l-amber-500 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                <CardContent className="p-5 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#374151' }}>Storage Used</p>
                      <p className="text-2xl font-bold" style={{ color: '#111827' }}>
                        {stats.storageUsedGB.toFixed(2)}
                        <span className="text-sm font-normal" style={{ color: '#374151' }}> GB</span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <HardDrive className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <Progress value={usagePercent.storage} className="mt-3 h-1.5" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Modules Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <Link href="/rfis">
                <CardContent className="p-4 text-center !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <FileQuestion className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{companyStats?.modules.rfis.total || 0}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>RFIs</p>
                  {(companyStats?.modules.rfis.open || 0) > 0 && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {companyStats?.modules.rfis.open} open
                    </Badge>
                  )}
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <Link href="/submittals">
                <CardContent className="p-4 text-center !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <PackageCheck className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{companyStats?.modules.submittals.total || 0}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Submittals</p>
                  {(companyStats?.modules.submittals.pending || 0) > 0 && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {companyStats?.modules.submittals.pending} pending
                    </Badge>
                  )}
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <Link href="/change-orders">
                <CardContent className="p-4 text-center !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <FileText className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{companyStats?.modules.changeOrders.total || 0}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Change Orders</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <Link href="/safety">
                <CardContent className="p-4 text-center !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <ShieldAlert className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{companyStats?.modules.safety.total || 0}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Safety Incidents</p>
                  {(companyStats?.modules.safety.open || 0) > 0 && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {companyStats?.modules.safety.open} open
                    </Badge>
                  )}
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <Link href="/documents">
                <CardContent className="p-4 text-center !bg-white" style={{ backgroundColor: '#ffffff' }}>
                  <FileText className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{companyStats?.modules.documents.total || 0}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Documents</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Team Members */}
            <Card className="!bg-white" style={{ backgroundColor: '#ffffff' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3 !bg-white" style={{ backgroundColor: '#ffffff' }}>
                <CardTitle className="text-lg font-semibold" style={{ color: '#111827' }}>Recent Team Members</CardTitle>
                <Link href="/company/team">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="!bg-white" style={{ backgroundColor: '#ffffff' }}>
                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: '#6b7280' }}>No team members yet</p>
                  ) : (
                    teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                            {member.user.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: '#111827' }}>{member.user.name}</p>
                            <p className="text-xs" style={{ color: '#6b7280' }}>{member.jobTitle || member.user.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.user.role.replace("_", " ")}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold">Top Projects</CardTitle>
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(companyStats?.topProjects || projects).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No projects yet</p>
                  ) : (
                    (companyStats?.topProjects || projects).slice(0, 5).map((project: any) => (
                      <Link key={project.id} href={`/projects/${project.id}`} className="block">
                        <div className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                            <p className="text-xs text-gray-500">
                              {project.taskCount || project._count?.tasks || 0} tasks • {project.teamSize || 0} members
                              {project.budget && ` • ${formatCurrency(project.budget)}`}
                            </p>
                          </div>
                          <Badge className={statusColors[project.status] || "bg-gray-100"}>
                            {project.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Task & Project Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-purple-500" />
                  Tasks by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyStats?.charts.tasksByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{item.status.replace("_", " ").toLowerCase()}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(item.count / (companyStats?.overview.totalTasks || 1)) * 100}%`,
                            backgroundColor: taskStatusColors[item.status] || "#64748b"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!companyStats?.charts.tasksByStatus || companyStats.charts.tasksByStatus.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No tasks data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Projects by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                  Projects by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyStats?.charts.projectsByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{item.status.replace("_", " ").toLowerCase()}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(item.count / (companyStats?.overview.totalProjects || 1)) * 100}%`,
                            backgroundColor: statusColors[item.status]?.includes("emerald") ? "#10b981" :
                              statusColors[item.status]?.includes("amber") ? "#f59e0b" :
                              statusColors[item.status]?.includes("blue") ? "#3b82f6" :
                              statusColors[item.status]?.includes("purple") ? "#8b5cf6" : "#64748b"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!companyStats?.charts.projectsByStatus || companyStats.charts.projectsByStatus.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No projects data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  Team by Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyStats?.charts.membersByRole.map((item) => (
                    <div key={item.role} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm capitalize">{item.role.replace("_", " ").toLowerCase()}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                  {(!companyStats?.charts.membersByRole || companyStats.charts.membersByRole.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No team data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  Weekly Activity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companyStats?.activity.weeklyTrend.slice(-7).map((day, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">
                        {new Date(day.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min((day.count / 50) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{day.count}</span>
                    </div>
                  ))}
                  {(!companyStats?.activity.weeklyTrend || companyStats.activity.weeklyTrend.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No activity data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Badge variant="outline">{companyStats?.activity.recentCount || 0} this week</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user?.name}</span>{" "}
                          {activity.action.toLowerCase()}{" "}
                          {activity.entityName && (
                            <span className="font-medium">{activity.entityName}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6 mt-6">
          <SafetyComplianceDashboard />
        </TabsContent>
      </Tabs>

      {/* Enabled Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Enabled Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(entitlements.modules).map(([key, enabled]) => (
              <div
                key={key}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  enabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200 opacity-50"
                }`}
              >
                {enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
