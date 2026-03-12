'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sparkles,
  RefreshCw,
  Calendar,
  BarChart3,
  Loader2,
  Eye,
  FileWarning,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface SafetyMetrics {
  totalIncidents: number;
  nearMisses: number;
  minorIncidents: number;
  majorIncidents: number;
  criticalIncidents: number;
  failedInspections: number;
  passedInspections: number;
  inspectionPassRate: number;
  highRiskAssessments: number;
  totalRiskAssessments: number;
  criticalDefects: number;
  currentSiteOccupancy: number;
}

interface SafetyPatterns {
  byType: Record<string, number>;
  byLocation: Record<string, number>;
  byHour: Record<number, number>;
  byDay: Record<number, number>;
}

interface Project {
  id: string;
  name: string;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PredictiveSafetyDashboardPage() {
  const [metrics, setMetrics] = useState<SafetyMetrics | null>(null);
  const [patterns, setPatterns] = useState<SafetyPatterns | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analysisType, setAnalysisType] = useState<string>('overview');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchSafetyData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSafetyData = async () => {
    setLoading(true);
    try {
      const url = selectedProject
        ? `/api/ai/predictive-safety?projectId=${selectedProject}`
        : '/api/ai/predictive-safety';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Error fetching safety data:', error);
      toast.error('Failed to load safety data');
    } finally {
      setLoading(false);
    }
  };

  const runAiAnalysis = async (type: string) => {
    setAnalysisType(type);
    setAnalyzing(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/ai/predictive-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject || undefined,
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

  // Prepare chart data
  const incidentTypeData = patterns?.byType
    ? Object.entries(patterns.byType).map(([name, value]) => ({ name, value }))
    : [];

  const dayDistributionData = patterns?.byDay
    ? DAYS.map((day, index) => ({
        day,
        incidents: patterns.byDay[index] || 0,
      }))
    : [];

  const hourDistributionData = patterns?.byHour
    ? Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        incidents: patterns.byHour[i] || 0,
      }))
    : [];

  const safetyScore = metrics
    ? Math.max(0, 100 - (metrics.criticalIncidents * 20) - (metrics.majorIncidents * 10) - (metrics.failedInspections * 5))
    : 85;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/25">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-red-800 to-orange-900 dark:from-white dark:via-red-200 dark:to-orange-200 bg-clip-text text-transparent">
                Predictive Safety Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                AI-powered safety risk prediction and analysis
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
              onClick={fetchSafetyData}
              className="h-10 px-4 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs">Safety Score</p>
                        <p className="text-3xl font-bold">{safetyScore}%</p>
                      </div>
                      <Shield className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs">On Site Now</p>
                        <p className="text-3xl font-bold">{metrics?.currentSiteOccupancy || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-xs">Near Misses</p>
                        <p className="text-3xl font-bold">{metrics?.nearMisses || 0}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs">Incidents</p>
                        <p className="text-3xl font-bold">{metrics?.totalIncidents || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-xs">Pass Rate</p>
                        <p className="text-3xl font-bold">{metrics?.inspectionPassRate || 100}%</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs">High Risks</p>
                        <p className="text-3xl font-bold">{metrics?.highRiskAssessments || 0}</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Analysis Controls */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-red-500" />
                  AI Safety Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'overview', name: 'Overview Analysis', icon: Eye },
                    { id: 'risk_prediction', name: 'Risk Prediction', icon: Brain },
                    { id: 'trend_analysis', name: 'Trend Analysis', icon: TrendingUp },
                    { id: 'compliance_gaps', name: 'Compliance Gaps', icon: FileWarning },
                  ].map((type) => (
                    <Button
                      key={type.id}
                      variant={analysisType === type.id && aiAnalysis ? 'default' : 'outline'}
                      onClick={() => runAiAnalysis(type.id)}
                      disabled={analyzing}
                      className={`rounded-xl ${
                        analysisType === type.id && aiAnalysis
                          ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white border-0'
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incidents by Type */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                    Incidents by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {incidentTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={incidentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {incidentTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No incidents recorded</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Incidents by Day */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Incidents by Day of Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dayDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="incidents" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Incidents by Hour */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    Incident Distribution by Hour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={hourDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" interval={3} />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="incidents"
                        stroke="#8b5cf6"
                        fill="url(#colorIncidents)"
                      />
                      <defs>
                        <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Severity Breakdown */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  Incident Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Critical</span>
                      <Badge className="bg-red-500 text-white">{metrics?.criticalIncidents || 0}</Badge>
                    </div>
                    <Progress value={metrics?.criticalIncidents ? (metrics.criticalIncidents / Math.max(metrics.totalIncidents, 1)) * 100 : 0} className="h-2 bg-red-200" />
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Major</span>
                      <Badge className="bg-orange-500 text-white">{metrics?.majorIncidents || 0}</Badge>
                    </div>
                    <Progress value={metrics?.majorIncidents ? (metrics.majorIncidents / Math.max(metrics.totalIncidents, 1)) * 100 : 0} className="h-2 bg-orange-200" />
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Minor</span>
                      <Badge className="bg-amber-500 text-white">{metrics?.minorIncidents || 0}</Badge>
                    </div>
                    <Progress value={metrics?.minorIncidents ? (metrics.minorIncidents / Math.max(metrics.totalIncidents, 1)) * 100 : 0} className="h-2 bg-amber-200" />
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Near Miss</span>
                      <Badge className="bg-blue-500 text-white">{metrics?.nearMisses || 0}</Badge>
                    </div>
                    <Progress value={metrics?.nearMisses ? (metrics.nearMisses / Math.max(metrics.totalIncidents, 1)) * 100 : 0} className="h-2 bg-blue-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
