"use client";

import React, { useState } from "react";
import { WorkflowEditor, WorkflowSaveData } from "@/components/dashboard/workflows/workflow-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Activity,
  Plus,
  Play,
  MoreVertical,
  Power,
  Clock,
  Zap,
  Database,
  Mail,
  Webhook,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  projectId?: string | null;
  triggerType: string;
  triggerCondition: unknown;
  actions: unknown[];
  isActive: boolean;
  lastTriggeredAt?: Date | null;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  executionLogs?: {
    id: string;
    executedAt: string;
    success: boolean;
    errorMessage?: string | null;
  }[];
}

interface WorkflowsClientProps {
  workflows: Workflow[];
}

export function WorkflowsClient({ workflows }: WorkflowsClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType?.toUpperCase()) {
      case "WEBHOOK":
        return <Webhook className="h-4 w-4" />;
      case "EVENT":
      case "RECORD":
        return <Database className="h-4 w-4" />;
      case "SCHEDULE":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTriggerColor = (triggerType: string) => {
    switch (triggerType?.toUpperCase()) {
      case "WEBHOOK":
        return "bg-blue-500";
      case "EVENT":
      case "RECORD":
        return "bg-purple-500";
      case "SCHEDULE":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleSaveWorkflow = async (data: WorkflowSaveData) => {
    const url = selectedWorkflow
      ? `/api/workflows/${selectedWorkflow.id}`
      : "/api/workflows";

    const response = await fetch(url, {
      method: selectedWorkflow ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save");
    }

    setIsCreateOpen(false);
    setIsEditorOpen(false);
    setSelectedWorkflow(null);
    window.location.reload();
  };

  const handleToggleActive = async (workflow: Workflow) => {
    const response = await fetch(`/api/workflows/${workflow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !workflow.isActive }),
    });

    if (response.ok) {
      toast.success(workflow.isActive ? "Workflow disabled" : "Workflow enabled");
      window.location.reload();
    } else {
      toast.error("Failed to update workflow");
    }
  };

  const handleExecute = async (workflow: Workflow) => {
    const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { test: true } }),
    });

    if (response.ok) {
      toast.success("Workflow executed");
    } else {
      toast.error("Failed to execute workflow");
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!confirm(`Delete workflow "${workflow.name}"?`)) return;

    const response = await fetch(`/api/workflows/${workflow.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toast.success("Workflow deleted");
      window.location.reload();
    } else {
      toast.error("Failed to delete workflow");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Workflows</h1>
          <p className="text-gray-500 mt-1">
            Build visual automation workflows with triggers and actions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500 mb-4">
                Choose a starting point for your automation workflow.
              </p>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-auto justify-start p-4"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditorOpen(true);
                  }}
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center mr-3">
                    <Webhook className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Webhook Trigger</div>
                    <div className="text-sm text-gray-500">
                      Trigger workflow when HTTP request received
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start p-4"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditorOpen(true);
                  }}
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center mr-3">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Record Event</div>
                    <div className="text-sm text-gray-500">
                      Trigger when database record created/updated
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start p-4"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditorOpen(true);
                  }}
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center mr-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Schedule</div>
                    <div className="text-sm text-gray-500">
                      Run workflow at scheduled times
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? "Edit Workflow" : "New Workflow"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden -mx-6">
            <WorkflowEditor
              initialWorkflow={
                selectedWorkflow
                  ? {
                      id: selectedWorkflow.id,
                      name: selectedWorkflow.name,
                      description: selectedWorkflow.description || undefined,
                      flow: (selectedWorkflow.triggerCondition as { flow?: { nodes: []; edges: [] } })?.flow,
                    }
                  : undefined
              }
              onSave={handleSaveWorkflow}
              organizationId=""
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter((w) => w.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.triggerCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Executions</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + (w.executionLogs?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No workflows yet</p>
              <p className="text-sm">Create your first automation workflow</p>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className={workflow.isActive ? "" : "opacity-60"}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg ${getTriggerColor(workflow.triggerType)} flex items-center justify-center`}
                  >
                    {getTriggerIcon(workflow.triggerType)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {workflow.description || "No description"}
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedWorkflow(workflow);
                      setIsEditorOpen(true);
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExecute(workflow)}>
                      <Play className="h-4 w-4 mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(workflow)}>
                      <Power className="h-4 w-4 mr-2" />
                      {workflow.isActive ? "Disable" : "Enable"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(workflow)}
                    >
                      <MoreVertical className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Trigger:</span>{" "}
                    {workflow.triggerType}
                  </div>
                  <div>
                    <span className="font-medium">Actions:</span>{" "}
                    {(workflow.actions as []).length}
                  </div>
                  <div>
                    <span className="font-medium">Executions:</span>{" "}
                    {workflow.triggerCount}
                  </div>
                  {workflow.lastTriggeredAt && (
                    <div>
                      <span className="font-medium">Last run:</span>{" "}
                      {new Date(workflow.lastTriggeredAt).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="text-xs">
                    Created by {workflow.createdBy?.name || "Unknown"}
                  </div>
                </div>
                {workflow.executionLogs && workflow.executionLogs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs font-medium mb-2">Recent executions:</div>
                    <div className="space-y-1">
                      {workflow.executionLogs.slice(0, 3).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {log.success ? (
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            )}
                            <span>
                              {new Date(log.executedAt).toLocaleString()}
                            </span>
                          </div>
                          {!log.success && log.errorMessage && (
                            <span className="text-red-500 truncate max-w-[200px]">
                              {log.errorMessage}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
