import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  getOrganizationContext,
  parseQueryParams,
  buildOrgScopedWhere,
  successResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { projectId, status, priority, trade } = parseQueryParams(request);

  const where = buildOrgScopedWhere(
    context!.organizationId,
    projectId,
    {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(trade && { trade }),
    }
  );

  const defects = await prisma.defect.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      photos: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(defects);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const body = await request.json();
  const {
    projectId, title, description, location, floor, room,
    trade, priority, dueDate, responsibleParty, assignedToId
  } = body;

  if (!projectId || !title) {
    return errorResponse("BAD_REQUEST", "Project ID and title are required");
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
      createdById: context!.userId,
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
});
