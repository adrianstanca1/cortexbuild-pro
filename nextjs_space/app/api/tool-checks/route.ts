import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import { sendToolCheckCompletedNotification } from "@/lib/email-notifications";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const toolType = searchParams.get("toolType");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "50");

    const whereClause: any = {
      project: { organizationId: orgId }
    };

    if (projectId) whereClause.projectId = projectId;
    if (toolType) whereClause.toolType = toolType;
    if (status) whereClause.overallStatus = status;
    if (date) {
      const checkDate = new Date(date);
      whereClause.checkDate = {
        gte: new Date(checkDate.setHours(0, 0, 0, 0)),
        lte: new Date(checkDate.setHours(23, 59, 59, 999))
      };
    }

    const checks = await prisma.toolCheck.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true, email: true } }
      },
      orderBy: { checkDate: "desc" },
      take: limit
    });

    return NextResponse.json({ checks });
  } catch (error) {
    console.error("Error fetching tool checks:", error);
    return NextResponse.json({ error: "Failed to fetch tool checks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgId = (session.user as any).organizationId;
    const body = await request.json();

    const {
      projectId,
      toolName,
      toolType,
      toolSerial,
      toolAssetTag,
      manufacturer,
      location,
      // Check items
      generalCondition,
      cableCondition,
      plugCondition,
      guardsFunctional,
      switchesFunctional,
      handlesSecure,
      bladeSharpness,
      lubricationStatus,
      safetyFeatures,
      storageCondition,
      patTestCurrent,
      // Ladder-specific
      stileCondition,
      rungCondition,
      feetCondition,
      lockingMechanismOk,
      // Results
      overallStatus,
      isSafeToUse,
      nextInspectionDue,
      defectsFound,
      actionsTaken,
      comments,
      // Signature
      inspectorSignature,
      photoUrls
    } = body;

    if (!projectId || !toolName || !toolType) {
      return NextResponse.json(
        { error: "Project, tool name, and tool type are required" },
        { status: 400 }
      );
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const check = await prisma.toolCheck.create({
      data: {
        projectId,
        toolName,
        toolType,
        toolSerial: toolSerial || null,
        toolAssetTag: toolAssetTag || null,
        manufacturer: manufacturer || null,
        location: location || null,
        inspectorId: userId,
        // Check items with defaults
        generalCondition: generalCondition || "OK",
        cableCondition: cableCondition || "NA",
        plugCondition: plugCondition || "NA",
        guardsFunctional: guardsFunctional || "NA",
        switchesFunctional: switchesFunctional || "OK",
        handlesSecure: handlesSecure || "OK",
        bladeSharpness: bladeSharpness || "NA",
        lubricationStatus: lubricationStatus || "NA",
        safetyFeatures: safetyFeatures || "OK",
        storageCondition: storageCondition || "OK",
        patTestCurrent: patTestCurrent || "NA",
        // Ladder-specific
        stileCondition: stileCondition || "NA",
        rungCondition: rungCondition || "NA",
        feetCondition: feetCondition || "NA",
        lockingMechanismOk: lockingMechanismOk || "NA",
        // Results
        overallStatus: overallStatus || "PASS",
        isSafeToUse: isSafeToUse !== false,
        nextInspectionDue: nextInspectionDue ? new Date(nextInspectionDue) : null,
        defectsFound: defectsFound || null,
        actionsTaken: actionsTaken || null,
        comments: comments || null,
        // Signature
        inspectorSignature: inspectorSignature || null,
        inspectorSignedAt: inspectorSignature ? new Date() : null,
        photoUrls: photoUrls || []
      },
      include: {
        project: { select: { id: true, name: true } },
        inspector: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "TOOL_CHECK_COMPLETED",
        entityType: "TOOL_CHECK",
        entityId: check.id,
        userId,
        projectId,
        details: JSON.stringify({ tool: toolName, type: toolType, status: check.overallStatus, safeToUse: check.isSafeToUse })
      }
    });

    broadcastToOrganization(orgId, {
      type: "tool_check_completed",
      data: { check }
    });

    // Send email notification (non-blocking)
    sendToolCheckCompletedNotification(
      {
        id: check.id,
        toolName: check.toolName || 'Tool',
        toolType: check.toolType,
        serialNumber: check.toolSerial,
        overallStatus: check.overallStatus,
        safeToUse: check.isSafeToUse,
        inspectorName: check.inspector?.name,
        projectName: check.project.name,
        checkDate: new Date(check.checkDate),
        defectsFound: check.defectsFound
      },
      'adrian.stanca1@gmail.com'
    ).catch(err => console.error('Email notification error:', err));

    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    console.error("Error creating tool check:", error);
    return NextResponse.json({ error: "Failed to create tool check" }, { status: 500 });
  }
}
