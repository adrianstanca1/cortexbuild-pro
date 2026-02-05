export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: id ?? "" },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        tasks: { include: { assignee: { select: { id: true, name: true } } } },
        documents: true,
        _count: { select: { tasks: true, documents: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const organizationId = (session.user as { organizationId?: string })?.organizationId;
    const body = await request.json();
    const { name, description, location, clientName, clientEmail, budget, startDate, endDate, status } = body;

    const project = await prisma.project.update({
      where: { id: id ?? "" },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(clientName !== undefined && { clientName: clientName?.trim() || null }),
        ...(clientEmail !== undefined && { clientEmail: clientEmail?.trim() || null }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status })
      },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "updated project",
        entityType: "Project",
        entityId: project.id,
        entityName: project.name,
        userId,
        projectId: project.id
      }
    });

    // Broadcast real-time event to organization
    if (organizationId) {
      broadcastToOrganization(organizationId, {
        type: 'project_updated',
        timestamp: new Date().toISOString(),
        payload: {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            location: project.location,
            clientName: project.clientName,
            managerName: project.manager?.name
          },
          userId
        }
      });
    }

    return NextResponse.json({ project });
  } catch {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    const organizationId = (session.user as { organizationId?: string })?.organizationId;

    // Fetch project before deletion for broadcast
    const project = await prisma.project.findUnique({
      where: { id: id ?? "" },
      select: { id: true, name: true }
    });

    await prisma.project.delete({ where: { id: id ?? "" } });

    // Broadcast real-time event to organization
    if (organizationId && project) {
      broadcastToOrganization(organizationId, {
        type: 'project_updated',
        timestamp: new Date().toISOString(),
        payload: {
          deleted: true,
          projectId: project.id,
          projectName: project.name,
          userId
        }
      });
    }

    return NextResponse.json({ message: "Project deleted" });
  } catch {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
