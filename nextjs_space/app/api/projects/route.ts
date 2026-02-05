import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  withAuthHandler,
  sanitizeEntityFields,
  broadcastEntityEvent,
  logActivity,
  errorResponse,
} from "@/lib/api-utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const GET = withAuthHandler(async (request: NextRequest, context) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: context.organizationId },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { tasks: true, documents: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ projects });
});

export const POST = withAuthHandler(async (request: NextRequest, context) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const body = await request.json();
  const { name, description, location, clientName, clientEmail, budget, startDate, endDate, status } = body;

  if (!name?.trim()) {
    return errorResponse("BAD_REQUEST", "Project name is required");
  }

  // Sanitize common fields
  const sanitized = sanitizeEntityFields({
    name,
    description,
    location,
    clientName,
    clientEmail,
  });

  const project = await prisma.project.create({
    data: {
      ...sanitized,
      budget: budget ? parseFloat(budget) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || "PLANNING",
      organizationId: context.organizationId,
      managerId: context.userId || null
    },
    include: {
      manager: { select: { id: true, name: true } }
    }
  });

  // Log activity
  await logActivity(
    prisma,
    context,
    "created project",
    "Project",
    `Created project: ${project.name}`,
    project.id,
    project.name,
    project.id
  );

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'project_created',
    {
      id: project.id,
      name: project.name,
      status: project.status,
      location: project.location,
      clientName: project.clientName,
      managerName: project.manager?.name
    },
    context.userId
  );

  return NextResponse.json({ project });
});
