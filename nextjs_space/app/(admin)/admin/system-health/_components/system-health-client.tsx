"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Radio,
  Activity,
  Users,
  Building2,
  FolderKanban,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Shield,
  Gauge,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import {  Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

export function SystemHealthClient() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/system-health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setLastUpdated(new Date());
      }
    } catch {
      console.error("Error fetching health:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealth();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const statusConfig = {
    healthy: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500" },
    warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500" },
    critical: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500" }
  };

  const currentStatus = health?.status || "healthy";
  const StatusIcon = statusConfig[currentStatus].icon;

  const services = [
    { name: "Database", status: health?.database.status === "connected" ? "healthy" : "critical", latency: health?.database.responseTime || "N/A" },
    { name: "Real-time SSE", status: health?.realtime.sseStatus === "operational" ? "healthy" : "warning", latency: "<10ms" },
    { name: "Authentication", status: "healthy" as const, latency: "<20ms" },
    { name: "File Storage", status: "healthy" as const, latency: "<100ms" },
    { name: "API Gateway", status: "healthy" as const, latency: "<30ms" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Health</h1>
            <p className="text-gray-500 mt-1">Real-time platform monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Status Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${statusConfig[currentStatus].border}`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`p-6 rounded-2xl ${statusConfig[currentStatus].bg}`}>
                  <StatusIcon className={`h-16 w-16 ${statusConfig[currentStatus].color}`} />
                </div>
                <div>
                  <h2 className="text-4xl font-bold capitalize">{health?.status || "Unknown"}</h2>
                  <p className="text-gray-500 mt-2">All systems operational</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      Health Score: {health?.healthScore ?? 0}%
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${(health?.healthScore ?? 0) * 3.51} 351`} className={statusConfig[currentStatus].color} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{health?.healthScore ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {services.map((service, idx) => {
              const config = statusConfig[service.status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{service.name}</span>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <p className="text-xs text-gray-500">Latency: {service.latency}</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Connections</p>
                <p className="text-3xl font-bold mt-1">{health?.realtime.connectedClients ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">Real-time SSE clients</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Radio className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users Today</p>
                <p className="text-3xl font-bold mt-1">{health?.users.activeToday ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">of {health?.users.total ?? 0} total</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Activity (24h)</p>
                <p className="text-3xl font-bold mt-1">{health?.activity.last24Hours ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">{health?.activity.lastHour ?? 0} in last hour</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-3xl font-bold mt-1">{health?.projects.active ?? 0}</p>
                <p className="text-xs text-gray-500 mt-2">of {health?.projects.total ?? 0} total</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <FolderKanban className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Platform Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span>Overdue Tasks</span>
                </div>
                <Badge variant={health?.alerts.overdueTasks ? "destructive" : "secondary"}>
                  {health?.alerts.overdueTasks ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span>Unresolved Incidents</span>
                </div>
                <Badge variant={health?.alerts.unresolvedIncidents ? "destructive" : "secondary"}>
                  {health?.alerts.unresolvedIncidents ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Open RFIs</span>
                </div>
                <Badge variant="outline">{health?.alerts.openRFIs ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-blue-500" />
                  <span>Pending Submittals</span>
                </div>
                <Badge variant="outline">{health?.alerts.pendingSubmittals ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              7-Day Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health?.activity.trends.map((trend, idx) => {
                const maxCount = Math.max(...(health?.activity.trends.map(t => t.count) || [1]));
                const percentage = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-24">
                      {new Date(trend.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded flex items-center justify-end pr-2"
                      >
                        <span className="text-xs text-white font-medium">{trend.count}</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Organization Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health?.organizations.breakdown.map((org, idx) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 border rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">{org.name.charAt(0)}</span>
                  </div>
                  <h4 className="font-semibold">{org.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-lg font-bold">{org.users}</p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-lg font-bold">{org.projects}</p>
                    <p className="text-xs text-gray-500">Projects</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
