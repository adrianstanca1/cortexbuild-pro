import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

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

    const costItem = await prisma.costItem.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: {
        project: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!costItem) {
      return NextResponse.json({ error: "Cost item not found" }, { status: 404 });
    }

    return NextResponse.json(costItem);
  } catch (error) {
    console.error("Error fetching cost item:", error);
    return NextResponse.json({ error: "Failed to fetch cost item" }, { status: 500 });
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

    const existing = await prisma.costItem.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Cost item not found" }, { status: 404 });
    }

    const body = await request.json();
    const { description, category, status, estimatedAmount, actualAmount, committedAmount, vendor, notes, subcontractorId, invoiceNumber, invoiceDate, paidDate } = body;

    const costItem = await prisma.costItem.update({
      where: { id: id },
      data: {
        ...(description && { description }),
        ...(category && { category }),
        ...(status && { status }),
        ...(estimatedAmount !== undefined && { estimatedAmount: parseFloat(estimatedAmount) }),
        ...(actualAmount !== undefined && { actualAmount: parseFloat(actualAmount) }),
        ...(committedAmount !== undefined && { committedAmount: parseFloat(committedAmount) }),
        ...(vendor !== undefined && { vendor }),
        ...(notes !== undefined && { notes }),
        ...(subcontractorId !== undefined && { subcontractorId: subcontractorId || null }),
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(invoiceDate !== undefined && { invoiceDate: invoiceDate ? new Date(invoiceDate) : null }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null })
      },
      include: {
        project: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "cost_item_updated",
        entityType: "CostItem",
        entityId: costItem.id,
        entityName: costItem.description,
        details: `Updated cost item: ${costItem.description}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "cost_item_updated",
      data: { costItem, projectId: existing.projectId }
    });

    return NextResponse.json(costItem);
  } catch (error) {
    console.error("Error updating cost item:", error);
    return NextResponse.json({ error: "Failed to update cost item" }, { status: 500 });
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

    const existing = await prisma.costItem.findFirst({
      where: {
        id: id,
        project: { organizationId: session.user.organizationId ?? "" }
      },
      include: { project: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Cost item not found" }, { status: 404 });
    }

    await prisma.costItem.delete({ where: { id: id } });

    await prisma.activityLog.create({
      data: {
        action: "cost_item_deleted",
        entityType: "CostItem",
        entityId: id,
        entityName: existing.description,
        details: `Deleted cost item: ${existing.description}`,
        userId: session.user.id,
        projectId: existing.projectId
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "cost_item_deleted",
      data: { id: id, projectId: existing.projectId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cost item:", error);
    return NextResponse.json({ error: "Failed to delete cost item" }, { status: 500 });
  }
}
