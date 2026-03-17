import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { saveWorkflow, getWorkflows, deleteWorkflow } from "@/lib/workflows/workflow-service";

// GET - List all workflows for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    const workflows = await prisma.automationRule.findMany({
      where: { organizationId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        executionLogs: {
          orderBy: { executedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Get workflows error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerCondition, actions, flow } = body;

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: "Name and triggerType are required" },
        { status: 400 }
      );
    }

    const organizationId = (session.user as any).organizationId;
    const userId = (session.user as any).id;

    // Map triggerType to schema values
    const schemaTriggerType = triggerType.toUpperCase();

    const workflow = await prisma.automationRule.create({
      data: {
        name,
        description: description || null,
        organizationId,
        triggerType: schemaTriggerType,
        triggerCondition: triggerCondition || {},
        actions: actions || [],
        notifyRoles: [],
        notifyUsers: [],
        isActive: true,
        createdById: userId,
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Create workflow error:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}
