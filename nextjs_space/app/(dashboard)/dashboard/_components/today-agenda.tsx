"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isBefore, _differenceInDays } from "date-fns";
import {
  Calendar, Clock, ListTodo, Users, ClipboardCheck, Shield, Target,
  AlertTriangle, ChevronRight, Loader2, FileQuestion, RefreshCw,
  HardHat, Wrench, MessageSquare, FileText, Send, AlertCircle,
  CheckCircle2, XCircle, Flame, TrendingUp, Clock4, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import Link from "next/link";

interface AgendaItem {
  id: string;
  type: "task" | "meeting" | "inspection" | "toolbox_talk" | "milestone" | "permit_expiring" | "rfi" | "submittal" | "daily_report" | "safety_incident";
  title: string;
  time?: Date | string;
  project?: { id: string; name: string };
  priority?: string;
  status?: string;
  assignee?: string;
  organizer?: string;
  presenter?: string;
  location?: string;
  inspector?: string;
  topic?: string;
  attendeeCount?: number;
  isOverdue?: boolean;
  isPending?: boolean;
  permitNumber?: string;
  submitter?: string;
  assignedTo?: string;
  severity?: string;
  reportedBy?: string;
}

interface AgendaSummary {
  tasksDue: number;
  overdueTaskCount: number;
  meetings: number;
  inspections: number;
  overdueInspections: number;
  toolboxTalks: number;
  overdueMilestones: number;
  permitsExpiring: number;
  mewpChecksCompleted: number;
  toolChecksCompleted: number;
  checksWithIssues: number;
  openRFIs: number;
  overdueRFIs: number;
  pendingSubmittals: number;
  overdueSubmittals: number;
  dailyReportsPending: number;
  safetyIncidents: number;
  criticalIncidents: number;
  totalUrgentItems: number;
}

const typeIcons: Record<string, React.ElementType> = {
  task: ListTodo,
  meeting: Users,
  inspection: ClipboardCheck,
  toolbox_talk: MessageSquare,
  milestone: Target,
  permit_expiring: AlertTriangle,
  rfi: FileQuestion,
  submittal: Send,
  daily_report: FileText,
  safety_incident: Shield
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  task: { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-200 dark:border-blue-800" },
  meeting: { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-200 dark:border-purple-800" },
  inspection: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-200 dark:border-orange-800" },
  toolbox_talk: { bg: "bg-green-500", text: "text-green-500", border: "border-green-200 dark:border-green-800" },
  milestone: { bg: "bg-pink-500", text: "text-pink-500", border: "border-pink-200 dark:border-pink-800" },
  permit_expiring: { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-200 dark:border-amber-800" },
  rfi: { bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-200 dark:border-indigo-800" },
  submittal: { bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-200 dark:border-cyan-800" },
  daily_report: { bg: "bg-slate-500", text: "text-slate-500", border: "border-slate-200 dark:border-slate-700" },
  safety_incident: { bg: "bg-red-500", text: "text-red-500", border: "border-red-200 dark:border-red-800" }
};

const typeLabels: Record<string, string> = {
  task: "Task",
  meeting: "Meeting",
  inspection: "Inspection",
  toolbox_talk: "Toolbox Talk",
  milestone: "Milestone",
  permit_expiring: "Permit",
  rfi: "RFI",
  submittal: "Submittal",
  daily_report: "Report",
  safety_incident: "Safety"
};

export function TodayAgenda() {
  const _router = useRouter();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [summary, setSummary] = useState<AgendaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchAgenda = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/agenda");
      if (!res.ok) throw new Error("Failed to fetch agenda");
      const data = await res.json();
      setAgenda(data.agenda || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Error fetching agenda:", err);
      setError("Failed to load agenda");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  // Real-time updates
  const handleRealtimeEvent = useCallback(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  useRealtimeSubscription(
    [
      "task_created", "task_updated",
      "meeting_recorded",
      "inspection_scheduled",
      "toolbox_talk_created", "toolbox_talk_updated",
      "milestone_created", "milestone_updated",
      "mewp_check_completed", "tool_check_completed",
      "rfi_created", "submittal_created",
      "safety_incident_reported"
    ],
    handleRealtimeEvent,
    []
  );

  const getItemLink = (item: AgendaItem) => {
    switch (item.type) {
      case "task":
        return item.project?.id ? `/projects/${item.project.id}?tab=tasks` : "/tasks";
      case "meeting":
        return `/meetings`;
      case "inspection":
        return item.project?.id ? `/projects/${item.project.id}?tab=inspections` : "/inspections";
      case "toolbox_talk":
        return item.project?.id ? `/projects/${item.project.id}?tab=toolbox-talks` : "/safety";
      case "milestone":
        return item.project?.id ? `/projects/${item.project.id}?tab=milestones` : "/projects";
      case "permit_expiring":
        return item.project?.id ? `/projects/${item.project.id}?tab=permits` : "/permits";
      case "rfi":
        return item.project?.id ? `/projects/${item.project.id}?tab=rfis` : "/rfis";
      case "submittal":
        return item.project?.id ? `/projects/${item.project.id}?tab=submittals` : "/submittals";
      case "daily_report":
        return item.project?.id ? `/projects/${item.project.id}?tab=daily-reports` : "/daily-reports";
      case "safety_incident":
        return item.project?.id ? `/projects/${item.project.id}?tab=safety` : "/safety";
      default:
        return "#";
    }
  };

  const filteredAgenda = activeFilter 
    ? agenda.filter(item => item.type === activeFilter)
    : agenda;

  const urgentItems = agenda.filter(item => 
    item.isOverdue || 
    item.priority === "CRITICAL" || 
    item.priority === "HIGH" ||
    item.severity === "CRITICAL" ||
    item.severity === "HIGH"
  );

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
      {/* Header with gradient */}
      <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Today's Agenda
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {urgentItems.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Flame className="h-3 w-3 mr-1" />
                {urgentItems.length} Urgent
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={fetchAgenda} className="h-8 w-8 p-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Quick Stats Bar */}
        {summary && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setActiveFilter(activeFilter === "task" ? null : "task")}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                  activeFilter === "task" 
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
                    : "bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <ListTodo className={`h-4 w-4 ${activeFilter === "task" ? "" : "text-blue-500"}`} />
                <div className="text-left">
                  <p className={`text-lg font-bold leading-none ${activeFilter === "task" ? "" : "text-foreground"}`}>
                    {summary.tasksDue}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeFilter === "task" ? "text-blue-100" : "text-muted-foreground"}`}>
                    Tasks{summary.overdueTaskCount > 0 && ` (${summary.overdueTaskCount} late)`}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "meeting" ? null : "meeting")}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                  activeFilter === "meeting" 
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" 
                    : "bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <Users className={`h-4 w-4 ${activeFilter === "meeting" ? "" : "text-purple-500"}`} />
                <div className="text-left">
                  <p className={`text-lg font-bold leading-none ${activeFilter === "meeting" ? "" : "text-foreground"}`}>
                    {summary.meetings}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeFilter === "meeting" ? "text-purple-100" : "text-muted-foreground"}`}>Meetings</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "inspection" ? null : "inspection")}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                  activeFilter === "inspection" 
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25" 
                    : "bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <ClipboardCheck className={`h-4 w-4 ${activeFilter === "inspection" ? "" : "text-orange-500"}`} />
                <div className="text-left">
                  <p className={`text-lg font-bold leading-none ${activeFilter === "inspection" ? "" : "text-foreground"}`}>
                    {summary.inspections}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeFilter === "inspection" ? "text-orange-100" : "text-muted-foreground"}`}>Inspections</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "rfi" ? null : "rfi")}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                  activeFilter === "rfi" 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
                    : "bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <FileQuestion className={`h-4 w-4 ${activeFilter === "rfi" ? "" : "text-indigo-500"}`} />
                <div className="text-left">
                  <p className={`text-lg font-bold leading-none ${activeFilter === "rfi" ? "" : "text-foreground"}`}>
                    {summary.openRFIs}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeFilter === "rfi" ? "text-indigo-100" : "text-muted-foreground"}`}>
                    RFIs{summary.overdueRFIs > 0 && ` (${summary.overdueRFIs} late)`}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "daily_report" ? null : "daily_report")}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                  activeFilter === "daily_report" 
                    ? "bg-slate-600 text-white shadow-lg shadow-slate-500/25" 
                    : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <FileText className={`h-4 w-4 ${activeFilter === "daily_report" ? "" : "text-slate-500"}`} />
                <div className="text-left">
                  <p className={`text-lg font-bold leading-none ${activeFilter === "daily_report" ? "" : "text-foreground"}`}>
                    {summary.dailyReportsPending}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeFilter === "daily_report" ? "text-slate-200" : "text-muted-foreground"}`}>Reports Due</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "safety_incident" ? null : "safety_incident")}
                className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                  activeFilter === "safety_incident" 
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25" 
                    : summary.criticalIncidents > 0
                      ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                      : "bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <Shield className={`h-4 w-4 ${activeFilter === "safety_incident" ? "" : summary.criticalIncidents > 0 ? "text-red-500" : "text-red-500"}`} />
                <div className="text-left">
                  <p className={`text-lg font-bold leading-none ${activeFilter === "safety_incident" ? "" : "text-foreground"}`}>
                    {summary.safetyIncidents}
                  </p>
                  <p className={`text-xs mt-0.5 ${activeFilter === "safety_incident" ? "text-red-100" : "text-muted-foreground"}`}>
                    Safety{summary.criticalIncidents > 0 && ` (${summary.criticalIncidents} critical)`}
                  </p>
                </div>
              </button>
            </div>

            {activeFilter && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Showing: {typeLabels[activeFilter] || activeFilter}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)} className="h-6 text-xs">
                  Clear filter
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Alerts Section */}
        {summary && (summary.overdueMilestones > 0 || summary.checksWithIssues > 0 || summary.permitsExpiring > 0) && (
          <div className="p-4 space-y-2 border-b border-slate-100 dark:border-slate-800">
            {summary.overdueMilestones > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border border-red-200 dark:border-red-900">
                <div className="p-2 rounded-lg bg-red-500 text-white">
                  <Target className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {summary.overdueMilestones} Overdue Milestone{summary.overdueMilestones > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveFilter("milestone")} className="text-red-600">
                  View
                </Button>
              </div>
            )}
            {summary.checksWithIssues > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-900">
                <div className="p-2 rounded-lg bg-amber-500 text-white">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {summary.checksWithIssues} Equipment Check{summary.checksWithIssues > 1 ? "s" : ""} with Issues
                  </p>
                  <p className="text-xs text-muted-foreground">Equipment flagged as unsafe</p>
                </div>
                <Link href="/equipment">
                  <Button variant="ghost" size="sm" className="text-amber-600">View</Button>
                </Link>
              </div>
            )}
            {summary.permitsExpiring > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900">
                <div className="p-2 rounded-lg bg-amber-500 text-white">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {summary.permitsExpiring} Permit{summary.permitsExpiring > 1 ? "s" : ""} Expiring Soon
                  </p>
                  <p className="text-xs text-muted-foreground">Within the next 7 days</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveFilter("permit_expiring")} className="text-amber-600">
                  View
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Agenda Items List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
          {filteredAgenda.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-medium text-foreground">
                {activeFilter ? `No ${typeLabels[activeFilter]?.toLowerCase() || activeFilter}s for today` : "All caught up!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilter ? "Try clearing the filter" : "No items scheduled for today. Enjoy your clear schedule!"}
              </p>
            </div>
          ) : (
            filteredAgenda.map((item) => {
              const Icon = typeIcons[item.type] || Calendar;
              const colors = typeColors[item.type] || typeColors.task;
              const isOverdue = item.isOverdue || (item.time && isBefore(new Date(item.time), new Date()) && item.status !== "COMPLETE" && item.status !== "CLOSED" && item.status !== "APPROVED");
              const isCritical = item.priority === "CRITICAL" || item.severity === "CRITICAL";
              const isHigh = item.priority === "HIGH" || item.severity === "HIGH";

              return (
                <Link key={`${item.type}-${item.id}`} href={getItemLink(item)}>
                  <div className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group ${
                    isOverdue ? "bg-red-50/50 dark:bg-red-950/10" : 
                    isCritical ? "bg-orange-50/50 dark:bg-orange-950/10" : ""
                  }`}>
                    <div className={`p-2.5 rounded-xl ${colors.bg} text-white flex-shrink-0 shadow-lg shadow-${colors.bg.replace('bg-', '')}/20`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isCritical && (
                            <Badge variant="destructive" className="text-xs px-1.5">
                              <Flame className="h-3 w-3 mr-0.5" />Critical
                            </Badge>
                          )}
                          {isHigh && !isCritical && (
                            <Badge variant="warning" className="text-xs px-1.5">High</Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs px-1.5 animate-pulse">
                              <Clock4 className="h-3 w-3 mr-0.5" />Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                        <Badge variant="outline" className={`text-xs ${colors.text} ${colors.border}`}>
                          {typeLabels[item.type]}
                        </Badge>
                        {item.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.time), "HH:mm")}
                          </span>
                        )}
                        {item.project && (
                          <span className="truncate max-w-[150px]">{item.project.name}</span>
                        )}
                        {item.assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.assignee}
                          </span>
                        )}
                        {item.type === "toolbox_talk" && item.attendeeCount !== undefined && (
                          <span>{item.attendeeCount} attendees</span>
                        )}
                        {item.type === "meeting" && item.location && (
                          <span className="truncate">{item.location}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-wrap gap-2">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="text-xs">
                <ListTodo className="h-3.5 w-3.5 mr-1.5" />
                All Tasks
              </Button>
            </Link>
            <Link href="/meetings">
              <Button variant="outline" size="sm" className="text-xs">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Meetings
              </Button>
            </Link>
            <Link href="/daily-reports">
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Daily Reports
              </Button>
            </Link>
            <Link href="/safety">
              <Button variant="outline" size="sm" className="text-xs">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Safety
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
