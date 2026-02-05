'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Package, Plus, Search, PoundSterling,
  ChevronRight, AlertCircle, CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface CostCode {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface WorkPackage {
  id: string;
  number: number;
  name: string;
  description: string | null;
  status: string;
  scope: string | null;
  budgetAmount: number;
  committedAmount: number;
  actualAmount: number;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  percentComplete: number;
  isCriticalPath: boolean;
  project: { id: string; name: string };
  responsibleParty: { id: string; name: string } | null;
  costCode: { id: string; code: string; name: string } | null;
  _count: { tasks: number; productionLogs: number };
  createdAt: string;
}

interface Props {
  projects: Project[];
  teamMembers: TeamMember[];
  costCodes: CostCode[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PLANNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ON_HOLD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export function WorkPackagesClient({ projects, teamMembers, costCodes }: Props) {
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newWP, setNewWP] = useState({
    projectId: '',
    name: '',
    description: '',
    scope: '',
    budgetAmount: '',
    plannedStartDate: '',
    plannedEndDate: '',
    responsiblePartyId: '',
    costCodeId: '',
    isCriticalPath: false
  });

  const fetchWorkPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterProject !== 'all') params.set('projectId', filterProject);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      
      const response = await fetch(`/api/work-packages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setWorkPackages(data);
    } catch {
      console.error('Error:', error);
      toast.error('Failed to load work packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkPackages();
  }, [filterProject, filterStatus]);

  const handleCreate = async () => {
    if (!newWP.projectId || !newWP.name) {
      toast.error('Project and name are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/work-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newWP,
          budgetAmount: parseFloat(newWP.budgetAmount) || 0,
          responsiblePartyId: newWP.responsiblePartyId || null,
          costCodeId: newWP.costCodeId || null
        })
      });

      if (!response.ok) throw new Error('Failed to create');
      
      toast.success('Work package created successfully');
      setShowNewDialog(false);
      setNewWP({
        projectId: '',
        name: '',
        description: '',
        scope: '',
        budgetAmount: '',
        plannedStartDate: '',
        plannedEndDate: '',
        responsiblePartyId: '',
        costCodeId: '',
        isCriticalPath: false
      });
      fetchWorkPackages();
    } catch {
      console.error('Error:', error);
      toast.error('Failed to create work package');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const filteredWPs = workPackages.filter(wp => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return wp.name.toLowerCase().includes(query) ||
             wp.description?.toLowerCase().includes(query) ||
             wp.project.name.toLowerCase().includes(query);
    }
    return true;
  });

  // Calculate summary stats
  const totalBudget = filteredWPs.reduce((sum, wp) => sum + wp.budgetAmount, 0);
  const totalActual = filteredWPs.reduce((sum, wp) => sum + wp.actualAmount, 0);
  const avgProgress = filteredWPs.length > 0 
    ? filteredWPs.reduce((sum, wp) => sum + wp.percentComplete, 0) / filteredWPs.length 
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Work Packages
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage scope, budget, and schedule at the work package level
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Work Package
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Work Package</DialogTitle>
              <DialogDescription>
                Define a new work package with scope, budget, and schedule
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select value={newWP.projectId} onValueChange={(v) => setNewWP({...newWP, projectId: v})}>
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
                  <Label>Name *</Label>
                  <Input 
                    value={newWP.name}
                    onChange={(e) => setNewWP({...newWP, name: e.target.value})}
                    placeholder="e.g., Foundation Works"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={newWP.description}
                  onChange={(e) => setNewWP({...newWP, description: e.target.value})}
                  placeholder="Brief description of the work package..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Scope of Work</Label>
                <Textarea 
                  value={newWP.scope}
                  onChange={(e) => setNewWP({...newWP, scope: e.target.value})}
                  placeholder="Detailed scope definition..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Budget (£)</Label>
                  <Input 
                    type="number"
                    value={newWP.budgetAmount}
                    onChange={(e) => setNewWP({...newWP, budgetAmount: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={newWP.plannedStartDate}
                    onChange={(e) => setNewWP({...newWP, plannedStartDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={newWP.plannedEndDate}
                    onChange={(e) => setNewWP({...newWP, plannedEndDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsible Party</Label>
                  <Select value={newWP.responsiblePartyId} onValueChange={(v) => setNewWP({...newWP, responsiblePartyId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(tm => (
                        <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cost Code</Label>
                  <Select value={newWP.costCodeId} onValueChange={(v) => setNewWP({...newWP, costCodeId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost code" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCodes.map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="criticalPath"
                  checked={newWP.isCriticalPath}
                  onChange={(e) => setNewWP({...newWP, isCriticalPath: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="criticalPath" className="cursor-pointer">
                  Critical Path Item
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Work Package
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
                <p className="text-sm text-slate-500">Total Work Packages</p>
                <p className="text-2xl font-bold">{filteredWPs.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <PoundSterling className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
              </div>
              <PoundSterling className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Progress</p>
                <p className="text-2xl font-bold">{avgProgress.toFixed(0)}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search work packages..."
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PLANNED">Planned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Work Packages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredWPs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No work packages found</h3>
            <p className="text-slate-500 mt-1">Create your first work package to get started</p>
            <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWPs.map(wp => (
            <Card key={wp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={statusColors[wp.status]}>
                        {wp.status.replace('_', ' ')}
                      </Badge>
                      {wp.isCriticalPath && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Critical Path
                        </Badge>
                      )}
                      <span className="text-sm text-slate-500">WP-{wp.number}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {wp.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {wp.project.name}
                      {wp.responsibleParty && ` • ${wp.responsibleParty.name}`}
                      {wp.costCode && ` • ${wp.costCode.code}`}
                    </p>
                    {wp.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {wp.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-6 lg:gap-8">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Budget</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(wp.budgetAmount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Spent: {formatCurrency(wp.actualAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Schedule</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {wp.plannedStartDate ? format(new Date(wp.plannedStartDate), 'dd MMM') : '-'}
                        {' - '}
                        {wp.plannedEndDate ? format(new Date(wp.plannedEndDate), 'dd MMM') : '-'}
                      </p>
                    </div>
                    <div className="w-32">
                      <p className="text-xs text-slate-500 mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={wp.percentComplete} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{wp.percentComplete}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Tasks</p>
                      <p className="text-sm font-medium">{wp._count.tasks}</p>
                    </div>
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
