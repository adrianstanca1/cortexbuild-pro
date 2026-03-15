"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Timer,
  FolderKanban,
  Loader2,
  User,
  TrendingUp,
  PoundSterling,
  FileSpreadsheet,
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
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/components/realtime-provider";

interface Project {
  id: string;
  name: string;
}
interface TaskOption {
  id: string;
  title: string;
  projectId: string;
}
interface TeamMember {
  id: string;
  user: { id: string; name: string; email: string };
}
interface TimeEntry {
  id: string;
  projectId: string;
  project: { id: string; name: string };
  taskId?: string;
  task?: { id: string; title: string };
  userId: string;
  user: { id: string; name: string; email: string };
  date: string;
  hours: number;
  description?: string;
  billable: boolean;
  hourlyRate?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: { id: string; name: string };
  approvedAt?: string;
}

interface TimeTrackingClientProps {
  projects: Project[];
  tasks: TaskOption[];
  initialEntries: TimeEntry[];
  teamMembers: TeamMember[];
  currentUserId: string;
  userRole: string;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export default function TimeTrackingClient({
  projects,
  tasks,
  initialEntries,
  teamMembers,
  currentUserId,
  userRole,
}: TimeTrackingClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    taskId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    description: "",
    billable: true,
    hourlyRate: "",
  });

  const canApprove = [
    "ADMIN",
    "PROJECT_MANAGER",
    "COMPANY_OWNER",
    "SUPER_ADMIN",
  ].includes(userRole);

  const handleRealtimeEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["time_entry_created", "time_entry_updated", "time_entry_deleted"],
    handleRealtimeEvent,
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const filteredEntries = entries.filter((e) => {
    if (projectFilter !== "all" && e.projectId !== projectFilter) return false;
    if (userFilter !== "all" && e.userId !== userFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const weekEntries = filteredEntries.filter((e) => {
    const entryDate = parseISO(e.date);
    return (
      entryDate >= weekStart &&
      entryDate <= endOfWeek(weekStart, { weekStartsOn: 1 })
    );
  });

  // Stats
  const stats = useMemo(() => {
    const weekHours = weekEntries.reduce((sum, e) => sum + e.hours, 0);
    const billableHours = weekEntries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + e.hours, 0);
    const pendingCount = entries.filter((e) => e.status === "PENDING").length;
    const billableAmount = weekEntries
      .filter((e) => e.billable && e.hourlyRate)
      .reduce((sum, e) => sum + e.hours * (e.hourlyRate || 0), 0);
    return { weekHours, billableHours, pendingCount, billableAmount };
  }, [weekEntries, entries]);

  const resetForm = () => {
    setFormData({
      projectId: "",
      taskId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      hours: "",
      description: "",
      billable: true,
      hourlyRate: "",
    });
    setEditingEntry(null);
  };

  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      projectId: entry.projectId,
      taskId: entry.taskId || "",
      date: entry.date.split("T")[0],
      hours: String(entry.hours),
      description: entry.description || "",
      billable: entry.billable,
      hourlyRate: entry.hourlyRate ? String(entry.hourlyRate) : "",
    });
    setShowNewModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.date || !formData.hours) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingEntry
        ? `/api/time-entries/${editingEntry.id}`
        : "/api/time-entries";
      const method = editingEntry ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(editingEntry ? "Time entry updated" : "Time entry created");
      setShowNewModal(false);
      resetForm();
      router.refresh();
    } catch (_error) {
      toast.error("Failed to save time entry");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success(
        status === "APPROVED" ? "Time entry approved" : "Time entry rejected",
      );
      router.refresh();
    } catch (_error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Time entry deleted");
      router.refresh();
    } catch (_error) {
      toast.error("Failed to delete");
    }
  };

  const projectTasks = formData.projectId
    ? tasks.filter((t) => t.projectId === formData.projectId)
    : [];

  const getEntriesForDay = (day: Date) =>
    weekEntries.filter((e) => isSameDay(parseISO(e.date), day));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Time Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Log and manage work hours
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowNewModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Time
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.weekHours.toFixed(1)}h
                </p>
                <p className="text-xs text-gray-500">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.billableHours.toFixed(1)}h
                </p>
                <p className="text-xs text-gray-500">Billable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-xs text-gray-500">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PoundSterling className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  £{stats.billableAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Billable Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[200px] text-center">
                {format(weekStart, "MMM d")} -{" "}
                {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
                }
              >
                Today
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canApprove && (
                <Select value="all" onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEntries = getEntriesForDay(day);
          const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={day.toISOString()}
              className={isToday ? "ring-2 ring-blue-500" : ""}
            >
              <CardHeader className="pb-2 p-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{format(day, "EEE")}</p>
                  <p
                    className={`text-lg font-bold ${isToday ? "text-blue-600" : ""}`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {dayEntries.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center">
                    No entries
                  </p>
                ) : (
                  dayEntries.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => openEditModal(entry)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {entry.hours}h
                        </span>
                        <Badge
                          className={`text-[10px] ${statusConfig[entry.status].color}`}
                        >
                          {entry.status[0]}
                        </Badge>
                      </div>
                      <p className="text-gray-500 truncate">
                        {entry.project.name}
                      </p>
                    </div>
                  ))
                )}
                {dayEntries.length > 3 && (
                  <p className="text-xs text-gray-400 text-center">
                    +{dayEntries.length - 3} more
                  </p>
                )}
                <div className="pt-2 border-t text-center">
                  <span className="text-sm font-medium">{dayTotal}h</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEntries.slice(0, 20).map((entry) => {
              const StatusIcon = statusConfig[entry.status].icon;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-bold">{entry.hours}</p>
                      <p className="text-xs text-gray-500">hours</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {entry.project.name}
                        </span>
                        {entry.task && (
                          <span className="text-sm text-gray-500">
                            • {entry.task.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(entry.date), "MMM d, yyyy")} •{" "}
                        {entry.user.name}
                      </p>
                      {entry.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[entry.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[entry.status].label}
                    </Badge>
                    {entry.billable && entry.hourlyRate && (
                      <Badge variant="outline">
                        £{(entry.hours * entry.hourlyRate).toFixed(0)}
                      </Badge>
                    )}
                    {canApprove && entry.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(entry.id, "APPROVED")}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(entry.id, "REJECTED")}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(entry)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={showNewModal}
        onOpenChange={(open) => {
          setShowNewModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Time Entry" : "Log Time"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project *</label>
              <Select
                value={formData.projectId}
                onValueChange={(val) =>
                  setFormData({ ...formData, projectId: val, taskId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {projectTasks.length > 0 && (
              <div>
                <label className="text-sm font-medium">Task (Optional)</label>
                <Select
                  value={formData.taskId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, taskId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No task</SelectItem>
                    {projectTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hours *</label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What did you work on?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={formData.billable}
                  onChange={(e) =>
                    setFormData({ ...formData, billable: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="billable" className="text-sm">
                  Billable
                </label>
              </div>
              {formData.billable && (
                <div>
                  <label className="text-sm font-medium">Rate (£/hr)</label>
                  <Input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRate: e.target.value })
                    }
                    placeholder="50.00"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEntry ? "Update" : "Log Time"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
