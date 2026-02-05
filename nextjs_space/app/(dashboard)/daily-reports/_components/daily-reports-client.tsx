'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  CloudLightning,
  Users,
  AlertTriangle,
  ChevronRight
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
import { FileUpload } from '@/components/ui/file-upload';
import { Camera } from 'lucide-react';

type WeatherCondition = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'STORMY' | 'SNOWY' | 'WINDY';

interface Photo {
  id?: string;
  name: string;
  cloud_storage_path?: string;
  cloudStoragePath?: string;
  caption?: string;
  isUploading?: boolean;
}

interface DailyReport {
  id: string;
  reportDate: string;
  weather: WeatherCondition;
  temperature?: number;
  workPerformed?: string;
  materialsUsed?: string;
  equipmentUsed?: string;
  visitors?: string;
  delays?: string;
  safetyNotes?: string;
  manpowerCount: number;
  project: { id: string; name: string };
  createdBy: { id: string; name: string };
  photos: { id: string; caption?: string; cloudStoragePath: string }[];
}

interface DailyReportsClientProps {
  initialReports: DailyReport[];
  projects: { id: string; name: string }[];
}

const weatherIcons: Record<WeatherCondition, React.ReactNode> = {
  SUNNY: <Sun className="w-5 h-5 text-yellow-500" />,
  CLOUDY: <Cloud className="w-5 h-5 text-gray-400" />,
  RAINY: <CloudRain className="w-5 h-5 text-blue-500" />,
  STORMY: <CloudLightning className="w-5 h-5 text-purple-500" />,
  SNOWY: <CloudSnow className="w-5 h-5 text-blue-300" />,
  WINDY: <Wind className="w-5 h-5 text-teal-500" />
};

const weatherLabels: Record<WeatherCondition, string> = {
  SUNNY: 'Sunny',
  CLOUDY: 'Cloudy',
  RAINY: 'Rainy',
  STORMY: 'Stormy',
  SNOWY: 'Snowy',
  WINDY: 'Windy'
};

export function DailyReportsClient({ initialReports, projects }: DailyReportsClientProps) {
  const router = useRouter();
  const [reports, setReports] = useState<DailyReport[]>(initialReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [newReport, setNewReport] = useState({
    projectId: '',
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    weather: 'SUNNY' as WeatherCondition,
    temperature: '',
    workPerformed: '',
    materialsUsed: '',
    equipmentUsed: '',
    visitors: '',
    delays: '',
    safetyNotes: '',
    manpowerCount: ''
  });
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Subscribe to real-time daily report events
  const handleDailyReportEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['daily_report_created', 'daily_report_updated', 'daily_report_deleted'],
    handleDailyReportEvent
  );

  const openDetailModal = (report: DailyReport) => {
    setSelectedReport(report);
    setPhotos(report.photos?.map((p: any) => ({
      id: p.id,
      name: `Photo ${p.id.slice(0, 6)}`,
      cloud_storage_path: p.cloudStoragePath,
      caption: p.caption
    })) || []);
    setShowDetailModal(true);
  };

  const handlePhotoUpload = async (file: Photo) => {
    if (!selectedReport || !file.cloud_storage_path) return;
    try {
      const res = await fetch(`/api/daily-reports/${selectedReport.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path: file.cloud_storage_path,
          caption: file.name
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setPhotos(prev => prev.map(p =>
          p.name === file.name && !p.id ? { ...p, id: saved.id } : p
        ));
        toast.success('Photo added');
      }
    } catch {
      console.error('Failed to save photo:', error);
    }
  };

  const handlePhotoDelete = async (file: Photo) => {
    if (!selectedReport || !file.id) return;
    try {
      await fetch(`/api/daily-reports/${selectedReport.id}/photos?photoId=${file.id}`, {
        method: 'DELETE'
      });
    } catch {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleCreateReport = async () => {
    if (!newReport.projectId || !newReport.reportDate) {
      toast.error('Please select a project and date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReport,
          temperature: newReport.temperature ? parseInt(newReport.temperature) : null,
          manpowerCount: newReport.manpowerCount ? parseInt(newReport.manpowerCount) : 0
        })
      });

      if (res.ok) {
        const created = await res.json();
        setReports([created, ...reports]);
        setShowNewModal(false);
        setNewReport({
          projectId: '',
          reportDate: format(new Date(), 'yyyy-MM-dd'),
          weather: 'SUNNY',
          temperature: '',
          workPerformed: '',
          materialsUsed: '',
          equipmentUsed: '',
          visitors: '',
          delays: '',
          safetyNotes: '',
          manpowerCount: ''
        });
        toast.success('Daily report created successfully');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create report');
      }
    } catch {
      toast.error('Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.workPerformed?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesProject = projectFilter === 'all' || report.project.id === projectFilter;
    return matchesSearch && matchesProject;
  });

  const totalManpower = reports.reduce((sum, r) => sum + r.manpowerCount, 0);
  const avgManpower = reports.length > 0 ? Math.round(totalManpower / reports.length) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-orange-600" />
            Daily Reports
          </h1>
          <p className="text-gray-500 mt-1">Field logs and daily progress tracking</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</div>
            <div className="text-sm text-gray-500">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{avgManpower}</div>
            <div className="text-sm text-gray-500">Avg. Manpower</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.reportDate && new Date(r.reportDate).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-sm text-gray-500">Today\'s Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter(r => r.delays && r.delays.length > 0).length}
            </div>
            <div className="text-sm text-gray-500">Reports with Delays</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No daily reports found</p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetailModal(report)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {format(new Date(report.reportDate), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">{report.project.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        {weatherIcons[report.weather]}
                        <span className="text-sm text-gray-600">{weatherLabels[report.weather]}</span>
                        {report.temperature && (
                          <span className="text-sm text-gray-500">{report.temperature}°F</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{report.manpowerCount}</span>
                      </div>
                      {report.delays && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Delays
                        </Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* New Report Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Daily Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <Select value={newReport.projectId} onValueChange={(v) => setNewReport({ ...newReport, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Report Date *</label>
                <Input
                  type="date"
                  value={newReport.reportDate}
                  onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Weather</label>
                <Select value={newReport.weather} onValueChange={(v) => setNewReport({ ...newReport, weather: v as WeatherCondition })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(weatherLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {weatherIcons[key as WeatherCondition]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Temperature (°F)</label>
                <Input
                  type="number"
                  value={newReport.temperature}
                  onChange={(e) => setNewReport({ ...newReport, temperature: e.target.value })}
                  placeholder="e.g., 75"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Manpower Count</label>
                <Input
                  type="number"
                  value={newReport.manpowerCount}
                  onChange={(e) => setNewReport({ ...newReport, manpowerCount: e.target.value })}
                  placeholder="e.g., 25"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Work Performed</label>
              <Textarea
                value={newReport.workPerformed}
                onChange={(e) => setNewReport({ ...newReport, workPerformed: e.target.value })}
                placeholder="Describe work completed today..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Materials Used</label>
                <Textarea
                  value={newReport.materialsUsed}
                  onChange={(e) => setNewReport({ ...newReport, materialsUsed: e.target.value })}
                  placeholder="List materials..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Equipment Used</label>
                <Textarea
                  value={newReport.equipmentUsed}
                  onChange={(e) => setNewReport({ ...newReport, equipmentUsed: e.target.value })}
                  placeholder="List equipment..."
                  rows={2}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Delays / Issues</label>
              <Textarea
                value={newReport.delays}
                onChange={(e) => setNewReport({ ...newReport, delays: e.target.value })}
                placeholder="Note any delays or issues..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Safety Notes</label>
              <Textarea
                value={newReport.safetyNotes}
                onChange={(e) => setNewReport({ ...newReport, safetyNotes: e.target.value })}
                placeholder="Safety observations, toolbox talks, etc."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreateReport} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-orange-600" />
                  {format(new Date(selectedReport.reportDate), 'EEEE, MMMM d, yyyy')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-semibold">{selectedReport.project.name}</div>
                    <div className="text-sm text-gray-500">Created by {selectedReport.createdBy.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {weatherIcons[selectedReport.weather]}
                      <span>{weatherLabels[selectedReport.weather]}</span>
                      {selectedReport.temperature && (
                        <span className="text-gray-500">| {selectedReport.temperature}°F</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{selectedReport.manpowerCount} workers</span>
                    </div>
                  </div>
                </div>

                {selectedReport.workPerformed && (
                  <div>
                    <h4 className="font-medium mb-2">Work Performed</h4>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedReport.workPerformed}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedReport.materialsUsed && (
                    <div>
                      <h4 className="font-medium mb-2">Materials Used</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="whitespace-pre-wrap text-sm">{selectedReport.materialsUsed}</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.equipmentUsed && (
                    <div>
                      <h4 className="font-medium mb-2">Equipment Used</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="whitespace-pre-wrap text-sm">{selectedReport.equipmentUsed}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedReport.delays && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Delays / Issues
                    </h4>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                      <p className="whitespace-pre-wrap">{selectedReport.delays}</p>
                    </div>
                  </div>
                )}

                {selectedReport.safetyNotes && (
                  <div>
                    <h4 className="font-medium mb-2">Safety Notes</h4>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedReport.safetyNotes}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Site Photos
                  </h4>
                  <FileUpload
                    files={photos}
                    onFilesChange={setPhotos}
                    onUploadComplete={handlePhotoUpload}
                    onDelete={handlePhotoDelete}
                    maxFiles={20}
                    maxSize={25}
                    accept="image/*"
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
