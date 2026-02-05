'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  PoundSterling,
  BarChart3,
  PieChart,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {  Card, CardContent, CardDescription , CardHeader, CardTitle } from '@/components/ui/card'';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface Project {
  id: string;
  name: string;
  budget: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { changeOrders: number; tasks: number };
}

interface ChangeOrder {
  id: string;
  costChange: number | null;
  status: string;
  createdAt: string;
  projectId: string;
}

interface Forecast {
  id: string;
  projectId: string;
  forecastDate: string;
  originalBudget: number | null;
  currentBudget: number | null;
  forecastAtCompletion: number | null;
  actualCost: number | null;
  earnedValue: number | null;
  costPerformanceIndex: number | null;
  schedulePerformanceIndex: number | null;
}

interface Props {
  projects: Project[];
  changeOrders: ChangeOrder[];
  forecasts: Forecast[];
  metrics: {
    totalBudget: number;
    approvedChanges: number;
    pendingChanges: number;
    currentBudget: number;
    projectCount: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
  return `£${value.toFixed(0)}`;
};

export default function CostTrendsClient({ projects, changeOrders, forecasts, metrics }: Props) {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [analysisType, setAnalysisType] = useState<'trend' | 'forecast' | 'variance'>('trend');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [_aiMetrics, setAiMetrics] = useState<Record<string, number | null> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Project budget breakdown for pie chart
  const budgetBreakdown = useMemo(() => {
    return projects
      .filter(p => p.budget && p.budget > 0)
      .slice(0, 6)
      .map((p, i) => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
        value: p.budget || 0,
        color: COLORS[i % COLORS.length]
      }));
  }, [projects]);

  // Monthly change order trend
  const changeOrderTrend = useMemo(() => {
    const months: Record<string, { approved: number; pending: number; rejected: number }> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      months[key] = { approved: 0, pending: 0, rejected: 0 };
    }

    changeOrders.forEach(co => {
      const date = new Date(co.createdAt);
      const key = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      if (months[key]) {
        if (co.status === 'APPROVED') months[key].approved += co.costChange || 0;
        else if (co.status === 'PENDING_APPROVAL') months[key].pending += co.costChange || 0;
        else if (co.status === 'REJECTED') months[key].rejected += co.costChange || 0;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data
    }));
  }, [changeOrders]);

  // Project performance comparison
  const projectPerformance = useMemo(() => {
    return projects
      .filter(p => p.budget && p.budget > 0)
      .slice(0, 8)
      .map(p => {
        const projectForecasts = forecasts.filter(f => f.projectId === p.id);
        const latestForecast = projectForecasts[0];
        const projectChanges = changeOrders
          .filter(co => co.projectId === p.id && co.status === 'APPROVED')
          .reduce((sum, co) => sum + (co.costChange || 0), 0);

        return {
          name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
          budget: p.budget || 0,
          changes: projectChanges,
          cpi: latestForecast?.costPerformanceIndex || 1
        };
      });
  }, [projects, forecasts, changeOrders]);

  const runAIAnalysis = async () => {
    if (selectedProject === 'all') {
      toast.error('Please select a specific project for AI analysis');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/cost-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          analysisType
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setAiAnalysis(data.analysis);
        setAiMetrics(data.metrics);
        toast.success('Analysis complete!');
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Cost Trend Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered cost analytics and forecasting
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <PoundSterling className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Budget</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(metrics.totalBudget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Changes</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(metrics.approvedChanges)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Changes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(metrics.pendingChanges)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Budget</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(metrics.currentBudget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Budget Distribution
            </CardTitle>
            <CardDescription>Portfolio budget breakdown by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={budgetBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {budgetBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Budget']}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Change Order Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Change Order Trends
            </CardTitle>
            <CardDescription>Monthly change order values (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={changeOrderTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value)]}
                    labelStyle={{ color: 'var(--foreground)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      border: '1px solid var(--border)' 
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="#10b981" name="Approved" />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Pending" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Project Cost Performance
          </CardTitle>
          <CardDescription>Budget vs approved changes by project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value)]}
                  labelStyle={{ color: 'var(--foreground)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)' 
                  }}
                />
                <Legend />
                <Bar dataKey="budget" fill="#3b82f6" name="Original Budget" />
                <Bar dataKey="changes" fill="#10b981" name="Approved Changes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Cost Analysis
          </CardTitle>
          <CardDescription>Get AI-powered insights on project costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as typeof analysisType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trend">Trend Analysis</SelectItem>
                  <SelectItem value="forecast">Cost Forecast</SelectItem>
                  <SelectItem value="variance">Variance Analysis</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={runAIAnalysis}
                disabled={analyzing || selectedProject === 'all'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {analyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Run Analysis</>
                )}
              </Button>
              {selectedProject === 'all' && (
                <Badge variant="outline" className="text-muted-foreground">
                  Select a project for AI analysis
                </Badge>
              )}
            </div>

            {analyzing && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing cost data...</p>
                </div>
              </div>
            )}

            {aiAnalysis && !analyzing && (
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiAnalysis}
                  </div>
                </div>
              </div>
            )}

            {!aiAnalysis && !analyzing && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Select a project and click "Run Analysis" for AI insights</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
