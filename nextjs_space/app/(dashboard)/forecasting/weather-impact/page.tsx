'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Loader2,
  RefreshCw,
  CloudLightning,
  Cloudy,
  Umbrella,
  TrendingUp,
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
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface WeatherData {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
}

interface ScheduleImpact {
  date: string;
  impactLevel: 'none' | 'low' | 'medium' | 'high' | 'severe';
  affectedActivities: string[];
  recommendation: string;
  riskScore: number;
}

interface Project {
  id: string;
  name: string;
  location: string;
}

interface Summary {
  totalDays: number;
  severeDays: number;
  highDays: number;
  mediumDays: number;
  goodDays: number;
  avgRiskScore: number;
  recommendation: string;
}

const impactColors: Record<string, string> = {
  none: '#22c55e',
  low: '#84cc16',
  medium: '#eab308',
  high: '#f97316',
  severe: '#ef4444',
};

const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return <Sun className="h-6 w-6 text-amber-500" />;
  if (code === 2 || code === 3) return <Cloud className="h-6 w-6 text-slate-400" />;
  if (code >= 45 && code <= 48) return <Cloudy className="h-6 w-6 text-slate-500" />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="h-6 w-6 text-blue-500" />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow className="h-6 w-6 text-cyan-500" />;
  if (code >= 95) return <CloudLightning className="h-6 w-6 text-purple-500" />;
  return <Cloud className="h-6 w-6 text-slate-400" />;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function WeatherImpactPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [impacts, setImpacts] = useState<ScheduleImpact[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [location, setLocation] = useState('London, UK');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedProject
        ? `/api/ai/weather-impact?projectId=${selectedProject}&days=14`
        : '/api/ai/weather-impact?days=14';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setForecast(data.forecast || []);
        setImpacts(data.impacts || []);
        setSummary(data.summary);
        setLocation(data.location);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchWeatherData();
  }, [selectedProject, fetchWeatherData]);

  const runAiAnalysis = async () => {
    setAnalyzing(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/ai/weather-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject || undefined,
          forecast,
          impacts,
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

  const chartData = forecast.map((f, i) => ({
    date: formatDate(f.date),
    tempMax: f.tempMax,
    tempMin: f.tempMin,
    precipitation: f.precipitation,
    windSpeed: f.windSpeed,
    riskScore: impacts[i]?.riskScore || 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
              <Cloud className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
                Weather Impact Forecasting
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                14-day forecast with schedule impact analysis • {location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">All Sites (London)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={fetchWeatherData}
              className="h-10 px-4 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs">Good Days</p>
                        <p className="text-3xl font-bold">{summary?.goodDays || 0}</p>
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
                        <p className="text-amber-100 text-xs">Medium Risk</p>
                        <p className="text-3xl font-bold">{summary?.mediumDays || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs">High Risk</p>
                        <p className="text-3xl font-bold">{summary?.highDays || 0}</p>
                      </div>
                      <Wind className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs">Severe</p>
                        <p className="text-3xl font-bold">{summary?.severeDays || 0}</p>
                      </div>
                      <CloudLightning className="h-8 w-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs">Avg Risk</p>
                        <p className="text-3xl font-bold">{summary?.avgRiskScore || 0}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs">Total Days</p>
                        <p className="text-3xl font-bold">{summary?.totalDays || 14}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Analysis Button */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-sky-500" />
                    <div>
                      <p className="font-medium">AI Schedule Impact Analysis</p>
                      <p className="text-sm text-slate-500">
                        Get detailed recommendations for managing weather impacts
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={runAiAnalysis}
                    disabled={analyzing}
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
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
              {/* Temperature Chart */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    Temperature Forecast (°C)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="tempMax" stroke="#ef4444" fill="url(#tempMax)" name="Max" />
                      <Area type="monotone" dataKey="tempMin" stroke="#3b82f6" fill="url(#tempMin)" name="Min" />
                      <defs>
                        <linearGradient id="tempMax" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tempMin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Score Chart */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Daily Risk Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="riskScore" name="Risk %">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.riskScore >= 60 ? '#ef4444' :
                              entry.riskScore >= 40 ? '#f97316' :
                              entry.riskScore >= 20 ? '#eab308' :
                              '#22c55e'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Daily Forecast Cards */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  14-Day Detailed Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                  {forecast.slice(0, 14).map((day, i) => {
                    const impact = impacts[i];
                    return (
                      <motion.div
                        key={day.date}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          impact?.impactLevel === 'severe' ? 'border-red-400 bg-red-50 dark:bg-red-950/30' :
                          impact?.impactLevel === 'high' ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30' :
                          impact?.impactLevel === 'medium' ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' :
                          'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <p className="text-xs font-medium text-slate-500">{formatDate(day.date)}</p>
                        <div className="flex items-center justify-between my-2">
                          {getWeatherIcon(day.weatherCode)}
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: impactColors[impact?.impactLevel || 'none'] }}
                          >
                            {impact?.impactLevel || 'good'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{day.description}</p>
                        <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3" />
                            {day.tempMin}° - {day.tempMax}°C
                          </div>
                          <div className="flex items-center gap-1">
                            <Umbrella className="h-3 w-3" />
                            {day.precipitation}mm
                          </div>
                          <div className="flex items-center gap-1">
                            <Wind className="h-3 w-3" />
                            {day.windSpeed} km/h
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress value={impact?.riskScore || 0} className="h-1" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
