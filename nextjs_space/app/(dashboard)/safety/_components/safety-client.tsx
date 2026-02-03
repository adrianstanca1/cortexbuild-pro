'use client';

import { useState, useCallback } from 'react';
import { format, _formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import {
  ShieldAlert,
  Plus,
  Search,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  ChevronRight,
  _Activity,
  XCircle,
  LayoutGrid,
  List,
  Building2,
  Flame,
  HeartPulse,
  Eye,
  FileText,
  Camera
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
import { FileUpload } from '@/components/ui/file-upload';

type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

interface Photo {
  id?: string;
  name: string;
  cloud_storage_path?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  isUploading?: boolean;
}

interface SafetyIncident {
  id: string;
  incidentDate: string;
  location?: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  injuryOccurred: boolean;
  injuryDescription?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  project: { id: string; name: string };
  reportedBy: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  createdAt: string;
}

interface SafetyClientProps {
  initialIncidents: SafetyIncident[];
  projects: { id: string; name: string }[];
  teamMembers: { id: string; user: { id: string; name: string; email: string } }[];
}

const severityConfig: Record<IncidentSeverity, { color: string; bgColor: string; borderColor: string; label: string; icon: React.ReactNode }> = {
  LOW: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-500', label: 'Low', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  MEDIUM: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', borderColor: 'border-amber-500', label: 'Medium', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  HIGH: { color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', borderColor: 'border-orange-500', label: 'High', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  CRITICAL: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', borderColor: 'border-red-500', label: 'Critical', icon: <Flame className="w-3.5 h-3.5" /> }
};

const statusConfig: Record<IncidentStatus, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  OPEN: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Open' },
  INVESTIGATING: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: <Eye className="w-3.5 h-3.5" />, label: 'Investigating' },
  RESOLVED: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Resolved' },
  CLOSED: { color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Closed' }
};

export function SafetyClient({ initialIncidents, projects, teamMembers }: SafetyClientProps) {
  const router = useRouter();
  const [incidents, setIncidents] = useState<SafetyIncident[]>(initialIncidents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [loading, setLoading] = useState(false);
  const [newIncident, setNewIncident] = useState({
    projectId: '',
    incidentDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    location: '',
    description: '',
    severity: 'MEDIUM' as IncidentSeverity,
    injuryOccurred: false,
    injuryDescription: '',
    assignedToId: ''
  });
  const [updateData, setUpdateData] = useState({
    status: '',
    rootCause: '',
    correctiveAction: '',
    preventiveAction: ''
  });
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleSafetyEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['safety_incident_reported', 'safety_incident_updated', 'safety_incident_resolved', 'safety_incident_deleted'],
    handleSafetyEvent
  );

  const openDetailModal = (incident: SafetyIncident) => {
    setSelectedIncident(incident);
    setUpdateData({
      status: incident.status,
      rootCause: incident.rootCause || '',
      correctiveAction: incident.correctiveAction || '',
      preventiveAction: incident.preventiveAction || ''
    });
    setPhotos([]);
    setShowDetailModal(true);
    fetchPhotos(incident.id);
  };

  const fetchPhotos = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/safety/${incidentId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.map((p: any) => ({
          id: p.id,
          name: `Photo ${p.id.slice(0, 6)}`,
          cloud_storage_path: p.cloudStoragePath,
          caption: p.caption,
          fileSize: p.fileSize,
          mimeType: p.mimeType
        })));
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const handlePhotoUpload = async (file: Photo) => {
    if (!selectedIncident || !file.cloud_storage_path) return;
    try {
      const res = await fetch(`/api/safety/${selectedIncident.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path: file.cloud_storage_path,
          caption: file.name,
          fileSize: file.fileSize,
          mimeType: file.mimeType
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setPhotos(prev => prev.map(p =>
          p.name === file.name && !p.id ? { ...p, id: saved.id } : p
        ));
        toast.success('Photo added');
      }
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  };

  const handlePhotoDelete = async (file: Photo) => {
    if (!selectedIncident || !file.id) return;
    try {
      await fetch(`/api/safety/${selectedIncident.id}/photos?photoId=${file.id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncident.projectId || !newIncident.description || !newIncident.incidentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      });

      if (res.ok) {
        const created = await res.json();
        setIncidents([created, ...incidents]);
        setShowNewModal(false);
        setNewIncident({
          projectId: '',
          incidentDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          location: '',
          description: '',
          severity: 'MEDIUM',
          injuryOccurred: false,
          injuryDescription: '',
          assignedToId: ''
        });
        toast.success('Safety incident reported');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to report incident');
      }
    } catch (error) {
      toast.error('Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/safety/${selectedIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const updated = await res.json();
        setIncidents(incidents.map(i => i.id === updated.id ? { ...i, ...updated } : i));
        setSelectedIncident({ ...selectedIncident, ...updated });
        toast.success('Incident updated');
      } else {
        toast.error('Failed to update incident');
      }
    } catch (error) {
      toast.error('Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.location?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'OPEN').length,
    investigating: incidents.filter(i => i.status === 'INVESTIGATING').length,
    critical: incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'CLOSED').length,
    withInjury: incidents.filter(i => i.injuryOccurred).length,
    resolved: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/25">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            Safety & Incidents
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage safety incidents across all projects</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/25">
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Incidents</p>
              </div>
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.open}</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 font-medium">Open</p>
              </div>
              <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.investigating}</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Investigating</p>
              </div>
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.critical}</p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">Critical Active</p>
              </div>
              <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.withInjury}</p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">With Injuries</p>
              </div>
              <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
                <HeartPulse className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">Resolved</p>
              </div>
              <div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                  placeholder="Search by description, project, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
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

      {/* Incidents List/Grid */}
      {filteredIncidents.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-4">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No safety incidents found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Great job! No incidents match your filters</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
            <Card
              key={incident.id}
              className={`group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 ${severityConfig[incident.severity].borderColor}`}
              onClick={() => openDetailModal(incident)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={`${severityConfig[incident.severity].bgColor} ${severityConfig[incident.severity].color} border-0`}>
                        {severityConfig[incident.severity].icon}
                        <span className="ml-1">{severityConfig[incident.severity].label}</span>
                      </Badge>
                      <Badge className={`${statusConfig[incident.status].bgColor} ${statusConfig[incident.status].color} border-0`}>
                        {statusConfig[incident.status].icon}
                        <span className="ml-1">{statusConfig[incident.status].label}</span>
                      </Badge>
                      {incident.injuryOccurred && (
                        <Badge className="bg-red-500 text-white border-0">
                          <HeartPulse className="w-3 h-3 mr-1" />
                          Injury Reported
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-900 dark:text-white line-clamp-2 font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {incident.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {incident.project.name}
                      </span>
                      {incident.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {incident.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(incident.incidentDate), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {incident.reportedBy.name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((incident) => (
            <Card
              key={incident.id}
              className={`group border-0 shadow-md hover:shadow-xl transition-all cursor-pointer border-t-4 ${severityConfig[incident.severity].borderColor}`}
              onClick={() => openDetailModal(incident)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`${severityConfig[incident.severity].bgColor} ${severityConfig[incident.severity].color} border-0`}>
                    {severityConfig[incident.severity].icon}
                    <span className="ml-1">{severityConfig[incident.severity].label}</span>
                  </Badge>
                  <Badge className={`${statusConfig[incident.status].bgColor} ${statusConfig[incident.status].color} border-0`}>
                    {statusConfig[incident.status].label}
                  </Badge>
                </div>
                <p className="text-slate-900 dark:text-white line-clamp-3 font-medium mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {incident.description}
                </p>
                {incident.injuryOccurred && (
                  <Badge className="bg-red-500 text-white border-0 text-xs mb-3">
                    <HeartPulse className="w-3 h-3 mr-1" />Injury
                  </Badge>
                )}
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{incident.project.name}</span>
                  </div>
                  {incident.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{incident.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400">
                    {format(new Date(incident.incidentDate), 'MMM d, yyyy')}
                  </span>
                  <span className="text-xs text-slate-500">{incident.reportedBy.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Incident Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              Report Safety Incident
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project *</label>
                <Select value={newIncident.projectId} onValueChange={(v) => setNewIncident({ ...newIncident, projectId: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date & Time *</label>
                <Input
                  type="datetime-local"
                  className="mt-1.5"
                  value={newIncident.incidentDate}
                  onChange={(e) => setNewIncident({ ...newIncident, incidentDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                <Input
                  className="mt-1.5"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                  placeholder="e.g., 2nd Floor, East Wing"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Severity *</label>
                <Select value={newIncident.severity} onValueChange={(v) => setNewIncident({ ...newIncident, severity: v as IncidentSeverity })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
              <Textarea
                className="mt-1.5"
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="Describe what happened..."
                rows={4}
              />
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIncident.injuryOccurred}
                  onChange={(e) => setNewIncident({ ...newIncident, injuryOccurred: e.target.checked })}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Injury Occurred</span>
              </label>
              {newIncident.injuryOccurred && (
                <Textarea
                  className="mt-3"
                  value={newIncident.injuryDescription}
                  onChange={(e) => setNewIncident({ ...newIncident, injuryDescription: e.target.value })}
                  placeholder="Describe the injury..."
                  rows={2}
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign Investigator</label>
              <Select value={newIncident.assignedToId} onValueChange={(v) => setNewIncident({ ...newIncident, assignedToId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select investigator" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map((tm) => (
                    <SelectItem key={tm.user.id} value={tm.user.id}>{tm.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreateIncident} disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? 'Submitting...' : 'Report Incident'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Incident Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  Safety Incident Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`${severityConfig[selectedIncident.severity].bgColor} ${severityConfig[selectedIncident.severity].color} border-0`}>
                    {severityConfig[selectedIncident.severity].icon}
                    <span className="ml-1">{severityConfig[selectedIncident.severity].label} Severity</span>
                  </Badge>
                  <Badge className={`${statusConfig[selectedIncident.status].bgColor} ${statusConfig[selectedIncident.status].color} border-0`}>
                    {statusConfig[selectedIncident.status].icon}
                    <span className="ml-1">{statusConfig[selectedIncident.status].label}</span>
                  </Badge>
                  {selectedIncident.injuryOccurred && (
                    <Badge className="bg-red-500 text-white border-0">
                      <HeartPulse className="w-3 h-3 mr-1" />
                      Injury Reported
                    </Badge>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Project:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedIncident.project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {format(new Date(selectedIncident.incidentDate), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {selectedIncident.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Location:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{selectedIncident.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Reported By:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedIncident.reportedBy.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    Incident Description
                  </h4>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedIncident.description}</p>
                  </div>
                </div>

                {selectedIncident.injuryDescription && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-red-500" />
                      Injury Details
                    </h4>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedIncident.injuryDescription}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-5">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-500" />
                    Incident Photos
                  </h4>
                  <FileUpload
                    files={photos}
                    onFilesChange={setPhotos}
                    onUploadComplete={handlePhotoUpload}
                    onDelete={handlePhotoDelete}
                    maxFiles={20}
                    maxSize={25}
                    accept="image/*"
                    disabled={selectedIncident.status === 'CLOSED'}
                  />
                </div>

                {selectedIncident.status !== 'CLOSED' && (
                  <div className="border-t pt-5 space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Investigation & Resolution</h4>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                      <Select value={updateData.status} onValueChange={(v) => setUpdateData({ ...updateData, status: v })}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Root Cause</label>
                      <Textarea
                        className="mt-1.5"
                        value={updateData.rootCause}
                        onChange={(e) => setUpdateData({ ...updateData, rootCause: e.target.value })}
                        placeholder="What caused this incident?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Corrective Action</label>
                      <Textarea
                        className="mt-1.5"
                        value={updateData.correctiveAction}
                        onChange={(e) => setUpdateData({ ...updateData, correctiveAction: e.target.value })}
                        placeholder="What was done to address this?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preventive Action</label>
                      <Textarea
                        className="mt-1.5"
                        value={updateData.preventiveAction}
                        onChange={(e) => setUpdateData({ ...updateData, preventiveAction: e.target.value })}
                        placeholder="How will this be prevented in the future?"
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleUpdateIncident} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? 'Saving...' : 'Update Incident'}
                      </Button>
                    </div>
                  </div>
                )}

                {(selectedIncident.rootCause || selectedIncident.correctiveAction || selectedIncident.preventiveAction) && (
                  <div className="border-t pt-5 space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Investigation Findings</h4>
                    {selectedIncident.rootCause && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Root Cause</h5>
                        <p className="text-slate-600 dark:text-slate-400">{selectedIncident.rootCause}</p>
                      </div>
                    )}
                    {selectedIncident.correctiveAction && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <h5 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Corrective Action</h5>
                        <p className="text-emerald-600 dark:text-emerald-400">{selectedIncident.correctiveAction}</p>
                      </div>
                    )}
                    {selectedIncident.preventiveAction && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Preventive Action</h5>
                        <p className="text-blue-600 dark:text-blue-400">{selectedIncident.preventiveAction}</p>
                      </div>
                    )}
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
