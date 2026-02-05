'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  PoundSterling,
  Leaf,
  Recycle,
  Sparkles,
  Loader2,
  RefreshCw,
  BarChart3,
  Target,
  Search,
} from 'lucide-react';
import {  Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface MaterialUsage {
  id: string;
  name: string;
  category: string;
  unit: string;
  budgeted: number;
  ordered: number;
  delivered: number;
  used: number;
  wasted: number;
  wastePercentage: number;
  costPerUnit: number;
  wasteCost: number;
  status: 'on_track' | 'warning' | 'critical';
}

interface WasteMetrics {
  totalBudgeted: number;
  totalUsed: number;
  totalWasted: number;
  totalWasteCost: number;
  avgWastePercentage: number;
  materialsAtRisk: number;
  materialsOnTrack: number;
}

interface Project {
  id: string;
  name: string;
}



const formatCurrency = (value: number) => {
  if (value >= 1000000) return `\u00a3${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `\u00a3${(value / 1000).toFixed(1)}K`;
  return `\u00a3${value.toFixed(0)}`;
};

export default function WasteTrackerPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialUsage[]>([]);
  const [metrics, setMetrics] = useState<WasteMetrics | null>(null);
  const [wasteByCategory, setWasteByCategory] = useState<Record<string, { waste: number; cost: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analysisType, setAnalysisType] = useState('waste_reduction');

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchMaterialData = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedProject
        ? `/api/ai/material-waste?projectId=${selectedProject}`
        : '/api/ai/material-waste';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
        setMetrics(data.metrics);
        setWasteByCategory(data.wasteByCategory || {});
      }
    } catch {
      console.error('Error fetching material data:', error);
      toast.error('Failed to load material data');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchMaterialData();
  }, [selectedProject, fetchMaterialData]);

  const runAiAnalysis = async (type: string) => {
    setAnalysisType(type);
    setAnalyzing(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/ai/material-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject || undefined,
          materials,
          metrics,
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
    } catch {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryData = Object.entries(wasteByCategory).map(([name, data]) => ({
    name,
    waste: data.waste,
    cost: data.cost,
  }));

  const statusData = [
    { name: 'On Track', value: metrics?.materialsOnTrack || 0, color: '#22c55e' },
    { name: 'At Risk', value: metrics?.materialsAtRisk || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-500 text-white">On Track</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 text-white">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <Recycle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-emerald-800 to-green-900 dark:from-white dark:via-emerald-200 dark:to-green-200 bg-clip-text text-transparent">
                Material Waste Tracker
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Monitor material usage and reduce waste with AI insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={fetchMaterialData}
              className="h-10 px-4 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-xs">Avg Waste %</p>
                        <p className="text-3xl font-bold">{metrics?.avgWastePercentage || 0}%</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-emerald-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs">Waste Cost</p>
                        <p className="text-3xl font-bold">{formatCurrency(metrics?.totalWasteCost || 0)}</p>
                      </div>
                      <PoundSterling className="h-8 w-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs">Materials</p>
                        <p className="text-3xl font-bold">{materials.length}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs">On Track</p>
                        <p className="text-3xl font-bold">{metrics?.materialsOnTrack || 0}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-xs">At Risk</p>
                        <p className="text-3xl font-bold">{metrics?.materialsAtRisk || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Analysis Controls */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  AI Waste Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'waste_reduction', name: 'Waste Reduction', icon: TrendingDown },
                    { id: 'cost_impact', name: 'Cost Impact', icon: PoundSterling },
                    { id: 'sustainability', name: 'Sustainability', icon: Leaf },
                  ].map((type) => (
                    <Button
                      key={type.id}
                      variant={analysisType === type.id && aiAnalysis ? 'default' : 'outline'}
                      onClick={() => runAiAnalysis(type.id)}
                      disabled={analyzing}
                      className={`rounded-xl ${
                        analysisType === type.id && aiAnalysis
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0'
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
              {/* Waste by Category */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Waste Cost by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `\u00a3${v}`} />
                        <Tooltip formatter={(v) => formatCurrency(v as number)} />
                        <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      No category data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-500" />
                    Material Status Distribution
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
                      No status data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Materials Table */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Material Waste Details
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 w-64 rounded-xl"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMaterials.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-slate-500 border-b">
                          <th className="pb-3 font-medium">Material</th>
                          <th className="pb-3 font-medium">Category</th>
                          <th className="pb-3 font-medium text-right">Delivered</th>
                          <th className="pb-3 font-medium text-right">Used</th>
                          <th className="pb-3 font-medium text-right">Wasted</th>
                          <th className="pb-3 font-medium text-right">Waste %</th>
                          <th className="pb-3 font-medium text-right">Waste Cost</th>
                          <th className="pb-3 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filteredMaterials.map((mat) => (
                          <tr key={mat.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 font-medium">{mat.name}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">{mat.category}</td>
                            <td className="py-3 text-right">{mat.delivered} {mat.unit}</td>
                            <td className="py-3 text-right">{mat.used} {mat.unit}</td>
                            <td className="py-3 text-right text-red-600">{mat.wasted} {mat.unit}</td>
                            <td className="py-3 text-right">
                              <span className={mat.wastePercentage > 10 ? 'text-red-600 font-medium' : ''}>
                                {mat.wastePercentage}%
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium">{formatCurrency(mat.wasteCost)}</td>
                            <td className="py-3 text-center">{getStatusBadge(mat.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Package className="h-12 w-12 mb-4" />
                    <p className="font-medium">No materials found</p>
                    <p className="text-sm">Add materials to projects to track waste</p>
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
