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

    const annotations = await prisma.drawingAnnotation.findMany({
      where: { drawingId: id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, color, strokeWidth, text } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Type and data are required" },
        { status: 400 }
      );
    }

    // Get drawing to find organization
    const drawing = await prisma.drawing.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    const annotation = await prisma.drawingAnnotation.create({
      data: {
        drawingId: id,
        type,
        data,
        color,
        strokeWidth,
        text,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast to organization
    if (drawing.project.organizationId) {
      broadcastToOrganization(drawing.project.organizationId, {
        type: "annotation_added",
        data: {
          drawingId: id,
          annotation,
        },
      });
    }

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("Error creating annotation:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
