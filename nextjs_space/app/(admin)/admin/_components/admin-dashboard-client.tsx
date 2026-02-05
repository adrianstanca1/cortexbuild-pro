"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 Users,
 Building2,
 FolderKanban,
 ListTodo,
 FileText,
 Activity,
 TrendingUp,
 Shield,
 Database,
 RefreshCw,
 ArrowUpRight,
 Clock,
 UserCheck,
 FileQuestion,
 PackageCheck,
 FileEdit,
 ShieldAlert,
 Zap,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 Radio,
 Server,
 Gauge,
 Globe,
 BarChart3,
 Terminal,
 Eye
} from "lucide-react";
import { Card, CardContent, CardTitle, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SystemHealth {
 status: "healthy" | "warning" | "critical";
 healthScore: number;
 timestamp: string;
 realtime: { connectedClients: number; sseStatus: string };
 users: { total: number; activeToday: number; activeThisWeek: number };
 organizations: { total: number; breakdown: { id: string; name: string; users: number; projects: number }[] };
 projects: { total: number; active: number; completion: number };
 activity: { lastHour: number; last24Hours: number; trends: { date: string; count: number }[] };
 alerts: { overdueTasks: number; openRFIs: number; pendingSubmittals: number; unresolvedIncidents: number; pendingTasks: number };
 database: { status: string; responseTime: string };
}

interface LiveActivity {
 id: string;
 action: string;
 entityType: string | null;
 details: string | null;
 createdAt: string;
 user: { id: string; name: string; email: string; role: string } | null;
 project: { id: string; name: string } | null;
 organization: { id: string; name: string } | null;
}

interface PlatformStats {
 totals: {
  users: number;
  organizations: number;
  projects: number;
  tasks: number;
  documents: number;
  rfis: number;
  submittals: number;
  changeOrders: number;
  safetyIncidents: number;
  dailyReports: number;
  activities: number;
 };
 usersByRole: { role: string; count: number }[];
 projectsByStatus: { status: string; count: number }[];
 tasksByStatus: { status: string; count: number }[];
 recentUsers: number;
 activeUsers: number;
 organizations: { id: string; name: string; slug: string; userCount: number; projectCount: number }[];
 storage: { totalDocuments: number; totalPhotos: number; totalAttachments: number };
}

export function AdminDashboardClient() {
 const [stats, setStats] = useState<PlatformStats | null>(null);
 const [health, setHealth] = useState<SystemHealth | null>(null);
 const [liveFeed, setLiveFeed] = useState<LiveActivity[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [activeTab, setActiveTab] = useState("command-center");

 const fetchAllData = useCallback(async () => {
  try {
   const [statsRes, healthRes, feedRes] = await Promise.all([
    fetch("/api/admin/stats"),
    fetch("/api/admin/system-health"),
    fetch("/api/admin/live-feed?limit=20")
   ]);

   if (statsRes.ok) setStats(await statsRes.json());
   if (healthRes.ok) setHealth(await healthRes.json());
   if (feedRes.ok) {
    const feedData = await feedRes.json();
    setLiveFeed(feedData.activities || []);
   }
  } catch {
   console.error("Error fetching data:", error);
  } finally {
   setLoading(false);
   setRefreshing(false);
  }
 }, []);

 useEffect(() => {
  fetchAllData();
  // Auto-refresh every 30 seconds
  const interval = setInterval(fetchAllData, 30000);
  return () => clearInterval(interval);
 }, [fetchAllData]);

 const handleRefresh = () => {
  setRefreshing(true);
  fetchAllData();
 };

 if (loading) {
  return (
   <div className="flex items-center justify-center h-96">
    <div className="text-center">
     <RefreshCw className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
     <p className="mt-4 text-gray-500">Loading Command Center...</p>
    </div>
   </div>
  );
 }

 const statusColors = {
  healthy: "text-green-500 bg-green-500/10",
  warning: "text-yellow-500 bg-yellow-500/10",
  critical: "text-red-500 bg-red-500/10"
 };

 const statusIcons = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle
 };

 const StatusIcon = health ? statusIcons[health.status] : CheckCircle2;

 const getActionIcon = (action: string) => {
  if (action.includes("task")) return ListTodo;
  if (action.includes("project")) return FolderKanban;
  if (action.includes("document")) return FileText;
  if (action.includes("user")) return Users;
  if (action.includes("rfi")) return FileQuestion;
  if (action.includes("safety")) return ShieldAlert;
  if (action.includes("submittal")) return PackageCheck;
  return Activity;
 };

 const getActionColor = (action: string) => {
  if (action.includes("created") || action.includes("added")) return "text-green-500 bg-green-500/10";
  if (action.includes("updated") || action.includes("modified")) return "text-blue-500 bg-blue-500/10";
  if (action.includes("deleted") || action.includes("removed")) return "text-red-500 bg-red-500/10";
  if (action.includes("error") || action.includes("failed")) return "text-red-500 bg-red-500/10";
  return "text-gray-500 bg-gray-500/10";
 };

 return (
  <div className="space-y-6">
   {/* Command Center Header */}
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
     <div className="p-3 bg-purple-600 rounded-xl">
      <Terminal className="h-8 w-8 text-white" />
     </div>
     <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
       Command Center
      </h1>
      <p className="text-gray-500 mt-1">Real-time platform monitoring & control</p>
     </div>
    </div>
    <div className="flex items-center gap-3">
     {health && (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusColors[health.status]}`}>
       <StatusIcon className="h-5 w-5" />
       <span className="font-medium capitalize">{health.status}</span>
       <Badge variant="outline" className="ml-2">{health.healthScore}%</Badge>
      </div>
     )}
     <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
      Refresh
     </Button>
    </div>
   </div>

   {/* Tabs */}
   <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="grid w-full max-w-2xl grid-cols-3">
     <TabsTrigger value="command-center" className="gap-2">
      <Gauge className="h-4 w-4" /> Command Center
     </TabsTrigger>
     <TabsTrigger value="analytics" className="gap-2">
      <BarChart3 className="h-4 w-4" /> Analytics
     </TabsTrigger>
     <TabsTrigger value="live-feed" className="gap-2">
      <Radio className="h-4 w-4" /> Live Feed
     </TabsTrigger>
    </TabsList>

    {/* Command Center Tab */}
    <TabsContent value="command-center" className="space-y-6 mt-6">
     {/* System Status Row */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
       <Card className={`border-l-4 ${health?.status === "healthy" ? "border-l-green-500" : health?.status === "warning" ? "border-l-yellow-500" : "border-l-red-500"}`}>
        <CardContent className="p-4">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-sm text-gray-500">System Health</p>
           <p className="text-2xl font-bold mt-1">{health?.healthScore ?? 0}%</p>
          </div>
          <div className={`p-3 rounded-full ${statusColors[health?.status || "healthy"]}`}>
           <StatusIcon className="h-6 w-6" />
          </div>
         </div>
         <Progress value={health?.healthScore ?? 0} className="mt-3 h-2" />
        </CardContent>
       </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
       <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-sm text-gray-500">Live Connections</p>
           <p className="text-2xl font-bold mt-1">{health?.realtime.connectedClients ?? 0}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-500/10">
           <Radio className="h-6 w-6 text-blue-500" />
          </div>
         </div>
         <p className="text-xs text-gray-500 mt-2">SSE: {health?.realtime.sseStatus || "N/A"}</p>
        </CardContent>
       </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
       <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-sm text-gray-500">Active Users Today</p>
           <p className="text-2xl font-bold mt-1">{health?.users.activeToday ?? 0}</p>
          </div>
          <div className="p-3 rounded-full bg-purple-500/10">
           <UserCheck className="h-6 w-6 text-purple-500" />
          </div>
         </div>
         <p className="text-xs text-gray-500 mt-2">{health?.users.activeThisWeek ?? 0} active this week</p>
        </CardContent>
       </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
       <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-sm text-gray-500">Database</p>
           <p className="text-2xl font-bold mt-1 capitalize">{health?.database.status || "N/A"}</p>
          </div>
          <div className="p-3 rounded-full bg-green-500/10">
           <Database className="h-6 w-6 text-green-500" />
          </div>
         </div>
         <p className="text-xs text-gray-500 mt-2">Response: {health?.database.responseTime || "N/A"}</p>
        </CardContent>
       </Card>
      </motion.div>
     </div>

     {/* Alerts Panel */}
     {health && (health.alerts.overdueTasks > 0 || health.alerts.unresolvedIncidents > 0 || health.alerts.openRFIs > 10) && (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
       <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-3">
         <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-5 w-5" />
          Platform Alerts
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health.alerts.overdueTasks > 0 && (
           <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <Clock className="h-5 w-5 text-red-500" />
            <div>
             <p className="font-semibold">{health.alerts.overdueTasks}</p>
             <p className="text-xs text-gray-500">Overdue Tasks</p>
            </div>
           </div>
          )}
          {health.alerts.unresolvedIncidents > 0 && (
           <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <div>
             <p className="font-semibold">{health.alerts.unresolvedIncidents}</p>
             <p className="text-xs text-gray-500">Open Incidents</p>
            </div>
           </div>
          )}
          {health.alerts.openRFIs > 0 && (
           <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <FileQuestion className="h-5 w-5 text-yellow-500" />
            <div>
             <p className="font-semibold">{health.alerts.openRFIs}</p>
             <p className="text-xs text-gray-500">Open RFIs</p>
            </div>
           </div>
          )}
          {health.alerts.pendingSubmittals > 0 && (
           <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <PackageCheck className="h-5 w-5 text-blue-500" />
            <div>
             <p className="font-semibold">{health.alerts.pendingSubmittals}</p>
             <p className="text-xs text-gray-500">Pending Submittals</p>
            </div>
           </div>
          )}
         </div>
        </CardContent>
       </Card>
      </motion.div>
     )}

     {/* Main Stats Grid */}
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
       <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <CardContent className="p-6 relative">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-purple-100 text-sm">Total Users</p>
           <p className="text-3xl font-bold mt-1">{stats?.totals.users ?? 0}</p>
           <p className="text-purple-200 text-sm mt-2">
            <UserCheck className="inline h-4 w-4 mr-1" />
            {stats?.activeUsers ?? 0} active this week
           </p>
          </div>
          <Users className="h-12 w-12 text-purple-300" />
         </div>
        </CardContent>
       </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
       <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <CardContent className="p-6 relative">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-blue-100 text-sm">Organizations</p>
           <p className="text-3xl font-bold mt-1">{stats?.totals.organizations ?? 0}</p>
           <p className="text-blue-200 text-sm mt-2">
            <Globe className="inline h-4 w-4 mr-1" />
            Multi-tenant platform
           </p>
          </div>
          <Building2 className="h-12 w-12 text-blue-300" />
         </div>
        </CardContent>
       </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
       <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <CardContent className="p-6 relative">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-green-100 text-sm">Total Projects</p>
           <p className="text-3xl font-bold mt-1">{stats?.totals.projects ?? 0}</p>
           <p className="text-green-200 text-sm mt-2">
            <TrendingUp className="inline h-4 w-4 mr-1" />
            {health?.projects.active ?? 0} active
           </p>
          </div>
          <FolderKanban className="h-12 w-12 text-green-300" />
         </div>
        </CardContent>
       </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
       <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <CardContent className="p-6 relative">
         <div className="flex items-center justify-between">
          <div>
           <p className="text-orange-100 text-sm">Activity (24h)</p>
           <p className="text-3xl font-bold mt-1">{health?.activity.last24Hours ?? 0}</p>
           <p className="text-orange-200 text-sm mt-2">
            <Zap className="inline h-4 w-4 mr-1" />
            {health?.activity.lastHour ?? 0} last hour
           </p>
          </div>
          <Activity className="h-12 w-12 text-orange-300" />
         </div>
        </CardContent>
       </Card>
      </motion.div>
     </div>

     {/* Secondary Stats */}
     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[
       { label: "Tasks", value: stats?.totals.tasks ?? 0, icon: ListTodo, color: "text-indigo-500" },
       { label: "Documents", value: stats?.totals.documents ?? 0, icon: FileText, color: "text-blue-500" },
       { label: "RFIs", value: stats?.totals.rfis ?? 0, icon: FileQuestion, color: "text-purple-500" },
       { label: "Submittals", value: stats?.totals.submittals ?? 0, icon: PackageCheck, color: "text-green-500" },
       { label: "Change Orders", value: stats?.totals.changeOrders ?? 0, icon: FileEdit, color: "text-orange-500" },
       { label: "Safety Incidents", value: stats?.totals.safetyIncidents ?? 0, icon: ShieldAlert, color: "text-red-500" }
      ].map((stat, index) => {
       const Icon = stat.icon;
       return (
        <motion.div
         key={stat.label}
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.05 * index }}
        >
         <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
           <Icon className={`h-6 w-6 mx-auto ${stat.color}`} />
           <p className="text-2xl font-bold mt-2">{stat.value}</p>
           <p className="text-xs text-gray-500">{stat.label}</p>
          </CardContent>
         </Card>
        </motion.div>
       );
      })}
     </div>

     {/* Quick Actions Grid */}
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/admin/users">
       <Card className="hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group">
        <CardContent className="p-6 flex items-center gap-4">
         <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
          <Users className="h-6 w-6 text-purple-600" />
         </div>
         <div>
          <h3 className="font-semibold">Manage Users</h3>
          <p className="text-sm text-gray-500">Create, edit, suspend users</p>
         </div>
         <ArrowUpRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-purple-500" />
        </CardContent>
       </Card>
      </Link>

      <Link href="/admin/organizations">
       <Card className="hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group">
        <CardContent className="p-6 flex items-center gap-4">
         <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
          <Building2 className="h-6 w-6 text-blue-600" />
         </div>
         <div>
          <h3 className="font-semibold">Organizations</h3>
          <p className="text-sm text-gray-500">Manage companies & tenants</p>
         </div>
         <ArrowUpRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-blue-500" />
        </CardContent>
       </Card>
      </Link>

      <Link href="/admin/system-health">
       <Card className="hover:border-green-500 hover:shadow-lg transition-all cursor-pointer group">
        <CardContent className="p-6 flex items-center gap-4">
         <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
          <Server className="h-6 w-6 text-green-600" />
         </div>
         <div>
          <h3 className="font-semibold">System Health</h3>
          <p className="text-sm text-gray-500">Monitor platform status</p>
         </div>
         <ArrowUpRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-green-500" />
        </CardContent>
       </Card>
      </Link>

      <Link href="/admin/audit-logs">
       <Card className="hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer group">
        <CardContent className="p-6 flex items-center gap-4">
         <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
          <Eye className="h-6 w-6 text-orange-600" />
         </div>
         <div>
          <h3 className="font-semibold">Audit Logs</h3>
          <p className="text-sm text-gray-500">Track all platform activity</p>
         </div>
         <ArrowUpRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-orange-500" />
        </CardContent>
       </Card>
      </Link>
     </div>

     {/* Organizations Overview */}
     <Card>
      <CardHeader>
       <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
         <Building2 className="h-5 w-5 text-blue-500" />
         Organizations Overview
        </CardTitle>
        <Link href="/admin/organizations">
         <Button variant="outline" size="sm">
          View All <ArrowUpRight className="h-4 w-4 ml-1" />
         </Button>
        </Link>
       </div>
      </CardHeader>
      <CardContent>
       <div className="overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b">
           <th className="text-left py-3 px-4 font-medium text-gray-500">Organization</th>
           <th className="text-center py-3 px-4 font-medium text-gray-500">Users</th>
           <th className="text-center py-3 px-4 font-medium text-gray-500">Projects</th>
           <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
          </tr>
         </thead>
         <tbody>
          {stats?.organizations.slice(0, 5).map((org) => (
           <tr key={org.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
            <td className="py-3 px-4">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold">{org.name.charAt(0)}</span>
              </div>
              <div>
               <span className="font-medium">{org.name}</span>
               <p className="text-xs text-gray-500">{org.slug}</p>
              </div>
             </div>
            </td>
            <td className="py-3 px-4 text-center">
             <Badge variant="secondary">{org.userCount}</Badge>
            </td>
            <td className="py-3 px-4 text-center">
             <Badge variant="outline">{org.projectCount}</Badge>
            </td>
            <td className="py-3 px-4 text-right">
             <Link href={`/admin/organizations?id=${org.id}`}>
              <Button variant="ghost" size="sm">View</Button>
             </Link>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </CardContent>
     </Card>
    </TabsContent>

    {/* Analytics Tab */}
    <TabsContent value="analytics" className="space-y-6 mt-6">
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Role Distribution */}
      <Card>
       <CardHeader>
        <CardTitle className="flex items-center gap-2">
         <Shield className="h-5 w-5 text-purple-500" />
         User Roles Distribution
        </CardTitle>
       </CardHeader>
       <CardContent>
        <div className="space-y-4">
         {stats?.usersByRole.map((role) => {
          const percentage = (stats?.totals.users ?? 0) > 0
           ? Math.round((role.count / (stats?.totals.users ?? 1)) * 100)
           : 0;
          return (
           <div key={role.role}>
            <div className="flex items-center justify-between mb-1">
             <span className="text-sm font-medium">{role.role.replace("_", " ")}</span>
             <span className="text-sm text-gray-500">{role.count} ({percentage}%)</span>
            </div>
            <Progress value={percentage} className="h-2" />
           </div>
          );
         })}
        </div>
       </CardContent>
      </Card>

      {/* Project Status Distribution */}
      <Card>
       <CardHeader>
        <CardTitle className="flex items-center gap-2">
         <FolderKanban className="h-5 w-5 text-green-500" />
         Project Status
        </CardTitle>
       </CardHeader>
       <CardContent>
        <div className="space-y-4">
         {stats?.projectsByStatus.map((status) => {
          const percentage = (stats?.totals.projects ?? 0) > 0
           ? Math.round((status.count / (stats?.totals.projects ?? 1)) * 100)
           : 0;
          const colors: Record<string, string> = {
           PLANNING: "bg-gray-500",
           IN_PROGRESS: "bg-blue-500",
           ON_HOLD: "bg-yellow-500",
           COMPLETED: "bg-green-500",
           ARCHIVED: "bg-gray-400"
          };
          return (
           <div key={status.status}>
            <div className="flex items-center justify-between mb-1">
             <span className="text-sm font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${colors[status.status] || "bg-gray-400"}`} />
              {status.status.replace("_", " ")}
             </span>
             <span className="text-sm text-gray-500">{status.count} ({percentage}%)</span>
            </div>
            <Progress value={percentage} className="h-2" />
           </div>
          );
         })}
        </div>
       </CardContent>
      </Card>

      {/* Storage Overview */}
      <Card>
       <CardHeader>
        <CardTitle className="flex items-center gap-2">
         <Database className="h-5 w-5 text-blue-500" />
         Storage Overview
        </CardTitle>
       </CardHeader>
       <CardContent>
        <div className="space-y-4">
         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm flex items-center gap-2">
           <FileText className="h-4 w-4 text-blue-500" /> Documents
          </span>
          <Badge variant="secondary">{stats?.storage.totalDocuments ?? 0}</Badge>
         </div>
         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm flex items-center gap-2">
           <Eye className="h-4 w-4 text-green-500" /> Photos
          </span>
          <Badge variant="secondary">{stats?.storage.totalPhotos ?? 0}</Badge>
         </div>
         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm flex items-center gap-2">
           <FileEdit className="h-4 w-4 text-orange-500" /> Attachments
          </span>
          <Badge variant="secondary">{stats?.storage.totalAttachments ?? 0}</Badge>
         </div>
         <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
           <span className="font-medium">Total Files</span>
           <span className="text-lg font-bold">
            {(stats?.storage.totalDocuments ?? 0) + (stats?.storage.totalPhotos ?? 0) + (stats?.storage.totalAttachments ?? 0)}
           </span>
          </div>
         </div>
        </div>
       </CardContent>
      </Card>

      {/* Activity Trends */}
      <Card>
       <CardHeader>
        <CardTitle className="flex items-center gap-2">
         <TrendingUp className="h-5 w-5 text-orange-500" />
         Activity Trends (7 Days)
        </CardTitle>
       </CardHeader>
       <CardContent>
        <div className="space-y-2">
         {health?.activity.trends.map((trend, idx) => {
          const maxCount = Math.max(...(health?.activity.trends.map(t => t.count) || [1]));
          const percentage = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
          return (
           <div key={idx} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20">
             {new Date(trend.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
            </span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
             <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded transition-all"
              style={{ width: `${percentage}%` }}
             />
            </div>
            <span className="text-sm font-medium w-12 text-right">{trend.count}</span>
           </div>
          );
         })}
        </div>
       </CardContent>
      </Card>
     </div>
    </TabsContent>

    {/* Live Feed Tab */}
    <TabsContent value="live-feed" className="space-y-6 mt-6">
     <Card>
      <CardHeader>
       <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
         <Radio className="h-5 w-5 text-green-500 animate-pulse" />
         Live Activity Feed
        </CardTitle>
        <Badge variant="outline" className="animate-pulse">
         <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2" />
         Live
        </Badge>
       </div>
      </CardHeader>
      <CardContent>
       <div className="space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence>
         {liveFeed.map((activity, idx) => {
          const Icon = getActionIcon(activity.action);
          const colorClass = getActionColor(activity.action);
          return (
           <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
           >
            <div className={`p-2 rounded-lg ${colorClass}`}>
             <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{activity.user?.name || "System"}</span>
              <span className="text-gray-500">{activity.action.replace(/_/g, " ")}</span>
              {activity.organization && (
               <Badge variant="outline" className="text-xs">
                {activity.organization.name}
               </Badge>
              )}
             </div>
             {activity.project && (
              <p className="text-sm text-gray-500 mt-1">
               Project: {activity.project.name}
              </p>
             )}
             {activity.details && (
              <p className="text-sm text-gray-400 mt-1 truncate">
               {activity.details}
              </p>
             )}
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
             {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </div>
           </motion.div>
          );
         })}
        </AnimatePresence>
        {liveFeed.length === 0 && (
         <div className="text-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
         </div>
        )}
       </div>
      </CardContent>
     </Card>
    </TabsContent>
   </Tabs>
  </div>
 );
}
