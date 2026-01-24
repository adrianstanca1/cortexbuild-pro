export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string })?.organizationId;
    const projects = await prisma.project.findMany({
      where: orgId ? { organizationId: orgId } : {},
      include: {
        manager: { select: { id: true, name: true } },
        _count: { select: { tasks: true, documents: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id || '';
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, location, clientName, clientEmail, budget, startDate, endDate, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        clientName: clientName?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "PLANNING",
        organizationId: orgId,
        managerId: userId || null
      },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "created project",
        entityType: "Project",
        entityId: project.id,
        entityName: project.name,
        userId,
        projectId: project.id
      }
    });

    // Broadcast real-time event to organization
    broadcastToOrganization(orgId, {
      type: 'project_created',
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

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
