import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  getOrganizationContext,
  parseQueryParams,
  buildOrgScopedWhere,
  successResponse,
  withErrorHandler,
  errorResponse,
} from "@/lib/api-utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export const GET = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { projectId, status, type } = parseQueryParams(request);

  const where = buildOrgScopedWhere(
    context!.organizationId,
    projectId,
    {
      ...(status && { status }),
      ...(type && { type }),
    }
  );

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

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

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

  // Broadcast real-time event
  if (permit.project.organizationId) {
    broadcastToOrganization(permit.project.organizationId, {
      type: "permit_created",
      data: { id: permit.id, number: permit.number, title: permit.title, projectName: permit.project.name },
    });
  }

  return NextResponse.json(permit, { status: 201 });
});
