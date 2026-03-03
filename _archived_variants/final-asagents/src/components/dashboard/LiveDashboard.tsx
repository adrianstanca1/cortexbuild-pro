import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Activity,
  DollarSign,
  FileText,
  TrendingUp,
  Database,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import backendApi, { Project, Invoice, HealthCheck } from '../../services/backendApi';

interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    planning: number;
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    total_amount: number;
    total_paid: number;
  };
  health: HealthCheck | null;
}

export default function LiveDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, active: 0, completed: 0, planning: 0 },
    invoices: { total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, total_amount: 0, total_paid: 0 },
    health: null
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load projects
      const projectsResponse = await backendApi.getProjects({ limit: 10, sort: 'created_at' });
      const projects = projectsResponse.projects;
      setRecentProjects(projects);

      // Calculate project stats
      const projectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        planning: projects.filter(p => p.status === 'planning').length
      };

      // Load invoices
      const invoicesResponse = await backendApi.getInvoices({ limit: 10, sort: 'created_at' });
      const invoices = invoicesResponse.invoices;
      setRecentInvoices(invoices);

      // Get invoice summary
      const invoiceSummary = await backendApi.getInvoiceSummary();

      // Load health check
      const health = await backendApi.getHealthCheck();

      setStats({
        projects: projectStats,
        invoices: invoiceSummary,
        health
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Monitor WebSocket status
  useEffect(() => {
    const updateWsStatus = () => {
      setWsStatus(backendApi.getWebSocketStatus());
    };

    // Initial status
    updateWsStatus();

    // Listen for WebSocket events
    backendApi.on('ws:connected', updateWsStatus);
    backendApi.on('ws:disconnected', updateWsStatus);

    // Update status periodically
    const interval = setInterval(updateWsStatus, 1000);

    return () => {
      clearInterval(interval);
      backendApi.off('ws:connected', updateWsStatus);
      backendApi.off('ws:disconnected', updateWsStatus);
    };
  }, []);

  // Load data on mount and set up auto-refresh
  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'on_hold': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      case 'paid': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with status indicators */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2">
            {wsStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {wsStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Backend Status */}
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <Badge variant={stats.health?.status === 'healthy' ? 'default' : 'destructive'}>
              {stats.health?.status || 'Unknown'}
            </Badge>
          </div>

          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary">{stats.projects.active} Active</Badge>
              <Badge variant="outline">{stats.projects.planning} Planning</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.invoices.total_amount)}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(stats.invoices.total_paid)} collected
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices.total}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary">{stats.invoices.sent} Sent</Badge>
              {stats.invoices.overdue > 0 && (
                <Badge variant="destructive">{stats.invoices.overdue} Overdue</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.health?.memory.percentage || 0}%
            </div>
            <div className="text-sm text-muted-foreground">
              Memory usage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
          <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.client_name || 'No client'} • {project.progress}% complete
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{project.status}</Badge>
                      {project.budget && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(project.budget)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(invoice.status)}`} />
                      <div>
                        <h4 className="font-medium">{invoice.invoice_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client_name} • Due {formatDate(invoice.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{invoice.status}</Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={stats.health?.database.status === 'connected' ? 'default' : 'destructive'}>
                      {stats.health?.database.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tables:</span>
                    <span>{stats.health?.database.tables}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Rows:</span>
                    <span>{stats.health?.database.total_rows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span>{stats.health?.database.response_time}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Usage:</span>
                    <span>{stats.health?.memory.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{Math.round((stats.health?.uptime || 0) / 60)} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span>{stats.health?.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>{stats.health?.version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
