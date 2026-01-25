export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { broadcastEntityChange } from "@/lib/query-builders";

export const GET = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const trade = searchParams.get("trade");

  const where: Record<string, unknown> = {};
  
  if (projectId) {
    where.projectId = projectId;
  } else {
    where.project = { organizationId: context.organizationId };
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

  return successResponse(defects);
});

export const POST = withAuth(async (request: NextRequest, context) => {
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
      createdById: context.userId,
    },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
      photos: true,
    },
  });

  await broadcastEntityChange(context.organizationId, "created", "defect", defect, context.userId);

  return successResponse(defect, "Defect created successfully");
});
