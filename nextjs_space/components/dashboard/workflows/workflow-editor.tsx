"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  TriggerNode,
  ActionNode,
  ConditionNode,
  WorkflowNodeData,
  WorkflowNodeType
} from "./node-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Plus, Save, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

const nodeTypes: Record<string, React.ComponentType<any>> = {
  "trigger-webhook": TriggerNode,
  "trigger-record": TriggerNode,
  "trigger-schedule": TriggerNode,
  "action-email": ActionNode,
  "action-record": ActionNode,
  "action-webhook": ActionNode,
  "action-notification": ActionNode,
  "condition-if": ConditionNode,
  "condition-switch": ConditionNode
};

interface WorkflowEditorProps {
  workflowId?: string;
  initialWorkflow?: {
    id: string;
    name: string;
    description?: string;
    flow?: { nodes: Node[]; edges: Edge[] };
  };
  onSave?: (workflowData: WorkflowSaveData) => Promise<void>;
  organizationId: string;
}

export interface WorkflowSaveData {
  name: string;
  description?: string;
  triggerType: string;
  triggerCondition: Record<string, unknown>;
  actions: Record<string, unknown>[];
  flow: {
    nodes: Node[];
    edges: Edge[];
  };
}

function WorkflowEditorContent({
  workflowId,
  initialWorkflow,
  onSave,
  organizationId
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.flow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow?.flow?.edges || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || "New Workflow");
  const [workflowDescription, setWorkflowDescription] = useState(
    initialWorkflow?.description || ""
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setIsConfigOpen(true);
    },
    []
  );

  const addNode = useCallback(
    (type: WorkflowNodeType, label: string, description?: string) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 200 + 100
        },
        data: {
          label,
          description,
          config: {}
        }
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const updateNodeConfig = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, config } }
            : node
        )
      );
      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, config } });
    },
    [selectedNode, setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setIsConfigOpen(false);
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const extractWorkflowData = useCallback((): WorkflowSaveData => {
    // Find trigger nodes
    const triggerNodes = nodes.filter((n) => n.type?.startsWith("trigger"));
    const actionNodes = nodes.filter((n) => n.type?.startsWith("action"));
    const conditionNodes = nodes.filter((n) => n.type?.startsWith("condition"));

    // Determine primary trigger type
    const primaryTrigger = triggerNodes[0];
    const triggerType = primaryTrigger?.type?.replace("trigger-", "").toUpperCase() || "WEBHOOK";

    // Build trigger condition from first trigger node
    const triggerCondition = {
      type: triggerType,
      config: primaryTrigger?.data?.config || {},
      nodes: triggerNodes.map((n) => ({
        id: n.id,
        type: n.type,
        config: n.data.config
      }))
    };

    // Build actions array from action nodes
    const actions = actionNodes.map((n) => ({
      type: n.type?.replace("action-", "").toUpperCase(),
      config: n.data.config || {},
      nodeId: n.id
    }));

    // Add conditions
    const conditions = conditionNodes.map((n) => ({
      type: "CONDITION",
      conditionType: n.type?.replace("condition-", "").toUpperCase(),
      config: n.data.config || {},
      nodeId: n.id
    }));

    return {
      name: workflowName,
      description: workflowDescription,
      triggerType,
      triggerCondition,
      actions: [...actions, ...conditions],
      flow: {
        nodes: nodes as Node[],
        edges: edges as Edge[]
      }
    };
  }, [nodes, edges, workflowName, workflowDescription]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const workflowData = extractWorkflowData();
      if (onSave) {
        await onSave(workflowData);
      }
      toast.success("Workflow saved successfully");
    } catch (error) {
      toast.error("Failed to save workflow");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    // Execute workflow - this would call the API
    toast.info("Workflow execution triggered");
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="Workflow Name"
          />
          <input
            type="text"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="text-sm text-gray-500 border-none bg-transparent focus:outline-none w-64"
            placeholder="Description..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExecute}>
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Node Palette */}
        <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Triggers</h3>
          <div className="space-y-2 mb-4">
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("trigger-webhook", "Webhook", "HTTP webhook received")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Webhook
            </Button>
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("trigger-record", "Record Created", "New database record")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Record Created
            </Button>
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("trigger-schedule", "Schedule", "Time-based trigger")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Schedule
            </Button>
          </div>

          <h3 className="text-sm font-semibold mb-3">Actions</h3>
          <div className="space-y-2 mb-4">
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("action-email", "Send Email", "Send email notification")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Send Email
            </Button>
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("action-record", "Create Record", "Create database record")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Create Record
            </Button>
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("action-webhook", "Call Webhook", "External API call")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Call Webhook
            </Button>
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("action-notification", "Notify", "Send notification")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Notify
            </Button>
          </div>

          <h3 className="text-sm font-semibold mb-3">Conditions</h3>
          <div className="space-y-2">
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("condition-if", "If/Else", "Conditional branching")}
            >
              <Plus className="h-3 w-3 mr-2" />
              If/Else
            </Button>
            <Button
              variant="subtle"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("condition-switch", "Switch", "Multi-branch condition")}
            >
              <Plus className="h-3 w-3 mr-2" />
              Switch
            </Button>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 h-[600px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type?.includes("trigger")) return "#3b82f6";
                if (node.type?.includes("action")) return "#22c55e";
                if (node.type?.includes("condition")) return "#f59e0b";
                return "#6366f1";
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {(selectedNode?.data as any)?.label}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedNode && (
              <NodeConfigForm
                nodeType={selectedNode.type as WorkflowNodeType}
                config={selectedNode.data.config as Record<string, string | number | boolean | null> || {}}
                onChange={updateNodeConfig}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="destructive" size="sm" onClick={() => deleteNode(selectedNode?.id || "")}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsConfigOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NodeConfigForm({
  nodeType,
  config,
  onChange
}: {
  nodeType: WorkflowNodeType;
  config: Record<string, string | number | boolean | null>;
  onChange: (config: Record<string, string | number | boolean | null>) => void;
}) {
  const [localConfig, setLocalConfig] = useState<Record<string, string>>(
    Object.keys(config).reduce((acc, key) => ({ ...acc, [key]: String(config[key]) }), {})
  );

  const handleChange = (key: string, value: string) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const renderFields = () => {
    switch (nodeType) {
      case "trigger-webhook":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Webhook Path</label>
              <input
                type="text"
                value={localConfig.path || ""}
                onChange={(e) => handleChange("path", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="/api/webhooks/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">HTTP Method</label>
              <select
                value={localConfig.method || "POST"}
                onChange={(e) => handleChange("method", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        );

      case "trigger-record":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Model</label>
              <select
                value={localConfig.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select model...</option>
                <option value="Project">Project</option>
                <option value="Task">Task</option>
                <option value="RFI">RFI</option>
                <option value="ChangeOrder">Change Order</option>
                <option value="SafetyIncident">Safety Incident</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Event</label>
              <select
                value={localConfig.event || "created"}
                onChange={(e) => handleChange("event", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
        );

      case "trigger-schedule":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Schedule Type</label>
              <select
                value={localConfig.scheduleType || "daily"}
                onChange={(e) => handleChange("scheduleType", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom (cron)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <input
                type="time"
                value={localConfig.time || "09:00"}
                onChange={(e) => handleChange("time", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        );

      case "action-email":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Recipients</label>
              <input
                type="text"
                value={localConfig.recipients || ""}
                onChange={(e) => handleChange("recipients", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="role:PM,user@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input
                type="text"
                value={localConfig.subject || ""}
                onChange={(e) => handleChange("subject", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <textarea
                value={localConfig.body || ""}
                onChange={(e) => handleChange("body", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Email body (supports {{variables}})"
              />
            </div>
          </div>
        );

      case "action-webhook":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL</label>
              <input
                type="url"
                value={localConfig.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://api.example.com/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Method</label>
              <select
                value={localConfig.method || "POST"}
                onChange={(e) => handleChange("method", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        );

      case "action-record":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Model</label>
              <select
                value={localConfig.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select model...</option>
                <option value="Project">Project</option>
                <option value="Task">Task</option>
                <option value="RFI">RFI</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Data (JSON)</label>
              <textarea
                value={localConfig.data || ""}
                onChange={(e) => handleChange("data", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                rows={3}
                placeholder='{"field": "value"}'
              />
            </div>
          </div>
        );

      case "condition-if":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Field</label>
              <input
                type="text"
                value={localConfig.field || ""}
                onChange={(e) => handleChange("field", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Field to check"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Operator</label>
              <select
                value={localConfig.operator || "equals"}
                onChange={(e) => handleChange("operator", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="empty">Is Empty</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Value</label>
              <input
                type="text"
                value={localConfig.value || ""}
                onChange={(e) => handleChange("value", e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Value to compare"
              />
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Configuration not implemented</p>;
    }
  };

  return <div>{renderFields()}</div>;
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent {...props} />
    </ReactFlowProvider>
  );
}
