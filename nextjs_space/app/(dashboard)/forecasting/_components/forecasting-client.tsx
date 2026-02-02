'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TrendingUp, TrendingDown, Plus, RefreshCw, PoundSterling,
  Target, Activity, AlertTriangle, Loader2, Calendar, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
}

interface ForecastEntry {
  id: string;
  projectId: string;
  forecastType: string;
  forecastDate: string;
  originalBudget: number | null;
  currentBudget: number | null;
  actualToDate: number | null;
  forecastAtCompletion: number | null;
  estimateToComplete: number | null;
  varianceAtCompletion: number | null;
  costPerformanceIndex: number | null;
  schedulePerformanceIndex: number | null;
  confidence: string | null;
  scenarioName: string | null;
  project: { id: string; name: string };
  createdBy: { id: string; name: string };
}

interface Props {
  projects: Project[];
}

export function ForecastingClient({ projects }: Props) {
  const [forecasts, setForecasts] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newForecast, setNewForecast] = useState({
    projectId: '',
    forecastType: 'COST',
    originalBudget: '',
    currentBudget: '',
    actualToDate: '',
    forecastAtCompletion: '',
    estimateToComplete: '',
    plannedValue: '',
    earnedValue: '',
    actualCost: '',
    confidence: 'MEDIUM',
    assumptions: '',
    scenarioName: ''
  });

  const fetchForecasts = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/forecasts?projectId=${selectedProject}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setForecasts(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchForecasts();
    }
  }, [selectedProject]);

  const handleCreate = async () => {
    if (!newForecast.projectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/forecasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newForecast,
          originalBudget: parseFloat(newForecast.originalBudget) || null,
          currentBudget: parseFloat(newForecast.currentBudget) || null,
          actualToDate: parseFloat(newForecast.actualToDate) || null,
          forecastAtCompletion: parseFloat(newForecast.forecastAtCompletion) || null,
          estimateToComplete: parseFloat(newForecast.estimateToComplete) || null,
          plannedValue: parseFloat(newForecast.plannedValue) || null,
          earnedValue: parseFloat(newForecast.earnedValue) || null,
          actualCost: parseFloat(newForecast.actualCost) || null
        })
      });

      if (!response.ok) throw new Error('Failed to create');
      
      toast.success('Forecast created successfully');
      setShowNewDialog(false);
      if (newForecast.projectId === selectedProject) {
        fetchForecasts();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create forecast');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const latestForecast = forecasts[0];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Forecasting & Burn Analysis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Cost and schedule forecasting with earned value metrics
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Forecast
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Forecast Entry</DialogTitle>
              <DialogDescription>
                Record cost or schedule forecast metrics
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select value={newForecast.projectId} onValueChange={(v) => setNewForecast({...newForecast, projectId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Forecast Type</Label>
                  <Select value={newForecast.forecastType} onValueChange={(v) => setNewForecast({...newForecast, forecastType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COST">Cost Forecast</SelectItem>
                      <SelectItem value="SCHEDULE">Schedule Forecast</SelectItem>
                      <SelectItem value="PRODUCTIVITY">Productivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Original Budget (£)</Label>
                  <Input 
                    type="number"
                    value={newForecast.originalBudget}
                    onChange={(e) => setNewForecast({...newForecast, originalBudget: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Budget (£)</Label>
                  <Input 
                    type="number"
                    value={newForecast.currentBudget}
                    onChange={(e) => setNewForecast({...newForecast, currentBudget: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual to Date (£)</Label>
                  <Input 
                    type="number"
                    value={newForecast.actualToDate}
                    onChange={(e) => setNewForecast({...newForecast, actualToDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forecast at Completion (£)</Label>
                  <Input 
                    type="number"
                    value={newForecast.forecastAtCompletion}
                    onChange={(e) => setNewForecast({...newForecast, forecastAtCompletion: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimate to Complete (£)</Label>
                  <Input 
                    type="number"
                    value={newForecast.estimateToComplete}
                    onChange={(e) => setNewForecast({...newForecast, estimateToComplete: e.target.value})}
                  />
                </div>
              </div>

              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-2">Earned Value Metrics</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Planned Value (BCWS)</Label>
                  <Input 
                    type="number"
                    value={newForecast.plannedValue}
                    onChange={(e) => setNewForecast({...newForecast, plannedValue: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Earned Value (BCWP)</Label>
                  <Input 
                    type="number"
                    value={newForecast.earnedValue}
                    onChange={(e) => setNewForecast({...newForecast, earnedValue: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Cost (ACWP)</Label>
                  <Input 
                    type="number"
                    value={newForecast.actualCost}
                    onChange={(e) => setNewForecast({...newForecast, actualCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Confidence Level</Label>
                  <Select value={newForecast.confidence} onValueChange={(v) => setNewForecast({...newForecast, confidence: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scenario Name</Label>
                  <Input 
                    value={newForecast.scenarioName}
                    onChange={(e) => setNewForecast({...newForecast, scenarioName: e.target.value})}
                    placeholder="e.g., Most Likely"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assumptions & Notes</Label>
                <Textarea 
                  value={newForecast.assumptions}
                  onChange={(e) => setNewForecast({...newForecast, assumptions: e.target.value})}
                  placeholder="Key assumptions and notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Forecast
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Label className="mb-2 block">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project to view forecasts" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.budget ? `(£${(p.budget/1000).toFixed(0)}k)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <Button variant="outline" onClick={fetchForecasts} className="mt-6">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {selectedProject && latestForecast && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Forecast at Completion</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(latestForecast.forecastAtCompletion)}</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
              {latestForecast.varianceAtCompletion !== null && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {latestForecast.varianceAtCompletion >= 0 ? (
                    <><TrendingUp className="h-4 w-4" /> Under by {formatCurrency(latestForecast.varianceAtCompletion)}</>
                  ) : (
                    <><TrendingDown className="h-4 w-4" /> Over by {formatCurrency(Math.abs(latestForecast.varianceAtCompletion))}</>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Cost Performance Index</p>
                  <p className={`text-2xl font-bold mt-1 ${latestForecast.costPerformanceIndex && latestForecast.costPerformanceIndex >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {latestForecast.costPerformanceIndex?.toFixed(2) || '—'}
                  </p>
                </div>
                <PoundSterling className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {latestForecast.costPerformanceIndex && latestForecast.costPerformanceIndex >= 1 ? 'Under budget' : 'Over budget'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Schedule Performance Index</p>
                  <p className={`text-2xl font-bold mt-1 ${latestForecast.schedulePerformanceIndex && latestForecast.schedulePerformanceIndex >= 1 ? 'text-green-600' : 'text-amber-600'}`}>
                    {latestForecast.schedulePerformanceIndex?.toFixed(2) || '—'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {latestForecast.schedulePerformanceIndex && latestForecast.schedulePerformanceIndex >= 1 ? 'Ahead of schedule' : 'Behind schedule'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Estimate to Complete</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(latestForecast.estimateToComplete)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Confidence: {latestForecast.confidence || 'Medium'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecasts List */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Forecast History
            </CardTitle>
            <CardDescription>
              Historical forecast entries for {selectedProjectData?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : forecasts.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No forecasts yet</h3>
                <p className="text-slate-500 mt-1">Create your first forecast for this project</p>
              </div>
            ) : (
              <div className="space-y-3">
                {forecasts.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{f.forecastType}</Badge>
                        {f.scenarioName && <span className="text-sm text-slate-500">{f.scenarioName}</span>}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {format(new Date(f.forecastDate), 'dd MMM yyyy')} by {f.createdBy.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-right">
                        <p className="text-slate-500">FAC</p>
                        <p className="font-semibold">{formatCurrency(f.forecastAtCompletion)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">CPI</p>
                        <p className={`font-semibold ${f.costPerformanceIndex && f.costPerformanceIndex >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {f.costPerformanceIndex?.toFixed(2) || '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">SPI</p>
                        <p className={`font-semibold ${f.schedulePerformanceIndex && f.schedulePerformanceIndex >= 1 ? 'text-green-600' : 'text-amber-600'}`}>
                          {f.schedulePerformanceIndex?.toFixed(2) || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedProject && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Select a Project</h3>
            <p className="text-slate-500 mt-1">Choose a project above to view and manage forecasts</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
