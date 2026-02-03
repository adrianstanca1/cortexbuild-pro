"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Heart,
  Zap,
  Server
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface UptimeStat {
  serviceName: string;
  name: string;
  connectionId: string;
  status: string;
  totalChecks: number;
  healthyChecks: number;
  uptimePercentage: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  recentChecks: Array<{
    timestamp: string;
    isHealthy: boolean;
    responseTime: number;
    errorMessage: string | null;
  }>;
}

interface Incident {
  timestamp: string;
  service: string;
  serviceName: string;
  errorMessage: string | null;
  responseTime: number;
}

export function HealthMonitoring() {
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalChecks: 0,
    healthyChecks: 0,
    failedChecks: 0,
    overallUptime: 100
  });
  const [uptimeStats, setUptimeStats] = useState<UptimeStat[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/api-connections/health-history?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setUptimeStats(data.uptimeStats || []);
        setIncidents(data.incidents || []);
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
      toast.error("Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const getUptimeColor = (pct: number) => {
    if (pct >= 99) return "text-green-600";
    if (pct >= 95) return "text-yellow-600";
    return "text-red-600";
  };

  const getUptimeBadge = (pct: number) => {
    if (pct >= 99) return "bg-green-100 text-green-800";
    if (pct >= 95) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={fetchHealthData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getUptimeColor(summary.overallUptime)}`}>
                  {summary.overallUptime}%
                </p>
                <p className="text-xs text-muted-foreground">Overall Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalChecks}</p>
                <p className="text-xs text-muted-foreground">Total Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.healthyChecks}</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{summary.failedChecks}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Uptime Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uptimeStats.map((stat) => (
          <motion.div
            key={stat.connectionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{stat.name}</CardTitle>
                  </div>
                  <Badge className={getUptimeBadge(stat.uptimePercentage)}>
                    {stat.uptimePercentage}% uptime
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Uptime Bar */}
                  <div className="flex gap-0.5">
                    {stat.recentChecks.slice(-24).map((check, idx) => (
                      <div
                        key={idx}
                        className={`h-6 flex-1 rounded-sm transition-colors ${
                          check.isHealthy ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={`${check.isHealthy ? "Healthy" : "Failed"} - ${check.responseTime}ms`}
                      />
                    ))}
                    {stat.recentChecks.length === 0 && (
                      <div className="h-6 flex-1 rounded-sm bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No data</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Response Time Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Avg</p>
                      <p className="font-semibold">{stat.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min</p>
                      <p className="font-semibold">{stat.minResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max</p>
                      <p className="font-semibold">{stat.maxResponseTime}ms</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {stat.totalChecks} checks • {stat.healthyChecks} healthy
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.map((incident, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{incident.service}</p>
                    <p className="text-xs text-muted-foreground">
                      {incident.errorMessage || "Connection failed"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {incident.responseTime}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {uptimeStats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No health check data available</p>
          <p className="text-sm">Test your API connections to start monitoring</p>
        </div>
      )}
    </div>
  );
}
