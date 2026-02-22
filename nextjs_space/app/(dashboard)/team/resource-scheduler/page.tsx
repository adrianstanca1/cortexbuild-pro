'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  Sparkles,
  Loader2,
  RefreshCw,
  BarChart3,
  User,
  Search,
  HardHat,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  resourceType: 'labour' | 'equipment';
  trade?: string;
  projects: {
    projectId: string;
    projectName: string;
    allocation: number;
    startDate: string;
    endDate: string;
    tasks: string[];
  }[];
  totalAllocation: number;
  availability: number;
  status: 'available' | 'allocated' | 'overallocated';
}

interface SchedulerMetrics {
  totalResources: number;
  totalLabour: number;
  totalEquipment: number;
  avgUtilization: number;
  overallocatedCount: number;
  underutilizedCount: number;
  optimallyAllocatedCount: number;
}

interface ProjectSummary {
  id: string;
  name: string;
  taskCount: number;
  teamCount: number;
}

export default function ResourceSchedulerPage() {
  const [resources, setResources] = useState<ResourceAllocation[]>([]);
  const [metrics, setMetrics] = useState<SchedulerMetrics | null>(null);
  const [byTrade, setByTrade] = useState<Record<string, { count: number; avgUtilization: number; available: number }>>({});
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'labour' | 'equipment'>('all');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analysisType, setAnalysisType] = useState('optimization');

  useEffect(() => {
    fetchResourceData();
  }, []);

  const fetchResourceData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/resource-scheduler');
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
        setMetrics(data.metrics);
        setByTrade(data.byTrade || {});
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching resource data:', error);
      toast.error('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  const runAiAnalysis = async (type: string) => {
    setAnalysisType(type);
    setAnalyzing(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/ai/resource-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resources,
          metrics,
          projects,
          analysisType: type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.analysis);
        toast.success('Analysis complete!');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.trade?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || r.resourceType === filterType;
    return matchesSearch && matchesType;
  });

  const statusData = [
    { name: 'Available', value: resources.filter((r) => r.status === 'available').length, color: '#22c55e' },
    { name: 'Allocated', value: resources.filter((r) => r.status === 'allocated').length, color: '#3b82f6' },
    { name: 'Overallocated', value: resources.filter((r) => r.status === 'overallocated').length, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const tradeData = Object.entries(byTrade).map(([name, data]) => ({
    name: name.substring(0, 12),
    utilization: data.avgUtilization,
    count: data.count,
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500 text-white">Available</Badge>;
      case 'allocated':
        return <Badge className="bg-blue-500 text-white">Allocated</Badge>;
      case 'overallocated':
        return <Badge className="bg-red-500 text-white">Overallocated</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600';
    if (utilization > 80) return 'text-blue-600';
    if (utilization > 60) return 'text-green-600';
    return 'text-amber-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                Smart Resource Scheduler
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                AI-driven labour and equipment allocation optimizer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchResourceData}
              className="h-10 px-4 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-xs">Total Resources</p>
                        <p className="text-3xl font-bold">{metrics?.totalResources || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-indigo-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs">Avg Utilization</p>
                        <p className="text-3xl font-bold">{metrics?.avgUtilization || 0}%</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-xs">Labour</p>
                        <p className="text-3xl font-bold">{metrics?.totalLabour || 0}</p>
                      </div>
                      <HardHat className="h-8 w-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500 to-slate-700 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-300 text-xs">Equipment</p>
                        <p className="text-3xl font-bold">{metrics?.totalEquipment || 0}</p>
                      </div>
                      <Wrench className="h-8 w-8 text-slate-300" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs">Optimal</p>
                        <p className="text-3xl font-bold">{metrics?.optimallyAllocatedCount || 0}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs">Overallocated</p>
                        <p className="text-3xl font-bold">{metrics?.overallocatedCount || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Analysis Controls */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  AI Resource Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'optimization', name: 'Optimization', icon: Target },
                    { id: 'capacity_planning', name: 'Capacity Planning', icon: BarChart3 },
                    { id: 'productivity', name: 'Productivity', icon: TrendingUp },
                  ].map((type) => (
                    <Button
                      key={type.id}
                      variant={analysisType === type.id && aiAnalysis ? 'default' : 'outline'}
                      onClick={() => runAiAnalysis(type.id)}
                      disabled={analyzing}
                      className={`rounded-xl ${
                        analysisType === type.id && aiAnalysis
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0'
                          : ''
                      }`}
                    >
                      {analyzing && analysisType === type.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <type.icon className="h-4 w-4 mr-2" />
                      )}
                      {type.name}
                    </Button>
                  ))}
                </div>

                {aiAnalysis && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <pre className="whitespace-pre-wrap text-sm">{aiAnalysis}</pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Allocation Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      No allocation data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Utilization by Trade */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Utilization by Trade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tradeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={tradeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="utilization" fill="#6366f1" name="Utilization %" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      No trade data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resource List */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Resource Allocations
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      {(['all', 'labour', 'equipment'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            filterType === type
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9 w-64 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredResources.length > 0 ? (
                  <div className="space-y-3">
                    {filteredResources.map((resource) => (
                      <motion.div
                        key={resource.resourceId}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className={`p-3 rounded-xl ${resource.resourceType === 'labour' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            {resource.resourceType === 'labour' ? (
                              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Wrench className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{resource.resourceName}</h3>
                              {getStatusBadge(resource.status)}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {resource.trade} • {resource.projects.length} projects
                            </p>
                          </div>

                          {/* Utilization */}
                          <div className="w-48 hidden md:block">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">Utilization</span>
                              <span className={`text-sm font-medium ${getUtilizationColor(resource.totalAllocation)}`}>
                                {resource.totalAllocation}%
                              </span>
                            </div>
                            <Progress
                              value={Math.min(resource.totalAllocation, 100)}
                              className={`h-2 ${resource.totalAllocation > 100 ? 'bg-red-200' : ''}`}
                            />
                          </div>

                          {/* Availability */}
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Available</p>
                            <p className="text-lg font-semibold text-green-600">{resource.availability}%</p>
                          </div>
                        </div>

                        {/* Project Allocations */}
                        {resource.projects.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex flex-wrap gap-2">
                              {resource.projects.map((proj) => (
                                <Badge
                                  key={proj.projectId}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {proj.projectName}: {proj.allocation}%
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Users className="h-12 w-12 mb-4" />
                    <p className="font-medium">No resources found</p>
                    <p className="text-sm">Add team members and equipment to see allocations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
