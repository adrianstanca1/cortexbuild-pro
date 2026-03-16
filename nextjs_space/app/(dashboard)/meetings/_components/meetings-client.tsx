'use client';

import { useState, useCallback } from 'react';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import {
  FileText, Plus, Search, Calendar, Clock, Users, CheckSquare,
  MapPin, Loader2, Video, ChevronRight, Filter, LayoutGrid, List,
  AlertCircle, CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  title: string;
  meetingType: 'KICKOFF' | 'PROGRESS' | 'SAFETY' | 'COORDINATION' | 'CLOSEOUT' | 'OTHER';
  meetingDate: string;
  location?: string;
  duration?: number;
  project: { id: string; name: string };
  organizer: { id: string; name: string };
  _count: { attendees: number; actionItems: number };
}

interface MeetingsClientProps {
  meetings: Meeting[];
  projects: { id: string; name: string }[];
}

const meetingTypeConfig = {
  KICKOFF: { 
    label: 'Kickoff', 
    bg: 'bg-purple-100 dark:bg-purple-900/30', 
    text: 'text-purple-700 dark:text-purple-400',
    icon: '🚀'
  },
  PROGRESS: { 
    label: 'Progress', 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-400',
    icon: '📊'
  },
  SAFETY: { 
    label: 'Safety', 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-400',
    icon: '🦺'
  },
  COORDINATION: { 
    label: 'Coordination', 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400',
    icon: '🤝'
  },
  CLOSEOUT: { 
    label: 'Closeout', 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400',
    icon: '✅'
  },
  OTHER: { 
    label: 'Other', 
    bg: 'bg-slate-100 dark:bg-slate-800', 
    text: 'text-slate-700 dark:text-slate-400',
    icon: '📋'
  }
};

export function MeetingsClient({ meetings, projects }: MeetingsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    projectId: '', title: '', meetingType: 'PROGRESS',
    meetingDate: '', location: '', duration: '', summary: ''
  });

  const handleMeetingEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['meeting_recorded', 'meeting_updated', 'meeting_deleted'],
    handleMeetingEvent
  );

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.project.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.meetingType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = async () => {
    if (!newMeeting.projectId || !newMeeting.title || !newMeeting.meetingDate) {
      toast.error('Project, title, and date are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMeeting,
          duration: newMeeting.duration ? parseInt(newMeeting.duration) : null
        })
      });
      if (!res.ok) throw new Error('Failed to record meeting');
      toast.success('Meeting minutes recorded');
      setShowNewModal(false);
      setNewMeeting({ projectId: '', title: '', meetingType: 'PROGRESS', meetingDate: '', location: '', duration: '', summary: '' });
      router.refresh();
    } catch (error) {
      toast.error('Failed to record meeting');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: meetings.length,
    thisWeek: meetings.filter(m => isThisWeek(new Date(m.meetingDate))).length,
    upcoming: meetings.filter(m => !isPast(new Date(m.meetingDate))).length,
    totalActionItems: meetings.reduce((sum, m) => sum + m._count.actionItems, 0),
    totalAttendees: meetings.reduce((sum, m) => sum + m._count.attendees, 0)
  };

  // Group meetings by date
  const upcomingMeetings = filteredMeetings.filter(m => !isPast(new Date(m.meetingDate)));
  const pastMeetings = filteredMeetings.filter(m => isPast(new Date(m.meetingDate)));

  const getMeetingDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEEE, MMM d');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Meetings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Record and track project meetings</p>
        </div>
        <Button 
          onClick={() => setShowNewModal(true)} 
          className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" /> Record Meeting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                <CalendarDays className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Meetings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.thisWeek}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/50">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.upcoming}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/50">
                <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalActionItems}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Action Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalAttendees}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search meetings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="KICKOFF">Kickoff</SelectItem>
                <SelectItem value="PROGRESS">Progress</SelectItem>
                <SelectItem value="SAFETY">Safety</SelectItem>
                <SelectItem value="COORDINATION">Coordination</SelectItem>
                <SelectItem value="CLOSEOUT">Closeout</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No meetings found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Record your first meeting to get started</p>
            <Button onClick={() => setShowNewModal(true)} className="bg-gradient-to-r from-primary to-purple-600">
              <Plus className="h-4 w-4 mr-2" /> Record Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Meetings
              </h2>
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => {
                  const typeConfig = meetingTypeConfig[meeting.meetingType];
                  const meetingDate = new Date(meeting.meetingDate);
                  const isUpcomingToday = isToday(meetingDate);

                  return (
                    <Card 
                      key={meeting.id} 
                      className={`border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all group ${
                        isUpcomingToday ? 'border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="hidden sm:flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl bg-primary/10 text-primary">
                              <span className="text-2xl font-bold">{format(meetingDate, 'd')}</span>
                              <span className="text-xs font-medium">{format(meetingDate, 'MMM')}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className={`${typeConfig.bg} ${typeConfig.text} border-0`}>
                                  <span className="mr-1">{typeConfig.icon}</span>
                                  {typeConfig.label}
                                </Badge>
                                {isUpcomingToday && (
                                  <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                                    Today
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                {meeting.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                  <FileText className="h-3.5 w-3.5" /> {meeting.project.name}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" /> {format(meetingDate, 'h:mm a')}
                                </span>
                                {meeting.location && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" /> {meeting.location}
                                  </span>
                                )}
                                {meeting.duration && (
                                  <span>{meeting.duration} min</span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5" /> {meeting._count.attendees} attendees
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="hidden sm:flex">
                              View Details
                            </Button>
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Past Meetings
              </h2>
              <div className="space-y-3">
                {pastMeetings.slice(0, 10).map((meeting) => {
                  const typeConfig = meetingTypeConfig[meeting.meetingType];
                  const meetingDate = new Date(meeting.meetingDate);

                  return (
                    <Card key={meeting.id} className="border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                              <span className="text-2xl font-bold">{format(meetingDate, 'd')}</span>
                              <span className="text-xs font-medium">{format(meetingDate, 'MMM')}</span>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge className={`${typeConfig.bg} ${typeConfig.text} border-0 text-xs`}>
                                  {typeConfig.label}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                {meeting.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                <span>{meeting.project.name}</span>
                                <span>{meeting._count.attendees} attendees</span>
                                {meeting._count.actionItems > 0 && (
                                  <span className="flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3" /> {meeting._count.actionItems} actions
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Meeting Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Record Meeting Minutes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project *</label>
              <Select value={newMeeting.projectId} onValueChange={(v) => setNewMeeting({ ...newMeeting, projectId: v })}>
                <SelectTrigger className="h-11">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                <Input
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="Meeting title"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                <Select value={newMeeting.meetingType} onValueChange={(v) => setNewMeeting({ ...newMeeting, meetingType: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KICKOFF">🚀 Kickoff</SelectItem>
                    <SelectItem value="PROGRESS">📊 Progress</SelectItem>
                    <SelectItem value="SAFETY">🦺 Safety</SelectItem>
                    <SelectItem value="COORDINATION">🤝 Coordination</SelectItem>
                    <SelectItem value="CLOSEOUT">✅ Closeout</SelectItem>
                    <SelectItem value="OTHER">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date & Time *</label>
              <Input
                type="datetime-local"
                value={newMeeting.meetingDate}
                onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                <Input
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  placeholder="e.g., Conference Room A"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Duration (minutes)</label>
                <Input
                  type="number"
                  value={newMeeting.duration}
                  onChange={(e) => setNewMeeting({ ...newMeeting, duration: e.target.value })}
                  placeholder="60"
                  className="h-11"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Summary</label>
              <Textarea
                value={newMeeting.summary}
                onChange={(e) => setNewMeeting({ ...newMeeting, summary: e.target.value })}
                placeholder="Meeting summary and key decisions"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading} className="bg-gradient-to-r from-primary to-purple-600">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Minutes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
