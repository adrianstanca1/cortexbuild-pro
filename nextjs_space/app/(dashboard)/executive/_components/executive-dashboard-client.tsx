'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard, TrendingUp, TrendingDown, AlertTriangle, Shield,
  PoundSterling, Clock, Target, Activity, ChevronRight, RefreshCw,
  BarChart3, PieChart, Zap, CheckCircle2, XCircle, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface DashboardData {
  summary: {
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    totalBudget: number;
  };
  schedule: {
    projectsOnSchedule: number;
    projectsDelayed: number;
    schedulePerformanceIndex: number;
    tasksTotal: number;
    tasksCompleted: number;
    tasksInProgress: number;
  };
  cost: {
    totalBudget: number;
    costPerformanceIndex: number;
    changeOrderValue: number;
    pendingChangeOrders: number;
    approvedChangeOrders: number;
  };
  risk: {
    openRisks: number;
    criticalRisks: number;
    highRisks: number;
    riskExposure: number;
  };
  safety: {
    openIncidents: number;
    incidentsThisMonth: number;
    lostTimeInjuries: number;
  };
  quality: {
    openDefects: number;
    defectRate: number;
  };
  signals: Array<{
    id: string;
    type: string;
    name: string;
    severity: string;
    projectId: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    phase: string;
    budget: number | null;
    tasksCount: number;
    risksCount: number;
    changeOrdersCount: number;
  }>;
}

export function ExecutiveDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/executive-dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-slate-900';
      default: return 'bg-blue-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load dashboard data</p>
        <Button onClick={fetchData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Executive Command Centre
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time portfolio intelligence and KPI tracking
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Portfolio Value</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(data.summary.totalBudget)}</p>
              </div>
              <PoundSterling className="h-10 w-10 text-indigo-200" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              <span>{data.summary.totalProjects} Projects</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Schedule Performance</p>
                <p className="text-3xl font-bold mt-1">{(data.schedule.schedulePerformanceIndex * 100).toFixed(0)}%</p>
              </div>
              <Clock className="h-10 w-10 text-emerald-200" />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {data.schedule.projectsOnSchedule} On Track
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {data.schedule.projectsDelayed} Delayed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Cost Performance</p>
                <p className="text-3xl font-bold mt-1">{(data.cost.costPerformanceIndex * 100).toFixed(0)}%</p>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-200" />
            </div>
            <div className="mt-4 text-sm">
              <span>CPI: </span>
              {data.cost.costPerformanceIndex >= 1 ? (
                <span className="flex items-center gap-1 inline-flex">
                  <TrendingUp className="h-4 w-4" /> Under Budget
                </span>
              ) : (
                <span className="flex items-center gap-1 inline-flex">
                  <TrendingDown className="h-4 w-4" /> Over Budget
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Risk Exposure</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(data.risk.riskExposure)}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-amber-200" />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span>{data.risk.criticalRisks} Critical</span>
              <span>{data.risk.highRisks} High</span>
              <span>{data.risk.openRisks} Total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Tasks Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Overall Completion</span>
                  <span className="font-semibold">
                    {data.schedule.tasksTotal > 0 
                      ? ((data.schedule.tasksCompleted / data.schedule.tasksTotal) * 100).toFixed(0)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={data.schedule.tasksTotal > 0 
                    ? (data.schedule.tasksCompleted / data.schedule.tasksTotal) * 100 
                    : 0} 
                  className="h-3"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.schedule.tasksTotal}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.schedule.tasksInProgress}</p>
                  <p className="text-xs text-slate-500">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{data.schedule.tasksCompleted}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Change Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total CO Value</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(data.cost.changeOrderValue)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{data.cost.pendingChangeOrders}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">Pending Approval</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{data.cost.approvedChangeOrders}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Approved</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Quality */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Safety & Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Safety</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Open Incidents</span>
                    <Badge variant={data.safety.openIncidents > 0 ? 'destructive' : 'secondary'}>
                      {data.safety.openIncidents}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">This Month</span>
                    <span className="text-sm font-medium">{data.safety.incidentsThisMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">LTIs</span>
                    <Badge variant={data.safety.lostTimeInjuries > 0 ? 'destructive' : 'outline'}>
                      {data.safety.lostTimeInjuries}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quality</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Open Defects</span>
                    <Badge variant={data.quality.openDefects > 5 ? 'destructive' : 'secondary'}>
                      {data.quality.openDefects}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Defect Rate</span>
                    <span className="text-sm font-medium">{data.quality.defectRate.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Signals & Projects */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Predictive Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Predictive Signals
            </CardTitle>
            <CardDescription>AI-detected patterns requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {data.signals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No active signals detected</p>
                <p className="text-sm">All systems operating normally</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.signals.slice(0, 5).map(signal => (
                  <div 
                    key={signal.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(signal.severity)}>
                        {signal.severity}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{signal.name}</p>
                        <p className="text-xs text-slate-500">{signal.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Project Portfolio
            </CardTitle>
            <CardDescription>Active projects overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.projects.slice(0, 5).map(project => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {project.tasksCount} tasks • {project.risksCount} risks
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {project.budget ? formatCurrency(project.budget) : '—'}
                    </p>
                    <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                  </div>
                </Link>
              ))}
              {data.projects.length > 5 && (
                <Link href="/projects" className="block text-center text-sm text-primary hover:underline pt-2">
                  View all {data.projects.length} projects →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
