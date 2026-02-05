import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

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
    const { userId, userName } = body;

    // Get drawing to find organization
    const drawing = await prisma.drawing.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } },
    });

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    // Broadcast user presence
    if (drawing.project.organizationId) {
      broadcastToOrganization(drawing.project.organizationId, {
        type: "user_viewing_drawing",
        data: {
          drawingId: id,
          userId,
          userName,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("Error announcing presence:", error);
    return NextResponse.json(
      { error: "Failed to announce presence" },
      { status: 500 }
    );
  }
}
