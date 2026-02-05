import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { broadcastToOrganization } from "@/lib/realtime-clients";
import { sendMEWPCheckCompletedNotification } from "@/lib/email-notifications";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const equipmentId = searchParams.get("equipmentId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "50");

    const whereClause: any = {
      project: { organizationId: orgId }
    };

    if (projectId) whereClause.projectId = projectId;
    if (equipmentId) whereClause.equipmentId = equipmentId;
    if (status) whereClause.overallStatus = status;
    if (date) {
      const checkDate = new Date(date);
      whereClause.checkDate = {
        gte: new Date(checkDate.setHours(0, 0, 0, 0)),
        lte: new Date(checkDate.setHours(23, 59, 59, 999))
      };
    }

    const checks = await prisma.mEWPCheck.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true, email: true } },
        supervisor: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true, equipmentNumber: true } }
      },
      orderBy: { checkDate: "desc" },
      take: limit
    });

    return NextResponse.json({ checks });
  } catch (error) {
    console.error("Error fetching MEWP checks:", error);
    return NextResponse.json({ error: "Failed to fetch MEWP checks" }, { status: 500 });
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
      equipmentId,
      equipmentName,
      equipmentSerial,
      equipmentModel,
      manufacturer,
      location,
      operatorCertNumber,
      certExpiryDate,
      // Check items
      visualInspection,
      guardrailsSecure,
      floorCondition,
      controlsFunction,
      emergencyControls,
      wheelsAndTyres,
      outriggersStabilizers,
      hydraulicSystem,
      electricalSystem,
      safetyDevices,
      warningAlarms,
      manualOverride,
      loadPlateVisible,
      userManualPresent,
      // Results
      overallStatus,
      isSafeToUse,
      defectsFound,
      actionsTaken,
      comments,
      weatherConditions,
      windSpeed,
      // Signature
      operatorSignature
    } = body;

    if (!projectId || !equipmentName) {
      return NextResponse.json(
        { error: "Project and equipment name are required" },
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

    const check = await prisma.mEWPCheck.create({
      data: {
        projectId,
        equipmentId: equipmentId || null,
        equipmentName,
        equipmentSerial: equipmentSerial || null,
        equipmentModel: equipmentModel || null,
        manufacturer: manufacturer || null,
        location: location || null,
        operatorId: userId,
        operatorCertNumber: operatorCertNumber || null,
        certExpiryDate: certExpiryDate ? new Date(certExpiryDate) : null,
        // Check items with defaults
        visualInspection: visualInspection || "OK",
        guardrailsSecure: guardrailsSecure || "OK",
        floorCondition: floorCondition || "OK",
        controlsFunction: controlsFunction || "OK",
        emergencyControls: emergencyControls || "OK",
        wheelsAndTyres: wheelsAndTyres || "OK",
        outriggersStabilizers: outriggersStabilizers || "OK",
        hydraulicSystem: hydraulicSystem || "OK",
        electricalSystem: electricalSystem || "OK",
        safetyDevices: safetyDevices || "OK",
        warningAlarms: warningAlarms || "OK",
        manualOverride: manualOverride || "OK",
        loadPlateVisible: loadPlateVisible || "OK",
        userManualPresent: userManualPresent || "OK",
        // Results
        overallStatus: overallStatus || "PASS",
        isSafeToUse: isSafeToUse !== false,
        defectsFound: defectsFound || null,
        actionsTaken: actionsTaken || null,
        comments: comments || null,
        weatherConditions: weatherConditions || null,
        windSpeed: windSpeed || null,
        // Signature
        operatorSignature: operatorSignature || null,
        operatorSignedAt: operatorSignature ? new Date() : null
      },
      include: {
        project: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "MEWP_CHECK_COMPLETED",
        entityType: "MEWP_CHECK",
        entityId: check.id,
        userId,
        projectId,
        details: JSON.stringify({ equipment: equipmentName, status: check.overallStatus, safeToUse: check.isSafeToUse })
      }
    });

    broadcastToOrganization(orgId, {
      type: "mewp_check_completed",
      data: { check }
    });

    // Send email notification (non-blocking)
    sendMEWPCheckCompletedNotification(
      {
        id: check.id,
        equipmentName: check.equipmentName || 'MEWP Equipment',
        serialNumber: check.equipmentSerial,
        overallStatus: check.overallStatus,
        safeToUse: check.isSafeToUse,
        operatorName: check.operator?.name,
        projectName: check.project.name,
        checkDate: new Date(check.checkDate),
        defectsFound: check.defectsFound
      },
      'adrian.stanca1@gmail.com'
    ).catch(err => console.error('Email notification error:', err));

    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    console.error("Error creating MEWP check:", error);
    return NextResponse.json({ error: "Failed to create MEWP check" }, { status: 500 });
  }
}
