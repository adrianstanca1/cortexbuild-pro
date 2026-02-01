export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  serviceRegistry,
  getAllServiceInstances,
  ServiceEnvironment,
  PLATFORM_SERVICES
} from "@/lib/service-registry";
import { prisma } from "@/lib/db";

// GET - Get all platform services with their current status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const environment = searchParams.get("environment") as ServiceEnvironment | null;
    const category = searchParams.get("category");
    const includeCustom = searchParams.get("includeCustom") !== "false";

    // Get all service instances with their current status
    const instances = await getAllServiceInstances(environment || undefined);

    // Filter by category if specified
    let filteredInstances = category
      ? instances.filter(i => i.definition.category === category)
      : instances;

    // Filter out custom services if not requested
    if (!includeCustom) {
      filteredInstances = filteredInstances.filter(i => i.definition.isBuiltIn);
    }

    // Get summary stats with single-pass reduce for better performance
    const stats = filteredInstances.reduce((acc, i) => {
      // Count by status
      if (i.status === "ACTIVE") acc.active++;
      else if (i.status === "INACTIVE") acc.inactive++;
      else if (i.status === "DISCONNECTED") acc.disconnected++;
      else if (i.status === "NOT_CONFIGURED") acc.notConfigured++;
      // Note: Unknown statuses are not counted but included in total
      
      // Count core services
      if (i.definition.isPlatformCore) {
        acc.coreServices++;
        if (i.status === "ACTIVE") acc.coreActive++;
      }
      
      return acc;
    }, {
      total: filteredInstances.length,
      active: 0,
      inactive: 0,
      disconnected: 0,
      notConfigured: 0,
      coreServices: 0,
      coreActive: 0
    });

    // Get categories for filtering
    const categories = [...new Set(PLATFORM_SERVICES.map(s => s.category))];

    return NextResponse.json({
      services: filteredInstances.map(i => ({
        ...i.definition,
        status: i.status,
        environment: i.environment,
        isConfigured: i.isConfigured,
        connectionId: i.connectionId,
        lastValidatedAt: i.lastValidatedAt,
        lastErrorMessage: i.lastErrorMessage
      })),
      stats,
      categories
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Quick configure a built-in service
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId, credentials, environment = "PRODUCTION" } = body;

    // Get the service definition
    const service = serviceRegistry.getService(serviceId);
    if (!service) {
      return NextResponse.json(
        { error: `Service '${serviceId}' not found` },
        { status: 404 }
      );
    }

    // Check if already configured
    const existing = await prisma.apiConnection.findFirst({
      where: {
        serviceName: serviceId.toLowerCase(),
        environment
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Service already configured for ${environment}` },
        { status: 409 }
      );
    }

    // Validate required credentials
    const requiredFields = service.credentialFields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!credentials[field.key]) {
        return NextResponse.json(
          { error: `Missing required credential: ${field.label}` },
          { status: 400 }
        );
      }
    }

    // Import encryption function
    const { encryptCredentials } = await import("@/lib/encryption");

    // Create the connection
    const connection = await prisma.apiConnection.create({
      data: {
        name: service.name,
        serviceName: serviceId.toLowerCase(),
        description: service.description,
        type: service.category === "INTERNAL" ? "INTERNAL" : "EXTERNAL",
        environment,
        credentials: encryptCredentials(credentials),
        baseUrl: service.baseUrl,
        status: "ACTIVE",
        createdById: session.user.id
      }
    });

    // Log the creation
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: connection.id,
        action: "quick_configure",
        details: {
          serviceId,
          environment,
          method: "platform_services"
        },
        newStatus: "ACTIVE",
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    return NextResponse.json(
      JSON.parse(JSON.stringify({
        success: true,
        connection: {
          id: connection.id,
          name: connection.name,
          serviceName: connection.serviceName,
          status: connection.status,
          environment: connection.environment
        }
      })),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error configuring service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
