export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { broadcastEntityChange } from "@/lib/query-builders";

export const GET = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  
  if (projectId) {
    where.projectId = projectId;
  } else {
    where.project = { organizationId: context.organizationId };
  }
  
  if (status) where.status = status;
  if (type) where.type = type;

  const permits = await prisma.permit.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(permits);
});

export const POST = withAuth(async (request: NextRequest, context) => {
  const body = await request.json();
  const { projectId, type, title, description, issuingAuthority, applicationDate, fee, conditions, notes } = body;

  if (!projectId || !title) {
    return errorResponse("BAD_REQUEST", "Project ID and title are required");
  }

  // Get next permit number for this project
  const lastPermit = await prisma.permit.findFirst({
    where: { projectId },
    orderBy: { number: "desc" },
  });
  const nextNumber = (lastPermit?.number || 0) + 1;

  const permit = await prisma.permit.create({
    data: {
      number: nextNumber,
      projectId,
      type: type || "BUILDING",
      title,
      description,
      issuingAuthority,
      applicationDate: applicationDate ? new Date(applicationDate) : null,
      fee: fee ? parseFloat(fee) : null,
      conditions,
      notes,
    },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
    },
  });

  await broadcastEntityChange(context.organizationId, "created", "permit", permit, context.userId);

  return successResponse(permit, "Permit created successfully");
});
