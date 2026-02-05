export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const discipline = searchParams.get("discipline");
    const status = searchParams.get("status");

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      where.project = { organizationId: session.user.organizationId };
    }
    
    if (discipline) where.discipline = discipline;
    if (status) where.status = status;

    const drawings = await prisma.drawing.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        revisions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { number: "asc" },
    });

    return NextResponse.json(drawings);
  } catch (error) {
    console.error("Error fetching drawings:", error);
    return NextResponse.json({ error: "Failed to fetch drawings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, number, title, description, discipline, scale, sheetSize } = body;

    if (!projectId || !number || !title) {
      return NextResponse.json({ error: "Project ID, number, and title are required" }, { status: 400 });
    }

    const drawing = await prisma.drawing.create({
      data: {
        projectId,
        number,
        title,
        description,
        discipline: discipline || "ARCHITECTURAL",
        scale,
        sheetSize,
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        revisions: true,
      },
    });

    if (drawing.project.organizationId) {
      broadcastToOrganization(drawing.project.organizationId, {
        type: "drawing_created",
        data: { id: drawing.id, number: drawing.number, title: drawing.title, projectName: drawing.project.name },
      });
    }

    return NextResponse.json(drawing, { status: 201 });
  } catch (error) {
    console.error("Error creating drawing:", error);
    return NextResponse.json({ error: "Failed to create drawing" }, { status: 500 });
  }
}
