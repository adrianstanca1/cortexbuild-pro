export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const milestone = await prisma.milestone.findFirst({
      where: {
        id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error fetching milestone:", error);
    return NextResponse.json({ error: "Failed to fetch milestone" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.milestone.findFirst({
      where: {
        id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name, description, targetDate, actualDate, status, percentComplete,
      sortOrder, isCritical, dependencies, notes
    } = body;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(actualDate !== undefined && { actualDate: actualDate ? new Date(actualDate) : null }),
        ...(status && { status }),
        ...(percentComplete !== undefined && { percentComplete: parseInt(percentComplete) }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
        ...(isCritical !== undefined && { isCritical }),
        ...(dependencies !== undefined && { dependencies }),
        ...(notes !== undefined && { notes })
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "milestone_updated",
        entityType: "Milestone",
        entityId: milestone.id,
        entityName: milestone.name,
        details: `Updated milestone: ${milestone.name}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "milestone_updated",
      data: { milestone, projectId: existing.projectId }
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.milestone.findFirst({
      where: {
        id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    await prisma.milestone.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: "milestone_deleted",
        entityType: "Milestone",
        entityId: id,
        entityName: existing.name,
        details: `Deleted milestone: ${existing.name}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "milestone_deleted",
      data: { id, projectId: existing.projectId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
