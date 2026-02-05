import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; annotationId: string }> }
) {
  try {
    const { id, annotationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data, color, strokeWidth, text, visible } = body;

    const existingAnnotation = await prisma.drawingAnnotation.findUnique({
      where: { id: annotationId },
      include: {
        drawing: {
          include: { project: { select: { organizationId: true } } },
        },
      },
    });

    if (!existingAnnotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Only allow creator to edit
    if (existingAnnotation.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const annotation = await prisma.drawingAnnotation.update({
      where: { id: annotationId },
      data: {
        ...(data && { data }),
        ...(color && { color }),
        ...(strokeWidth !== undefined && { strokeWidth }),
        ...(text !== undefined && { text }),
        ...(visible !== undefined && { visible }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast to organization
    if (existingAnnotation.drawing.project.organizationId) {
      broadcastToOrganization(
        existingAnnotation.drawing.project.organizationId,
        {
          type: "annotation_updated",
          data: {
            drawingId: id,
            annotation,
          },
        }
      );
    }

    return NextResponse.json(annotation);
  } catch {
    console.error("Error updating annotation:", error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; annotationId: string }> }
) {
  const { id, annotationId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const annotation = await prisma.drawingAnnotation.findUnique({
      where: { id: annotationId },
      include: {
        drawing: {
          include: { project: { select: { organizationId: true } } },
        },
      },
    });

    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Only allow creator to delete
    if (annotation.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.drawingAnnotation.delete({
      where: { id: annotationId },
    });

    // Broadcast to organization
    if (annotation.drawing.project.organizationId) {
      broadcastToOrganization(annotation.drawing.project.organizationId, {
        type: "annotation_deleted",
        data: {
          drawingId: id,
          annotationId: annotationId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("Error deleting annotation:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
