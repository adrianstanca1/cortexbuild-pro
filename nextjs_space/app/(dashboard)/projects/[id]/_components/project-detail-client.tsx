"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, MapPin, Calendar, PoundSterling, User,
  ListTodo, FileText, Users, Plus, Loader2, CheckCircle, Clock, AlertCircle, Activity, TrendingUp,
  Upload, Download, Eye, Ruler, Image, FileSpreadsheet, File, Brain, BarChart3, Camera,
  ClipboardList, Timer, Wallet, Receipt, Package, HardHat, FileQuestion, Send, FileCheck,
  Shield, PenTool, BookOpen, AlertTriangle, Target, Search, ChevronRight, FolderOpen,
  Milestone, Building2, Hammer, Truck, UserCheck, Scale, LayoutGrid, List,
  FolderClosed, Home, ChevronDown, Minus, CornerDownRight, Gauge, Sparkles, Settings,
  ExternalLink, Network, MoreVertical, Share2, Star, Archive, Copy, Zap,
  PanelLeftClose, PanelLeft, ChevronLeft
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { ProjectIntelligence } from "@/components/ui/project-intelligence";
import { PhotoGallery } from "@/components/ui/photo-gallery";
import { WeatherWidget } from "@/components/ui/weather-widget";
import { ToolboxTalksTab } from "./toolbox-talks-tab";
import { DailyChecksTab } from "./daily-checks-tab";
import { ProjectTimelineTab } from "./project-timeline-tab";
import { RiskAssessmentsTab } from "./risk-assessments-tab";
import { PermitsToWorkTab } from "./permits-to-work-tab";
import { LiftingOperationsTab } from "./lifting-operations-tab";
import { SiteAccessTab } from "./site-access-tab";
import { CertificationsTab } from "./certifications-tab";

interface ProjectDetailClientProps {
  project: any;
  availableTeamMembers: any[];
  currentUserId: string;
  activities?: any[];
  certifications?: any[];
}

const statusColors = {
  PLANNING: "info",
  IN_PROGRESS: "default",
  ON_HOLD: "warning",
  COMPLETED: "success",
  ARCHIVED: "secondary"
} as const;

const taskStatusColors = {
  TODO: "secondary",
  IN_PROGRESS: "info",
  REVIEW: "warning",
  COMPLETE: "success"
} as const;

const priorityColors = {
  LOW: "secondary",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "destructive"
} as const;

// Folder color configurations for each category
const folderColors = {
  "overview": { gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
  "work": { gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  "financial": { gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  "resources": { gradient: "from-pink-500 to-rose-500", bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
  "docs": { gradient: "from-indigo-500 to-blue-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800" },
  "field": { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  "safety": { gradient: "from-red-500 to-rose-500", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
};

// TOP MENU - Overview, Work Management & Field Operations (most frequently used)
const topMenuCategories = [
  {
    id: "overview",
    name: "Overview",
    colorKey: "overview" as const,
    icon: LayoutGrid,
    gradient: "from-violet-500 to-purple-500",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutGrid },
      { id: "intelligence", label: "AI Intelligence", icon: Brain, badge: "AI" },
      { id: "timeline", label: "Timeline", icon: Activity },
    ]
  },
  {
    id: "work",
    name: "Work Management",
    colorKey: "work" as const,
    icon: CheckCircle,
    gradient: "from-blue-500 to-cyan-500",
    items: [
      { id: "tasks", label: "Tasks", icon: CheckCircle },
      { id: "milestones", label: "Milestones", icon: Milestone },
      { id: "time-tracking", label: "Time Tracking", icon: Timer },
    ]
  },
  {
    id: "field",
    name: "Field Operations",
    colorKey: "field" as const,
    icon: ClipboardList,
    gradient: "from-amber-500 to-orange-500",
    items: [
      { id: "site-diary", label: "Site Diary", icon: ClipboardList },
      { id: "inspections", label: "Inspections", icon: Search },
      { id: "toolbox-talks", label: "Toolbox Talks", icon: Users },
      { id: "daily-checks", label: "Daily Checks", icon: ClipboardList },
      { id: "daily-reports", label: "Daily Reports", icon: BookOpen },
      { id: "gallery", label: "Photo Gallery", icon: Camera },
    ]
  },
];

// SIDEBAR - Generic/administrative categories
const featureCategories = [
  {
    id: "financial",
    name: "Financial",
    colorKey: "financial" as const,
    icon: Wallet,
    items: [
      { id: "budget", label: "Budget & Costs", icon: Wallet },
      { id: "progress-claims", label: "Progress Claims", icon: Receipt },
      { id: "change-orders", label: "Change Orders", icon: FileCheck },
    ]
  },
  {
    id: "resources",
    name: "Resources",
    colorKey: "resources" as const,
    icon: Users,
    items: [
      { id: "team", label: "Team", icon: Users },
      { id: "materials", label: "Materials", icon: Package },
      { id: "subcontractors", label: "Subcontractors", icon: HardHat },
    ]
  },
  {
    id: "docs",
    name: "Documentation",
    colorKey: "docs" as const,
    icon: FileText,
    items: [
      { id: "rfis", label: "RFIs", icon: FileQuestion },
      { id: "submittals", label: "Submittals", icon: Send },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "drawings", label: "Drawings", icon: PenTool },
      { id: "permits", label: "Permits", icon: Scale },
      { id: "site-access", label: "Site Access", icon: UserCheck },
      { id: "lifting-ops", label: "Lifting Ops", icon: Truck },
    ]
  },
  {
    id: "safety",
    name: "Quality & Safety",
    colorKey: "safety" as const,
    icon: Shield,
    items: [
      { id: "risk-assessments", label: "Risk Assessments", icon: Shield },
      { id: "permits-to-work", label: "Permits to Work", icon: Scale },
      { id: "defects", label: "Defects", icon: AlertTriangle },
      { id: "punch-lists", label: "Punch Lists", icon: Target },
      { id: "safety", label: "Safety Incidents", icon: AlertCircle },
      { id: "certifications", label: "Certifications", icon: FileCheck },
    ]
  },
];

// Helper: Check if tab is in top menu
const isTopMenuTab = (tabId: string) => {
  return topMenuCategories.some(cat => cat.items.some(item => item.id === tabId));
};

export function ProjectDetailClient({ project, availableTeamMembers, currentUserId, activities = [], certifications = [] }: ProjectDetailClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["overview"]));
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [expandedTopMenu, setExpandedTopMenu] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Toggle top menu folder expansion
  const toggleTopMenuFolder = (folderId: string) => {
    setExpandedTopMenu(prev => prev === folderId ? null : folderId);
  };

  // Get category containing active tab (check both sidebar and top menu)
  const getActiveFolderCategory = () => {
    // Check sidebar categories first
    for (const cat of featureCategories) {
      if (cat.items.some(item => item.id === activeTab)) {
        return cat.id;
      }
    }
    return "overview";
  };
  
  // Get active top menu category
  const getActiveTopMenuCategory = () => {
    for (const cat of topMenuCategories) {
      if (cat.items.some(item => item.id === activeTab)) {
        return cat.id;
      }
    }
    return null;
  };
  
  // Form states
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM", status: "TODO", assigneeId: "", dueDate: "" });
  const [newRfi, setNewRfi] = useState({ subject: "", question: "", assignedToId: "" });
  const [newMilestone, setNewMilestone] = useState({ name: "", description: "", dueDate: "" });
  const [newTimeEntry, setNewTimeEntry] = useState({ description: "", hours: "", date: new Date().toISOString().split('T')[0], taskId: "" });

  // Get counts for badges
  const getCounts = () => ({
    tasks: project?.tasks?.length || 0,
    milestones: project?.milestones?.length || 0,
    rfis: project?.rfis?.length || 0,
    submittals: project?.submittals?.length || 0,
    documents: project?.documents?.length || 0,
    team: project?.teamMembers?.length || 0,
    changeOrders: project?.changeOrders?.length || 0,
    safety: project?.safetyIncidents?.length || 0,
    dailyReports: project?.dailyReports?.length || 0,
    timeEntries: project?.timeEntries?.length || 0,
    materials: project?.materials?.length || 0,
    permits: project?.permits?.length || 0,
    drawings: project?.drawings?.length || 0,
    defects: project?.defects?.length || 0,
    punchLists: project?.punchLists?.length || 0,
    inspections: project?.inspections?.length || 0,
    progressClaims: project?.progressClaims?.length || 0,
    siteDiaries: project?.siteDiaries?.length || 0,
    subcontractors: project?.subcontracts?.length || 0,
    costItems: project?.costItems?.length || 0,
    toolboxTalks: project?.toolboxTalks?.length || 0,
    mewpChecks: project?.mewpChecks?.length || 0,
    toolChecks: project?.toolChecks?.length || 0,
    riskAssessments: project?.riskAssessments?.length || 0,
    hotWorkPermits: project?.hotWorkPermits?.length || 0,
    confinedSpacePermits: project?.confinedSpacePermits?.length || 0,
    liftingOperations: project?.liftingOperations?.length || 0,
    siteAccessLogs: project?.siteAccessLogs?.length || 0,
    certifications: certifications?.length || 0,
  });
  const counts = getCounts();

  const handleCreateTask = async () => {
    if (!newTask.title?.trim()) { toast.error("Task title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, projectId: project?.id ?? "", dueDate: newTask.dueDate || null, assigneeId: newTask.assigneeId || null })
      });
      if (res.ok) {
        toast.success("Task created!");
        setShowNewTaskModal(false);
        setNewTask({ title: "", description: "", priority: "MEDIUM", status: "TODO", assigneeId: "", dueDate: "" });
        router.refresh();
      } else { toast.error("Failed to create task"); }
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); }
  };

  const handleCreateRfi = async () => {
    if (!newRfi.subject?.trim()) { toast.error("Subject is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/rfis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRfi, projectId: project?.id ?? "" })
      });
      if (res.ok) {
        toast.success("RFI created!");
        setShowNewItemModal(false);
        setNewRfi({ subject: "", question: "", assignedToId: "" });
        router.refresh();
      } else { toast.error("Failed to create RFI"); }
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.name?.trim()) { toast.error("Milestone name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMilestone, projectId: project?.id ?? "" })
      });
      if (res.ok) {
        toast.success("Milestone created!");
        setShowNewItemModal(false);
        setNewMilestone({ name: "", description: "", dueDate: "" });
        router.refresh();
      } else { toast.error("Failed to create milestone"); }
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); }
  };

  const handleCreateTimeEntry = async () => {
    if (!newTimeEntry.hours) { toast.error("Hours is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTimeEntry, projectId: project?.id ?? "", hours: parseFloat(newTimeEntry.hours) })
      });
      if (res.ok) {
        toast.success("Time entry created!");
        setShowNewItemModal(false);
        setNewTimeEntry({ description: "", hours: "", date: new Date().toISOString().split('T')[0], taskId: "" });
        router.refresh();
      } else { toast.error("Failed to create time entry"); }
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); }
  };

  const openCreateModal = (type: string) => {
    setModalType(type);
    setShowNewItemModal(true);
  };

  const renderCreateModal = () => {
    switch (modalType) {
      case "rfi":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <Input value={newRfi.subject} onChange={(e) => setNewRfi({ ...newRfi, subject: e.target.value })} placeholder="RFI Subject" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <Textarea value={newRfi.question} onChange={(e) => setNewRfi({ ...newRfi, question: e.target.value })} placeholder="Describe your question..." rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <Select value={newRfi.assignedToId} onValueChange={(v) => setNewRfi({ ...newRfi, assignedToId: v })}>
                <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {availableTeamMembers?.filter((m) => m?.user?.id || m?.id).map((m) => (
                    <SelectItem key={m?.user?.id || m?.id} value={m?.user?.id || m?.id}>{m?.user?.name || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateRfi} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create RFI
            </Button>
          </div>
        );
      case "milestone":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input value={newMilestone.name} onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })} placeholder="Milestone name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={newMilestone.description} onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })} placeholder="Description..." rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} />
            </div>
            <Button onClick={handleCreateMilestone} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Milestone
            </Button>
          </div>
        );
      case "time-entry":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hours *</label>
              <Input type="number" step="0.5" min="0" value={newTimeEntry.hours} onChange={(e) => setNewTimeEntry({ ...newTimeEntry, hours: e.target.value })} placeholder="Hours worked" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input type="date" value={newTimeEntry.date} onChange={(e) => setNewTimeEntry({ ...newTimeEntry, date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input value={newTimeEntry.description} onChange={(e) => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })} placeholder="Work description" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Task (Optional)</label>
              <Select value={newTimeEntry.taskId} onValueChange={(v) => setNewTimeEntry({ ...newTimeEntry, taskId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Link to task" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {project?.tasks?.filter((t: any) => t?.id).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t?.title || "Untitled"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTimeEntry} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Log Time
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // Render different tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab project={project} counts={counts} setActiveTab={setActiveTab} />;
      case "intelligence":
        return <ProjectIntelligence project={project} />;
      case "tasks":
        return <TasksTab project={project} availableTeamMembers={availableTeamMembers} onCreateTask={() => setShowNewTaskModal(true)} router={router} />;
      case "milestones":
        return <MilestonesTab project={project} onCreateMilestone={() => openCreateModal("milestone")} />;
      case "time-tracking":
        return <TimeTrackingTab project={project} onCreateEntry={() => openCreateModal("time-entry")} />;
      case "budget":
        return <BudgetTab project={project} />;
      case "progress-claims":
        return <ProgressClaimsTab project={project} />;
      case "change-orders":
        return <ChangeOrdersTab project={project} />;
      case "team":
        return <TeamTab project={project} availableTeamMembers={availableTeamMembers} />;
      case "materials":
        return <MaterialsTab project={project} />;
      case "subcontractors":
        return <SubcontractorsTab project={project} />;
      case "rfis":
        return <RFIsTab project={project} onCreateRfi={() => openCreateModal("rfi")} />;
      case "submittals":
        return <SubmittalsTab project={project} />;
      case "documents":
        return <DocumentsTab project={project} />;
      case "drawings":
        return <DrawingsTab project={project} />;
      case "permits":
        return <PermitsTab project={project} />;
      case "daily-reports":
        return <DailyReportsTab project={project} />;
      case "site-diary":
        return <SiteDiaryTab project={project} />;
      case "inspections":
        return <InspectionsTab project={project} />;
      case "gallery":
        return <PhotoGallery projectId={project?.id ?? ""} />;
      case "defects":
        return <DefectsTab project={project} />;
      case "punch-lists":
        return <PunchListsTab project={project} />;
      case "safety":
        return <SafetyTab project={project} />;
      case "timeline":
        return <ProjectTimelineTab project={project} milestones={project?.milestones || []} tasks={project?.tasks || []} />;
      case "toolbox-talks":
        return <ToolboxTalksTab projectId={project?.id} toolboxTalks={project?.toolboxTalks || []} teamMembers={availableTeamMembers} />;
      case "daily-checks":
        return <DailyChecksTab projectId={project?.id} mewpChecks={project?.mewpChecks || []} toolChecks={project?.toolChecks || []} equipment={[]} />;
      case "risk-assessments":
        return <RiskAssessmentsTab project={project} teamMembers={availableTeamMembers} riskAssessments={project?.riskAssessments || []} />;
      case "permits-to-work":
        return <PermitsToWorkTab project={project} teamMembers={availableTeamMembers} hotWorkPermits={project?.hotWorkPermits || []} confinedSpacePermits={project?.confinedSpacePermits || []} />;
      case "lifting-ops":
        return <LiftingOperationsTab project={project} teamMembers={availableTeamMembers} liftingOperations={project?.liftingOperations || []} />;
      case "site-access":
        return <SiteAccessTab project={project} teamMembers={availableTeamMembers} siteAccessLogs={project?.siteAccessLogs || []} />;
      case "certifications":
        return <CertificationsTab teamMembers={availableTeamMembers} certifications={certifications} />;
      default:
        return <OverviewTab project={project} counts={counts} setActiveTab={setActiveTab} />;
    }
  };

  // Calculate project health
  const completedTasks = project?.tasks?.filter((t: any) => t?.status === "COMPLETE")?.length || 0;
  const totalTasks = project?.tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const healthStatus = taskProgress >= 80 ? "excellent" : taskProgress >= 60 ? "on-track" : taskProgress >= 40 ? "at-risk" : "critical";
  const healthColors = {
    excellent: { gradient: "from-emerald-500 to-teal-500", text: "text-emerald-600", bg: "bg-emerald-50" },
    "on-track": { gradient: "from-blue-500 to-cyan-500", text: "text-blue-600", bg: "bg-blue-50" },
    "at-risk": { gradient: "from-amber-500 to-orange-500", text: "text-amber-600", bg: "bg-amber-50" },
    critical: { gradient: "from-red-500 to-rose-500", text: "text-red-600", bg: "bg-red-50" },
  };
  const currentHealth = healthColors[healthStatus];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Collapsible Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex-shrink-0 hidden lg:flex lg:flex-col relative"
      >
        {/* Collapse Toggle Button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute -right-3 top-20 z-20 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Project Header */}
        <div className="relative">
          {!sidebarCollapsed && (
            <>
              <div className={`absolute -top-1 left-4 w-24 h-4 rounded-t-lg bg-gradient-to-r ${currentHealth.gradient} transform -skew-x-12`} />
              <div className={`absolute -top-1 left-4 w-24 h-4 rounded-t-lg bg-gradient-to-r ${currentHealth.gradient} opacity-50 transform skew-x-12 translate-x-3`} />
            </>
          )}
          
          <div className={`relative ${sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-4'} bg-gradient-to-r ${currentHealth.gradient}`}>
            {sidebarCollapsed ? (
              // Collapsed Header - Icon only
              <div className="flex flex-col items-center gap-2">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/projects" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <ArrowLeft className="h-4 w-4 text-white" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Back to Portfolio</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-semibold">{project?.name}</p>
                      <p className="text-xs text-slate-400">{taskProgress}% complete</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              // Expanded Header
              <>
                <Link href="/projects" className="flex items-center gap-2 text-sm text-white/80 hover:text-white mb-3 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to Portfolio
                </Link>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-white truncate text-lg" title={project?.name}>{project?.name ?? "Project"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">
                        {(project?.status ?? "")?.replace("_", " ")}
                      </Badge>
                      <span className="text-white/70 text-xs">{taskProgress}% complete</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Edit Project</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                          <Share2 className="h-4 w-4 text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Share</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                          <Star className="h-4 w-4 text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Favorite</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                          <Settings className="h-4 w-4 text-white" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Settings</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-3'} overflow-y-auto`}>
          {sidebarCollapsed ? (
            // Collapsed Navigation - Icons only with tooltips
            <div className="flex flex-col items-center gap-1">
              {featureCategories.map((category) => {
                const colors = folderColors[category.colorKey];
                const isActiveCategory = getActiveFolderCategory() === category.id;
                const CategoryIcon = category.icon;
                
                return (
                  <div key={category.id} className="w-full">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              // Auto-expand and select first item
                              if (!expandedFolders.has(category.id)) {
                                toggleFolder(category.id);
                              }
                              setActiveTab(category.items[0].id);
                            }}
                            className={`
                              w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-200
                              ${isActiveCategory 
                                ? `bg-gradient-to-br ${colors.gradient} shadow-md` 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }
                            `}
                          >
                            <CategoryIcon className={`h-5 w-5 ${isActiveCategory ? 'text-white' : colors.text}`} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex flex-col gap-1">
                          <p className="font-semibold">{category.name}</p>
                          <div className="text-xs text-slate-400">
                            {category.items.map(item => item.label).join(', ')}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>
          ) : (
            // Expanded Navigation - Full folder tree
            <div className="relative">
              <div className="absolute left-[18px] top-0 bottom-4 w-px bg-gradient-to-b from-primary/40 via-slate-200 dark:via-slate-700 to-transparent" />
              
              {featureCategories.map((category) => {
                const colors = folderColors[category.colorKey];
                const isExpanded = expandedFolders.has(category.id);
                const isActiveCategory = getActiveFolderCategory() === category.id;
                const categoryItemCount = category.items.reduce((sum, item) => sum + (counts[item.id as keyof typeof counts] || 0), 0);
                
                return (
                  <div key={category.id} className="relative mb-1">
                    <div className="absolute left-[14px] top-[18px] w-2.5 h-2.5 rounded-full border-2 border-primary bg-white dark:bg-slate-900 z-10" />
                    
                    <div className="ml-8">
                      <button
                        onClick={() => toggleFolder(category.id)}
                        className={`
                          w-full flex items-center gap-2 p-2 rounded-xl transition-all duration-200
                          ${isActiveCategory 
                            ? `${colors.bg} ${colors.border} border` 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }
                        `}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${colors.gradient} shadow-sm`}>
                          {isExpanded ? (
                            <FolderOpen className="h-4 w-4 text-white" />
                          ) : (
                            <FolderClosed className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${isActiveCategory ? colors.text : 'text-slate-700 dark:text-slate-300'}`}>
                          {category.name}
                        </span>
                        {categoryItemCount > 0 && (
                          <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0">
                            {categoryItemCount}
                          </Badge>
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="relative ml-3 py-1 space-y-0.5">
                              <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700" />
                              
                              {category.items.map((item) => {
                                const count = counts[item.id as keyof typeof counts] || 0;
                                const isActive = activeTab === item.id;
                                const ItemIcon = item.icon;
                                
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                                      relative w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all
                                      ${isActive 
                                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md` 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                      }
                                    `}
                                  >
                                    <div className="absolute -left-1 top-1/2 w-3 h-px bg-slate-200 dark:bg-slate-700" />
                                    <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    
                                    <ItemIcon className={`h-4 w-4 ${isActive ? '' : colors.text}`} />
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                    {(item as any).badge && (
                                      <Badge className="bg-violet-500 text-white text-[8px] px-1 py-0 border-0">
                                        {(item as any).badge}
                                      </Badge>
                                    )}
                                    {count > 0 && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        {count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>
        
        {/* Sidebar Footer */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-3'} border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50`}>
          {sidebarCollapsed ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Project Active</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Project Active</span>
              </div>
              <span className="flex items-center gap-1">
                <Network className="h-3 w-3" /> Folder View
              </span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area - Expands when sidebar collapses */}
      <motion.main 
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900/50 flex flex-col"
      >
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <Link href="/projects" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-bold text-lg text-slate-900 dark:text-white">{project?.name ?? "Project"}</h1>
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {topMenuCategories.map(cat => (
                <React.Fragment key={cat.id}>
                  <SelectItem value={cat.id} disabled className="font-semibold text-slate-500">{cat.name}</SelectItem>
                  {cat.items.map(item => (
                    <SelectItem key={item.id} value={item.id} className="pl-6">{item.label}</SelectItem>
                  ))}
                </React.Fragment>
              ))}
              {featureCategories.flatMap(cat => cat.items).map(item => (
                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PROJECT INFO HEADER - Responsive to sidebar state */}
        <div className="hidden lg:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <motion.div 
            layout
            transition={{ duration: 0.3 }}
            className={`py-4 transition-all duration-300 ${sidebarCollapsed ? 'px-8' : 'px-6'}`}
          >
            {/* Project Title Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  layout
                  className={`rounded-xl bg-gradient-to-br ${currentHealth.gradient} shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'p-4' : 'p-3'}`}
                >
                  <Building2 className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'h-7 w-7' : 'h-6 w-6'}`} />
                </motion.div>
                <div>
                  <h1 className={`font-bold text-slate-900 dark:text-white transition-all duration-300 ${sidebarCollapsed ? 'text-2xl' : 'text-xl'}`}>
                    {project?.name ?? "Project"}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={`${currentHealth.bg} ${currentHealth.text} border-0`}>
                      {(project?.status ?? "")?.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-slate-500">{taskProgress}% complete</span>
                    {sidebarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"
                      >
                        Expanded View
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions - More visible when expanded */}
              <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'gap-3' : 'gap-2'}`}>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size={sidebarCollapsed ? "default" : "sm"} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Edit Project</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className={`transition-all duration-300 ${sidebarCollapsed ? 'h-10 w-10' : 'h-9 w-9'}`}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Share</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className={`transition-all duration-300 ${sidebarCollapsed ? 'h-10 w-10' : 'h-9 w-9'}`}>
                        <Star className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Favorite</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Info Cards Row - Responsive grid based on sidebar state */}
            <motion.div 
              layout
              className={`grid gap-4 transition-all duration-300 ${
                sidebarCollapsed 
                  ? 'grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5' 
                  : 'grid-cols-2 xl:grid-cols-4'
              }`}
            >
              {/* Client Card - Enhanced */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(139, 92, 246, 0.3)" }}
                className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20 transition-all duration-300 cursor-pointer group ${sidebarCollapsed ? 'p-5' : 'p-4'}`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-purple-500/20 rounded-bl-[50px] group-hover:w-24 group-hover:h-24 transition-all duration-300" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-violet-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                <div className="relative flex items-start gap-3">
                  <div className={`rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 transition-all duration-300 ${sidebarCollapsed ? 'p-3' : 'p-2'}`}>
                    <User className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Client</p>
                    <p className={`font-bold text-slate-900 dark:text-white truncate mt-1 transition-all duration-300 ${sidebarCollapsed ? 'text-base' : 'text-sm'}`}>
                      {project?.clientName || "Not specified"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Location Card - Enhanced */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(16, 185, 129, 0.3)" }}
                className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 transition-all duration-300 cursor-pointer group ${sidebarCollapsed ? 'p-5' : 'p-4'}`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/20 rounded-bl-[50px] group-hover:w-24 group-hover:h-24 transition-all duration-300" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                <div className="relative flex items-start gap-3">
                  <div className={`rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 transition-all duration-300 ${sidebarCollapsed ? 'p-3' : 'p-2'}`}>
                    <MapPin className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Location</p>
                    <p className={`font-bold text-slate-900 dark:text-white truncate mt-1 transition-all duration-300 ${sidebarCollapsed ? 'text-base' : 'text-sm'}`}>
                      {project?.location || "Not specified"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Budget Card - Enhanced */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(245, 158, 11, 0.3)" }}
                className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 transition-all duration-300 cursor-pointer group ${sidebarCollapsed ? 'p-5' : 'p-4'}`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/20 rounded-bl-[50px] group-hover:w-24 group-hover:h-24 transition-all duration-300" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                <div className="relative flex items-start gap-3">
                  <div className={`rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 transition-all duration-300 ${sidebarCollapsed ? 'p-3' : 'p-2'}`}>
                    <PoundSterling className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Budget</p>
                    <p className={`font-bold text-slate-900 dark:text-white truncate mt-1 transition-all duration-300 ${sidebarCollapsed ? 'text-base' : 'text-sm'}`}>
                      £{(project?.budget || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Progress Card - Enhanced */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(59, 130, 246, 0.3)" }}
                className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 transition-all duration-300 cursor-pointer group ${sidebarCollapsed ? 'p-5' : 'p-4'}`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/20 rounded-bl-[50px] group-hover:w-24 group-hover:h-24 transition-all duration-300" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                <div className="relative flex items-start gap-3">
                  <div className={`rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25 transition-all duration-300 ${sidebarCollapsed ? 'p-3' : 'p-2'}`}>
                    <TrendingUp className={`text-white transition-all duration-300 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'h-3' : 'h-2'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${taskProgress}%` }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 rounded-full relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </motion.div>
                      </div>
                      <span className={`font-bold text-slate-900 dark:text-white transition-all duration-300 ${sidebarCollapsed ? 'text-base' : 'text-sm'}`}>{taskProgress}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Extra Stats Card - Only shows when sidebar collapsed */}
              {sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 40px -10px rgba(168, 85, 247, 0.3)" }}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-red-900/20 p-5 cursor-pointer group"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/10 to-rose-500/20 rounded-bl-[50px] group-hover:w-24 group-hover:h-24 transition-all duration-300" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                  <div className="relative flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/25">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Team</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {counts.team} Members
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* TOP HORIZONTAL MENU - Prominent navigation bar with separation */}
        <motion.div 
          layout
          className={`
            relative bg-gradient-to-r from-slate-50 via-white to-slate-50 
            dark:from-slate-800/80 dark:via-slate-800 dark:to-slate-800/80
            border-t-2 border-b border-slate-200/80 dark:border-slate-700
            shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]
            transition-all duration-300 ${sidebarCollapsed ? 'px-8 py-4' : 'px-6 py-3'}
          `}
        >
          {/* Decorative top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 opacity-60" />
          
          {/* Menu Label */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" />
              <span>Quick Access</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Top Menu Folder Tabs - More prominent styling */}
            <div className={`flex items-center flex-1 transition-all duration-300 ${sidebarCollapsed ? 'gap-4' : 'gap-2'}`}>
              {topMenuCategories.map((category) => {
                const colors = folderColors[category.colorKey];
                const isActive = getActiveTopMenuCategory() === category.id;
                const isExpanded = expandedTopMenu === category.id;
                const CategoryIcon = category.icon;
                const categoryItemCount = category.items.reduce((sum, item) => sum + (counts[item.id as keyof typeof counts] || 0), 0);
                
                return (
                  <div key={category.id} className="relative">
                    <motion.button
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleTopMenuFolder(category.id)}
                      className={`
                        relative flex items-center gap-2.5 rounded-xl transition-all duration-200
                        ${sidebarCollapsed ? 'px-6 py-3.5' : 'px-5 py-3'}
                        ${isActive || isExpanded
                          ? `bg-gradient-to-r ${category.gradient} text-white shadow-xl shadow-${category.colorKey === 'overview' ? 'violet' : category.colorKey === 'work' ? 'blue' : 'amber'}-500/30`
                          : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md'
                        }
                      `}
                    >
                      <div className="relative z-10 flex items-center gap-2.5">
                        <div className={`
                          ${isExpanded || isActive ? 'bg-white/20' : `bg-gradient-to-br ${category.gradient}`} 
                          p-1.5 rounded-lg transition-all duration-200
                        `}>
                          {isExpanded || isActive ? (
                            <FolderOpen className={`transition-all duration-300 text-white ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          ) : (
                            <FolderClosed className={`transition-all duration-300 text-white ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          )}
                        </div>
                        <span className={`font-semibold transition-all duration-300 ${sidebarCollapsed ? 'text-base' : 'text-sm'}`}>{category.name}</span>
                        {categoryItemCount > 0 && (
                          <Badge className={`transition-all duration-300 font-bold ${sidebarCollapsed ? 'text-xs px-2.5 py-0.5' : 'text-[10px] px-2 py-0.5'} ${isActive || isExpanded ? 'bg-white/25 text-white border-0' : `${colors.bg} ${colors.text} border-0`}`}>
                            {categoryItemCount}
                          </Badge>
                        )}
                        <ChevronDown className={`transition-transform duration-200 ${sidebarCollapsed ? 'h-4 w-4' : 'h-3.5 w-3.5'} ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </motion.button>
                    
                    {/* Dropdown Menu - Enhanced with better styling */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute top-full left-0 z-50 mt-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${sidebarCollapsed ? 'min-w-[300px]' : 'min-w-[240px]'}`}
                        >
                          <div className={`bg-gradient-to-r ${category.gradient} text-white ${sidebarCollapsed ? 'px-5 py-4' : 'px-4 py-3'}`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/20 rounded-lg">
                                <CategoryIcon className={`${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
                              </div>
                              <div>
                                <span className={`font-bold block ${sidebarCollapsed ? 'text-base' : 'text-sm'}`}>{category.name}</span>
                                <span className="text-xs text-white/70">{category.items.length} items</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`space-y-1 ${sidebarCollapsed ? 'p-3' : 'p-2'}`}>
                            {category.items.map((item) => {
                              const ItemIcon = item.icon;
                              const count = counts[item.id as keyof typeof counts] || 0;
                              const isItemActive = activeTab === item.id;
                              
                              return (
                                <motion.button
                                  key={item.id}
                                  whileHover={{ x: 4 }}
                                  onClick={() => {
                                    setActiveTab(item.id);
                                    setExpandedTopMenu(null);
                                  }}
                                  className={`
                                    w-full flex items-center gap-3 rounded-xl transition-all duration-200
                                    ${sidebarCollapsed ? 'px-4 py-3.5 text-base' : 'px-3 py-3 text-sm'}
                                    ${isItemActive 
                                      ? `bg-gradient-to-r ${category.gradient} text-white shadow-md` 
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }
                                  `}
                                >
                                  <div className={`p-1.5 rounded-lg ${isItemActive ? 'bg-white/20' : colors.bg}`}>
                                    <ItemIcon className={`${sidebarCollapsed ? 'h-4 w-4' : 'h-3.5 w-3.5'} ${isItemActive ? 'text-white' : colors.text}`} />
                                  </div>
                                  <span className="flex-1 text-left font-medium">{item.label}</span>
                                  {(item as any).badge && (
                                    <Badge className="bg-violet-500 text-white text-[8px] px-1.5 py-0.5 border-0 font-bold">
                                      {(item as any).badge}
                                    </Badge>
                                  )}
                                  {count > 0 && (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isItemActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                      {count}
                                    </span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            
            {/* Vertical Divider */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
            
            {/* Quick Add Button - More prominent */}
            <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'gap-3' : 'gap-2'}`}>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size={sidebarCollapsed ? "lg" : "default"}
                        onClick={() => setShowNewTaskModal(true)}
                        className={`
                          bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 
                          hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 
                          text-white shadow-xl shadow-blue-500/30 font-semibold
                          transition-all duration-300
                          ${sidebarCollapsed ? 'px-6 text-base' : 'px-5'}
                        `}
                      >
                        <Plus className={`mr-1.5 ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'}`} /> 
                        <span>New Task</span>
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent><p>Quick add task (Ctrl + N)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>

        {/* Click outside to close dropdown */}
        {expandedTopMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setExpandedTopMenu(null)}
          />
        )}

        {/* Tab Content with Animation - Responsive padding */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'p-8' : 'p-6'}`}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`transition-all duration-300 ${sidebarCollapsed ? 'max-w-none' : 'max-w-7xl'}`}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Create Task Modal */}
      <Dialog open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl font-bold">Create New Task</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Title *</label>
              <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" className="h-11" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Description</label>
              <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Priority</label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Due Date</label>
                <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="h-11" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Assignee</label>
              <Select value={newTask.assigneeId} onValueChange={(v) => setNewTask({ ...newTask, assigneeId: v })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {availableTeamMembers?.filter((m) => m?.user?.id || m?.id).map((m) => (
                    <SelectItem key={m?.user?.id || m?.id} value={m?.user?.id || m?.id}>{m?.user?.name || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTask} disabled={loading} className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generic Create Modal */}
      <Dialog open={showNewItemModal} onOpenChange={setShowNewItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "rfi" ? "Create New RFI" : modalType === "milestone" ? "Create Milestone" : modalType === "time-entry" ? "Log Time" : "Create Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">{renderCreateModal()}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Tab Components ====================

function OverviewTab({ project, counts, setActiveTab }: { project: any; counts: any; setActiveTab: (tab: string) => void }) {
  const completedTasks = project?.tasks?.filter((t: any) => t?.status === "COMPLETE")?.length || 0;
  const totalTasks = project?.tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalBudget = project?.budget || 0;
  const spentBudget = project?.costItems?.reduce((sum: number, item: any) => sum + (item?.actualCost || 0), 0) || 0;
  const budgetUsed = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;
  
  // Calculate health metrics
  const openRfis = project?.rfis?.filter((r: any) => r?.status !== 'CLOSED')?.length || 0;
  const openDefects = project?.defects?.filter((d: any) => d?.status !== 'CLOSED')?.length || 0;
  const overdueTasks = project?.tasks?.filter((t: any) => {
    if (!t?.dueDate || t?.status === "COMPLETE") return false;
    return new Date(t.dueDate) < new Date();
  })?.length || 0;
  
  const healthScore = Math.max(0, Math.min(100, 100 - (overdueTasks * 5) - (openDefects * 3) - (openRfis * 2)));
  const healthStatus = healthScore >= 80 ? "excellent" : healthScore >= 60 ? "on-track" : healthScore >= 40 ? "at-risk" : "critical";
  const healthConfig = {
    excellent: { gradient: "from-emerald-500 to-teal-500", text: "Excellent", textColor: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
    "on-track": { gradient: "from-blue-500 to-cyan-500", text: "On Track", textColor: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    "at-risk": { gradient: "from-amber-500 to-orange-500", text: "At Risk", textColor: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
    critical: { gradient: "from-red-500 to-rose-500", text: "Critical", textColor: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/20" },
  };
  const currentHealth = healthConfig[healthStatus];

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid - Enhanced */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Project Health Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${currentHealth.gradient}`} />
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Project Health</h3>
              <p className={`text-3xl font-bold mt-1 ${currentHealth.textColor}`}>{healthScore}%</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${currentHealth.bgColor} ${currentHealth.textColor}`}>
              {currentHealth.text}
            </div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${currentHealth.gradient} rounded-full relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </motion.div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{overdueTasks}</p>
              <p className="text-[10px] text-slate-500 uppercase">Overdue</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{openDefects}</p>
              <p className="text-[10px] text-slate-500 uppercase">Defects</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{openRfis}</p>
              <p className="text-[10px] text-slate-500 uppercase">Open RFIs</p>
            </div>
          </div>
        </div>

        {/* Task Progress Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Task Progress</h3>
              <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{taskProgress}%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </motion.div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
            <span className="font-semibold text-slate-900 dark:text-white">{completedTasks}</span> of <span className="font-semibold">{totalTasks}</span> tasks completed
          </p>
          <button 
            onClick={() => setActiveTab("tasks")}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
          >
            View All Tasks <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Budget Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${budgetUsed > 90 ? 'from-red-500 to-rose-500' : budgetUsed > 70 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'}`} />
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Budget Utilization</h3>
              <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">£{spentBudget.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${budgetUsed > 90 ? 'from-red-500 to-rose-500' : budgetUsed > 70 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'} rounded-full relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </motion.div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
            <span className="font-semibold text-slate-900 dark:text-white">{budgetUsed}%</span> of £{totalBudget.toLocaleString()} used
          </p>
          <button 
            onClick={() => setActiveTab("budget")}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2"
          >
            View Budget Details <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Access Grid - Enhanced Folder Style */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" /> Quick Access
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: "tasks", label: "Tasks", count: counts.tasks, icon: CheckCircle, gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { id: "team", label: "Team", count: counts.team, icon: Users, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
            { id: "rfis", label: "RFIs", count: counts.rfis, icon: FileQuestion, gradient: "from-indigo-500 to-blue-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { id: "documents", label: "Documents", count: counts.documents, icon: FileText, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { id: "safety", label: "Safety", count: counts.safety, icon: Shield, gradient: "from-red-500 to-rose-500", bg: "bg-red-50 dark:bg-red-900/20" },
            { id: "daily-reports", label: "Daily Reports", count: counts.dailyReports, icon: BookOpen, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { id: "milestones", label: "Milestones", count: counts.milestones, icon: Milestone, gradient: "from-pink-500 to-rose-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
            { id: "inspections", label: "Inspections", count: counts.inspections, icon: Search, gradient: "from-cyan-500 to-blue-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
          ].map(item => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 cursor-pointer group"
              onClick={() => setActiveTab(item.id)}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${item.bg} transition-transform group-hover:scale-110`}>
                  <item.icon className={`h-5 w-5 bg-gradient-to-r ${item.gradient} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                </div>
              </div>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weather Widget */}
      <WeatherWidget location={project?.location || "London, UK"} showForecast={true} />
    </div>
  );
}

function TasksTab({ project, availableTeamMembers, onCreateTask, router }: { project: any; availableTeamMembers: any[]; onCreateTask: () => void; router: any }) {
  const [filter, setFilter] = useState("all");
  const tasks = project?.tasks || [];
  const filteredTasks = filter === "all" ? tasks : tasks.filter((t: any) => t?.status === filter);

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      toast.success("Task updated!");
      router.refresh();
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks ({filteredTasks.length})</h2>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onCreateTask}><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
        </div>
      </div>
      {filteredTasks.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No tasks found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task: any) => (
            <Card key={task?.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{task?.title}</p>
                  <p className="text-sm text-gray-500">{task?.assignee?.name || "Unassigned"} {task?.dueDate && `• Due ${format(new Date(task.dueDate), 'MMM d')}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityColors[task?.priority as keyof typeof priorityColors] || "secondary"}>{task?.priority}</Badge>
                  <Select value={task?.status} onValueChange={(v) => handleStatusChange(task?.id, v)}>
                    <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="COMPLETE">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestonesTab({ project, onCreateMilestone }: { project: any; onCreateMilestone: () => void }) {
  const milestones = project?.milestones || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Milestones ({milestones.length})</h2>
        <Button onClick={onCreateMilestone}><Plus className="h-4 w-4 mr-2" /> Add Milestone</Button>
      </div>
      {milestones.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No milestones yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {milestones.map((m: any) => (
            <Card key={m?.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${m?.status === 'COMPLETED' ? 'bg-green-500' : m?.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium">{m?.name}</p>
                    {m?.targetDate && <p className="text-sm text-gray-500">Due {format(new Date(m.targetDate), 'MMM d, yyyy')}</p>}
                  </div>
                </div>
                <Badge variant={m?.status === 'COMPLETED' ? 'success' : m?.status === 'IN_PROGRESS' ? 'info' : 'secondary'}>{m?.status?.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TimeTrackingTab({ project, onCreateEntry }: { project: any; onCreateEntry: () => void }) {
  const entries = project?.timeEntries || [];
  const totalHours = entries.reduce((sum: number, e: any) => sum + (e?.hours || 0), 0);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Time Tracking</h2>
          <p className="text-sm text-gray-500">Total: {totalHours.toFixed(1)} hours logged</p>
        </div>
        <Button onClick={onCreateEntry}><Plus className="h-4 w-4 mr-2" /> Log Time</Button>
      </div>
      {entries.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No time entries yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 20).map((e: any) => (
            <Card key={e?.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e?.user?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{e?.description || 'No description'} {e?.task && `• ${e?.task?.title}`}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{e?.hours}h</p>
                  <p className="text-xs text-gray-500">{e?.date && format(new Date(e.date), 'MMM d')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetTab({ project }: { project: any }) {
  const costItems = project?.costItems || [];
  const totalBudget = project?.budget || 0;
  const totalEstimated = costItems.reduce((sum: number, i: any) => sum + (i?.estimatedCost || 0), 0);
  const totalActual = costItems.reduce((sum: number, i: any) => sum + (i?.actualCost || 0), 0);
  const variance = totalEstimated - totalActual;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Budget Management</h2>
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Budget</p><p className="text-2xl font-bold">£{totalBudget.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Estimated</p><p className="text-2xl font-bold">£{totalEstimated.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Actual Spent</p><p className="text-2xl font-bold">£{totalActual.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Variance</p><p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{variance >= 0 ? '+' : ''}£{variance.toLocaleString()}</p></CardContent></Card>
      </div>
      {costItems.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Cost Items</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {costItems.map((item: any) => (
                <div key={item?.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{item?.description || item?.category}</span>
                  <span className="font-medium">£{(item?.actualCost || item?.estimatedCost || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProgressClaimsTab({ project }: { project: any }) {
  const claims = project?.progressClaims || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Progress Claims ({claims.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> New Claim</Button>
      </div>
      {claims.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No progress claims yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {claims.map((c: any) => (
            <Card key={c?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">Claim #{c?.claimNumber || c?.id?.slice(-6)}</p>
                  <p className="text-sm text-gray-500">{c?.periodStart && format(new Date(c.periodStart), 'MMM d')} - {c?.periodEnd && format(new Date(c.periodEnd), 'MMM d, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">£{(c?.amount || 0).toLocaleString()}</p>
                  <Badge variant={c?.status === 'APPROVED' ? 'success' : c?.status === 'REJECTED' ? 'destructive' : 'warning'}>{c?.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeOrdersTab({ project }: { project: any }) {
  const orders = project?.changeOrders || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Change Orders ({orders.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> New Change Order</Button>
      </div>
      {orders.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No change orders yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {orders.map((co: any) => (
            <Card key={co?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{co?.title || `CO #${co?.number || co?.id?.slice(-6)}`}</p>
                  <p className="text-sm text-gray-500">{co?.description?.slice(0, 50)}...</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${(co?.costChange || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(co?.costChange || 0) >= 0 ? '+' : ''}£{Math.abs(co?.costChange || 0).toLocaleString()}
                  </p>
                  <Badge variant={co?.status === 'APPROVED' ? 'success' : co?.status === 'REJECTED' ? 'destructive' : 'warning'}>{co?.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamTab({ project, availableTeamMembers }: { project: any; availableTeamMembers: any[] }) {
  const teamMembers = project?.teamMembers || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Project Team ({teamMembers.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
      </div>
      {teamMembers.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No team members assigned</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((tm: any) => (
            <Card key={tm?.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5f46e5] flex items-center justify-center text-white font-medium">
                  {tm?.teamMember?.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium">{tm?.teamMember?.user?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{tm?.teamMember?.user?.email}</p>
                  <Badge variant="secondary" className="mt-1">{tm?.role || tm?.teamMember?.user?.role || 'Member'}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialsTab({ project }: { project: any }) {
  const materials = project?.materials || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Materials ({materials.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Material</Button>
      </div>
      {materials.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No materials tracked</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {materials.map((m: any) => (
            <Card key={m?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{m?.name}</p>
                  <p className="text-sm text-gray-500">Qty: {m?.quantity} {m?.unit} • {m?.supplier || 'No supplier'}</p>
                </div>
                <Badge variant={m?.status === 'DELIVERED' ? 'success' : m?.status === 'ORDERED' ? 'info' : 'secondary'}>{m?.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubcontractorsTab({ project }: { project: any }) {
  const subcontractors = project?.subcontracts || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Subcontractors ({subcontractors.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Subcontractor</Button>
      </div>
      {subcontractors.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No subcontractors assigned</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {subcontractors.map((s: any) => (
            <Card key={s?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{s?.subcontractor?.companyName || s?.companyName}</p>
                  <p className="text-sm text-gray-500">{s?.scope || s?.subcontractor?.trade}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">£{(s?.contractValue || 0).toLocaleString()}</p>
                  <Badge variant={s?.status === 'ACTIVE' ? 'success' : 'secondary'}>{s?.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RFIsTab({ project, onCreateRfi }: { project: any; onCreateRfi: () => void }) {
  const rfis = project?.rfis || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">RFIs ({rfis.length})</h2>
        <Button onClick={onCreateRfi}><Plus className="h-4 w-4 mr-2" /> New RFI</Button>
      </div>
      {rfis.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No RFIs yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rfis.map((rfi: any) => (
            <Card key={rfi?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">RFI #{rfi?.number} - {rfi?.subject}</p>
                  <p className="text-sm text-gray-500">By {rfi?.createdBy?.name || 'Unknown'} • {rfi?.createdAt && formatDistanceToNow(new Date(rfi.createdAt), { addSuffix: true })}</p>
                </div>
                <Badge variant={rfi?.status === 'CLOSED' ? 'success' : rfi?.status === 'ANSWERED' ? 'info' : 'warning'}>{rfi?.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmittalsTab({ project }: { project: any }) {
  const submittals = project?.submittals || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Submittals ({submittals.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> New Submittal</Button>
      </div>
      {submittals.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No submittals yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {submittals.map((s: any) => (
            <Card key={s?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{s?.title || `Submittal #${s?.number}`}</p>
                  <p className="text-sm text-gray-500">{s?.type} • By {s?.submittedBy?.name || 'Unknown'}</p>
                </div>
                <Badge variant={s?.status === 'APPROVED' ? 'success' : s?.status === 'REJECTED' ? 'destructive' : s?.status === 'REVISE_RESUBMIT' ? 'warning' : 'secondary'}>{s?.status?.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ project }: { project: any }) {
  const documents = project?.documents || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents ({documents.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Upload Document</Button>
      </div>
      {documents.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No documents yet</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: any) => (
            <Card key={doc?.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-8 w-8 text-[#5f46e5]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc?.name}</p>
                    <p className="text-sm text-gray-500">{doc?.type} • {doc?.uploadedBy?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DrawingsTab({ project }: { project: any }) {
  const drawings = project?.drawings || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Drawings ({drawings.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Upload Drawing</Button>
      </div>
      {drawings.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No drawings yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {drawings.map((d: any) => (
            <Card key={d?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <PenTool className="h-5 w-5 text-[#5f46e5]" />
                  <div>
                    <p className="font-medium">{d?.title || d?.drawingNumber}</p>
                    <p className="text-sm text-gray-500">Rev {d?.revision || '0'} • {d?.discipline}</p>
                  </div>
                </div>
                <Badge variant={d?.status === 'APPROVED' ? 'success' : 'secondary'}>{d?.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PermitsTab({ project }: { project: any }) {
  const permits = project?.permits || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Permits ({permits.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Permit</Button>
      </div>
      {permits.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No permits tracked</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {permits.map((p: any) => (
            <Card key={p?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{p?.title || p?.type}</p>
                  <p className="text-sm text-gray-500">{p?.issuingAuthority} • Expires {p?.expirationDate && format(new Date(p.expirationDate), 'MMM d, yyyy')}</p>
                </div>
                <Badge variant={p?.status === 'APPROVED' ? 'success' : p?.status === 'EXPIRED' ? 'destructive' : 'warning'}>{p?.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyReportsTab({ project }: { project: any }) {
  const reports = project?.dailyReports || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Daily Reports ({reports.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> New Report</Button>
      </div>
      {reports.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No daily reports yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <Card key={r?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{r?.reportDate && format(new Date(r.reportDate), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-gray-500">By {r?.createdBy?.name || 'Unknown'} • Weather: {r?.weather || 'N/A'} • Crew: {r?.manpowerCount || 0}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SiteDiaryTab({ project }: { project: any }) {
  const diaries = project?.siteDiaries || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Site Diary ({diaries.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> New Entry</Button>
      </div>
      {diaries.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No site diary entries</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {diaries.map((d: any) => (
            <Card key={d?.id}>
              <CardContent className="p-4">
                <p className="font-medium">{d?.date && format(new Date(d.date), 'MMMM d, yyyy')}</p>
                <p className="text-sm text-gray-600 mt-1">{d?.notes?.slice(0, 150)}...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InspectionsTab({ project }: { project: any }) {
  const inspections = project?.inspections || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Inspections ({inspections.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Schedule Inspection</Button>
      </div>
      {inspections.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No inspections scheduled</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {inspections.map((i: any) => (
            <Card key={i?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{i?.inspectionType || i?.title}</p>
                  <p className="text-sm text-gray-500">{i?.scheduledDate && format(new Date(i.scheduledDate), 'MMM d, yyyy')} • {i?.inspectorName || 'TBD'}</p>
                </div>
                <Badge variant={i?.status === 'PASSED' ? 'success' : i?.status === 'FAILED' ? 'destructive' : 'warning'}>{i?.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DefectsTab({ project }: { project: any }) {
  const defects = project?.defects || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Defects ({defects.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Report Defect</Button>
      </div>
      {defects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No defects reported</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {defects.map((d: any) => (
            <Card key={d?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{d?.title || d?.description?.slice(0, 50)}</p>
                  <p className="text-sm text-gray-500">{d?.location} • Reported {d?.createdAt && formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityColors[d?.severity as keyof typeof priorityColors] || 'secondary'}>{d?.severity || 'MEDIUM'}</Badge>
                  <Badge variant={d?.status === 'CLOSED' ? 'success' : d?.status === 'IN_PROGRESS' ? 'info' : 'warning'}>{d?.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PunchListsTab({ project }: { project: any }) {
  const punchLists = project?.punchLists || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Punch Lists ({punchLists.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> New Punch List</Button>
      </div>
      {punchLists.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No punch lists yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {punchLists.map((pl: any) => (
            <Card key={pl?.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{pl?.title || `Punch List #${pl?.id?.slice(-6)}`}</p>
                  <p className="text-sm text-gray-500">{pl?.location} • {pl?.items?.length || 0} items</p>
                </div>
                <Badge variant={pl?.status === 'COMPLETE' ? 'success' : 'warning'}>{pl?.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SafetyTab({ project }: { project: any }) {
  const incidents = project?.safetyIncidents || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Safety Incidents ({incidents.length})</h2>
        <Button><Plus className="h-4 w-4 mr-2" /> Report Incident</Button>
      </div>
      {incidents.length === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">No safety incidents reported</p>
            <p className="text-green-600 text-sm">Keep up the great safety record!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {incidents.map((i: any) => (
            <Card key={i?.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{i?.type || 'Incident'}</p>
                  <p className="text-sm text-gray-500">{i?.description?.slice(0, 60)}... • {i?.incidentDate && format(new Date(i.incidentDate), 'MMM d, yyyy')}</p>
                </div>
                <Badge variant={i?.severity === 'CRITICAL' ? 'destructive' : i?.severity === 'HIGH' ? 'warning' : 'secondary'}>{i?.severity}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Activity Timeline</h2>
      {activities.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No activity yet</CardContent></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {activities.map((a: any) => (
              <div key={a?.id} className="relative pl-10">
                <div className="absolute left-2.5 w-3 h-3 bg-[#5f46e5] rounded-full border-2 border-white" />
                <Card>
                  <CardContent className="p-4">
                    <p className="font-medium">{a?.action}</p>
                    <p className="text-sm text-gray-500">{a?.user?.name || 'System'} • {a?.createdAt && formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                    {a?.details && <p className="text-sm text-gray-600 mt-1">{a.details}</p>}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
