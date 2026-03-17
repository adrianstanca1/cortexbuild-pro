import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

// POST - Execute/trigger a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const { id } = params;
    const body = await request.json();
    const eventData = body?.data || {};

    // Fetch workflow
    const workflow = await prisma.automationRule.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!workflow.isActive) {
      return NextResponse.json(
        { error: "Workflow is inactive", workflow },
        { status: 400 }
      );
    }

    // Process trigger condition
    const triggerCondition = workflow.triggerCondition as {
      type?: string;
      config?: Record<string, unknown>;
    };

    // Execute based on trigger type
    let executionResult = { success: true, message: "Workflow triggered" };

    // For webhook triggers, dispatch to webhook system
    if (triggerCondition.type === "WEBHOOK" || workflow.triggerType === "WEBHOOK") {
      const event = `automation.${workflow.id}`;
      await dispatchWebhook(organizationId, event, {
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventData,
      });
    }

    // Create execution log
    const execution = await prisma.ruleExecutionLog.create({
      data: {
        ruleId: workflow.id,
        triggerData: eventData as object,
        actionsExecuted: workflow.actions as object,
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

    return NextResponse.json({
      success: true,
      message: "Workflow executed",
      executionId: execution.id,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        triggerCount: workflow.triggerCount + 1,
      },
    });
  } catch (error) {
    console.error("Execute workflow error:", error);

    // Log failed execution
    try {
      await prisma.ruleExecutionLog.create({
        data: {
          ruleId: params.id,
          triggerData: await request.json().catch(() => ({})),
          actionsExecuted: {},
          success: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch (logError) {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 }
    );
  }
}
