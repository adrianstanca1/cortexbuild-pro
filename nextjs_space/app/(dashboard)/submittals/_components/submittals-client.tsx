'use client';

import { useState, useCallback } from 'react';
import { format, formatDistanceToNow, isPast, addDays, isWithinInterval } from 'date-fns';
import {
  PackageCheck,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Paperclip,
  ArrowRight,
  RefreshCw,
  FileCheck,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  User,
  ChevronRight,
  AlertCircle,
  FileText,
  Timer
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

type SubmittalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISE_RESUBMIT';

interface Submittal {
  id: string;
  number: number;
  title: string;
  description?: string;
  status: SubmittalStatus;
  specSection?: string;
  dueDate?: string;
  submittedAt?: string;
  reviewedAt?: string;
  revisionNumber: number;
  reviewComments?: string;
  projectId: string;
  project: { id: string; name: string };
  submittedBy?: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string; email: string };
  createdAt: string;
  _count: { attachments: number };
}

interface SubmittalsClientProps {
  initialSubmittals: Submittal[];
  projects: { id: string; name: string }[];
  teamMembers: { id: string; user: { id: string; name: string; email: string } }[];
}

const statusConfig: Record<SubmittalStatus, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  DRAFT: { color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800', icon: <Clock className="w-3.5 h-3.5" />, label: 'Draft' },
  SUBMITTED: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: <Send className="w-3.5 h-3.5" />, label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: <Eye className="w-3.5 h-3.5" />, label: 'Under Review' },
  APPROVED: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Approved' },
  REJECTED: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Rejected' },
  REVISE_RESUBMIT: { color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Revise & Resubmit' }
};

export function SubmittalsClient({ initialSubmittals, projects, _teamMembers }: SubmittalsClientProps) {
  const router = useRouter();
  const [submittals, setSubmittals] = useState<Submittal[]>(initialSubmittals);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSubmittal, setNewSubmittal] = useState({
    title: '',
    description: '',
    projectId: '',
    dueDate: '',
    specSection: ''
  });
  const [reviewComment, setReviewComment] = useState('');

  const handleSubmittalEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['submittal_created', 'submittal_updated', 'submittal_deleted'],
    handleSubmittalEvent
  );

  const handleCreateSubmittal = async () => {
    if (!newSubmittal.title || !newSubmittal.projectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/submittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubmittal)
      });

      if (res.ok) {
        const created = await res.json();
        setSubmittals([created, ...submittals]);
        setShowNewModal(false);
        setNewSubmittal({ title: '', description: '', projectId: '', dueDate: '', specSection: '' });
        toast.success('Submittal created successfully');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create submittal');
      }
    } catch (error) {
      toast.error('Failed to create submittal');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedSubmittal) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/submittals/${selectedSubmittal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...(reviewComment && { reviewComments: reviewComment })
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSubmittals(submittals.map(s => s.id === updated.id ? { ...s, ...updated } : s));
        setSelectedSubmittal({ ...selectedSubmittal, ...updated });
        setReviewComment('');
        toast.success(`Submittal ${newStatus.toLowerCase().replace('_', ' ')}`);
      } else {
        toast.error('Failed to update submittal');
      }
    } catch (error) {
      toast.error('Failed to update submittal');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmittals = submittals.filter(submittal => {
    const matchesSearch = submittal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `SUB-${submittal.number}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submittal.status === statusFilter;
    const matchesProject = projectFilter === 'all' || submittal.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const stats = {
    total: submittals.length,
    draft: submittals.filter(s => s.status === 'DRAFT').length,
    pending: submittals.filter(s => ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status)).length,
    approved: submittals.filter(s => s.status === 'APPROVED').length,
    needsRevision: submittals.filter(s => s.status === 'REVISE_RESUBMIT').length,
    rejected: submittals.filter(s => s.status === 'REJECTED').length
  };

  const getUrgencyIndicator = (submittal: Submittal) => {
    if (submittal.status === 'APPROVED' || submittal.status === 'REJECTED') return null;
    if (submittal.dueDate && isPast(new Date(submittal.dueDate))) return 'overdue';
    if (submittal.dueDate && isWithinInterval(new Date(submittal.dueDate), { start: new Date(), end: addDays(new Date(), 3) })) return 'urgent';
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-500/25">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            Submittals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track material and product submittal approvals</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-500/25">
          <Plus className="w-4 h-4 mr-2" />
          New Submittal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total</p>
              </div>
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <PackageCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.draft}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Draft</p>
              </div>
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Pending Review</p>
              </div>
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">Approved</p>
              </div>
              <div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.needsRevision}</p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">Needs Revision</p>
              </div>
              <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 font-medium">Rejected</p>
              </div>
              <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by title or submittal number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="REVISE_RESUBMIT">Revise & Resubmit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submittals List/Grid */}
      {filteredSubmittals.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded-full w-fit mx-auto mb-4">
              <PackageCheck className="w-12 h-12 text-teal-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No submittals found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Get started by creating your first submittal</p>
            <Button onClick={() => setShowNewModal(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" /> Create Submittal
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredSubmittals.map((submittal) => {
            const urgency = getUrgencyIndicator(submittal);
            return (
              <Card
                key={submittal.id}
                className={`group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  urgency === 'overdue' ? 'border-l-4 border-l-red-500' :
                  urgency === 'urgent' ? 'border-l-4 border-l-amber-500' : ''
                }`}
                onClick={() => { setSelectedSubmittal(submittal); setShowDetailModal(true); }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                          SUB-{String(submittal.number).padStart(3, '0')}
                        </span>
                        <Badge className={`${statusConfig[submittal.status].bgColor} ${statusConfig[submittal.status].color} border-0`}>
                          {statusConfig[submittal.status].icon}
                          <span className="ml-1">{statusConfig[submittal.status].label}</span>
                        </Badge>
                        {submittal.revisionNumber > 0 && (
                          <Badge variant="outline" className="text-slate-600 border-slate-300 bg-slate-50 dark:bg-slate-800">
                            Rev {submittal.revisionNumber}
                          </Badge>
                        )}
                        {urgency === 'overdue' && (
                          <Badge className="bg-red-500 text-white border-0">
                            <AlertCircle className="w-3 h-3 mr-1" />Overdue
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {submittal.title}
                      </h3>
                      {submittal.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{submittal.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {submittal.project.name}
                        </span>
                        {submittal.specSection && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Spec: {submittal.specSection}
                          </span>
                        )}
                        {submittal.dueDate && (
                          <span className={`flex items-center gap-1.5 ${urgency === 'overdue' ? 'text-red-500 font-medium' : urgency === 'urgent' ? 'text-amber-500 font-medium' : ''}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            Due {format(new Date(submittal.dueDate), 'MMM d')}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(submittal.createdAt), { addSuffix: true })}
                        </span>
                        {submittal._count.attachments > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5" />{submittal._count.attachments}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmittals.map((submittal) => {
            const urgency = getUrgencyIndicator(submittal);
            return (
              <Card
                key={submittal.id}
                className={`group border-0 shadow-md hover:shadow-xl transition-all cursor-pointer ${
                  urgency === 'overdue' ? 'ring-2 ring-red-500' :
                  urgency === 'urgent' ? 'ring-2 ring-amber-500' : ''
                }`}
                onClick={() => { setSelectedSubmittal(submittal); setShowDetailModal(true); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                      SUB-{String(submittal.number).padStart(3, '0')}
                    </span>
                    <Badge className={`${statusConfig[submittal.status].bgColor} ${statusConfig[submittal.status].color} border-0`}>
                      {statusConfig[submittal.status].label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {submittal.title}
                  </h3>
                  {submittal.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{submittal.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {submittal.revisionNumber > 0 && (
                      <Badge variant="outline" className="text-xs">Rev {submittal.revisionNumber}</Badge>
                    )}
                    {urgency === 'overdue' && (
                      <Badge className="bg-red-500 text-white border-0 text-xs">Overdue</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
                      {submittal.project.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {submittal._count.attachments > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />{submittal._count.attachments}
                        </span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Submittal Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <PackageCheck className="w-5 h-5 text-teal-600" />
              </div>
              Create New Submittal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project *</label>
              <Select value={newSubmittal.projectId} onValueChange={(v) => setNewSubmittal({ ...newSubmittal, projectId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
              <Input
                className="mt-1.5"
                value={newSubmittal.title}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, title: e.target.value })}
                placeholder="Submittal title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Textarea
                className="mt-1.5"
                value={newSubmittal.description}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, description: e.target.value })}
                placeholder="Detailed description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Spec Section</label>
                <Input
                  className="mt-1.5"
                  value={newSubmittal.specSection}
                  onChange={(e) => setNewSubmittal({ ...newSubmittal, specSection: e.target.value })}
                  placeholder="e.g., 08 14 16"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={newSubmittal.dueDate}
                  onChange={(e) => setNewSubmittal({ ...newSubmittal, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreateSubmittal} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                {loading ? 'Creating...' : 'Create Submittal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submittal Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSubmittal && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3">
                    <span className="font-mono text-lg text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded">
                      SUB-{String(selectedSubmittal.number).padStart(3, '0')}
                    </span>
                    <Badge className={`${statusConfig[selectedSubmittal.status].bgColor} ${statusConfig[selectedSubmittal.status].color} border-0`}>
                      {statusConfig[selectedSubmittal.status].label}
                    </Badge>
                    {selectedSubmittal.revisionNumber > 0 && (
                      <Badge variant="outline">Rev {selectedSubmittal.revisionNumber}</Badge>
                    )}
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedSubmittal.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {selectedSubmittal.project.name}
                  </p>
                </div>

                {selectedSubmittal.description && (
                  <div className="border-t pt-5">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedSubmittal.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                  {selectedSubmittal.specSection && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Spec Section:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSubmittal.specSection}</span>
                    </div>
                  )}
                  {selectedSubmittal.dueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Due Date:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{format(new Date(selectedSubmittal.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedSubmittal.submittedBy && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Submitted By:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSubmittal.submittedBy.name}</span>
                    </div>
                  )}
                  {selectedSubmittal.reviewedBy && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Reviewed By:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedSubmittal.reviewedBy.name}</span>
                    </div>
                  )}
                </div>

                {selectedSubmittal.reviewComments && (
                  <div className="border-t pt-5">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Review Comments</h4>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedSubmittal.reviewComments}</p>
                    </div>
                  </div>
                )}

                {/* Actions based on status */}
                {selectedSubmittal.status === 'DRAFT' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => handleStatusChange('SUBMITTED')} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-2" />Submit for Review
                    </Button>
                  </div>
                )}

                {selectedSubmittal.status === 'SUBMITTED' && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleStatusChange('UNDER_REVIEW')} disabled={loading}>
                      <Eye className="w-4 h-4 mr-2" />Start Review
                    </Button>
                  </div>
                )}

                {selectedSubmittal.status === 'UNDER_REVIEW' && (
                  <div className="border-t pt-5 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Review Comments</label>
                      <Textarea
                        className="mt-1.5"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Add review comments..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => handleStatusChange('REVISE_RESUBMIT')} disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-2" />Revise & Resubmit
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleStatusChange('REJECTED')} disabled={loading}>
                        <XCircle className="w-4 h-4 mr-2" />Reject
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange('APPROVED')} disabled={loading}>
                        <CheckCircle className="w-4 h-4 mr-2" />Approve
                      </Button>
                    </div>
                  </div>
                )}

                {selectedSubmittal.status === 'REVISE_RESUBMIT' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => handleStatusChange('SUBMITTED')} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-2" />Resubmit
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
