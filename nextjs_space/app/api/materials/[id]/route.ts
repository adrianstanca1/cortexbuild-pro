import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const material = await prisma.material.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        deliveries: {
          include: {
            receivedBy: { select: { id: true, name: true } }
          },
          orderBy: { deliveryDate: "desc" }
        }
      }
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json({ error: "Failed to fetch material" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.material.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name, description, sku, category, unit, quantityNeeded, quantityOrdered,
      quantityReceived, quantityInstalled, unitCost, status, supplier, leadTime,
      expectedDate, deliveredDate, location, notes
    } = body;

    const newQuantityNeeded = quantityNeeded !== undefined ? parseFloat(quantityNeeded) : existing.quantityNeeded;
    const newUnitCost = unitCost !== undefined ? parseFloat(unitCost) : existing.unitCost;
    const totalCost = newQuantityNeeded * newUnitCost;

    const material = await prisma.material.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sku !== undefined && { sku }),
        ...(category !== undefined && { category }),
        ...(unit && { unit }),
        ...(quantityNeeded !== undefined && { quantityNeeded: parseFloat(quantityNeeded) }),
        ...(quantityOrdered !== undefined && { quantityOrdered: parseFloat(quantityOrdered) }),
        ...(quantityReceived !== undefined && { quantityReceived: parseFloat(quantityReceived) }),
        ...(quantityInstalled !== undefined && { quantityInstalled: parseFloat(quantityInstalled) }),
        ...(unitCost !== undefined && { unitCost: parseFloat(unitCost) }),
        totalCost,
        ...(status && { status }),
        ...(supplier !== undefined && { supplier }),
        ...(leadTime !== undefined && { leadTime: leadTime ? parseInt(leadTime) : null }),
        ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
        ...(deliveredDate !== undefined && { deliveredDate: deliveredDate ? new Date(deliveredDate) : null }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes })
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "material_updated",
        entityType: "Material",
        entityId: material.id,
        entityName: material.name,
        details: `Updated material: ${material.name}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "material_updated",
      data: { material, projectId: existing.projectId }
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.material.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await prisma.material.delete({ where: { id: id } });

    await prisma.activityLog.create({
      data: {
        action: "material_deleted",
        entityType: "Material",
        entityId: id,
        entityName: existing.name,
        details: `Deleted material: ${existing.name}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "material_deleted",
      data: { id: id, projectId: existing.projectId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
