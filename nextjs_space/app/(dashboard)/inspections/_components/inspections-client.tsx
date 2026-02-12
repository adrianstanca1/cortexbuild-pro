'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
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

interface Inspection {
  id: string;
  number: number;
  title: string;
  inspectionType: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'REQUIRES_REINSPECTION';
  scheduledDate?: string;
  completedDate?: string;
  inspectorName?: string;
  inspectorCompany?: string;
  project: { id: string; name: string };
  requestedBy: { id: string; name: string };
  _count: { checklistItems: number; photos: number };
}

interface InspectionsClientProps {
  inspections: Inspection[];
  projects: { id: string; name: string }[];
}

const statusConfig = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: ClipboardList },
  PASSED: { label: 'Passed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  REQUIRES_REINSPECTION: { label: 'Re-inspection', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
};

const inspectionTypes = [
  'Foundation', 'Framing', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Insulation', 'Drywall', 'Fire Safety', 'Final'
];

export function InspectionsClient({ inspections, projects }: InspectionsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newInspection, setNewInspection] = useState({
    projectId: '',
    title: '',
    inspectionType: '',
    scheduledDate: '',
    inspectorName: '',
    inspectorCompany: '',
    description: ''
  });

  // Subscribe to real-time events
  const handleInspectionEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['inspection_scheduled', 'inspection_updated', 'inspection_passed', 'inspection_failed', 'inspection_deleted'],
    handleInspectionEvent
  );

  const filteredInspections = inspections.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.inspectionType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!newInspection.projectId || !newInspection.title || !newInspection.inspectionType) {
      toast.error('Project, title, and inspection type are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInspection)
      });

      if (!res.ok) throw new Error('Failed to schedule inspection');

      toast.success('Inspection scheduled');
      setShowNewModal(false);
      setNewInspection({ projectId: '', title: '', inspectionType: '', scheduledDate: '', inspectorName: '', inspectorCompany: '', description: '' });
      router.refresh();
    } catch (error) {
      toast.error('Failed to schedule inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/inspections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success('Inspection status updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const stats = {
    total: inspections.length,
    scheduled: inspections.filter(i => i.status === 'SCHEDULED').length,
    passed: inspections.filter(i => i.status === 'PASSED').length,
    failed: inspections.filter(i => i.status === 'FAILED' || i.status === 'REQUIRES_REINSPECTION').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-600">Schedule and track quality inspections</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} variant="accent">
          <Plus className="h-4 w-4 mr-2" /> Schedule Inspection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <div className="text-sm text-blue-600">Scheduled</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-green-600">Passed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-600">Failed/Re-inspect</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="PASSED">Passed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REQUIRES_REINSPECTION">Re-inspection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No inspections found</p>
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map((inspection, index) => {
            const StatusIcon = statusConfig[inspection.status].icon;
            return (
              <motion.div
                key={inspection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-gray-500">#{inspection.number}</span>
                          <Badge className={statusConfig[inspection.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[inspection.status].label}
                          </Badge>
                          <Badge variant="outline">{inspection.inspectionType}</Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900">{inspection.title}</h3>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" /> {inspection.project.name}
                          </span>
                          {inspection.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" /> {format(new Date(inspection.scheduledDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          {inspection.inspectorName && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" /> {inspection.inspectorName}
                              {inspection.inspectorCompany && ` (${inspection.inspectorCompany})`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {inspection.status === 'SCHEDULED' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(inspection.id, 'IN_PROGRESS')}>
                            Start
                          </Button>
                        )}
                        {inspection.status === 'IN_PROGRESS' && (
                          <>
                            <Button size="sm" variant="default" onClick={() => handleStatusUpdate(inspection.id, 'PASSED')}>
                              Pass
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(inspection.id, 'FAILED')}>
                              Fail
                            </Button>
                          </>
                        )}
                        {inspection.status === 'FAILED' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(inspection.id, 'REQUIRES_REINSPECTION')}>
                            Schedule Re-inspection
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* New Inspection Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project *</label>
              <Select value={newInspection.projectId} onValueChange={(v) => setNewInspection({ ...newInspection, projectId: v })}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  value={newInspection.title}
                  onChange={(e) => setNewInspection({ ...newInspection, title: e.target.value })}
                  placeholder="e.g., Foundation Inspection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <Select value={newInspection.inspectionType} onValueChange={(v) => setNewInspection({ ...newInspection, inspectionType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectionTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <Input
                type="datetime-local"
                value={newInspection.scheduledDate}
                onChange={(e) => setNewInspection({ ...newInspection, scheduledDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Inspector Name</label>
                <Input
                  value={newInspection.inspectorName}
                  onChange={(e) => setNewInspection({ ...newInspection, inspectorName: e.target.value })}
                  placeholder="Inspector name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Inspector Company</label>
                <Input
                  value={newInspection.inspectorCompany}
                  onChange={(e) => setNewInspection({ ...newInspection, inspectorCompany: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newInspection.description}
                onChange={(e) => setNewInspection({ ...newInspection, description: e.target.value })}
                placeholder="Additional details"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
