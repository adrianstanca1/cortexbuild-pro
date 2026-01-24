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

    const claim = await prisma.progressClaim.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
        documents: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Progress claim not found" }, { status: 404 });
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error fetching progress claim:", error);
    return NextResponse.json({ error: "Failed to fetch progress claim" }, { status: 500 });
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
      status, thisClaim, retentionHeld, approvedAmount, notes,
      submittedDate, approvedDate, paidDate
    } = body;

    const existingClaim = await prisma.progressClaim.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!existingClaim) {
      return NextResponse.json({ error: "Progress claim not found" }, { status: 404 });
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === "SUBMITTED" && !existingClaim.submittedDate) {
        updateData.submittedDate = new Date();
      }
      if ((status === "APPROVED" || status === "PARTIALLY_APPROVED") && !existingClaim.approvedDate) {
        updateData.approvedDate = new Date();
      }
      if (status === "PAID" && !existingClaim.paidDate) {
        updateData.paidDate = new Date();
      }
    }
    
    if (thisClaim !== undefined) {
      updateData.thisClaim = thisClaim;
      updateData.totalClaimed = existingClaim.previousClaimed + thisClaim;
      updateData.netPayable = thisClaim - (retentionHeld ?? existingClaim.retentionHeld);
    }
    
    if (retentionHeld !== undefined) {
      updateData.retentionHeld = retentionHeld;
      updateData.netPayable = (updateData.thisClaim ?? existingClaim.thisClaim) - retentionHeld;
    }
    
    if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount;
    if (notes !== undefined) updateData.notes = notes;
    if (submittedDate) updateData.submittedDate = new Date(submittedDate);
    if (approvedDate) updateData.approvedDate = new Date(approvedDate);
    if (paidDate) updateData.paidDate = new Date(paidDate);

    const claim = await prisma.progressClaim.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: "asc" } },
        documents: true,
      },
    });

    if (existingClaim.project.organizationId) {
      broadcastToOrganization(existingClaim.project.organizationId, {
        type: "progress_claim_updated",
        data: { id: claim.id, number: claim.number, status: claim.status },
      });
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error updating progress claim:", error);
    return NextResponse.json({ error: "Failed to update progress claim" }, { status: 500 });
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

    const claim = await prisma.progressClaim.findUnique({
      where: { id: params.id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!claim) {
      return NextResponse.json({ error: "Progress claim not found" }, { status: 404 });
    }

    // Only allow deleting draft claims
    if (claim.status !== "DRAFT") {
      return NextResponse.json({ error: "Can only delete draft claims" }, { status: 400 });
    }

    await prisma.progressClaim.delete({ where: { id: params.id } });

    if (claim.project.organizationId) {
      broadcastToOrganization(claim.project.organizationId, {
        type: "progress_claim_deleted",
        data: { id: claim.id, number: claim.number },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting progress claim:", error);
    return NextResponse.json({ error: "Failed to delete progress claim" }, { status: 500 });
  }
}
