"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isPast, isToday, isFuture, addDays } from "date-fns";
import {
  Flag, Plus, Search, Filter, Calendar, CheckCircle2, Clock,
  AlertTriangle, Target, MoreVertical, Edit, Trash2, ChevronRight,
  FolderKanban, Loader2, AlertCircle, TrendingUp, Milestone as MilestoneIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/components/realtime-provider";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Milestone {
  id: string;
  name: string;
  description?: string;
  targetDate: string;
  actualDate?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "AT_RISK";
  percentComplete: number;
  sortOrder: number;
  isCritical: boolean;
  dependencies: string[];
  notes?: string;
  projectId: string;
  project: { id: string; name: string };
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface MilestonesClientProps {
  projects: Project[];
  initialMilestones: Milestone[];
}

const statusConfig = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-800", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: TrendingUp },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  DELAYED: { label: "Delayed", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  AT_RISK: { label: "At Risk", color: "bg-amber-100 text-amber-800", icon: AlertCircle }
};

export default function MilestonesClient({ projects, initialMilestones }: MilestonesClientProps) {
  const router = useRouter();
  const [milestones, _setMilestones] = useState<Milestone[]>(initialMilestones);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(false);
  const [_viewMode, _setViewMode] = useState<"timeline" | "list">("timeline");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
    targetDate: "",
    status: "NOT_STARTED",
    percentComplete: "0",
    isCritical: false,
    notes: ""
  });

  const handleRealtimeEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["milestone_created", "milestone_updated", "milestone_deleted"],
    handleRealtimeEvent
  );

  const filteredMilestones = milestones.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (projectFilter !== "all" && m.projectId !== projectFilter) return false;
    return true;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      projectId: "",
      targetDate: "",
      status: "NOT_STARTED",
      percentComplete: "0",
      isCritical: false,
      notes: ""
    });
    setEditingMilestone(null);
  };

  const openEditModal = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      name: milestone.name,
      description: milestone.description || "",
      projectId: milestone.projectId,
      targetDate: milestone.targetDate.split("T")[0],
      status: milestone.status,
      percentComplete: String(milestone.percentComplete),
      isCritical: milestone.isCritical,
      notes: milestone.notes || ""
    });
    setShowNewModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.projectId || !formData.targetDate) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingMilestone 
        ? `/api/milestones/${editingMilestone.id}` 
        : "/api/milestones";
      const method = editingMilestone ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed to save milestone");

      toast.success(editingMilestone ? "Milestone updated" : "Milestone created");
      setShowNewModal(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error("Failed to save milestone");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;

    try {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Milestone deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete milestone");
    }
  };

  const getMilestoneUrgency = (milestone: Milestone) => {
    if (milestone.status === "COMPLETED") return "completed";
    const target = new Date(milestone.targetDate);
    if (isPast(target)) return "overdue";
    if (isToday(target)) return "today";
    if (isFuture(target) && target <= addDays(new Date(), 7)) return "upcoming";
    return "future";
  };

  // Stats
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === "COMPLETED").length,
    inProgress: milestones.filter(m => m.status === "IN_PROGRESS").length,
    atRisk: milestones.filter(m => m.status === "AT_RISK" || m.status === "DELAYED").length,
    critical: milestones.filter(m => m.isCritical && m.status !== "COMPLETED").length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Milestones</h1>
          <p className="text-gray-600 dark:text-gray-400">Track project milestones and deadlines</p>
        </div>
        <Button onClick={() => { resetForm(); setShowNewModal(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Flag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.atRisk}</p>
                <p className="text-xs text-gray-500">At Risk/Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search milestones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No milestones found</h3>
                <p className="text-gray-500 mt-1">Create your first milestone to start tracking progress</p>
                <Button className="mt-4" onClick={() => { resetForm(); setShowNewModal(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map((milestone, index) => {
              const StatusIcon = statusConfig[milestone.status].icon;
              const urgency = getMilestoneUrgency(milestone);
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`hover:shadow-md transition-shadow ${
                    urgency === "overdue" ? "border-l-4 border-l-red-500" :
                    urgency === "today" ? "border-l-4 border-l-amber-500" :
                    urgency === "completed" ? "border-l-4 border-l-green-500" : ""
                  }`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {milestone.name}
                            </h3>
                            {milestone.isCritical && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                            <Badge className={statusConfig[milestone.status].color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[milestone.status].label}
                            </Badge>
                          </div>
                          
                          {milestone.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {milestone.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <FolderKanban className="h-4 w-4" />
                              {milestone.project.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(milestone.targetDate), "MMM d, yyyy")}
                              {urgency === "overdue" && (
                                <span className="text-red-500 ml-1">
                                  ({formatDistanceToNow(new Date(milestone.targetDate))} overdue)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{milestone.percentComplete}%</span>
                            </div>
                            <Progress value={milestone.percentComplete} className="h-2" />
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(milestone)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(milestone.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showNewModal} onOpenChange={(open) => { setShowNewModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Milestone name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Project *</label>
              <Select
                value={formData.projectId}
                onValueChange={(val) => setFormData({ ...formData, projectId: val })}
              >
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
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Milestone description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Date *</label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Progress (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentComplete}
                  onChange={(e) => setFormData({ ...formData, percentComplete: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isCritical"
                  checked={formData.isCritical}
                  onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isCritical" className="text-sm font-medium">Critical Milestone</label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowNewModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMilestone ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
