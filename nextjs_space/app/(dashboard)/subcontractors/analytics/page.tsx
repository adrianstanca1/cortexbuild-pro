'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  Shield,
  BarChart3,
  Loader2,
  Sparkles,
  Target,
  Search,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Legend,
} from 'recharts';

interface SubcontractorMetrics {
  id: string;
  name: string;
  company: string;
  trade: string;
  projectsCount: number;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  avgTaskDuration: number;
  safetyIncidents: number;
  defectsReported: number;
  qualityScore: number;
  safetyScore: number;
  timelinessScore: number;
  overallScore: number;
  ranking: number;
  trend: 'up' | 'down' | 'stable';
}

interface AggregateStats {
  totalSubcontractors: number;
  avgOverallScore: number;
  avgSafetyScore: number;
  avgQualityScore: number;
  topPerformers: number;
  needsImprovement: number;
  totalProjects: number;
  totalTasks: number;
  totalIncidents: number;
}

interface PerformanceDistribution {
  excellent: number;
  good: number;
  average: number;
  belowAverage: number;
  poor: number;
}

export default function SubcontractorAnalyticsPage() {
  const [subcontractors, setSubcontractors] = useState<SubcontractorMetrics[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(null);
  const [performanceDistribution, setPerformanceDistribution] = useState<PerformanceDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/subcontractor-analytics');
      if (response.ok) {
        const data = await response.json();
        setSubcontractors(data.subcontractors || []);
        setAggregateStats(data.aggregateStats);
        setPerformanceDistribution(data.performanceDistribution);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const runAiAnalysis = async (subId: string, analysisType: string) => {
    setSelectedSubcontractor(subId);
    setAnalyzing(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/ai/subcontractor-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcontractorId: subId,
          analysisType,
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

  const filteredSubcontractors = subcontractors.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const distributionData = performanceDistribution
    ? [
        { name: 'Excellent', value: performanceDistribution.excellent, color: '#22c55e' },
        { name: 'Good', value: performanceDistribution.good, color: '#3b82f6' },
        { name: 'Average', value: performanceDistribution.average, color: '#eab308' },
        { name: 'Below Avg', value: performanceDistribution.belowAverage, color: '#f97316' },
        { name: 'Poor', value: performanceDistribution.poor, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : [];

  const scoreComparisonData = subcontractors.slice(0, 10).map((s) => ({
    name: s.name.substring(0, 15),
    safety: s.safetyScore,
    quality: s.qualityScore,
    timeliness: s.timelinessScore,
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Subcontractor Performance Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                AI-powered scoring and ranking of your supply chain
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            AI Powered
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs">Total Subs</p>
                        <p className="text-3xl font-bold">{aggregateStats?.totalSubcontractors || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs">Avg Score</p>
                        <p className="text-3xl font-bold">{aggregateStats?.avgOverallScore || 0}%</p>
                      </div>
                      <Target className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-xs">Top Performers</p>
                        <p className="text-3xl font-bold">{aggregateStats?.topPerformers || 0}</p>
                      </div>
                      <Award className="h-8 w-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs">Needs Attention</p>
                        <p className="text-3xl font-bold">{aggregateStats?.needsImprovement || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs">Safety Avg</p>
                        <p className="text-3xl font-bold">{aggregateStats?.avgSafetyScore || 0}%</p>
                      </div>
                      <Shield className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Distribution */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      No subcontractor data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score Comparison */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Score Comparison (Top 10)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scoreComparisonData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={scoreComparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="safety" fill="#22c55e" name="Safety" />
                        <Bar dataKey="quality" fill="#3b82f6" name="Quality" />
                        <Bar dataKey="timeliness" fill="#f59e0b" name="Timeliness" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      No subcontractor data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Subcontractor Rankings */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Subcontractor Rankings
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search subcontractors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 w-64 rounded-xl"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSubcontractors.length > 0 ? (
                  <div className="space-y-3">
                    {filteredSubcontractors.map((sub) => (
                      <motion.div
                        key={sub.id}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {/* Ranking */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getScoreBadgeColor(sub.overallScore)}`}>
                            #{sub.ranking}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{sub.name}</h3>
                              {getTrendIcon(sub.trend)}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {sub.trade} • {sub.projectsCount} projects • {sub.tasksCompleted}/{sub.tasksTotal} tasks
                            </p>
                          </div>

                          {/* Scores */}
                          <div className="hidden md:flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Safety</p>
                              <Badge className={getScoreBadgeColor(sub.safetyScore) + ' text-white'}>
                                {sub.safetyScore}%
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Quality</p>
                              <Badge className={getScoreBadgeColor(sub.qualityScore) + ' text-white'}>
                                {sub.qualityScore}%
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Time</p>
                              <Badge className={getScoreBadgeColor(sub.timelinessScore) + ' text-white'}>
                                {sub.timelinessScore}%
                              </Badge>
                            </div>
                          </div>

                          {/* Overall Score */}
                          <div className={`px-4 py-2 rounded-xl ${getScoreColor(sub.overallScore)}`}>
                            <p className="text-xs">Overall</p>
                            <p className="text-xl font-bold">{sub.overallScore}%</p>
                          </div>

                          {/* AI Analysis Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runAiAnalysis(sub.id, 'performance_review')}
                            disabled={analyzing && selectedSubcontractor === sub.id}
                            className="rounded-lg"
                          >
                            {analyzing && selectedSubcontractor === sub.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* AI Analysis Result */}
                        {selectedSubcontractor === sub.id && aiAnalysis && (
                          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">AI Analysis</span>
                            </div>
                            <pre className="whitespace-pre-wrap text-sm">{aiAnalysis}</pre>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Users className="h-12 w-12 mb-4" />
                    <p className="font-medium">No subcontractors found</p>
                    <p className="text-sm">Add subcontractors to see performance analytics</p>
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
