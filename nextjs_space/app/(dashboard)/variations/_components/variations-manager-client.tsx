'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FileEdit,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Play,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import { useRouter } from 'next/navigation';

type ChangeOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

interface Variation {
  id: string;
  number: number;
  title: string;
  description?: string;
  status: ChangeOrderStatus;
  reason?: string;
  costChange: number;
  scheduleChange?: number;
  originalBudget?: number;
  revisedBudget?: number;
  projectId: string;
  project: { id: string; name: string; budget?: number };
  requestedBy: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string };
  approvedAt?: string;
  executedAt?: string;
  createdAt: string;
}

interface VariationsManagerClientProps {
  initialVariations: Variation[];
  projects: { id: string; name: string; budget?: number }[];
  userRole: string;
}

const statusConfig: Record<ChangeOrderStatus, { color: string; icon: React.ReactNode; label: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-3 h-3" />, label: 'Draft' },
  PENDING_APPROVAL: { color: 'bg-yellow-100 text-yellow-700', icon: <Send className="w-3 h-3" />, label: 'Pending' },
  APPROVED: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Approved' },
  REJECTED: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" />, label: 'Rejected' },
  EXECUTED: { color: 'bg-purple-100 text-purple-700', icon: <Play className="w-3 h-3" />, label: 'Executed' }
};

export function VariationsManagerClient({ initialVariations, projects, userRole }: VariationsManagerClientProps) {
  const router = useRouter();
  const [variations, setVariations] = useState<Variation[]>(initialVariations);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newVariation, setNewVariation] = useState({
    title: '',
    description: '',
    projectId: '',
    reason: '',
    costChange: '',
    scheduleChange: ''
  });

  // Subscribe to real-time variation events
  const handleVariationEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['change_order_created', 'change_order_updated', 'change_order_deleted'],
    handleVariationEvent
  );

  const fetchVariations = async () => {
    try {
      const res = await fetch('/api/change-orders');
      if (res.ok) {
        const data = await res.json();
        setVariations(data);
      }
    } catch (error) {
      console.error('Failed to fetch variations:', error);
    }
  };

  const handleCreateVariation = async () => {
    if (!newVariation.title || !newVariation.projectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVariation,
          costChange: parseFloat(newVariation.costChange) || 0,
          scheduleChange: newVariation.scheduleChange ? parseInt(newVariation.scheduleChange) : null
        })
      });

      if (res.ok) {
        const created = await res.json();
        setVariations([created, ...variations]);
        setShowNewModal(false);
        setNewVariation({ title: '', description: '', projectId: '', reason: '', costChange: '', scheduleChange: '' });
        toast.success('Variation created successfully');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create variation');
      }
    } catch (error) {
      toast.error('Failed to create variation');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedVariation) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/change-orders/${selectedVariation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setVariations(variations.map(v => v.id === updated.id ? { ...v, ...updated } : v));
        setSelectedVariation({ ...selectedVariation, ...updated });
        toast.success(`Variation ${newStatus.toLowerCase().replace('_', ' ')}`);
      } else {
        toast.error('Failed to update variation');
      }
    } catch (error) {
      toast.error('Failed to update variation');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const url = projectFilter !== 'all'
        ? `/api/variations/export?format=csv&projectId=${projectFilter}`
        : '/api/variations/export?format=csv';

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `variations-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('Variations report downloaded');
      } else {
        toast.error('Failed to export variations');
      }
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const filteredVariations = variations.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `VAR-${v.number}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesProject = projectFilter === 'all' || v.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const stats = {
    total: variations.length,
    pending: variations.filter(v => v.status === 'PENDING_APPROVAL').length,
    totalValue: variations.filter(v => v.status === 'APPROVED' || v.status === 'EXECUTED').reduce((sum, v) => sum + v.costChange, 0),
    approved: variations.filter(v => v.status === 'APPROVED' || v.status === 'EXECUTED').length
  };

  const formatCurrencyValue = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const canApprove = ['ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileEdit className="w-7 h-7 text-indigo-600" />
            Variations Manager
          </h1>
          <p className="text-gray-500 mt-1">Manage project variations and change orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportCSV()} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => setShowNewModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Variation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div><div className="text-sm text-gray-500">Total</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><div className="text-sm text-gray-500">Pending</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{stats.approved}</div><div className="text-sm text-gray-500">Approved</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{formatCurrencyValue(stats.totalValue)}</div><div className="text-sm text-gray-500">Total Value</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-gray-600">{variations.length > 0 ? (stats.totalValue / variations.length).toFixed(0) : 0}</div><div className="text-sm text-gray-500">Avg Value</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search variations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXECUTED">Executed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Variations List */}
      <div className="space-y-3">
        {filteredVariations.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><FileEdit className="w-12 h-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No variations found</p></CardContent></Card>
        ) : (
          filteredVariations.map((v, index) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedVariation(v); setShowDetailModal(true); }}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-indigo-600">VAR-{String(v.number).padStart(3, '0')}</span>
                        <Badge className={statusConfig[v.status].color}>{statusConfig[v.status].icon}<span className="ml-1">{statusConfig[v.status].label}</span></Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{v.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{v.project.name}</span>
                        <span>•</span>
                        <span className={`flex items-center gap-1 font-medium ${v.costChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {v.costChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatCurrencyValue(Math.abs(v.costChange))}
                        </span>
                        {v.scheduleChange && (
                          <><span>•</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{v.scheduleChange > 0 ? '+' : ''}{v.scheduleChange} days</span></>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* New Variation Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create New Variation</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><label className="text-sm font-medium">Project *</label>
              <Select value={newVariation.projectId} onValueChange={(v) => setNewVariation({ ...newVariation, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Title *</label>
              <Input value={newVariation.title} onChange={(e) => setNewVariation({ ...newVariation, title: e.target.value })} placeholder="Variation title" />
            </div>
            <div><label className="text-sm font-medium">Description</label>
              <Textarea value={newVariation.description} onChange={(e) => setNewVariation({ ...newVariation, description: e.target.value })} placeholder="Detailed description of the variation" rows={3} />
            </div>
            <div><label className="text-sm font-medium">Reason</label>
              <Input value={newVariation.reason} onChange={(e) => setNewVariation({ ...newVariation, reason: e.target.value })} placeholder="Reason for variation" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Cost Change (</label>
                <Input type="number" value={newVariation.costChange} onChange={(e) => setNewVariation({ ...newVariation, costChange: e.target.value })} placeholder="e.g., 5000 or -2000" />
              </div>
              <div><label className="text-sm font-medium">Schedule Change (days)</label>
                <Input type="number" value={newVariation.scheduleChange} onChange={(e) => setNewVariation({ ...newVariation, scheduleChange: e.target.value })} placeholder="e.g., 5 or -3" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreateVariation} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">{loading ? 'Creating...' : 'Create Variation'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variation Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedVariation && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <span className="font-mono text-indigo-600">VAR-{String(selectedVariation.number).padStart(3, '0')}</span>
                    <Badge className={statusConfig[selectedVariation.status].color}>{statusConfig[selectedVariation.status].label}</Badge>
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div><h3 className="font-semibold text-lg">{selectedVariation.title}</h3><p className="text-sm text-gray-500 mt-1">{selectedVariation.project.name}</p></div>

                {/* Cost & Schedule Impact */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Cost Impact</div>
                    <div className={`text-xl font-bold flex items-center gap-2 ${selectedVariation.costChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedVariation.costChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {formatCurrencyValue(Math.abs(selectedVariation.costChange))}
                    </div>
                  </div>
                  {selectedVariation.scheduleChange !== null && selectedVariation.scheduleChange !== undefined && (
                    <div>
                      <div className="text-sm text-gray-500">Schedule Impact</div>
                      <div className={`text-xl font-bold flex items-center gap-2 ${selectedVariation.scheduleChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        <Calendar className="w-5 h-5" />
                        {selectedVariation.scheduleChange > 0 ? '+' : ''}{selectedVariation.scheduleChange} days
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget Impact */}
                {(selectedVariation.originalBudget !== null || selectedVariation.revisedBudget !== null) && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Budget Impact</h4>
                    <div className="flex items-center justify-between">
                      <div><div className="text-sm text-gray-500">Original Budget</div><div className="font-semibold">{formatCurrencyValue(selectedVariation.originalBudget || 0)}</div></div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      <div><div className="text-sm text-gray-500">Revised Budget</div><div className="font-semibold">{formatCurrencyValue(selectedVariation.revisedBudget || 0)}</div></div>
                    </div>
                  </div>
                )}

                {selectedVariation.description && (<div className="border-t pt-4"><h4 className="font-medium mb-2">Description</h4><p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedVariation.description}</p></div>)}
                {selectedVariation.reason && (<div><h4 className="font-medium mb-2">Reason</h4><p className="text-gray-600 dark:text-gray-300">{selectedVariation.reason}</p></div>)}

                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div><span className="text-gray-500">Requested By:</span><span className="ml-2 font-medium">{selectedVariation.requestedBy.name}</span></div>
                  {selectedVariation.approvedBy && (<div><span className="text-gray-500">Approved By:</span><span className="ml-2 font-medium">{selectedVariation.approvedBy.name}</span></div>)}
                  {selectedVariation.approvedAt && (<div><span className="text-gray-500">Approved:</span><span className="ml-2 font-medium">{format(new Date(selectedVariation.approvedAt), 'MMM d, yyyy')}</span></div>)}
                  {selectedVariation.executedAt && (<div><span className="text-gray-500">Executed:</span><span className="ml-2 font-medium">{format(new Date(selectedVariation.executedAt), 'MMM d, yyyy')}</span></div>)}
                </div>

                {/* Actions based on status */}
                {selectedVariation.status === 'DRAFT' && (
                  <div className="flex justify-end pt-4 border-t"><Button onClick={() => handleStatusChange('PENDING_APPROVAL')} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700"><Send className="w-4 h-4 mr-2" />Submit for Approval</Button></div>
                )}
                {selectedVariation.status === 'PENDING_APPROVAL' && canApprove && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleStatusChange('REJECTED')} disabled={loading}><XCircle className="w-4 h-4 mr-2" />Reject</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('APPROVED')} disabled={loading}><CheckCircle className="w-4 h-4 mr-2" />Approve</Button>
                  </div>
                )}
                {selectedVariation.status === 'APPROVED' && (
                  <div className="flex justify-end pt-4 border-t"><Button onClick={() => handleStatusChange('EXECUTED')} disabled={loading} className="bg-purple-600 hover:bg-purple-700"><Play className="w-4 h-4 mr-2" />Mark as Executed</Button></div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
