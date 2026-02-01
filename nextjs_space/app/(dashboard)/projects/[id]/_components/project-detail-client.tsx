"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, MapPin, Calendar, PoundSterling, User,
  ListTodo, FileText, Users, Plus, Loader2, CheckCircle, Clock, AlertCircle, Activity, TrendingUp,
  Upload, Download, Eye, Ruler, Image, FileSpreadsheet, File, Brain, BarChart3, Camera,
  ClipboardList, Timer, Wallet, Receipt, Package, HardHat, FileQuestion, Send, FileCheck,
  Shield, PenTool, BookOpen, AlertTriangle, Target, Search, ChevronRight, FolderOpen,
  Milestone, Building2, Hammer, Truck, UserCheck, Scale, LayoutGrid, List
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

// Feature categories for sidebar navigation
const featureCategories = [
  {
    name: "Overview",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutGrid },
      { id: "intelligence", label: "Intelligence", icon: Brain },
      { id: "timeline", label: "Timeline", icon: Activity },
    ]
  },
  {
    name: "Work Management",
    items: [
      { id: "tasks", label: "Tasks", icon: CheckCircle },
      { id: "milestones", label: "Milestones", icon: Milestone },
      { id: "time-tracking", label: "Time Tracking", icon: Timer },
    ]
  },
  {
    name: "Financial",
    items: [
      { id: "budget", label: "Budget", icon: Wallet },
      { id: "progress-claims", label: "Progress Claims", icon: Receipt },
      { id: "change-orders", label: "Change Orders", icon: FileCheck },
    ]
  },
  {
    name: "Resources",
    items: [
      { id: "team", label: "Team", icon: Users },
      { id: "materials", label: "Materials", icon: Package },
      { id: "subcontractors", label: "Subcontractors", icon: HardHat },
    ]
  },
  {
    name: "Documentation",
    items: [
      { id: "rfis", label: "RFIs", icon: FileQuestion },
      { id: "submittals", label: "Submittals", icon: Send },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "drawings", label: "Drawings", icon: PenTool },
      { id: "permits", label: "Permits", icon: Scale },
    ]
  },
  {
    name: "Field Operations",
    items: [
      { id: "daily-reports", label: "Daily Reports", icon: BookOpen },
      { id: "site-diary", label: "Site Diary", icon: ClipboardList },
      { id: "inspections", label: "Inspections", icon: Search },
      { id: "toolbox-talks", label: "Toolbox Talks", icon: Users },
      { id: "daily-checks", label: "Daily Checks", icon: ClipboardList },
      { id: "site-access", label: "Site Access", icon: UserCheck },
      { id: "lifting-ops", label: "Lifting Operations", icon: Truck },
      { id: "gallery", label: "Photo Gallery", icon: Camera },
    ]
  },
  {
    name: "Quality & Safety",
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

export function ProjectDetailClient({ project, availableTeamMembers, currentUserId, activities = [], certifications = [] }: ProjectDetailClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM", status: "TODO", assigneeId: "", dueDate: "" });
  const [newRfi, setNewRfi] = useState({ subject: "", question: "", assignedToId: "" });
  const [newMilestone, setNewMilestone] = useState({ name: "", description: "", dueDate: "" });
  const [newTimeEntry, setNewTimeEntry] = useState({ description: "", hours: "", date: new Date().toISOString().split('T')[0], taskId: "" });

  // Get counts for badges - use _count for accurate totals
  const getCounts = () => ({
    tasks: project?._count?.tasks || 0,
    milestones: project?._count?.milestones || 0,
    rfis: project?._count?.rfis || 0,
    submittals: project?._count?.submittals || 0,
    documents: project?._count?.documents || 0,
    team: project?._count?.teamMembers || 0,
    changeOrders: project?._count?.changeOrders || 0,
    safety: project?._count?.safetyIncidents || 0,
    dailyReports: project?.dailyReports?.length || 0,
    timeEntries: project?._count?.timeEntries || 0,
    materials: project?._count?.materials || 0,
    permits: project?._count?.permits || 0,
    drawings: project?._count?.drawings || 0,
    defects: project?._count?.defects || 0,
    punchLists: project?._count?.punchLists || 0,
    inspections: project?._count?.inspections || 0,
    progressClaims: project?._count?.progressClaims || 0,
    siteDiaries: project?._count?.siteDiaries || 0,
    subcontractors: project?._count?.subcontracts || 0,
    costItems: project?._count?.costItems || 0,
    toolboxTalks: project?._count?.toolboxTalks || 0,
    mewpChecks: project?._count?.mewpChecks || 0,
    toolChecks: project?._count?.toolChecks || 0,
    riskAssessments: project?._count?.riskAssessments || 0,
    hotWorkPermits: project?._count?.hotWorkPermits || 0,
    confinedSpacePermits: project?._count?.confinedSpacePermits || 0,
    liftingOperations: project?._count?.liftingOperations || 0,
    siteAccessLogs: project?._count?.siteAccessLogs || 0,
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

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-white overflow-y-auto flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b">
          <Link href="/projects" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
          <h2 className="font-semibold text-gray-900 truncate" title={project?.name}>{project?.name ?? "Project"}</h2>
          <Badge variant={statusColors[project?.status as keyof typeof statusColors] ?? "secondary"} className="mt-1">
            {(project?.status ?? "")?.replace("_", " ")}
          </Badge>
        </div>
        <nav className="p-2">
          {featureCategories.map((category) => (
            <div key={category.name} className="mb-4">
              <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{category.name}</p>
              {category.items.map((item) => {
                const count = counts[item.id as keyof typeof counts];
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === item.id
                        ? "bg-[#5f46e5] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === item.id ? "bg-white/20" : "bg-gray-200"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-white border-b">
          <Link href="/projects" className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-semibold text-lg">{project?.name ?? "Project"}</h1>
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {featureCategories.flatMap(cat => cat.items).map(item => (
                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {renderTabContent()}
          </motion.div>
        </div>
      </main>

      {/* Create Task Modal */}
      <Dialog open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              <Select value={newTask.assigneeId} onValueChange={(v) => setNewTask({ ...newTask, assigneeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {availableTeamMembers?.filter((m) => m?.user?.id || m?.id).map((m) => (
                    <SelectItem key={m?.user?.id || m?.id} value={m?.user?.id || m?.id}>{m?.user?.name || "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTask} disabled={loading} className="w-full">
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
  // Use the fetched tasks for display, but note this is limited data
  const completedTasks = project?.tasks?.filter((t: any) => t?.status === "COMPLETE")?.length || 0;
  const totalTasks = project?.tasks?.length || 0;
  // Note: This progress is based on limited data (first 100 tasks)
  // For accurate progress, consider adding a server-side calculation
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalBudget = project?.budget || 0;
  const spentBudget = project?.costItems?.reduce((sum: number, item: any) => sum + (item?.actualCost || 0), 0) || 0;
  const budgetUsed = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {project?.location && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-[#5f46e5]" />
            <div><p className="text-xs text-gray-500">Location</p><p className="font-medium text-sm">{project.location}</p></div>
          </CardContent></Card>
        )}
        {project?.budget && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <PoundSterling className="h-5 w-5 text-green-500" />
            <div><p className="text-xs text-gray-500">Budget</p><p className="font-medium text-sm">£{Number(project.budget)?.toLocaleString()}</p></div>
          </CardContent></Card>
        )}
        {project?.startDate && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div><p className="text-xs text-gray-500">Start Date</p><p className="font-medium text-sm">{new Date(project.startDate).toLocaleDateString()}</p></div>
          </CardContent></Card>
        )}
        {project?.clientName && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-orange-500" />
            <div><p className="text-xs text-gray-500">Client</p><p className="font-medium text-sm">{project.clientName}</p></div>
          </CardContent></Card>
        )}
      </div>

      {/* Progress Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Task Progress</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{taskProgress}%</p>
            <p className="text-xs text-gray-500">{completedTasks} of {totalTasks} tasks complete</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${taskProgress}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Budget Used</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{spentBudget.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{budgetUsed}% of £{totalBudget.toLocaleString()}</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Open Items</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Note: Counts based on limited data (first 50 items) */}
              <div className="flex justify-between"><span className="text-gray-500">RFIs:</span><span className="font-medium">{project?.rfis?.filter((r: any) => r?.status !== 'CLOSED')?.length || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Submittals:</span><span className="font-medium">{project?.submittals?.filter((s: any) => s?.status !== 'APPROVED')?.length || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Defects:</span><span className="font-medium">{project?.defects?.filter((d: any) => d?.status !== 'CLOSED')?.length || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Change Orders:</span><span className="font-medium">{project?.changeOrders?.filter((c: any) => c?.status === 'PENDING')?.length || 0}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { id: "tasks", label: "Tasks", count: counts.tasks, icon: CheckCircle, color: "bg-blue-50 text-blue-600" },
          { id: "rfis", label: "RFIs", count: counts.rfis, icon: FileQuestion, color: "bg-purple-50 text-purple-600" },
          { id: "safety", label: "Safety", count: counts.safety, icon: Shield, color: "bg-red-50 text-red-600" },
          { id: "documents", label: "Documents", count: counts.documents, icon: FileText, color: "bg-green-50 text-green-600" },
        ].map(item => (
          <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(item.id)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.color}`}><item.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
