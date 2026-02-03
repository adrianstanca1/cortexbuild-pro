'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, _formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import {
  ClipboardCheck,
  Plus,
  Search,
  _Filter,
  MapPin,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  _AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, _CardHeader, _CardTitle } from '@/components/ui/card';
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

interface PunchList {
  id: string;
  number: number;
  title: string;
  description?: string;
  location?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  dueDate?: string;
  project: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface PunchListsClientProps {
  punchLists: PunchList[];
  projects: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}

const statusConfig = {
  OPEN: { label: 'Open', color: 'bg-red-100 text-red-800', icon: XCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  VERIFIED: { label: 'Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle2 }
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-800' }
};

export function PunchListsClient({ punchLists, projects, teamMembers }: PunchListsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    projectId: '',
    title: '',
    description: '',
    location: '',
    priority: 'MEDIUM',
    category: '',
    dueDate: '',
    assignedToId: ''
  });

  // Subscribe to real-time events
  const handlePunchListEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['punch_list_created', 'punch_list_updated', 'punch_list_deleted'],
    handlePunchListEvent
  );

  const filteredItems = punchLists.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProject = projectFilter === 'all' || item.project.id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreate = async () => {
    if (!newItem.projectId || !newItem.title) {
      toast.error('Project and title are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/punch-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (!res.ok) throw new Error('Failed to create punch list item');

      toast.success('Punch list item created');
      setShowNewModal(false);
      setNewItem({ projectId: '', title: '', description: '', location: '', priority: 'MEDIUM', category: '', dueDate: '', assignedToId: '' });
      router.refresh();
    } catch (error) {
      toast.error('Failed to create punch list item');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/punch-lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success('Status updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const stats = {
    total: punchLists.length,
    open: punchLists.filter(i => i.status === 'OPEN').length,
    inProgress: punchLists.filter(i => i.status === 'IN_PROGRESS').length,
    completed: punchLists.filter(i => i.status === 'COMPLETED' || i.status === 'VERIFIED').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Punch Lists</h1>
          <p className="text-gray-600">Track items for project closeout</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} variant="accent">
          <Plus className="h-4 w-4 mr-2" /> New Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <div className="text-sm text-red-600">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search punch list items..."
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
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No punch list items found</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item, index) => {
            const StatusIcon = statusConfig[item.status].icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-gray-500">#{item.number}</span>
                          <Badge className={statusConfig[item.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[item.status].label}
                          </Badge>
                          <Badge className={priorityConfig[item.priority].color}>
                            {priorityConfig[item.priority].label}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClipboardCheck className="h-4 w-4" /> {item.project.name}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" /> {item.location}
                            </span>
                          )}
                          {item.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" /> {item.assignedTo.name}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" /> {format(new Date(item.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'OPEN' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, 'IN_PROGRESS')}>
                            Start
                          </Button>
                        )}
                        {item.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, 'COMPLETED')}>
                            Complete
                          </Button>
                        )}
                        {item.status === 'COMPLETED' && (
                          <Button size="sm" variant="default" onClick={() => handleStatusUpdate(item.id, 'VERIFIED')}>
                            Verify
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

      {/* New Item Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Punch List Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project *</label>
              <Select value={newItem.projectId} onValueChange={(v) => setNewItem({ ...newItem, projectId: v })}>
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
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Enter item title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Describe the issue"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  placeholder="e.g., Room 201"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="e.g., Electrical"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select value={newItem.priority} onValueChange={(v) => setNewItem({ ...newItem, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <Input
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <Select value={newItem.assignedToId} onValueChange={(v) => setNewItem({ ...newItem, assignedToId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
