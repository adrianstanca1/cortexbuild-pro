'use client';

import { useState, useEffect } from 'react';
import {  Card, CardContent, CardDescription, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  AlertTriangle, Plus, Search, PoundSterling,
  ChevronRight, Loader2,
  TrendingUp, TrendingDown, Shield, Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface RiskEntry {
  id: string;
  number: number;
  projectId: string;
  title: string;
  description: string;
  category: string | null;
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: string | null;
  status: string;
  responseStrategy: string | null;
  mitigationPlan: string | null;
  costImpactMostLikely: number | null;
  scheduleImpactDays: number | null;
  trendDirection: string | null;
  project: { id: string; name: string };
  owner: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  mitigationActions: Array<{
    id: string;
    description: string;
    status: string;
    assignee: { id: string; name: string } | null;
  }>;
  createdAt: string;
}

interface Props {
  projects: Project[];
  teamMembers: TeamMember[];
}

const riskLevelColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  MITIGATING: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-100 text-slate-700',
  OCCURRED: 'bg-red-100 text-red-700'
};

export function RiskRegisterClient({ projects, teamMembers }: Props) {
  const [risks, setRisks] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newRisk, setNewRisk] = useState({
    projectId: '',
    title: '',
    description: '',
    category: '',
    probability: '3',
    impact: '3',
    responseStrategy: '',
    mitigationPlan: '',
    costImpactMostLikely: '',
    scheduleImpactDays: '',
    ownerId: ''
  });

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterProject !== 'all') params.set('projectId', filterProject);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterLevel !== 'all') params.set('riskLevel', filterLevel);
      
      const response = await fetch(`/api/risk-register?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setRisks(data);
    } catch {
      console.error('Error:', error);
      toast.error('Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [filterProject, filterStatus, filterLevel]);

  const handleCreate = async () => {
    if (!newRisk.projectId || !newRisk.title || !newRisk.description) {
      toast.error('Project, title and description are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/risk-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRisk,
          probability: parseInt(newRisk.probability),
          impact: parseInt(newRisk.impact),
          costImpactMostLikely: parseFloat(newRisk.costImpactMostLikely) || null,
          scheduleImpactDays: parseInt(newRisk.scheduleImpactDays) || null,
          ownerId: newRisk.ownerId || null
        })
      });

      if (!response.ok) throw new Error('Failed to create');
      
      toast.success('Risk created successfully');
      setShowNewDialog(false);
      setNewRisk({
        projectId: '',
        title: '',
        description: '',
        category: '',
        probability: '3',
        impact: '3',
        responseStrategy: '',
        mitigationPlan: '',
        costImpactMostLikely: '',
        scheduleImpactDays: '',
        ownerId: ''
      });
      fetchRisks();
    } catch {
      console.error('Error:', error);
      toast.error('Failed to create risk');
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

  const filteredRisks = risks.filter(r => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(query) ||
             r.description.toLowerCase().includes(query) ||
             r.project.name.toLowerCase().includes(query);
    }
    return true;
  });

  // Calculate summary stats
  const openRisks = filteredRisks.filter(r => r.status === 'OPEN' || r.status === 'MITIGATING');
  const criticalRisks = openRisks.filter(r => r.riskLevel === 'CRITICAL');
  const highRisks = openRisks.filter(r => r.riskLevel === 'HIGH');
  const totalExposure = openRisks.reduce((sum, r) => sum + (r.costImpactMostLikely || 0), 0);

  // Risk matrix data
  const getMatrixCount = (prob: number, imp: number) => {
    return openRisks.filter(r => r.probability === prob && r.impact === imp).length;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-primary" />
            Risk Register
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Identify, assess, and manage project risks
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Risk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Register New Risk</DialogTitle>
              <DialogDescription>
                Identify and assess a new project risk
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select value={newRisk.projectId} onValueChange={(v) => setNewRisk({...newRisk, projectId: v})}>
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
                  <Label>Category</Label>
                  <Select value={newRisk.category} onValueChange={(v) => setNewRisk({...newRisk, category: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Schedule">Schedule</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                      <SelectItem value="Environmental">Environmental</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="External">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Risk Title *</Label>
                <Input 
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({...newRisk, title: e.target.value})}
                  placeholder="Brief risk title"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea 
                  value={newRisk.description}
                  onChange={(e) => setNewRisk({...newRisk, description: e.target.value})}
                  placeholder="Detailed risk description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Probability (1-5)</Label>
                  <Select value={newRisk.probability} onValueChange={(v) => setNewRisk({...newRisk, probability: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Rare</SelectItem>
                      <SelectItem value="2">2 - Unlikely</SelectItem>
                      <SelectItem value="3">3 - Possible</SelectItem>
                      <SelectItem value="4">4 - Likely</SelectItem>
                      <SelectItem value="5">5 - Almost Certain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Impact (1-5)</Label>
                  <Select value={newRisk.impact} onValueChange={(v) => setNewRisk({...newRisk, impact: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Negligible</SelectItem>
                      <SelectItem value="2">2 - Minor</SelectItem>
                      <SelectItem value="3">3 - Moderate</SelectItem>
                      <SelectItem value="4">4 - Major</SelectItem>
                      <SelectItem value="5">5 - Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Response Strategy</Label>
                  <Select value={newRisk.responseStrategy} onValueChange={(v) => setNewRisk({...newRisk, responseStrategy: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVOID">Avoid</SelectItem>
                      <SelectItem value="MITIGATE">Mitigate</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="ACCEPT">Accept</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risk Owner</Label>
                  <Select value={newRisk.ownerId} onValueChange={(v) => setNewRisk({...newRisk, ownerId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(tm => (
                        <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cost Impact (£)</Label>
                  <Input 
                    type="number"
                    value={newRisk.costImpactMostLikely}
                    onChange={(e) => setNewRisk({...newRisk, costImpactMostLikely: e.target.value})}
                    placeholder="Most likely cost impact"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule Impact (days)</Label>
                  <Input 
                    type="number"
                    value={newRisk.scheduleImpactDays}
                    onChange={(e) => setNewRisk({...newRisk, scheduleImpactDays: e.target.value})}
                    placeholder="Days of delay"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mitigation Plan</Label>
                <Textarea 
                  value={newRisk.mitigationPlan}
                  onChange={(e) => setNewRisk({...newRisk, mitigationPlan: e.target.value})}
                  placeholder="How will this risk be mitigated?"
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
                Register Risk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open Risks</p>
                <p className="text-2xl font-bold">{openRisks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-500">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalRisks.length}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-500">High</p>
                <p className="text-2xl font-bold text-orange-600">{highRisks.length}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Exposure</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExposure)}</p>
              </div>
              <PoundSterling className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Risk Heat Map</CardTitle>
          <CardDescription>Probability vs Impact Matrix</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-1 max-w-lg">
            <div className="text-xs text-slate-500 text-right pr-2 pt-2">5</div>
            {[1,2,3,4,5].map(imp => {
              const count = getMatrixCount(5, imp);
              const score = 5 * imp;
              let bg = 'bg-green-100'; 
              if (score >= 15) bg = 'bg-red-200';
              else if (score >= 10) bg = 'bg-orange-200';
              else if (score >= 5) bg = 'bg-yellow-200';
              return (
                <div key={`5-${imp}`} className={`h-10 ${bg} rounded flex items-center justify-center text-sm font-medium`}>
                  {count || ''}
                </div>
              );
            })}
            
            <div className="text-xs text-slate-500 text-right pr-2 pt-2">4</div>
            {[1,2,3,4,5].map(imp => {
              const count = getMatrixCount(4, imp);
              const score = 4 * imp;
              let bg = 'bg-green-100'; 
              if (score >= 15) bg = 'bg-red-200';
              else if (score >= 10) bg = 'bg-orange-200';
              else if (score >= 5) bg = 'bg-yellow-200';
              return (
                <div key={`4-${imp}`} className={`h-10 ${bg} rounded flex items-center justify-center text-sm font-medium`}>
                  {count || ''}
                </div>
              );
            })}
            
            <div className="text-xs text-slate-500 text-right pr-2 pt-2">3</div>
            {[1,2,3,4,5].map(imp => {
              const count = getMatrixCount(3, imp);
              const score = 3 * imp;
              let bg = 'bg-green-100'; 
              if (score >= 15) bg = 'bg-red-200';
              else if (score >= 10) bg = 'bg-orange-200';
              else if (score >= 5) bg = 'bg-yellow-200';
              return (
                <div key={`3-${imp}`} className={`h-10 ${bg} rounded flex items-center justify-center text-sm font-medium`}>
                  {count || ''}
                </div>
              );
            })}
            
            <div className="text-xs text-slate-500 text-right pr-2 pt-2">2</div>
            {[1,2,3,4,5].map(imp => {
              const count = getMatrixCount(2, imp);
              const score = 2 * imp;
              let bg = 'bg-green-100'; 
              if (score >= 10) bg = 'bg-orange-200';
              else if (score >= 5) bg = 'bg-yellow-200';
              return (
                <div key={`2-${imp}`} className={`h-10 ${bg} rounded flex items-center justify-center text-sm font-medium`}>
                  {count || ''}
                </div>
              );
            })}
            
            <div className="text-xs text-slate-500 text-right pr-2 pt-2">1</div>
            {[1,2,3,4,5].map(imp => {
              const count = getMatrixCount(1, imp);
              return (
                <div key={`1-${imp}`} className="h-10 bg-green-100 rounded flex items-center justify-center text-sm font-medium">
                  {count || ''}
                </div>
              );
            })}
            
            <div></div>
            {[1,2,3,4,5].map(i => (
              <div key={`label-${i}`} className="text-xs text-slate-500 text-center pt-1">{i}</div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="rotate-[-90deg] origin-left absolute -ml-6">Probability</span>
            <div className="ml-8">Impact →</div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="MITIGATING">Mitigating</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Risks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRisks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No risks found</h3>
            <p className="text-slate-500 mt-1">Register your first risk to start tracking</p>
            <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Risk
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRisks.map(risk => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={riskLevelColors[risk.riskLevel || 'MEDIUM']}>
                        {risk.riskLevel || 'MEDIUM'}
                      </Badge>
                      <Badge className={statusColors[risk.status]}>
                        {risk.status}
                      </Badge>
                      <span className="text-sm text-slate-500">R-{risk.number}</span>
                      {risk.trendDirection && (
                        <span className="flex items-center gap-1 text-xs">
                          {risk.trendDirection === 'IMPROVING' ? (
                            <TrendingDown className="h-3 w-3 text-green-500" />
                          ) : risk.trendDirection === 'WORSENING' ? (
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          ) : null}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {risk.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {risk.project.name}
                      {risk.category && ` • ${risk.category}`}
                      {risk.owner && ` • Owner: ${risk.owner.name}`}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {risk.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 lg:gap-8 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Score</p>
                      <div className={`text-2xl font-bold ${risk.riskScore >= 15 ? 'text-red-600' : risk.riskScore >= 10 ? 'text-orange-600' : risk.riskScore >= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {risk.riskScore}
                      </div>
                      <p className="text-xs text-slate-400">{risk.probability} × {risk.impact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Cost Impact</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(risk.costImpactMostLikely)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Schedule</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {risk.scheduleImpactDays ? `${risk.scheduleImpactDays} days` : '—'}
                      </p>
                    </div>
                    {risk.responseStrategy && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Strategy</p>
                        <Badge variant="outline">{risk.responseStrategy}</Badge>
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-slate-400 hidden lg:block" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
