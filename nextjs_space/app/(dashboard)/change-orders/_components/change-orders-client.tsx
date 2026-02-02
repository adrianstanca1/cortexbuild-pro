'use client';

import { useState } from 'react';
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
  PoundSterling,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Play
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
import { useCallback } from 'react';

type ChangeOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

interface ChangeOrder {
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

interface ChangeOrdersClientProps {
  initialChangeOrders: ChangeOrder[];
  projects: { id: string; name: string; budget?: number }[];
  userRole: string;
}

const statusConfig: Record<ChangeOrderStatus, { color: string; icon: React.ReactNode; label: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-3 h-3" />, label: 'Draft' },
  PENDING_APPROVAL: { color: 'bg-yellow-100 text-yellow-700', icon: <Send className="w-3 h-3" />, label: 'Pending Approval' },
  APPROVED: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Approved' },
  REJECTED: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" />, label: 'Rejected' },
  EXECUTED: { color: 'bg-purple-100 text-purple-700', icon: <Play className="w-3 h-3" />, label: 'Executed' }
};

export function ChangeOrdersClient({ initialChangeOrders, projects, userRole }: ChangeOrdersClientProps) {
  const router = useRouter();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(initialChangeOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCO, setSelectedCO] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCO, setNewCO] = useState({
    title: '',
    description: '',
    projectId: '',
    reason: '',
    costChange: '',
    scheduleChange: ''
  });

  // Subscribe to real-time change order events
  const handleChangeOrderEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['change_order_created', 'change_order_updated', 'change_order_deleted'],
    handleChangeOrderEvent
  );

  const _fetchChangeOrders = async () => {
    try {
      const res = await fetch('/api/change-orders');
      if (res.ok) {
        const data = await res.json();
        setChangeOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch change orders:', error);
    }
  };

  const handleCreateCO = async () => {
    if (!newCO.title || !newCO.projectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCO,
          costChange: parseFloat(newCO.costChange) || 0,
          scheduleChange: newCO.scheduleChange ? parseInt(newCO.scheduleChange) : null
        })
      });

      if (res.ok) {
        const created = await res.json();
        setChangeOrders([created, ...changeOrders]);
        setShowNewModal(false);
        setNewCO({ title: '', description: '', projectId: '', reason: '', costChange: '', scheduleChange: '' });
        toast.success('Change order created successfully');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create change order');
      }
    } catch (error) {
      toast.error('Failed to create change order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCO) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/change-orders/${selectedCO.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setChangeOrders(changeOrders.map(co => co.id === updated.id ? { ...co, ...updated } : co));
        setSelectedCO({ ...selectedCO, ...updated });
        toast.success(`Change order ${newStatus.toLowerCase().replace('_', ' ')}`);
      } else {
        toast.error('Failed to update change order');
      }
    } catch (error) {
      toast.error('Failed to update change order');
    } finally {
      setLoading(false);
    }
  };

  const filteredCOs = changeOrders.filter(co => {
    const matchesSearch = co.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `CO-${co.number}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || co.status === statusFilter;
    const matchesProject = projectFilter === 'all' || co.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter(co => co.status === 'PENDING_APPROVAL').length,
    totalCost: changeOrders.filter(co => co.status === 'APPROVED' || co.status === 'EXECUTED').reduce((sum, co) => sum + co.costChange, 0),
    approved: changeOrders.filter(co => co.status === 'APPROVED' || co.status === 'EXECUTED').length
  };

  const formatCurrencyValue = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const canApprove = ['ADMIN', 'PROJECT_MANAGER'].includes(userRole);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileEdit className="w-7 h-7 text-indigo-600" />
            Change Orders
          </h1>
          <p className="text-gray-500 mt-1">Manage project scope and budget changes</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Change Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div><div className="text-sm text-gray-500">Total COs</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><div className="text-sm text-gray-500">Pending Approval</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{stats.approved}</div><div className="text-sm text-gray-500">Approved</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className={`text-2xl font-bold ${stats.totalCost >= 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrencyValue(stats.totalCost)}</div><div className="text-sm text-gray-500">Net Cost Impact</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search change orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
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

      {/* Change Orders List */}
      <div className="space-y-3">
        {filteredCOs.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><FileEdit className="w-12 h-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No change orders found</p></CardContent></Card>
        ) : (
          filteredCOs.map((co, index) => (
            <motion.div key={co.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedCO(co); setShowDetailModal(true); }}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-indigo-600">CO-{String(co.number).padStart(3, '0')}</span>
                        <Badge className={statusConfig[co.status].color}>{statusConfig[co.status].icon}<span className="ml-1">{statusConfig[co.status].label}</span></Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{co.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{co.project.name}</span>
                        <span>•</span>
                        <span className={`flex items-center gap-1 font-medium ${co.costChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {co.costChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatCurrencyValue(Math.abs(co.costChange))}
                        </span>
                        {co.scheduleChange && (
                          <><span>•</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{co.scheduleChange > 0 ? '+' : ''}{co.scheduleChange} days</span></>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(co.createdAt), { addSuffix: true })}</span>
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

      {/* New CO Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create New Change Order</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><label className="text-sm font-medium">Project *</label>
              <Select value={newCO.projectId} onValueChange={(v) => setNewCO({ ...newCO, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Title *</label>
              <Input value={newCO.title} onChange={(e) => setNewCO({ ...newCO, title: e.target.value })} placeholder="Change order title" />
            </div>
            <div><label className="text-sm font-medium">Description</label>
              <Textarea value={newCO.description} onChange={(e) => setNewCO({ ...newCO, description: e.target.value })} placeholder="Detailed description of the change" rows={3} />
            </div>
            <div><label className="text-sm font-medium">Reason</label>
              <Input value={newCO.reason} onChange={(e) => setNewCO({ ...newCO, reason: e.target.value })} placeholder="Reason for change" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Cost Change (£)</label>
                <Input type="number" value={newCO.costChange} onChange={(e) => setNewCO({ ...newCO, costChange: e.target.value })} placeholder="e.g., 5000 or -2000" />
              </div>
              <div><label className="text-sm font-medium">Schedule Change (days)</label>
                <Input type="number" value={newCO.scheduleChange} onChange={(e) => setNewCO({ ...newCO, scheduleChange: e.target.value })} placeholder="e.g., 5 or -3" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreateCO} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">{loading ? 'Creating...' : 'Create Change Order'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CO Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCO && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <span className="font-mono text-indigo-600">CO-{String(selectedCO.number).padStart(3, '0')}</span>
                    <Badge className={statusConfig[selectedCO.status].color}>{statusConfig[selectedCO.status].label}</Badge>
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div><h3 className="font-semibold text-lg">{selectedCO.title}</h3><p className="text-sm text-gray-500 mt-1">{selectedCO.project.name}</p></div>
                
                {/* Cost & Schedule Impact */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Cost Impact</div>
                    <div className={`text-xl font-bold flex items-center gap-2 ${selectedCO.costChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedCO.costChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {formatCurrencyValue(Math.abs(selectedCO.costChange))}
                    </div>
                  </div>
                  {selectedCO.scheduleChange !== null && selectedCO.scheduleChange !== undefined && (
                    <div>
                      <div className="text-sm text-gray-500">Schedule Impact</div>
                      <div className={`text-xl font-bold flex items-center gap-2 ${selectedCO.scheduleChange > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        <Calendar className="w-5 h-5" />
                        {selectedCO.scheduleChange > 0 ? '+' : ''}{selectedCO.scheduleChange} days
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget Impact */}
                {(selectedCO.originalBudget !== null || selectedCO.revisedBudget !== null) && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Budget Impact</h4>
                    <div className="flex items-center justify-between">
                      <div><div className="text-sm text-gray-500">Original Budget</div><div className="font-semibold">{formatCurrencyValue(selectedCO.originalBudget || 0)}</div></div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      <div><div className="text-sm text-gray-500">Revised Budget</div><div className="font-semibold">{formatCurrencyValue(selectedCO.revisedBudget || 0)}</div></div>
                    </div>
                  </div>
                )}

                {selectedCO.description && (<div className="border-t pt-4"><h4 className="font-medium mb-2">Description</h4><p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedCO.description}</p></div>)}
                {selectedCO.reason && (<div><h4 className="font-medium mb-2">Reason</h4><p className="text-gray-600 dark:text-gray-300">{selectedCO.reason}</p></div>)}
                
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div><span className="text-gray-500">Requested By:</span><span className="ml-2 font-medium">{selectedCO.requestedBy.name}</span></div>
                  {selectedCO.approvedBy && (<div><span className="text-gray-500">Approved By:</span><span className="ml-2 font-medium">{selectedCO.approvedBy.name}</span></div>)}
                  {selectedCO.approvedAt && (<div><span className="text-gray-500">Approved:</span><span className="ml-2 font-medium">{format(new Date(selectedCO.approvedAt), 'MMM d, yyyy')}</span></div>)}
                  {selectedCO.executedAt && (<div><span className="text-gray-500">Executed:</span><span className="ml-2 font-medium">{format(new Date(selectedCO.executedAt), 'MMM d, yyyy')}</span></div>)}
                </div>

                {/* Actions based on status */}
                {selectedCO.status === 'DRAFT' && (
                  <div className="flex justify-end pt-4 border-t"><Button onClick={() => handleStatusChange('PENDING_APPROVAL')} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700"><Send className="w-4 h-4 mr-2" />Submit for Approval</Button></div>
                )}
                {selectedCO.status === 'PENDING_APPROVAL' && canApprove && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleStatusChange('REJECTED')} disabled={loading}><XCircle className="w-4 h-4 mr-2" />Reject</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('APPROVED')} disabled={loading}><CheckCircle className="w-4 h-4 mr-2" />Approve</Button>
                  </div>
                )}
                {selectedCO.status === 'APPROVED' && (
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
