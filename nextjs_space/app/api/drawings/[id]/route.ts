import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drawing = await prisma.drawing.findUnique({
      where: { id: id },
      include: {
        project: { select: { id: true, name: true } },
        revisions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error fetching drawing:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawing" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      number,
      title,
      description,
      discipline,
      status,
      currentRevision,
      scale,
      sheetSize,
      newRevision,
    } = body;

    const existingDrawing = await prisma.drawing.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!existingDrawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    // If adding a new revision
    if (newRevision) {
      await prisma.drawingRevision.create({
        data: {
          drawingId: id,
          revision: newRevision.revision,
          description: newRevision.description,
          cloudStoragePath: newRevision.cloudStoragePath,
          fileSize: newRevision.fileSize,
          mimeType: newRevision.mimeType,
          issuedBy: newRevision.issuedBy,
        },
      });
    }

    const drawing = await prisma.drawing.update({
      where: { id: id },
      data: {
        ...(number && { number }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(discipline && { discipline }),
        ...(status && { status }),
        ...(currentRevision && { currentRevision }),
        ...(scale !== undefined && { scale }),
        ...(sheetSize !== undefined && { sheetSize }),
      },
      include: {
        project: { select: { id: true, name: true } },
        revisions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (existingDrawing.project.organizationId) {
      broadcastToOrganization(existingDrawing.project.organizationId, {
        type: "drawing_updated",
        data: { id: drawing.id, number: drawing.number, title: drawing.title },
      });
    }

    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error updating drawing:", error);
    return NextResponse.json(
      { error: "Failed to update drawing" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drawing = await prisma.drawing.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    await prisma.drawing.delete({ where: { id: id } });

    if (drawing.project.organizationId) {
      broadcastToOrganization(drawing.project.organizationId, {
        type: "drawing_deleted",
        data: { id: drawing.id, number: drawing.number },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting drawing:", error);
    return NextResponse.json(
      { error: "Failed to delete drawing" },
      { status: 500 },
    );
  }
}
