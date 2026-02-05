export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = {
        organizationId: session.user.organizationId
      };
    }

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: [{ sortOrder: "asc" }, { targetDate: "asc" }]
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId, name, description, targetDate, status, percentComplete,
      sortOrder, isCritical, dependencies, notes
    } = body;

    if (!projectId || !name || !targetDate) {
      return NextResponse.json({ error: "Project, name, and target date are required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId ?? "" }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name,
        description,
        targetDate: new Date(targetDate),
        status: status || "NOT_STARTED",
        percentComplete: parseInt(percentComplete) || 0,
        sortOrder: parseInt(sortOrder) || 0,
        isCritical: isCritical || false,
        dependencies: dependencies || [],
        notes,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "milestone_created",
        entityType: "Milestone",
        entityId: milestone.id,
        entityName: milestone.name,
        details: `Added milestone: ${milestone.name}`,
        userId: session.user.id,
        projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "milestone_created",
      data: { milestone, projectId }
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
