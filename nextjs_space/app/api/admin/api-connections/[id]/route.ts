import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { encryptCredentials, decryptCredentials, maskCredentials } from "@/lib/encryption";

// GET - Get single API connection details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await prisma.apiConnection.findUnique({
      where: { id: id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        logs: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            performedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const credentials = connection.credentials as Record<string, string>;
    const decrypted = decryptCredentials(credentials);

    return NextResponse.json(JSON.parse(JSON.stringify({
      connection: {
        ...connection,
        credentials: maskCredentials(decrypted)
      }
    })));
  } catch (error) {
    console.error("Error fetching API connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update API connection
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.apiConnection.findUnique({
      where: { id: id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      description,
      credentials,
      baseUrl,
      version,
      headers,
      isEnabled,
      status,
      environment,
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

    const updateData: any = {};
    const changes: string[] = [];

    if (name !== undefined) {
      updateData.name = name;
      changes.push("name");
    }
    if (description !== undefined) {
      updateData.description = description;
      changes.push("description");
    }
    if (baseUrl !== undefined) {
      updateData.baseUrl = baseUrl;
      changes.push("baseUrl");
    }
    if (version !== undefined) {
      updateData.version = version;
      changes.push("version");
    }
    if (headers !== undefined) {
      updateData.headers = headers;
      changes.push("headers");
    }
    if (isEnabled !== undefined) {
      updateData.isEnabled = isEnabled;
      changes.push("isEnabled");
    }
    if (status !== undefined) {
      updateData.status = status;
      changes.push("status");
    }
    if (environment !== undefined) {
      updateData.environment = environment;
      changes.push("environment");
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      changes.push("expiresAt");
    }
    if (credentials) {
      updateData.credentials = encryptCredentials(credentials);
      changes.push("credentials");
    }
    // New plug-and-play fields
    if (category !== undefined) {
      updateData.category = category;
      changes.push("category");
    }
    if (purpose !== undefined) {
      updateData.purpose = purpose;
      changes.push("purpose");
    }
    if (dependentModules !== undefined) {
      updateData.dependentModules = dependentModules;
      changes.push("dependentModules");
    }
    if (configSchema !== undefined) {
      updateData.configSchema = configSchema;
      changes.push("configSchema");
    }
    if (isBuiltIn !== undefined) {
      updateData.isBuiltIn = isBuiltIn;
      changes.push("isBuiltIn");
    }
    if (isRequired !== undefined) {
      updateData.isRequired = isRequired;
      changes.push("isRequired");
    }
    if (autoReconnect !== undefined) {
      updateData.autoReconnect = autoReconnect;
      changes.push("autoReconnect");
    }
    // Track last modifier
    updateData.lastModifiedById = session.user.id;

    const connection = await prisma.apiConnection.update({
      where: { id: id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        lastModifiedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log the update
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: connection.id,
        action: "updated",
        details: { fieldsChanged: changes },
        previousStatus: existing.status,
        newStatus: connection.status,
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    const updatedCredentials = connection.credentials as Record<string, string>;
    const decrypted = decryptCredentials(updatedCredentials);

    return NextResponse.json(JSON.parse(JSON.stringify({
      connection: {
        ...connection,
        credentials: maskCredentials(decrypted)
      }
    })));
  } catch (error) {
    console.error("Error updating API connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete API connection
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.apiConnection.findUnique({
      where: { id: id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Log before deletion
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: existing.id,
        action: "deleted",
        details: {
          name: existing.name,
          serviceName: existing.serviceName,
          environment: existing.environment
        },
        previousStatus: existing.status,
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    await prisma.apiConnection.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
