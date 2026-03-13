"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Building2, FolderKanban, Clock, FileText, Activity,
  Shield, Database, RefreshCw, UserCheck,
  ShieldAlert, Zap, AlertTriangle, CheckCircle2, XCircle,
  Radio, BarChart3, Terminal, HardHat, PoundSterling,
  TrendingUp, Calendar, ClipboardCheck,
  ChevronRight, Eye, UserCog, Bell, Settings, Plus,
  FileCheck, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  healthScore: number;
  timestamp: string;
  realtime: { connectedClients: number; sseStatus: string };
  users: { total: number; activeToday: number; activeThisWeek: number };
  organizations: { total: number; breakdown: { id: string; name: string; users: number; projects: number }[] };
  projects: { total: number; active: number; completion: number };
  activity: { lastHour: number; last24Hours: number };
  alerts: { overdueTasks: number; openRFIs: number; pendingSubmittals: number; unresolvedIncidents: number; pendingTasks: number };
  database: { status: string; responseTime: string };
}

interface PlatformStats {
  totals: {
    users: number; organizations: number; projects: number; tasks: number;
    documents: number; rfis: number; submittals: number; changeOrders: number;
    safetyIncidents: number; dailyReports: number; activities: number;
  };
  usersByRole: { role: string; count: number }[];
  projectsByStatus: { status: string; count: number }[];
  tasksByStatus: { status: string; count: number }[];
  recentUsers: number;
  activeUsers: number;
  organizations: { id: string; name: string; slug: string; userCount: number; projectCount: number }[];
}

interface LiveActivity {
  id: string;
  action: string;
  entityType: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
  project: { id: string; name: string } | null;
}

// Fetch company-level data directly
interface CompanyData {
  users: any[];
  projects: any[];
  timeEntries: any[];
  safetyIncidents: any[];
  inspections: any[];
  tasks: any[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    COMPANY_OWNER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    PROJECT_MANAGER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    FIELD_WORKER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

function getInitials(name: string) {
  return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// KPI tile
function KPITile({ label, value, sub, icon: Icon, color, _trend }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; _trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color.replace("border-l-", "bg-").replace("-500", "-500/10")}`}>
            <Icon className={`h-6 w-6 ${color.replace("border-l-", "text-")}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [liveFeed, setLiveFeed] = useState<LiveActivity[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData>({ users: [], projects: [], timeEntries: [], safetyIncidents: [], inspections: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAllData = useCallback(async () => {
    try {
      const [statsRes, healthRes, feedRes, usersRes, projectsRes, timeRes, safetyRes, inspRes, tasksRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/system-health"),
        fetch("/api/admin/live-feed?limit=15"),
        fetch("/api/admin/users"),
        fetch("/api/projects"),
        fetch("/api/time-entries"),
        fetch("/api/safety"),
        fetch("/api/inspections"),
        fetch("/api/tasks"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (feedRes.ok) {
        const d = await feedRes.json();
        setLiveFeed(d.activities || []);
      }
      const users = usersRes.ok ? await usersRes.json() : { users: [] };
      const projects = projectsRes.ok ? await projectsRes.json() : [];
      const timeEntries = timeRes.ok ? await timeRes.json() : [];
      const safety = safetyRes.ok ? await safetyRes.json() : [];
      const inspections = inspRes.ok ? await inspRes.json() : [];
      const tasks = tasksRes.ok ? await tasksRes.json() : [];

      setCompanyData({
        users: users.users || [],
        projects: Array.isArray(projects) ? projects : projects.projects || [],
        timeEntries: Array.isArray(timeEntries) ? timeEntries : [],
        safetyIncidents: Array.isArray(safety) ? safety : safety.incidents || [],
        inspections: Array.isArray(inspections) ? inspections : inspections.inspections || [],
        tasks: Array.isArray(tasks) ? tasks : tasks.tasks || [],
      });
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRefresh = () => { setRefreshing(true); fetchAllData(); };

  // Derived metrics
  const totalBudget = companyData.projects.reduce((s: number, p: any) => s + (Number(p.budget) || 0), 0);
  const activeProjects = companyData.projects.filter((p: any) => p.status === "IN_PROGRESS").length;
  const totalHoursThisWeek = companyData.timeEntries
    .filter((t: any) => {
      const d = new Date(t.date);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    })
    .reduce((s: number, t: any) => s + (Number(t.hours) || 0), 0);
  const pendingTimeEntries = companyData.timeEntries.filter((t: any) => t.status === "PENDING").length;
  const openIncidents = companyData.safetyIncidents.filter((i: any) => i.status === "OPEN" || i.status === "INVESTIGATING").length;
  const upcomingInspections = companyData.inspections.filter((i: any) => i.status === "SCHEDULED").length;
  const openTasks = companyData.tasks.filter((t: any) => t.status !== "COMPLETE").length;
  const criticalTasks = companyData.tasks.filter((t: any) => t.priority === "CRITICAL" && t.status !== "COMPLETE").length;

  const statusColors = {
    healthy: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    critical: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
  };
  const StatusIcon = health ? (health.status === "healthy" ? CheckCircle2 : health.status === "warning" ? AlertTriangle : XCircle) : CheckCircle2;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full mx-auto" />
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0 mx-auto" />
          </div>
          <p className="mt-6 text-gray-500 font-medium">Loading Command Centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
            <Terminal className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Command Centre</h1>
            <p className="text-sm text-gray-500 mt-0.5">AS Cladding & Roofing Ltd — Platform Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {health && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[health.status]}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="capitalize">{health.status}</span>
              <span className="font-bold">{health.healthScore}%</span>
            </div>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full max-w-3xl gap-1">
          <TabsTrigger value="overview" className="flex-1 gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="workers" className="flex-1 gap-2 text-xs sm:text-sm">
            <HardHat className="h-4 w-4" /> Workers
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="flex-1 gap-2 text-xs sm:text-sm">
            <Clock className="h-4 w-4" /> Timesheets
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex-1 gap-2 text-xs sm:text-sm">
            <Shield className="h-4 w-4" /> Safety
          </TabsTrigger>
          <TabsTrigger value="system" className="flex-1 gap-2 text-xs sm:text-sm">
            <Database className="h-4 w-4" /> System
          </TabsTrigger>
        </TabsList>

        {/* ====== OVERVIEW TAB ====== */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <KPITile label="Total Projects" value={companyData.projects.length} sub={`${activeProjects} active`} icon={FolderKanban} color="border-l-indigo-500" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <KPITile label="Total Budget" value={formatCurrency(totalBudget)} sub="across all projects" icon={PoundSterling} color="border-l-amber-500" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <KPITile label="Team Size" value={stats?.totals.users ?? companyData.users.length} sub={`${pendingTimeEntries} timesheets pending`} icon={Users} color="border-l-purple-500" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <KPITile label="Open Tasks" value={openTasks} sub={`${criticalTasks} critical`} icon={ClipboardCheck} color="border-l-rose-500" />
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <KPITile label="Hours This Week" value={`${totalHoursThisWeek.toFixed(0)}h`} sub={`${companyData.timeEntries.length} total entries`} icon={Clock} color="border-l-cyan-500" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <KPITile label="Safety Incidents" value={companyData.safetyIncidents.length} sub={`${openIncidents} open`} icon={ShieldAlert} color={openIncidents > 0 ? "border-l-orange-500" : "border-l-green-500"} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <KPITile label="Inspections" value={companyData.inspections.length} sub={`${upcomingInspections} upcoming`} icon={FileCheck} color="border-l-teal-500" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <KPITile label="Documents" value={stats?.totals.documents ?? 0} sub={`${stats?.totals.rfis ?? 0} RFIs`} icon={FileText} color="border-l-violet-500" />
            </motion.div>
          </div>

          {/* Projects + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-indigo-500" /> Active Projects
                  </CardTitle>
                  <Link href="/projects">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">View all <ChevronRight className="h-3 w-3" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {companyData.projects.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.budget ? formatCurrency(Number(p.budget)) : "No budget set"}</p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${
                        p.status === "IN_PROGRESS" ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" :
                        p.status === "PLANNING" ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" :
                        p.status === "COMPLETED" ? "border-gray-300 text-gray-600" :
                        "border-amber-300 text-amber-700 bg-amber-50"
                      }`}>
                        {p.status?.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
                {companyData.projects.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No projects yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" /> Recent Activity
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{health?.activity.last24Hours ?? 0} today</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {liveFeed.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{item.user?.name || "System"}</span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">{item.action}</span>
                        {item.project && <span className="text-indigo-600 dark:text-indigo-400"> · {item.project.name}</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
                {liveFeed.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No activity recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====== WORKERS TAB ====== */}
        <TabsContent value="workers" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Worker Roster</h2>
              <p className="text-sm text-gray-500">{companyData.users.length} team members registered</p>
            </div>
            <div className="flex gap-2">
              <Link href="/company/team">
                <Button variant="outline" size="sm" className="gap-2">
                  <UserCog className="h-4 w-4" /> Manage Team
                </Button>
              </Link>
              <Link href="/company/invitations">
                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="h-4 w-4" /> Invite Worker
                </Button>
              </Link>
            </div>
          </div>

          {/* Role breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { role: "SUPER_ADMIN", label: "Super Admin", icon: Shield, color: "border-l-purple-500" },
              { role: "COMPANY_OWNER", label: "Company Owner", icon: Building2, color: "border-l-amber-500" },
              { role: "PROJECT_MANAGER", label: "Project Managers", icon: UserCheck, color: "border-l-blue-500" },
              { role: "FIELD_WORKER", label: "Field Workers", icon: HardHat, color: "border-l-green-500" },
            ].map(({ role, label, icon: Icon, color }) => {
              const count = companyData.users.filter((u: any) => u.role === role).length;
              return (
                <Card key={role} className={`border-l-4 ${color}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Worker cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyData.users.map((user: any) => (
              <motion.div key={user.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 border-2 border-gray-100 dark:border-gray-700">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                          {getInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name || "Unnamed"}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role?.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3" />
                        {user._count?.assignedTasks ?? 0} tasks
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {user.lastLogin
                          ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                          : "Never logged in"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {companyData.users.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ====== TIMESHEETS TAB ====== */}
        <TabsContent value="timesheets" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timesheet Overview</h2>
              <p className="text-sm text-gray-500">{companyData.timeEntries.length} entries across all projects</p>
            </div>
            <Link href="/time-tracking">
              <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Clock className="h-4 w-4" /> Manage Timesheets
              </Button>
            </Link>
          </div>

          {/* Time KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPITile label="Hours This Week" value={`${totalHoursThisWeek.toFixed(0)}h`} sub="last 7 days" icon={Clock} color="border-l-cyan-500" />
            <KPITile label="Pending Approval" value={pendingTimeEntries} sub="awaiting sign-off" icon={AlertCircle} color={pendingTimeEntries > 0 ? "border-l-amber-500" : "border-l-green-500"} />
            <KPITile label="Total Hours" value={`${companyData.timeEntries.reduce((s: number, t: any) => s + (Number(t.hours) || 0), 0).toFixed(0)}h`} sub="all time" icon={TrendingUp} color="border-l-indigo-500" />
            <KPITile label="Approved" value={companyData.timeEntries.filter((t: any) => t.status === "APPROVED").length} sub="entries approved" icon={CheckCircle2} color="border-l-green-500" />
          </div>

          {/* Recent time entries table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-500" /> Recent Time Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Worker</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hours</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {companyData.timeEntries.slice(0, 12).map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {getInitials(entry.user?.name || "")}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{entry.user?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 max-w-[150px] truncate">{entry.project?.name || "—"}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {entry.date ? format(new Date(entry.date), "dd MMM") : "—"}
                        </td>
                        <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">{entry.hours}h</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className={`text-xs ${
                            entry.status === "APPROVED" ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" :
                            entry.status === "PENDING" ? "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/20" :
                            "border-gray-200 text-gray-600"
                          }`}>
                            {entry.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {companyData.timeEntries.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No time entries recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== SAFETY TAB ====== */}
        <TabsContent value="safety" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Safety Overview</h2>
              <p className="text-sm text-gray-500">Incidents, inspections & compliance</p>
            </div>
            <Link href="/safety">
              <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Shield className="h-4 w-4" /> Safety Module
              </Button>
            </Link>
          </div>

          {/* Safety KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPITile label="Total Incidents" value={companyData.safetyIncidents.length} sub="all time" icon={ShieldAlert} color="border-l-orange-500" />
            <KPITile label="Open / Investigating" value={openIncidents} sub="need attention" icon={AlertTriangle} color={openIncidents > 0 ? "border-l-red-500" : "border-l-green-500"} />
            <KPITile label="Inspections" value={companyData.inspections.length} sub={`${upcomingInspections} upcoming`} icon={FileCheck} color="border-l-teal-500" />
            <KPITile
              label="Safety Score"
              value={openIncidents === 0 ? "100%" : `${Math.max(0, 100 - openIncidents * 15)}%`}
              sub="based on open incidents"
              icon={Shield}
              color={openIncidents === 0 ? "border-l-green-500" : "border-l-amber-500"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-orange-500" /> Recent Incidents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {companyData.safetyIncidents.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">No incidents recorded</p>
                    <p className="text-xs text-gray-500">Great safety record!</p>
                  </div>
                ) : (
                  companyData.safetyIncidents.slice(0, 5).map((incident: any) => (
                    <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        incident.severity === "HIGH" || incident.severity === "CRITICAL" ? "bg-red-500" :
                        incident.severity === "MEDIUM" ? "bg-amber-500" : "bg-yellow-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{incident.description?.slice(0, 60)}...</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${
                            incident.severity === "HIGH" || incident.severity === "CRITICAL" ? "border-red-300 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400" :
                            incident.severity === "MEDIUM" ? "border-amber-300 text-amber-700 bg-amber-50" :
                            "border-yellow-200 text-yellow-700"
                          }`}>{incident.severity}</Badge>
                          <Badge variant="outline" className={`text-xs ${
                            incident.status === "OPEN" || incident.status === "INVESTIGATING" ? "border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20" :
                            "border-gray-200 text-gray-600"
                          }`}>{incident.status}</Badge>
                          <span className="text-xs text-gray-400">{incident.incidentDate ? formatDistanceToNow(new Date(incident.incidentDate), { addSuffix: true }) : ""}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Inspections */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-teal-500" /> Inspections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {companyData.inspections.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No inspections scheduled</p>
                ) : (
                  companyData.inspections.slice(0, 5).map((insp: any) => (
                    <div key={insp.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{insp.title}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {insp.scheduledDate ? format(new Date(insp.scheduledDate), "dd MMM yyyy") : "TBC"}
                        </div>
                      </div>
                      <Badge variant="outline" className={`ml-2 text-xs flex-shrink-0 ${
                        insp.status === "PASSED" ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" :
                        insp.status === "SCHEDULED" ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" :
                        insp.status === "FAILED" ? "border-red-300 text-red-700 bg-red-50" :
                        "border-gray-200 text-gray-600"
                      }`}>{insp.status}</Badge>
                    </div>
                  ))
                )}
                <Link href="/inspections">
                  <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                    <Eye className="h-4 w-4" /> View All Inspections
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====== SYSTEM TAB ====== */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPITile label="System Health" value={`${health?.healthScore ?? 0}%`} sub={health?.status ?? "unknown"} icon={Zap} color={health?.status === "healthy" ? "border-l-green-500" : "border-l-amber-500"} />
            <KPITile label="Active Users Today" value={health?.users.activeToday ?? 0} sub={`${health?.users.total ?? 0} total`} icon={UserCheck} color="border-l-blue-500" />
            <KPITile label="DB Response" value={health?.database.responseTime ?? "—"} sub={health?.database.status ?? ""} icon={Database} color="border-l-purple-500" />
            <KPITile label="Events (24h)" value={health?.activity.last24Hours ?? 0} sub={`${health?.activity.lastHour ?? 0} last hour`} icon={Activity} color="border-l-indigo-500" />
          </div>

          {/* Alerts */}
          {health && (health.alerts.overdueTasks > 0 || health.alerts.unresolvedIncidents > 0 || health.alerts.openRFIs > 0) && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Bell className="h-4 w-4" /> Platform Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {health.alerts.overdueTasks > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{health.alerts.overdueTasks}</p>
                        <p className="text-xs text-gray-500">Overdue Tasks</p>
                      </div>
                    </div>
                  )}
                  {health.alerts.openRFIs > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{health.alerts.openRFIs}</p>
                        <p className="text-xs text-gray-500">Open RFIs</p>
                      </div>
                    </div>
                  )}
                  {health.alerts.unresolvedIncidents > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{health.alerts.unresolvedIncidents}</p>
                        <p className="text-xs text-gray-500">Safety Issues</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Links to Admin Modules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" /> Admin Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { href: "/admin/users", label: "User Management", icon: Users, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
                  { href: "/admin/organizations", label: "Organisations", icon: Building2, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
                  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText, color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20" },
                  { href: "/admin/system-health", label: "System Health", icon: Zap, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
                  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20" },
                  { href: "/admin/permissions", label: "Permissions", icon: Shield, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
                  { href: "/admin/invitations", label: "Invitations", icon: UserCheck, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
                  { href: "/admin/webhooks", label: "Webhooks", icon: Radio, color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all cursor-pointer group">
                      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
