import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { encryptCredentials, decryptCredentials, maskCredentials } from "@/lib/encryption";
import { broadcastToAll } from "@/lib/realtime-clients";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


// GET - List all API connections
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");
    const environment = searchParams.get("environment");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const isBuiltIn = searchParams.get("isBuiltIn");

    const where: any = {};
    if (type) where.type = type;
    if (environment) where.environment = environment;
    if (status) where.status = status;
    if (category) where.category = category;
    if (isBuiltIn !== null && isBuiltIn !== undefined) {
      where.isBuiltIn = isBuiltIn === "true";
    }

    const connections = await prisma.apiConnection.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        lastModifiedBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { logs: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Mask credentials for security
    const maskedConnections = connections.map(conn => {
      const credentials = conn.credentials as Record<string, string>;
      const decrypted = decryptCredentials(credentials);
      return {
        ...conn,
        credentials: maskCredentials(decrypted)
      };
    });

    return NextResponse.json(JSON.parse(JSON.stringify({ connections: maskedConnections })));
  } catch (error) {
    console.error("Error fetching API connections:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new API connection
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      serviceName,
      description,
      type,
      environment,
      credentials,
      baseUrl,
      version,
      headers,
      expiresAt,
      // New plug-and-play fields
      category,
      purpose,
      dependentModules,
      configSchema,
      isBuiltIn,
      isRequired,
      autoReconnect
    } = body;

    if (!name || !serviceName || !credentials) {
      return NextResponse.json(
        { error: "Name, serviceName, and credentials are required" },
        { status: 400 }
      );
    }

    // Check for existing connection with same service + environment
    const existing = await prisma.apiConnection.findFirst({
      where: {
        serviceName: serviceName.toLowerCase(),
        environment: environment || "PRODUCTION"
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Connection for ${serviceName} in ${environment || 'PRODUCTION'} already exists` },
        { status: 409 }
      );
    }

    // Encrypt credentials before storing
    const encryptedCredentials = encryptCredentials(credentials);

    const connection = await prisma.apiConnection.create({
      data: {
        name,
        serviceName: serviceName.toLowerCase(),
        description,
        type: type || "EXTERNAL",
        environment: environment || "PRODUCTION",
        credentials: encryptedCredentials,
        baseUrl,
        version,
        headers: headers || {},
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
        status: "ACTIVE",
        // New plug-and-play fields
        category: category || "OTHER",
        purpose,
        dependentModules: dependentModules || [],
        configSchema: configSchema || {},
        isBuiltIn: isBuiltIn || false,
        isRequired: isRequired || false,
        autoReconnect: autoReconnect !== false // Default true
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log the creation
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: connection.id,
        action: "created",
        details: {
          name,
          serviceName,
          type: type || "EXTERNAL",
          environment: environment || "PRODUCTION"
        },
        newStatus: "ACTIVE",
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    // Broadcast service configured event
    broadcastToAll({
      type: "api_connection_created",
      data: {
        id: connection.id,
        serviceName,
        name,
        environment: environment || "PRODUCTION",
        status: "ACTIVE",
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json(
      JSON.parse(JSON.stringify({
        connection: {
          ...connection,
          credentials: maskCredentials(credentials)
        }
      })),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
