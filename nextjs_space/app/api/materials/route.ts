import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = {
        organizationId: session.user.organizationId
      };
    }
    
    if (status && status !== "all") where.status = status;

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
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId, name, description, sku, category, unit, quantityNeeded,
      quantityOrdered, unitCost, status, supplier, leadTime, expectedDate, location, notes
    } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: "Project and name are required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId ?? "" }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
        createdById: session.user.id
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
        userId: session.user.id,
        projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "material_created",
      data: { material, projectId }
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
  }
}
