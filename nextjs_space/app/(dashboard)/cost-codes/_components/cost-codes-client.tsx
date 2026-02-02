'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Coins, Plus, Search, ChevronRight, ChevronDown, FolderTree,
  Loader2, Package, PoundSterling
} from 'lucide-react';
import { toast } from 'sonner';

interface CostCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: number;
  category: string;
  budgetAmount: number;
  committedAmount: number;
  actualAmount: number;
  isActive: boolean;
  parent: { id: string; code: string; name: string } | null;
  children: Array<{ id: string; code: string; name: string; level: number }>;
  _count: { workPackages: number; costItems: number; budgetLines: number };
}

interface Props {
  initialCostCodes: CostCode[];
}

const categoryColors: Record<string, string> = {
  LABOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MATERIALS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EQUIPMENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SUBCONTRACTOR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PERMITS: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  INSURANCE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  OVERHEAD: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  CONTINGENCY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
};

export function CostCodesClient({ initialCostCodes }: Props) {
  const [costCodes, setCostCodes] = useState<CostCode[]>(initialCostCodes);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const [newCode, setNewCode] = useState({
    code: '',
    name: '',
    description: '',
    parentId: '',
    category: 'OTHER',
    budgetAmount: ''
  });

  const topLevelCodes = costCodes.filter(cc => !cc.parent);

  const handleCreate = async () => {
    if (!newCode.code || !newCode.name) {
      toast.error('Code and name are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/cost-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCode,
          budgetAmount: parseFloat(newCode.budgetAmount) || 0,
          parentId: newCode.parentId || null
        })
      });

      if (!response.ok) throw new Error('Failed to create');
      const created = await response.json();
      
      setCostCodes([...costCodes, created]);
      toast.success('Cost code created successfully');
      setShowNewDialog(false);
      setNewCode({
        code: '',
        name: '',
        description: '',
        parentId: '',
        category: 'OTHER',
        budgetAmount: ''
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create cost code');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCodes(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const renderCostCode = (cc: CostCode, depth: number = 0) => {
    const children = costCodes.filter(c => c.parent?.id === cc.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCodes.has(cc.id);
    const variance = cc.budgetAmount - cc.actualAmount;
    const variancePercent = cc.budgetAmount > 0 ? (variance / cc.budgetAmount) * 100 : 0;

    if (searchQuery && !cc.code.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !cc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }

    return (
      <div key={cc.id}>
        <div 
          className={`flex items-center gap-4 py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <button
            onClick={() => hasChildren && toggleExpand(cc.id)}
            className={`w-6 h-6 flex items-center justify-center ${hasChildren ? 'cursor-pointer' : ''}`}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                {cc.code}
              </span>
              <span className="text-slate-700 dark:text-slate-300">{cc.name}</span>
              <Badge className={categoryColors[cc.category] || categoryColors.OTHER}>
                {cc.category}
              </Badge>
              {!cc.isActive && (
                <Badge variant="outline" className="text-slate-400">Inactive</Badge>
              )}
            </div>
            {cc.description && (
              <p className="text-sm text-slate-500 mt-0.5 truncate">{cc.description}</p>
            )}
          </div>

          <div className="flex items-center gap-8 text-sm">
            <div className="text-right">
              <p className="text-slate-500">Budget</p>
              <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(cc.budgetAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Actual</p>
              <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(cc.actualAmount)}</p>
            </div>
            <div className="text-right w-24">
              <p className="text-slate-500">Variance</p>
              <p className={`font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variancePercent.toFixed(1)}%
              </p>
            </div>
            <div className="text-right text-slate-500">
              <p>{cc._count.workPackages} WPs</p>
              <p>{cc._count.costItems} Items</p>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderCostCode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalBudget = costCodes.reduce((sum, cc) => sum + (cc.level === 1 ? cc.budgetAmount : 0), 0);
  const totalActual = costCodes.reduce((sum, cc) => sum + (cc.level === 1 ? cc.actualAmount : 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            Cost Code Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Hierarchical cost code structure for budget management
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Cost Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Cost Code</DialogTitle>
              <DialogDescription>
                Add a new cost code to your organization library
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input 
                    value={newCode.code}
                    onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                    placeholder="e.g., 01.01"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={newCode.name}
                    onChange={(e) => setNewCode({...newCode, name: e.target.value})}
                    placeholder="e.g., Concrete Works"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={newCode.description}
                  onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent Code</Label>
                  <Select value={newCode.parentId} onValueChange={(v) => setNewCode({...newCode, parentId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {costCodes.filter(cc => cc.level < 3).map(cc => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.code} - {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCode.category} onValueChange={(v) => setNewCode({...newCode, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LABOR">Labor</SelectItem>
                      <SelectItem value="MATERIALS">Materials</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="SUBCONTRACTOR">Subcontractor</SelectItem>
                      <SelectItem value="PERMITS">Permits</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                      <SelectItem value="OVERHEAD">Overhead</SelectItem>
                      <SelectItem value="CONTINGENCY">Contingency</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Budget (£)</Label>
                <Input 
                  type="number"
                  value={newCode.budgetAmount}
                  onChange={(e) => setNewCode({...newCode, budgetAmount: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Cost Code
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
                <p className="text-sm text-slate-500">Total Cost Codes</p>
                <p className="text-2xl font-bold">{costCodes.length}</p>
              </div>
              <FolderTree className="h-8 w-8 text-primary opacity-50" />
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
                <p className="text-sm text-slate-500">Total Actual</p>
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
                <p className="text-sm text-slate-500">Linked Work Packages</p>
                <p className="text-2xl font-bold">
                  {costCodes.reduce((sum, cc) => sum + cc._count.workPackages, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search cost codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cost Code Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Cost Code Hierarchy
          </CardTitle>
          <CardDescription>
            Click on codes with children to expand/collapse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topLevelCodes.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No cost codes yet</h3>
              <p className="text-slate-500 mt-1">Create your first cost code to get started</p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Cost Code
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topLevelCodes.map(cc => renderCostCode(cc))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
