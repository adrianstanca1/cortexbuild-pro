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
import { createAuditLog } from "@/lib/audit";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

// GET /api/variations - list all variations with optional projectId filter
export const GET = withAuthHandler(async (request: NextRequest, context) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const whereClause: any = {
    project: {
      organizationId: context.organizationId
    }
  };

  if (projectId) {
    whereClause.projectId = projectId;
  }

  const variations = await prisma.variation.findMany({
    where: whereClause,
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
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(bigintSafe(variations));
});

// POST /api/variations - create new variation
export const POST = withAuthHandler(async (request: NextRequest, context) => {
  if (!context.organizationId) {
    return errorResponse("FORBIDDEN", "User must belong to an organization");
  }

  const body = await request.json();
  const { title, description, total, projectId, status } = body;

  if (!title?.trim()) {
    return errorResponse("BAD_REQUEST", "Variation title is required");
  }

  if (!projectId) {
    return errorResponse("BAD_REQUEST", "Project ID is required");
  }

  // Verify the project belongs to the organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: context.organizationId
    }
  });

  if (!project) {
    return errorResponse("BAD_REQUEST", "Invalid project");
  }

  const sanitized = sanitizeEntityFields({
    title,
    description
  });

  const variation = await prisma.variation.create({
    data: {
      ...sanitized,
      total: total ? parseFloat(total) : 0,
      status: status || "PENDING",
      projectId,
      createdById: context.userId
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

  // Log activity (existing activity log)
  await logActivity(
    prisma,
    context,
    "created variation",
    "Variation",
    `Created variation: ${variation.title}`,
    variation.id,
    variation.title,
    variation.id
  );

  // Create comprehensive audit log
  await createAuditLog(prisma, context, {
    entity: "Variation",
    entityId: variation.id,
    action: "CREATE",
    newValues: {
      title: variation.title,
      description: variation.description,
      total: variation.total,
      status: variation.status,
      projectId: variation.projectId,
    },
    metadata: {
      projectId: variation.projectId,
    },
  });

  // Broadcast real-time event
  broadcastEntityEvent(
    broadcastToOrganization,
    context.organizationId,
    'variation_created',
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

  return NextResponse.json(bigintSafe(variation), { status: 201 });
});
