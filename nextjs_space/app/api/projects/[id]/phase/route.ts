export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT update project phase
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id?: string })?.id || '';
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    // Verify project exists and belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { phase, phaseGatesData } = body;

    if (!phase) {
      return NextResponse.json({ error: "Phase is required" }, { status: 400 });
    }

    // Validate phase transition
    const validPhases = ["PRE_CONSTRUCTION", "MOBILIZATION", "ACTIVE", "CLOSEOUT", "CLOSED"];
    if (!validPhases.includes(phase)) {
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }

    // Check if phase gates are met (if phaseGatesData provided)
    let canTransition = true;
    let gateErrors: string[] = [];

    if (phaseGatesData) {
      // Parse phase gates requirements
      const gates = typeof phaseGatesData === 'string' ? JSON.parse(phaseGatesData) : phaseGatesData;
      
      // Example validation: Check required documents, approvals, etc.
      if (gates.requiredDocuments && gates.requiredDocuments.length > 0) {
        const docCount = await prisma.document.count({
          where: {
            projectId: id,
            id: { in: gates.requiredDocuments }
          }
        });
        
        if (docCount < gates.requiredDocuments.length) {
          canTransition = false;
          gateErrors.push("Required documents not uploaded");
        }
      }
    }

    if (!canTransition) {
      return NextResponse.json(
        { error: "Phase gate requirements not met", details: gateErrors },
        { status: 400 }
      );
    }

    // Update project phase
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        phase
      },
      include: {
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `Project phase changed to ${phase}`,
        entityType: "Project",
        entityId: id,
        projectId: id,
        userId,
        details: JSON.stringify({
          oldPhase: project.phase,
          newPhase: phase
        })
      }
    });

    // Broadcast to organization
    if (orgId) {
      await broadcastToOrganization(orgId, {
        type: "project_phase_updated",
        project: updatedProject
      });
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Update project phase error:", error);
    return NextResponse.json({ error: "Failed to update project phase" }, { status: 500 });
  }
}

// GET current phase and gate status
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = (session.user as { organizationId?: string })?.organizationId;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        name: true,
        phase: true,
        status: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate phase completion metrics
    return NextResponse.json({
      project: {
        ...project,
        phaseGates: null
      }
    });
  } catch (error) {
    console.error("Get project phase error:", error);
    return NextResponse.json({ error: "Failed to fetch project phase" }, { status: 500 });
  }
}
