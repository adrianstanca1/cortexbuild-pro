import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  withAuthHandler,
  broadcastEntityEvent,
  logActivity,
  errorResponse,
} from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// PATCH /api/variations/[id]/status - update variation status
export const PATCH = withAuthHandler(async (request: NextRequest, context, params) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const variationId = params?.id as string;

  // Verify the variation belongs to the organization
  const existingVariation = await prisma.variation.findFirst({
    where: {
      id: variationId,
      project: {
        organizationId: context.organizationId
      }
    }
  });

  if (!existingVariation) {
    return errorResponse("NOT_FOUND", "Variation not found");
  }

  const body = await request.json();
  const { status } = body;

  if (!status) {
    return errorResponse("BAD_REQUEST", "Status is required");
  }

  // Validate status value
  const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    return errorResponse("BAD_REQUEST", `Status must be one of: ${validStatuses.join(", ")}`);
  }

  // Update status with approvedAt timestamp if approved
  const variation = await prisma.variation.update({
    where: { id: variationId },
    data: {
      status: status as "PENDING" | "APPROVED" | "REJECTED",
      approvedAt: status === "APPROVED" ? new Date() : null
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Log activity
  await logActivity(
    prisma,
    context,
    `marked variation as ${status.toLowerCase()}`,
    "Variation",
    `Variation "${variation.title}" status changed to ${status}`,
    variation.id,
    variation.title,
    variation.id
  );

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'variation_status_changed',
    {
      id: variation.id,
      title: variation.title,
      status: variation.status,
      previousStatus: existingVariation.status,
      projectId: variation.projectId,
      projectName: variation.project.name
    },
    context.userId
  );

  return NextResponse.json(bigintSafe(variation));
});
