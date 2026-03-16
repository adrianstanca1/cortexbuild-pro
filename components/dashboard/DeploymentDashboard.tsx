"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Terminal,
  Container,
  Activity,
  RefreshCw,
  Play,
  Square,
  RotateCw,
  Trash2,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface Process {
  id: number;
  name: string;
  status: "online" | "stopped" | "errored";
  cpu: number;
  memory: number;
  restarts: number;
  uptime: string;
}

interface Container {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped" | "exited";
  ports: string[];
  uptime: string;
}

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  lastChecked: string;
}

interface DeploymentData {
  processes: Process[];
  containers: Container[];
  healthServices: ServiceHealth[];
  overallHealth: "healthy" | "degraded" | "unhealthy";
}

export function DeploymentDashboard() {
  const [activeTab, setActiveTab] = useState<"processes" | "containers" | "health">("processes");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DeploymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDeploymentData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deployment/status');
      if (!response.ok) throw new Error('Failed to fetch deployment status');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load deployment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentData();
  }, []);

  const processes = data?.processes ?? [];
  const containers = data?.containers ?? [];
  const healthServices = data?.healthServices ?? [];
  const overallHealth = data?.overallHealth ?? "healthy" as const;

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "healthy":
      case "running":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "degraded":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "stopped":
      case "exited":
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
      case "errored":
      case "unhealthy":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "healthy":
      case "running":
        return CheckCircle;
      case "degraded":
        return AlertTriangle;
      case "errored":
      case "unhealthy":
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deployment Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage deployment infrastructure</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={overallHealth === "healthy" ? "default" : overallHealth === "degraded" ? "secondary" : "destructive"}>
            {getStatusIcon(overallHealth) === CheckCircle && <CheckCircle className="h-3 w-3 mr-1" />}
            {getStatusIcon(overallHealth) === AlertTriangle && <AlertTriangle className="h-3 w-3 mr-1" />}
            {getStatusIcon(overallHealth) === XCircle && <XCircle className="h-3 w-3 mr-1" />}
            {overallHealth === "healthy" ? "Healthy" : overallHealth === "degraded" ? "Degraded" : "Unhealthy"}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchDeploymentData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
            Loading deployment data...
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchDeploymentData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "processes" ? "default" : "ghost"}
          onClick={() => setActiveTab("processes")}
          className="rounded-none border-b-2 border-transparent"
        >
          <Server className="h-4 w-4 mr-2" />
          PM2 Processes
        </Button>
        <Button
          variant={activeTab === "containers" ? "default" : "ghost"}
          onClick={() => setActiveTab("containers")}
          className="rounded-none border-b-2 border-transparent"
        >
          <Container className="h-4 w-4 mr-2" />
          Docker Containers
        </Button>
        <Button
          variant={activeTab === "health" ? "default" : "ghost"}
          onClick={() => setActiveTab("health")}
          className="rounded-none border-b-2 border-transparent"
        >
          <Activity className="h-4 w-4 mr-2" />
          System Health
        </Button>
      </div>

      {/* PM2 Processes Tab */}
      {activeTab === "processes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              PM2 Process Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-7 gap-4 p-4 border-b bg-muted/50 text-sm font-medium">
                <div className="col-span-2">Name</div>
                <div>Status</div>
                <div>CPU</div>
                <div>Memory</div>
                <div>Restarts</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {processes.map((process) => (
                  <div key={process.id} className="grid grid-cols-7 gap-4 p-4 items-center">
                    <div className="col-span-2 font-mono text-sm">{process.name}</div>
                    <div>
                      <Badge variant={process.status === "online" ? "default" : process.status === "errored" ? "destructive" : "secondary"}>
                        {process.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{process.cpu}%</div>
                    <div className="text-sm text-muted-foreground">{formatMemory(process.memory)}</div>
                    <div className="text-sm text-muted-foreground">{process.restarts}</div>
                    <div className="flex justify-end gap-1">
                      {process.status !== "online" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Square className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Docker Containers Tab */}
      {activeTab === "containers" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              Docker Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50 text-sm font-medium">
                <div className="col-span-2">Container</div>
                <div>Image</div>
                <div>Ports</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {containers.map((container) => (
                  <div key={container.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                    <div className="col-span-2">
                      <div className="font-mono text-sm">{container.name}</div>
                      <div className="text-xs text-muted-foreground">{container.id.slice(0, 8)}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{container.image}</div>
                    <div className="text-sm text-muted-foreground font-mono">{container.ports.join(", ")}</div>
                    <div>
                      <Badge variant={container.status === "running" ? "default" : "secondary"}>
                        {container.status}
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-1">
                      {container.status !== "running" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Square className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Tab */}
      {activeTab === "health" && (
        <div className="space-y-4">
          {/* Overall Health */}
          <Card className={
            overallHealth === "healthy" ? "border-green-500/50" :
            overallHealth === "degraded" ? "border-yellow-500/50" :
            "border-red-500/50"
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(overallHealth)({ className: `h-5 w-5 ${getStatusColor(overallHealth).split(" ")[0]}` })}
                System Status: {overallHealth === "healthy" ? "Healthy" : overallHealth === "degraded" ? "Degraded" : "Unhealthy"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {overallHealth === "healthy"
                  ? "All services are running normally"
                  : overallHealth === "degraded"
                  ? "Some services are experiencing issues"
                  : "Critical services are down"}
              </p>
            </CardContent>
          </Card>

          {/* Service Health Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthServices.map((service) => {
              const Icon = getStatusIcon(service.status);
              return (
                <Card key={service.name} className={getStatusColor(service.status)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${getStatusColor(service.status).split(" ")[0]}`} />
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{service.status}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{service.latency}ms</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Wifi className="h-3 w-3" />
                      Last checked: {formatDistanceToNow(new Date(service.lastChecked), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeploymentDashboard;
