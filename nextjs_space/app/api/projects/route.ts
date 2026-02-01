export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import { 
  getApiContext, 
  buildOrgFilter, 
  handleApiError,
  successResponse,
  errorResponse
} from "@/lib/api-utils";

export async function GET() {
  try {
    const { context, error } = await getApiContext();
    if (error) return error;

    const projects = await prisma.project.findMany({
      where: buildOrgFilter(context!.organizationId, true),
      include: {
        manager: { select: { id: true, name: true } },
        _count: { select: { tasks: true, documents: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return successResponse({ projects });
  } catch (error) {
    return handleApiError(error, "fetch projects");
  }
}

export async function POST(request: Request) {
  try {
    const { context, error } = await getApiContext();
    if (error) return error;

    const body = await request.json();
    const { name, description, location, clientName, clientEmail, budget, startDate, endDate, status } = body;

    if (!name?.trim()) {
      return errorResponse("BAD_REQUEST", "Project name is required");
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
        organizationId: context!.organizationId,
        managerId: context!.userId || null
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
        userId: context!.userId,
        projectId: project.id
      }
    });

    // Broadcast real-time event to organization
    broadcastToOrganization(context!.organizationId, {
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
        userId: context!.userId
      }
    });

    return successResponse({ project }, "Project created successfully");
  } catch (error) {
    return handleApiError(error, "create project");
  }
}
