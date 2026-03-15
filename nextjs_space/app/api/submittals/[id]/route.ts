import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submittal = await prisma.submittal.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        attachments: true,
      },
    });

    if (!submittal) {
      return NextResponse.json(
        { error: "Submittal not found" },
        { status: 404 },
      );
    }

    if (submittal.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(submittal);
  } catch (error) {
    console.error("Error fetching submittal:", error);
    return NextResponse.json(
      { error: "Failed to fetch submittal" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reviewComments, title, description, specSection, dueDate } =
      body;

    const existingSubmittal = await prisma.submittal.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!existingSubmittal) {
      return NextResponse.json(
        { error: "Submittal not found" },
        { status: 404 },
      );
    }

    if (
      existingSubmittal.project.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (specSection !== undefined) updateData.specSection = specSection;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;

    if (status !== undefined) {
      updateData.status = status;
      if (status === "SUBMITTED") {
        updateData.submittedAt = new Date();
        updateData.submittedById = session.user.id;
      }
      if (["APPROVED", "REJECTED", "REVISE_RESUBMIT"].includes(status)) {
        updateData.reviewedAt = new Date();
        updateData.reviewedById = session.user.id;
      }
      if (status === "REVISE_RESUBMIT") {
        updateData.revisionNumber = existingSubmittal.revisionNumber + 1;
      }
    }
    if (reviewComments !== undefined)
      updateData.reviewComments = reviewComments;

    const submittal = await prisma.submittal.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: status
          ? `status_changed_to_${status.toLowerCase()}`
          : "updated",
        entityType: "submittal",
        entityId: submittal.id,
        entityName: `Submittal #${submittal.number}: ${submittal.title}`,
        userId: session.user.id,
        projectId: submittal.projectId,
      },
    });

    // Broadcast real-time event
    broadcastToOrganization(existingSubmittal.project.organizationId, {
      type: "submittal_updated",
      payload: {
        ...submittal,
        updatedByName: session.user.name,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(submittal);
  } catch (error) {
    console.error("Error updating submittal:", error);
    return NextResponse.json(
      { error: "Failed to update submittal" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const submittal = await prisma.submittal.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!submittal) {
      return NextResponse.json(
        { error: "Submittal not found" },
        { status: 404 },
      );
    }

    if (submittal.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.submittal.delete({ where: { id } });

    // Broadcast deletion
    broadcastToOrganization(submittal.project.organizationId, {
      type: "submittal_deleted",
      payload: { id, number: submittal.number, title: submittal.title },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting submittal:", error);
    return NextResponse.json(
      { error: "Failed to delete submittal" },
      { status: 500 },
    );
  }
}
