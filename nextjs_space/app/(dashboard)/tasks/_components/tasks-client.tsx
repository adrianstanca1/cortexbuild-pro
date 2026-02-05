"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import {
  Plus, Search, ListTodo, User, Clock, Loader2, LayoutGrid, List,
  GanttChart as GanttIcon, Filter, Calendar, AlertCircle, CheckCircle2,
  ChevronRight, Target, Flame, TrendingUp, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { KanbanBoard } from "./kanban-board";
import { TaskCard, TaskDetailDialog } from "@/components/ui/task-card";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { GanttChart } from "@/components/ui/gantt-chart";

interface TasksClientProps {
  tasks: any[];
  projects: any[];
  teamMembers: any[];
}

const statusColors = {
  TODO: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400" },
  IN_PROGRESS: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  REVIEW: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  COMPLETE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" }
} as const;

const priorityConfig = {
  LOW: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  MEDIUM: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  CRITICAL: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" }
} as const;

export function TasksClient({ tasks, projects, teamMembers }: TasksClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "gantt">("list");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "MEDIUM",
    status: "TODO",
    assigneeId: "",
    dueDate: ""
  });

  const handleTaskEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['task_created', 'task_updated', 'task_deleted'],
    handleTaskEvent,
    []
  );

  const filteredTasks = (tasks ?? [])?.filter((task: any) => {
    const matchesSearch = (task?.title ?? "")?.toLowerCase()?.includes(search?.toLowerCase() ?? "");
    const matchesStatus = statusFilter === "all" || task?.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task?.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate stats
  const stats = {
    total: tasks?.length ?? 0,
    todo: tasks?.filter(t => t?.status === "TODO")?.length ?? 0,
    inProgress: tasks?.filter(t => t?.status === "IN_PROGRESS")?.length ?? 0,
    review: tasks?.filter(t => t?.status === "REVIEW")?.length ?? 0,
    complete: tasks?.filter(t => t?.status === "COMPLETE")?.length ?? 0,
    overdue: tasks?.filter(t => t?.dueDate && isPast(new Date(t.dueDate)) && t?.status !== "COMPLETE")?.length ?? 0,
    critical: tasks?.filter(t => t?.priority === "CRITICAL" && t?.status !== "COMPLETE")?.length ?? 0,
    dueToday: tasks?.filter(t => t?.dueDate && isToday(new Date(t.dueDate)))?.length ?? 0
  };

  const handleCreateTask = async () => {
    if (!newTask.title?.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!newTask.projectId) {
      toast.error("Please select a project");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate || null,
          assigneeId: newTask.assigneeId || null
        })
      });
      if (res.ok) {
        toast.success("Task created!");
        setShowNewTaskModal(false);
        setNewTask({ title: "", description: "", projectId: "", priority: "MEDIUM", status: "TODO", assigneeId: "", dueDate: "" });
        router.refresh();
      } else {
        toast.error("Failed to create task");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      toast.success("Task updated!");
      router.refresh();
    } catch (e) {
      toast.error("Failed to update task");
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track all tasks across projects</p>
        </div>
        <Dialog open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                <Input
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project *</label>
                <Select value={newTask.projectId} onValueChange={(v) => setNewTask({ ...newTask, projectId: v })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {(projects ?? [])?.map((p: any) => (
                      <SelectItem key={p?.id ?? Math.random()} value={p?.id ?? ""}>{p?.name ?? "Unknown"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <Textarea
                  placeholder="Add task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                  <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="h-11" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assignee</label>
                <Select value={newTask.assigneeId} onValueChange={(v) => setNewTask({ ...newTask, assigneeId: v })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    {(teamMembers ?? [])?.filter((tm: any) => tm?.userId || tm?.user?.id).map((tm: any) => (
                      <SelectItem key={tm?.id ?? Math.random()} value={tm?.userId || tm?.user?.id}>{tm?.user?.name ?? "Unknown"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTask} disabled={loading} className="w-full h-11 bg-gradient-to-r from-primary to-purple-600">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <ListTodo className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.review}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.complete}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.critical}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              {/* View Toggle */}
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium border-x border-slate-200 dark:border-slate-700 transition-colors ${
                    viewMode === "kanban"
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  onClick={() => setViewMode("gantt")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === "gantt"
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <GanttIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Gantt</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks View */}
      {viewMode === "gantt" ? (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <GanttChart
              items={filteredTasks.filter((t: any) => t.dueDate).map((t: any) => ({
                id: t.id,
                name: t.title,
                startDate: t.createdAt || new Date().toISOString(),
                endDate: t.dueDate || new Date().toISOString(),
                progress: t.status === "COMPLETE" ? 100 : t.status === "REVIEW" ? 75 : t.status === "IN_PROGRESS" ? 50 : 0,
                type: "task" as const,
                status: t.status,
                assignee: t.assignee?.name
              }))}
              onItemClick={(item) => {
                const task = filteredTasks.find((t: any) => t.id === item.id);
                if (task) setSelectedTask(task);
              }}
            />
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        <KanbanBoard tasks={filteredTasks} onStatusChange={handleUpdateStatus} />
      ) : filteredTasks?.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <ListTodo className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No tasks found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Create your first task to get started</p>
            <Button onClick={() => setShowNewTaskModal(true)} className="bg-gradient-to-r from-primary to-purple-600">
              <Plus className="h-4 w-4 mr-2" /> Create Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks?.map((task: any) => {
            const isOverdue = task?.dueDate && isPast(new Date(task.dueDate)) && task?.status !== "COMPLETE";
            const statusStyle = statusColors[task?.status as keyof typeof statusColors] || statusColors.TODO;
            const priorityStyle = priorityConfig[task?.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;

            return (
              <Card
                key={task?.id}
                className={`border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group ${
                  isOverdue ? "border-l-4 border-l-red-500" : ""
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {task?.title ?? "Untitled"}
                        </h3>
                        <Badge className={`${priorityStyle.bg} ${priorityStyle.text} text-xs px-2 py-0.5`}>
                          {task?.priority ?? "MEDIUM"}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {task?.project?.name ?? "No project"}
                        </span>
                        {task?.assignee && (
                          <span className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                              {task.assignee.name?.charAt(0)?.toUpperCase()}
                            </div>
                            {task.assignee.name}
                          </span>
                        )}
                        {task?.dueDate && (
                          <span className={`flex items-center gap-1.5 ${isOverdue ? "text-red-500" : ""}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <Select value={task?.status ?? "TODO"} onValueChange={(v) => handleUpdateStatus(task?.id ?? "", v)}>
                        <SelectTrigger className={`w-36 h-9 ${statusStyle.bg} ${statusStyle.text} border-0`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="REVIEW">Review</SelectItem>
                          <SelectItem value="COMPLETE">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={(taskId, status) => {
          handleUpdateStatus(taskId, status);
          if (selectedTask) {
            setSelectedTask({ ...selectedTask, status });
          }
        }}
      />
    </div>
  );
}
