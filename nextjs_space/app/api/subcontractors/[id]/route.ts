export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
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

    const subcontractor = await prisma.subcontractor.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId ?? ""
      },
      include: {
        contracts: {
          include: {
            project: { select: { id: true, name: true } }
          }
        },
        costItems: {
          include: {
            project: { select: { id: true, name: true } }
          },
          take: 10,
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: { contracts: true, costItems: true }
        }
      }
    });

    if (!subcontractor) {
      return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
    }

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error("Error fetching subcontractor:", error);
    return NextResponse.json({ error: "Failed to fetch subcontractor" }, { status: 500 });
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

    const existing = await prisma.subcontractor.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId ?? ""
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      companyName, contactName, email, phone, address, trade,
      licenseNumber, insuranceExpiry, rating, notes
    } = body;

    const subcontractor = await prisma.subcontractor.update({
      where: { id },
      data: {
        ...(companyName && { companyName }),
        ...(contactName && { contactName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(trade && { trade }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(insuranceExpiry !== undefined && { insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null }),
        ...(rating !== undefined && { rating: rating ? parseInt(rating) : null }),
        ...(notes !== undefined && { notes })
      },
      include: {
        contracts: {
          include: {
            project: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { contracts: true, costItems: true }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: "subcontractor_updated",
        entityType: "Subcontractor",
        entityId: subcontractor.id,
        entityName: subcontractor.companyName,
        details: `Updated subcontractor: ${subcontractor.companyName}`,
        userId: session.user.id
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "subcontractor_updated",
      data: { subcontractor }
    });

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error("Error updating subcontractor:", error);
    return NextResponse.json({ error: "Failed to update subcontractor" }, { status: 500 });
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

    const existing = await prisma.subcontractor.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId ?? ""
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
    }

    await prisma.subcontractor.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: "subcontractor_deleted",
        entityType: "Subcontractor",
        entityId: id,
        entityName: existing.companyName,
        details: `Deleted subcontractor: ${existing.companyName}`,
        userId: session.user.id
      }
    });

    broadcastToOrganization(session.user.organizationId ?? "", {
      type: "subcontractor_deleted",
      data: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subcontractor:", error);
    return NextResponse.json({ error: "Failed to delete subcontractor" }, { status: 500 });
  }
}
