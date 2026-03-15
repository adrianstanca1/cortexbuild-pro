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

    const permits = await prisma.confinedSpacePermit.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(permits);
  } catch (error) {
    console.error("Error fetching confined space permits:", error);
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

    const lastPermit = await prisma.confinedSpacePermit.findFirst({
      where: { projectId: data.projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (lastPermit?.number || 0) + 1;

    const permit = await prisma.confinedSpacePermit.create({
      data: {
        number,
        spaceDescription: data.spaceDescription,
        location: data.location,
        reasonForEntry: data.reasonForEntry,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        oxygenLevel: data.oxygenLevel,
        h2sLevel: data.h2sLevel,
        coLevel: data.coLevel,
        lelLevel: data.lelLevel,
        testDateTime: data.testDateTime ? new Date(data.testDateTime) : null,
        testPerformedBy: data.testPerformedBy,
        spaceLocked: data.spaceLocked || false,
        spaceIsolated: data.spaceIsolated || false,
        ventilationProvided: data.ventilationProvided || false,
        lightingProvided: data.lightingProvided || false,
        communicationTested: data.communicationTested || false,
        rescueEquipmentReady: data.rescueEquipmentReady || false,
        entrantsTrained: data.entrantsTrained || false,
        entrantNames: data.entrantNames || [],
        attendantName: data.attendantName,
        rescueTeamNotified: data.rescueTeamNotified || false,
        emergencyContact: data.emergencyContact,
        emergencyNumber: data.emergencyNumber,
        nearestHospital: data.nearestHospital,
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
        entityType: "ConfinedSpacePermit",
        entityId: permit.id,
        entityName: `Confined Space Permit #${number}`,
        userId: session.user.id,
        projectId: data.projectId,
      },
    });

    broadcastToOrganization(permit.project.organizationId, {
      type: "confined_space_permit_created",
      data: permit,
    });

    return NextResponse.json(permit, { status: 201 });
  } catch (error) {
    console.error("Error creating confined space permit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
