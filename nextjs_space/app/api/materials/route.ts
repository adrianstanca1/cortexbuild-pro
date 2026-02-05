import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import {
  getOrganizationContext,
  parseQueryParams,
  buildOrgScopedWhere,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export const GET = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const { projectId, status } = parseQueryParams(request);

  const where = buildOrgScopedWhere(
    context!.organizationId,
    projectId,
    {
      ...(status && status !== "all" && { status })
    }
  );

  const materials = await prisma.material.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      deliveries: {
        include: {
          receivedBy: { select: { id: true, name: true } }
        },
        orderBy: { deliveryDate: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate summary
  const summary = materials.reduce((acc: { totalValue: number; totalOrdered: number; totalReceived: number }, mat) => {
    acc.totalValue += mat.totalCost;
    acc.totalOrdered += mat.quantityOrdered;
    acc.totalReceived += mat.quantityReceived;
    return acc;
  }, { totalValue: 0, totalOrdered: 0, totalReceived: 0 });

  return NextResponse.json({ materials, summary });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { context, error } = await getOrganizationContext();
  if (error) return error;

  const body = await request.json();
  const {
    projectId, name, description, sku, category, unit, quantityNeeded,
    quantityOrdered, unitCost, status, supplier, leadTime, expectedDate, location, notes
  } = body;

  if (!projectId || !name) {
    return errorResponse("BAD_REQUEST", "Project and name are required");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: context!.organizationId }
  });

  if (!project) {
    return errorResponse("NOT_FOUND", "Project not found");
  }

  const totalCost = (parseFloat(quantityNeeded) || 0) * (parseFloat(unitCost) || 0);

  const material = await prisma.material.create({
    data: {
      projectId,
      name,
      description,
      sku,
      category,
      unit: unit || "each",
      quantityNeeded: parseFloat(quantityNeeded) || 0,
      quantityOrdered: parseFloat(quantityOrdered) || 0,
      quantityReceived: 0,
      quantityInstalled: 0,
      unitCost: parseFloat(unitCost) || 0,
      totalCost,
      status: status || "PLANNED",
      supplier,
      leadTime: leadTime ? parseInt(leadTime) : null,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      location,
      notes,
      createdById: context!.userId
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } }
    }
  });

  await prisma.activityLog.create({
    data: {
      action: "material_created",
      entityType: "Material",
      entityId: material.id,
      entityName: material.name,
      details: `Added material: ${material.name} (${material.quantityNeeded} ${material.unit})`,
      userId: context!.userId,
      projectId
    }
  });

  broadcastToOrganization(context!.organizationId, {
    type: "material_created",
    data: { material, projectId }
  });

  return NextResponse.json(material);
});
  }
}
