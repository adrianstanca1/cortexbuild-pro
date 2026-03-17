"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  Webhook,
  Database,
  Clock,
  Mail,
  FilePlus,
  Zap,
  GitBranch,
  Shuffle,
  Shield,
  Bell,
  CheckCircle2,
  XCircle
} from "lucide-react";

export type WorkflowNodeType =
  | "trigger-webhook"
  | "trigger-record"
  | "trigger-schedule"
  | "action-email"
  | "action-record"
  | "action-webhook"
  | "action-notification"
  | "condition-if"
  | "condition-switch";

export interface WorkflowNodeData {
  label: string;
  description?: string;
  icon?: string;
  config?: Record<string, string | number | boolean | null>;
  status?: "success" | "error" | "pending";
}

const nodeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "trigger-webhook": Webhook,
  "trigger-record": Database,
  "trigger-schedule": Clock,
  "action-email": Mail,
  "action-record": FilePlus,
  "action-webhook": Zap,
  "action-notification": Bell,
  "condition-if": GitBranch,
  "condition-switch": Shuffle
};

const nodeColors: Record<string, string> = {
  "trigger-webhook": "border-blue-500 bg-blue-50",
  "trigger-record": "border-blue-500 bg-blue-50",
  "trigger-schedule": "border-blue-500 bg-blue-50",
  "action-email": "border-green-500 bg-green-50",
  "action-record": "border-green-500 bg-green-50",
  "action-webhook": "border-green-500 bg-green-50",
  "action-notification": "border-green-500 bg-green-50",
  "condition-if": "border-amber-500 bg-amber-50",
  "condition-switch": "border-amber-500 bg-amber-50"
};

const statusColors: Record<string, string> = {
  success: "border-emerald-500",
  error: "border-red-500",
  pending: "border-gray-300"
};

interface BaseNodeProps {
  id: string;
  data: WorkflowNodeData;
  type?: string;
}

function BaseNode({ id, data, type }: BaseNodeProps) {
  const Icon = nodeIcons[type || "trigger-webhook"] || Shield;
  const baseColor = nodeColors[type || "trigger-webhook"] || "border-gray-500 bg-gray-50";
  const statusColor = data.status ? statusColors[data.status] : "";

  return (
    <div
      id={id}
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border-2 p-4 min-w-[200px] max-w-[280px] shadow-lg transition-all hover:shadow-xl",
        baseColor,
        statusColor
      )}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !border-2 !w-3 !h-3"
      />

      {/* Node Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            type?.includes("trigger")
              ? "bg-blue-500 text-white"
              : type?.includes("action")
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500 truncate">{data.description}</div>
          )}
        </div>
      </div>

      {/* Node Config Preview */}
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="rounded-md bg-white/50 p-2 text-xs text-gray-600">
          {Object.entries(data.config).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <span className="font-medium">{key}:</span>
              <span className="truncate flex-1 text-right">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !border-2 !w-3 !h-3"
      />

      {/* Condition outputs */}
      {type?.includes("condition") && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!bg-emerald-400 !border-2 !w-3 !h-3 !right-[-12px]"
            style={{ top: "60%" }}
          />
          <div
            className="absolute text-xs text-emerald-600 font-medium"
            style={{ right: "-24px", top: "58%" }}
          >
            Yes
          </div>
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            className="!bg-red-400 !border-2 !w-3 !h-3 !left-[-12px]"
            style={{ top: "60%" }}
          />
          <div
            className="absolute text-xs text-red-600 font-medium"
            style={{ left: "-20px", top: "58%" }}
          >
            No
          </div>
        </>
      )}
    </div>
  );
}

export const TriggerNode = memo((props: BaseNodeProps) => (
  <BaseNode {...props} />
));

export const ActionNode = memo((props: BaseNodeProps) => (
  <BaseNode {...props} />
));

export const ConditionNode = memo((props: BaseNodeProps) => (
  <BaseNode {...props} />
));

TriggerNode.displayName = "TriggerNode";
ActionNode.displayName = "ActionNode";
ConditionNode.displayName = "ConditionNode";

// Default node for unknown types
export const DefaultNode = memo((props: BaseNodeProps) => (
  <BaseNode {...props} type="trigger-webhook" />
));

DefaultNode.displayName = "DefaultNode";
