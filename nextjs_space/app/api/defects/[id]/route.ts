import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

    const defect = await prisma.defect.findUnique({
      where: { id: id },
      include: {
        project: { select: { id: true, name: true } },
        photos: true,
      },
    });

    if (!defect) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }

    return NextResponse.json(defect);
  } catch (error) {
    console.error("Error fetching defect:", error);
    return NextResponse.json({ error: "Failed to fetch defect" }, { status: 500 });
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

    const body = await request.json();
    const {
      title, description, location, floor, room, trade, status, priority,
      dueDate, responsibleParty, rootCause, remedialAction, cost, assignedToId
    } = body;

    const existingDefect = await prisma.defect.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!existingDefect) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }

    // Handle status changes
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (floor !== undefined) updateData.floor = floor;
    if (room !== undefined) updateData.room = room;
    if (trade) updateData.trade = trade;
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (responsibleParty !== undefined) updateData.responsibleParty = responsibleParty || null;
    if (rootCause !== undefined) updateData.rootCause = rootCause || null;
    if (remedialAction !== undefined) updateData.remedialAction = remedialAction || null;
    if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    if (status) {
      updateData.status = status;
      if (status === "COMPLETED" && !existingDefect.completedDate) {
        updateData.completedDate = new Date();
      }
      if (status === "VERIFIED" && !existingDefect.verifiedDate) {
        updateData.verifiedDate = new Date();
        updateData.verifiedById = session.user.id;
      }
    }

    const defect = await prisma.defect.update({
      where: { id: id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        photos: true,
      },
    });

    if (existingDefect.project.organizationId) {
      broadcastToOrganization(existingDefect.project.organizationId, {
        type: "defect_updated",
        data: { id: defect.id, number: defect.number, title: defect.title, status: defect.status },
      });
    }

    return NextResponse.json(defect);
  } catch (error) {
    console.error("Error updating defect:", error);
    return NextResponse.json({ error: "Failed to update defect" }, { status: 500 });
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

    const defect = await prisma.defect.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!defect) {
      return NextResponse.json({ error: "Defect not found" }, { status: 404 });
    }

    await prisma.defect.delete({ where: { id: id } });

    if (defect.project.organizationId) {
      broadcastToOrganization(defect.project.organizationId, {
        type: "defect_deleted",
        data: { id: defect.id, number: defect.number },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting defect:", error);
    return NextResponse.json({ error: "Failed to delete defect" }, { status: 500 });
  }
}
