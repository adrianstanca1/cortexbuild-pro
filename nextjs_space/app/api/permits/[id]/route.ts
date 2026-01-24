export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permit = await prisma.permit.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        documents: true,
      },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    return NextResponse.json(permit);
  } catch (error) {
    console.error("Error fetching permit:", error);
    return NextResponse.json({ error: "Failed to fetch permit" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type, title, description, status, permitNumber, issuingAuthority,
      applicationDate, approvalDate, expirationDate, inspectionDate,
      fee, feePaidDate, conditions, notes
    } = body;

    const existingPermit = await prisma.permit.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!existingPermit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    const permit = await prisma.permit.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(permitNumber !== undefined && { permitNumber }),
        ...(issuingAuthority !== undefined && { issuingAuthority }),
        ...(applicationDate !== undefined && { applicationDate: applicationDate ? new Date(applicationDate) : null }),
        ...(approvalDate !== undefined && { approvalDate: approvalDate ? new Date(approvalDate) : null }),
        ...(expirationDate !== undefined && { expirationDate: expirationDate ? new Date(expirationDate) : null }),
        ...(inspectionDate !== undefined && { inspectionDate: inspectionDate ? new Date(inspectionDate) : null }),
        ...(fee !== undefined && { fee: fee ? parseFloat(fee) : null }),
        ...(feePaidDate !== undefined && { feePaidDate: feePaidDate ? new Date(feePaidDate) : null }),
        ...(conditions !== undefined && { conditions }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        project: { select: { id: true, name: true } },
        documents: true,
      },
    });

    if (existingPermit.project.organizationId) {
      broadcastToOrganization(existingPermit.project.organizationId, {
        type: "permit_updated",
        data: { id: permit.id, number: permit.number, title: permit.title, status: permit.status },
      });
    }

    return NextResponse.json(permit);
  } catch (error) {
    console.error("Error updating permit:", error);
    return NextResponse.json({ error: "Failed to update permit" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permit = await prisma.permit.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!permit) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 });
    }

    await prisma.permit.delete({ where: { id: params.id } });

    if (permit.project.organizationId) {
      broadcastToOrganization(permit.project.organizationId, {
        type: "permit_deleted",
        data: { id: permit.id, number: permit.number },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting permit:", error);
    return NextResponse.json({ error: "Failed to delete permit" }, { status: 500 });
  }
}
