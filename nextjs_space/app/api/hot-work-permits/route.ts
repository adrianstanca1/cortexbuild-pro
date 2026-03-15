import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    } else if (session.user.organizationId) {
      const projects = await prisma.project.findMany({
        where: { organizationId: session.user.organizationId },
        select: { id: true },
      });
      where.projectId = { in: projects.map((p) => p.id) };
    }

    if (status) {
      where.status = status;
    }

    const permits = await prisma.hotWorkPermit.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(permits);
  } catch (error) {
    console.error("Error fetching hot work permits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Get next number
    const lastPermit = await prisma.hotWorkPermit.findFirst({
      where: { projectId: data.projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (lastPermit?.number || 0) + 1;

    const permit = await prisma.hotWorkPermit.create({
      data: {
        number,
        workDescription: data.workDescription,
        location: data.location,
        floor: data.floor,
        equipment: data.equipment,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        fireExtinguisherAvailable: data.fireExtinguisherAvailable || false,
        areaCleared: data.areaCleared || false,
        combustiblesRemoved: data.combustiblesRemoved || false,
        fireWatchAssigned: data.fireWatchAssigned || false,
        sprinklersOperational: data.sprinklersOperational ?? true,
        detectorsIsolated: data.detectorsIsolated || false,
        ventilationAdequate: data.ventilationAdequate || false,
        fireWatchName: data.fireWatchName,
        fireWatchDuration: data.fireWatchDuration,
        projectId: data.projectId,
        requestedById: session.user.id,
        requesterSignature: data.requesterSignature,
        requesterSignedAt: data.requesterSignature ? new Date() : null,
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "created",
        entityType: "HotWorkPermit",
        entityId: permit.id,
        entityName: `Hot Work Permit #${number}`,
        userId: session.user.id,
        projectId: data.projectId,
      },
    });

    broadcastToOrganization(permit.project.organizationId, {
      type: "hot_work_permit_created",
      data: permit,
    });

    return NextResponse.json(permit, { status: 201 });
  } catch (error) {
    console.error("Error creating hot work permit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
