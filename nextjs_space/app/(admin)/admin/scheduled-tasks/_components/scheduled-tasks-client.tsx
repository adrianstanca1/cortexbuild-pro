"use client";

import { useState, useEffect } from "react";
import {
 Clock,
 Plus,
 Play,
 Pause,
 Edit,
 Trash2,
 RefreshCw,
 Check,
 X,
 History,
 Eye
} from "lucide-react";
import { Card, CardContent, CardTitle, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScheduledTask {
 id: string;
 name: string;
 description: string;
 cronExpression: string;
 enabled: boolean;
 lastRun: string | null;
 lastStatus: "success" | "failed" | "running" | null;
 nextRun: string | null;
 createdAt: string;
 executionCount: number;
 averageDuration: number;
}

interface TaskExecution {
 id: string;
 taskId: string;
 taskName: string;
 status: "success" | "failed" | "running";
 startedAt: string;
 completedAt: string | null;
 duration: number | null;
 output: string | null;
 error: string | null;
}

const CRON_PRESETS = [
 { label: "Every minute", value: "* * * * *" },
 { label: "Every 5 minutes", value: "*/5 * * * *" },
 { label: "Every 15 minutes", value: "*/15 * * * *" },
 { label: "Every hour", value: "0 * * * *" },
 { label: "Daily at midnight", value: "0 0 * * *" },
 { label: "Daily at 2 AM", value: "0 2 * * *" },
 { label: "Weekly on Monday", value: "0 0 * * 1" },
 { label: "Monthly on 1st", value: "0 0 1 * *" }
];

export function ScheduledTasksClient() {
 const [tasks, setTasks] = useState<ScheduledTask[]>([]);
 const [executions, setExecutions] = useState<TaskExecution[]>([]);
 const [loading, setLoading] = useState(true);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showExecutionModal, setShowExecutionModal] = useState(false);
 const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
 const [selectedExecution, setSelectedExecution] = useState<TaskExecution | null>(null);
 const [activeTab, setActiveTab] = useState("tasks");
 const [saving, setSaving] = useState(false);
 const [executing, setExecuting] = useState(false);
 const [formData, setFormData] = useState({
  name: "",
  description: "",
  cronExpression: "0 2 * * *",
  enabled: true
 });

 const fetchData = async () => {
  try {
   setLoading(true);
   const [tasksRes, executionsRes] = await Promise.all([
    fetch("/api/admin/scheduled-tasks"),
    fetch("/api/admin/scheduled-tasks/executions")
   ]);

   if (tasksRes.ok) {
    const data = await tasksRes.json();
    setTasks(data.tasks || []);
   }

   if (executionsRes.ok) {
    const data = await executionsRes.json();
    setExecutions(data.executions || []);
   }
  } catch {
   toast.error("Failed to fetch tasks");
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchData();
 }, []);

 const handleCreate = async () => {
  if (!formData.name || !formData.cronExpression) {
   toast.error("Please fill in name and cron expression");
   return;
  }

  setSaving(true);
  try {
   const res = await fetch("/api/admin/scheduled-tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
   });

   if (res.ok) {
    toast.success("Task created successfully");
    setShowCreateModal(false);
    setFormData({ name: "", description: "", cronExpression: "0 2 * * *", enabled: true });
    fetchData();
   } else {
    toast.error("Failed to create task");
   }
  } catch {
   toast.error("Failed to create task");
  } finally {
   setSaving(false);
  }
 };

 const handleUpdate = async () => {
  if (!selectedTask) return;

  setSaving(true);
  try {
   const res = await fetch(`/api/admin/scheduled-tasks/${selectedTask.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
   });

   if (res.ok) {
    toast.success("Task updated successfully");
    setShowEditModal(false);
    setSelectedTask(null);
    fetchData();
   } else {
    toast.error("Failed to update task");
   }
  } catch {
   toast.error("Failed to update task");
  } finally {
   setSaving(false);
  }
 };

 const handleDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) {
   return;
  }

  try {
   const res = await fetch(`/api/admin/scheduled-tasks/${taskId}`, {
    method: "DELETE"
   });

   if (res.ok) {
    toast.success("Task deleted successfully");
    fetchData();
   } else {
    toast.error("Failed to delete task");
   }
  } catch {
   toast.error("Failed to delete task");
  }
 };

 const handleToggleEnabled = async (task: ScheduledTask) => {
  try {
   const res = await fetch(`/api/admin/scheduled-tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: !task.enabled })
   });

   if (res.ok) {
    toast.success(`Task ${!task.enabled ? "enabled" : "disabled"} successfully`);
    fetchData();
   } else {
    toast.error("Failed to update task");
   }
  } catch {
   toast.error("Failed to update task");
  }
 };

 const handleExecuteNow = async (taskId: string) => {
  if (!confirm("Are you sure you want to execute this task now?")) {
   return;
  }

  setExecuting(true);
  try {
   const res = await fetch(`/api/admin/scheduled-tasks/${taskId}/execute`, {
    method: "POST"
   });

   if (res.ok) {
    toast.success("Task execution started");
    fetchData();
   } else {
    toast.error("Failed to execute task");
   }
  } catch {
   toast.error("Failed to execute task");
  } finally {
   setExecuting(false);
  }
 };

 const openEditModal = (task: ScheduledTask) => {
  setSelectedTask(task);
  setFormData({
   name: task.name,
   description: task.description,
   cronExpression: task.cronExpression,
   enabled: task.enabled
  });
  setShowEditModal(true);
 };

 const openExecutionModal = (execution: TaskExecution) => {
  setSelectedExecution(execution);
  setShowExecutionModal(true);
 };

 const getStatusColor = (status: string | null) => {
  switch (status) {
   case "success": return "bg-green-100 text-green-800";
   case "failed": return "bg-red-100 text-red-800";
   case "running": return "bg-blue-100 text-blue-800";
   default: return "bg-gray-100 text-gray-800";
  }
 };

 if (loading) {
  return (
   <div className="flex items-center justify-center h-96">
    <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
   </div>
  );
 }

 const enabledTasks = tasks.filter(t => t.enabled).length;
 const successRate = executions.length > 0
  ? (executions.filter(e => e.status === "success").length / executions.length) * 100
  : 0;

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
      Scheduled Tasks
     </h1>
     <p className="text-gray-500 mt-1">Manage automated tasks and cron jobs</p>
    </div>
    <Button onClick={() => setShowCreateModal(true)}>
     <Plus className="h-4 w-4 mr-2" />
     Create Task
    </Button>
   </div>

   {/* Stats Overview */}
   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Total Tasks</p>
        <p className="text-2xl font-bold mt-1">{tasks.length}</p>
       </div>
       <Clock className="h-8 w-8 text-purple-500" />
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Enabled</p>
        <p className="text-2xl font-bold mt-1">{enabledTasks}</p>
       </div>
       <Check className="h-8 w-8 text-green-500" />
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Success Rate</p>
        <p className="text-2xl font-bold mt-1">{successRate.toFixed(0)}%</p>
       </div>
       <Check className="h-8 w-8 text-blue-500" />
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-sm text-gray-500">Total Executions</p>
        <p className="text-2xl font-bold mt-1">{executions.length}</p>
       </div>
       <History className="h-8 w-8 text-orange-500" />
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Tabs */}
   <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="grid w-full grid-cols-2">
     <TabsTrigger value="tasks">
      <Clock className="h-4 w-4 mr-2" />
      Tasks
     </TabsTrigger>
     <TabsTrigger value="executions">
      <History className="h-4 w-4 mr-2" />
      Execution History
     </TabsTrigger>
    </TabsList>

    <TabsContent value="tasks" className="space-y-4">
     <Card>
      <CardContent className="p-0">
       <Table>
        <TableHeader>
         <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Cron Expression</TableHead>
          <TableHead>Last Run</TableHead>
          <TableHead>Next Run</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Executions</TableHead>
          <TableHead className="text-right">Actions</TableHead>
         </TableRow>
        </TableHeader>
        <TableBody>
         {tasks.map((task) => (
          <TableRow key={task.id}>
           <TableCell>
            <div>
             <p className="font-medium">{task.name}</p>
             {task.description && (
              <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
             )}
            </div>
           </TableCell>
           <TableCell>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
             {task.cronExpression}
            </code>
           </TableCell>
           <TableCell>
            {task.lastRun ? (
             <div className="flex items-center gap-2">
              <span className="text-sm">
               {format(new Date(task.lastRun), "MMM d, HH:mm")}
              </span>
              {task.lastStatus && (
               <Badge className={getStatusColor(task.lastStatus)}>
                {task.lastStatus}
               </Badge>
              )}
             </div>
            ) : (
             <span className="text-gray-400 text-sm">Never</span>
            )}
           </TableCell>
           <TableCell>
            {task.nextRun && task.enabled ? (
             <span className="text-sm">
              {format(new Date(task.nextRun), "MMM d, HH:mm")}
             </span>
            ) : (
             <span className="text-gray-400 text-sm">N/A</span>
            )}
           </TableCell>
           <TableCell>
            <Badge className={task.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
             {task.enabled ? "Enabled" : "Disabled"}
            </Badge>
           </TableCell>
           <TableCell>
            <span className="text-sm">{task.executionCount}</span>
           </TableCell>
           <TableCell className="text-right">
            <DropdownMenu>
             <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
               <Edit className="h-4 w-4" />
              </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExecuteNow(task.id)} disabled={!task.enabled || executing}>
               <Play className="h-4 w-4 mr-2" />
               Execute Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleEnabled(task)}>
               {task.enabled ? (
                <>
                 <Pause className="h-4 w-4 mr-2" />
                 Disable
                </>
               ) : (
                <>
                 <Play className="h-4 w-4 mr-2" />
                 Enable
                </>
               )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditModal(task)}>
               <Edit className="h-4 w-4 mr-2" />
               Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
               onClick={() => handleDelete(task.id)}
               className="text-red-600"
              >
               <Trash2 className="h-4 w-4 mr-2" />
               Delete
              </DropdownMenuItem>
             </DropdownMenuContent>
            </DropdownMenu>
           </TableCell>
          </TableRow>
         ))}
        </TableBody>
       </Table>
       {tasks.length === 0 && (
        <div className="text-center py-12">
         <Clock className="h-12 w-12 mx-auto text-gray-300" />
         <p className="mt-2 text-gray-500">No scheduled tasks</p>
         <Button onClick={() => setShowCreateModal(true)} className="mt-4">
          Create Task
         </Button>
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    <TabsContent value="executions" className="space-y-4">
     <Card>
      <CardHeader>
       <div className="flex items-center justify-between">
        <CardTitle>Execution History</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchData}>
         <RefreshCw className="h-4 w-4 mr-2" />
         Refresh
        </Button>
       </div>
      </CardHeader>
      <CardContent className="p-0">
       <Table>
        <TableHeader>
         <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Actions</TableHead>
         </TableRow>
        </TableHeader>
        <TableBody>
         {executions.map((execution) => (
          <TableRow key={execution.id}>
           <TableCell className="font-medium">{execution.taskName}</TableCell>
           <TableCell>
            <Badge className={getStatusColor(execution.status)}>
             {execution.status === "running" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
             {execution.status === "success" && <Check className="h-3 w-3 mr-1" />}
             {execution.status === "failed" && <X className="h-3 w-3 mr-1" />}
             {execution.status}
            </Badge>
           </TableCell>
           <TableCell>
            <span className="text-sm">
             {format(new Date(execution.startedAt), "MMM d, HH:mm:ss")}
            </span>
           </TableCell>
           <TableCell>
            {execution.duration ? (
             <span className="text-sm">{execution.duration}ms</span>
            ) : (
             <span className="text-gray-400 text-sm">Running...</span>
            )}
           </TableCell>
           <TableCell className="text-right">
            <Button
             variant="ghost"
             size="sm"
             onClick={() => openExecutionModal(execution)}
            >
             <Eye className="h-4 w-4" />
            </Button>
           </TableCell>
          </TableRow>
         ))}
        </TableBody>
       </Table>
       {executions.length === 0 && (
        <div className="text-center py-12">
         <History className="h-12 w-12 mx-auto text-gray-300" />
         <p className="mt-2 text-gray-500">No execution history</p>
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>
   </Tabs>

   {/* Create/Edit Task Modal */}
   {[
    { open: showCreateModal, setOpen: setShowCreateModal, title: "Create Task", action: handleCreate },
    { open: showEditModal, setOpen: setShowEditModal, title: "Edit Task", action: handleUpdate }
   ].map(({ open, setOpen, title, action }, idx) => (
    <Dialog key={idx} open={open} onOpenChange={setOpen}>
     <DialogContent className="max-w-md">
      <DialogHeader>
       <DialogTitle className="flex items-center gap-2">
        {idx === 0 ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
        {title}
       </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
       <div>
        <Label>Task Name *</Label>
        <Input
         value={formData.name}
         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
         placeholder="Send Daily Report"
        />
       </div>
       <div>
        <Label>Description</Label>
        <Textarea
         value={formData.description}
         onChange={(e) => setFormData({ ...formData, description: e.target.value })}
         placeholder="Generates and sends daily report to admins"
         rows={2}
        />
       </div>
       <div>
        <Label>Cron Expression *</Label>
        <Input
         value={formData.cronExpression}
         onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
         placeholder="0 2 * * *"
        />
        <div className="mt-2">
         <Label className="text-xs text-gray-500">Quick presets:</Label>
         <div className="grid grid-cols-2 gap-2 mt-1">
          {CRON_PRESETS.slice(0, 4).map((preset) => (
           <Button
            key={preset.value}
            variant="outline"
            size="sm"
            onClick={() => setFormData({ ...formData, cronExpression: preset.value })}
            className="text-xs h-7"
           >
            {preset.label}
           </Button>
          ))}
         </div>
        </div>
       </div>
       <div className="flex items-center gap-2">
        <input
         type="checkbox"
         id={`enabled-${idx}`}
         checked={formData.enabled}
         onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
         className="rounded"
        />
        <Label htmlFor={`enabled-${idx}`}>Enable task</Label>
       </div>
       <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
         Cancel
        </Button>
        <Button className="flex-1" onClick={action} disabled={saving}>
         {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
         {idx === 0 ? "Create" : "Update"}
        </Button>
       </div>
      </div>
     </DialogContent>
    </Dialog>
   ))}

   {/* Execution Details Modal */}
   <Dialog open={showExecutionModal} onOpenChange={setShowExecutionModal}>
    <DialogContent className="max-w-2xl">
     <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
       <Eye className="h-5 w-5" />
       Execution Details
      </DialogTitle>
     </DialogHeader>
     {selectedExecution && (
      <div className="space-y-4 mt-4">
       <div className="grid grid-cols-2 gap-4">
        <div>
         <Label className="text-xs text-gray-500">Task</Label>
         <p className="font-medium mt-1">{selectedExecution.taskName}</p>
        </div>
        <div>
         <Label className="text-xs text-gray-500">Status</Label>
         <div className="mt-1">
          <Badge className={getStatusColor(selectedExecution.status)}>
           {selectedExecution.status}
          </Badge>
         </div>
        </div>
        <div>
         <Label className="text-xs text-gray-500">Started At</Label>
         <p className="text-sm mt-1">
          {format(new Date(selectedExecution.startedAt), "MMM d, yyyy HH:mm:ss")}
         </p>
        </div>
        <div>
         <Label className="text-xs text-gray-500">Duration</Label>
         <p className="text-sm mt-1">
          {selectedExecution.duration ? `${selectedExecution.duration}ms` : "Running..."}
         </p>
        </div>
       </div>

       {selectedExecution.output && (
        <div>
         <Label className="text-xs text-gray-500">Output</Label>
         <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border max-h-60 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">{selectedExecution.output}</pre>
         </div>
        </div>
       )}

       {selectedExecution.error && (
        <div>
         <Label className="text-xs text-gray-500">Error</Label>
         <div className="mt-1 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-h-60 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap text-red-900 dark:text-red-100">
           {selectedExecution.error}
          </pre>
         </div>
        </div>
       )}

       <Button variant="outline" className="w-full" onClick={() => setShowExecutionModal(false)}>
        Close
       </Button>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 );
}
