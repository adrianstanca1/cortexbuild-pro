import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const trade = searchParams.get("trade");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = { organizationId: session.user.organizationId };
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (trade) where.trade = trade;

    const defects = await prisma.defect.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        photos: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(defects);
  } catch (error) {
    console.error("Error fetching defects:", error);
    return NextResponse.json({ error: "Failed to fetch defects" }, { status: 500 });
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
      projectId, title, description, location, floor, room,
      trade, priority, dueDate, responsibleParty, assignedToId
    } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "Project ID and title are required" }, { status: 400 });
    }

    // Get next defect number
    const lastDefect = await prisma.defect.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastDefect?.number || 0) + 1;

    const defect = await prisma.defect.create({
      data: {
        number: nextNumber,
        projectId,
        title,
        description,
        location,
        floor,
        room,
        trade: trade || "GENERAL",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        responsibleParty: responsibleParty || null,
        assignedToId: assignedToId || null,
        createdById: session.user.id,
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        photos: true,
      },
    });

    if (defect.project.organizationId) {
      broadcastToOrganization(defect.project.organizationId, {
        type: "defect_created",
        data: { id: defect.id, number: defect.number, title: defect.title, projectName: defect.project.name },
      });
    }

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    console.error("Error creating defect:", error);
    return NextResponse.json({ error: "Failed to create defect" }, { status: 500 });
  }
}
