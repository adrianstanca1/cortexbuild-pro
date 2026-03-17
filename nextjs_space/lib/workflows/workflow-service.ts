"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { WorkflowSaveData } from "@/components/dashboard/workflows/workflow-editor";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

export interface WorkflowData {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  projectId?: string | null;
  triggerType: string;
  triggerCondition: object;
  actions: object[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function saveWorkflow(data: WorkflowSaveData): Promise<WorkflowData> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = (session.user as any).organizationId;

  // Convert triggerType to match schema
  const schemaTriggerType = data.triggerType.toUpperCase();

  // Check if updating existing workflow
  const existing = await prisma.automationRule.findFirst({
    where: {
      organizationId,
      name: data.name,
    }
  });

  if (existing) {
    // Update existing
    const updated = await prisma.automationRule.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        triggerType: schemaTriggerType,
        triggerCondition: data.triggerCondition as any,
        actions: data.actions as any,
        isActive: true,
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      organizationId: updated.organizationId,
      projectId: updated.projectId,
      triggerType: updated.triggerType,
      triggerCondition: updated.triggerCondition as object,
      actions: updated.actions as object[],
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Create new
  const created = await prisma.automationRule.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      organizationId,
      triggerType: schemaTriggerType,
      triggerCondition: data.triggerCondition as any,
      actions: data.actions as any,
      notifyRoles: [],
      notifyUsers: [],
      isActive: true,
      createdById: (session.user as any).id,
    },
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    organizationId: created.organizationId,
    projectId: created.projectId,
    triggerType: created.triggerType,
    triggerCondition: created.triggerCondition as object,
    actions: created.actions as object[],
    isActive: created.isActive,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export async function getWorkflows(): Promise<WorkflowData[]> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = (session.user as any).organizationId;

  const workflows = await prisma.automationRule.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    organizationId: w.organizationId,
    projectId: w.projectId,
    triggerType: w.triggerType,
    triggerCondition: w.triggerCondition as object,
    actions: w.actions as object[],
    isActive: w.isActive,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
}

export async function getWorkflow(id: string): Promise<WorkflowData | null> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = (session.user as any).organizationId;

  const workflow = await prisma.automationRule.findFirst({
    where: { id, organizationId },
  });

  if (!workflow) return null;

  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    organizationId: workflow.organizationId,
    projectId: workflow.projectId,
    triggerType: workflow.triggerType,
    triggerCondition: workflow.triggerCondition as object,
    actions: workflow.actions as object[],
    isActive: workflow.isActive,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

export async function deleteWorkflow(id: string): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = (session.user as any).organizationId;

  await prisma.automationRule.deleteMany({
    where: { id, organizationId },
  });
}

export async function executeWorkflow(workflowId: string, eventData: Record<string, unknown>): Promise<{
  success: boolean;
  message: string;
  executionId?: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = (session.user as any).organizationId;

  const workflow = await prisma.automationRule.findFirst({
    where: { id: workflowId, organizationId },
  });

  if (!workflow) {
    return { success: false, message: "Workflow not found" };
  }

  if (!workflow.isActive) {
    return { success: false, message: "Workflow is inactive" };
  }

  try {
    // Check if trigger condition matches
    const triggerCondition = workflow.triggerCondition as { type?: string; config?: Record<string, unknown> };

    // For webhook triggers, dispatch to webhook system
    if (triggerCondition.type === "WEBHOOK") {
      const path = (triggerCondition.config?.path as string) || "";
      const event = `workflow.${workflow.id}`;

      // Dispatch webhook with workflow data
      await dispatchWebhook(organizationId, event, {
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventData,
      });
    }

    // Log execution
    const execution = await prisma.ruleExecutionLog.create({
      data: {
        ruleId: workflow.id,
        triggerData: eventData as any,
        actionsExecuted: workflow.actions as any,
        success: true,
      },
    });

    // Update workflow stats
    await prisma.automationRule.update({
      where: { id: workflow.id },
      data: {
        triggerCount: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });

    return {
      success: true,
      message: "Workflow executed successfully",
      executionId: execution.id,
    };
  } catch (error) {
    // Log failed execution
    await prisma.ruleExecutionLog.create({
      data: {
        ruleId: workflow.id,
        triggerData: eventData as any,
        actionsExecuted: {} as any,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Execution failed",
    };
  }
}
