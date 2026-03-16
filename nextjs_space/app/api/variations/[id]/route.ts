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
import { createAuditLog, extractChanges } from "@/lib/audit";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// GET /api/variations/[id] - get single variation
export const GET = withAuthHandler(async (request: NextRequest, context, params) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const variationId = params?.id as string;

  const variation = await prisma.variation.findFirst({
    where: {
      id: variationId,
      project: {
        organizationId: context.organizationId
      }
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

  if (!variation) {
    return errorResponse("NOT_FOUND", "Variation not found");
  }

  return NextResponse.json(bigintSafe(variation));
});

// PUT /api/variations/[id] - update variation
export const PUT = withAuthHandler(async (request: NextRequest, context, params) => {
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
  const { title, description, total, status } = body;

  const sanitized = sanitizeEntityFields({
    title,
    description
  });

  const variation = await prisma.variation.update({
    where: { id: variationId },
    data: {
      ...sanitized,
      total: total !== undefined ? parseFloat(total) : existingVariation.total,
      status: status || existingVariation.status
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

  // Prepare old and new values for audit
  const oldValues = {
    title: existingVariation.title,
    description: existingVariation.description,
    total: existingVariation.total,
    status: existingVariation.status,
  };
  const newValues = {
    title: title || existingVariation.title,
    description: description || existingVariation.description,
    total: total !== undefined ? parseFloat(total) : existingVariation.total,
    status: status || existingVariation.status,
  };

  // Log activity (existing activity log)
  await logActivity(
    prisma,
    context,
    "updated variation",
    "Variation",
    `Updated variation: ${variation.title}`,
    variation.id,
    variation.title,
    variation.id
  );

  // Create comprehensive audit log with field changes
  await createAuditLog(prisma, context, {
    entity: "Variation",
    entityId: variation.id,
    action: "UPDATE",
    oldValues,
    newValues,
    metadata: {
      projectId: variation.projectId,
      changes: extractChanges(oldValues, newValues),
    },
  });

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'variation_updated',
    {
      id: variation.id,
      title: variation.title,
      total: variation.total,
      status: variation.status,
      projectId: variation.projectId,
      projectName: variation.project.name
    },
    context.userId
  );

  return NextResponse.json(bigintSafe(variation));
});

// DELETE /api/variations/[id] - delete variation
export const DELETE = withAuthHandler(async (request: NextRequest, context, params) => {
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

  await prisma.variation.delete({
    where: { id: variationId }
  });

  // Log activity (existing activity log)
  await logActivity(
    prisma,
    context,
    "deleted variation",
    "Variation",
    `Deleted variation: ${existingVariation.title}`,
    variationId,
    existingVariation.title,
    variationId
  );

  // Create comprehensive audit log for deletion
  await createAuditLog(prisma, context, {
    entity: "Variation",
    entityId: variationId,
    action: "DELETE",
    oldValues: {
      title: existingVariation.title,
      description: existingVariation.description,
      total: existingVariation.total,
      status: existingVariation.status,
      projectId: existingVariation.projectId,
    },
    metadata: {
      projectId: existingVariation.projectId,
      deletedTitle: existingVariation.title,
    },
  });

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'variation_deleted',
    {
      id: variationId,
      title: existingVariation.title,
      projectId: existingVariation.projectId
    },
    context.userId
  );

  return NextResponse.json({ success: true, id: variationId });
});
