export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  encryptCredentials,
  decryptCredentials,
  maskCredentials,
} from "@/lib/encryption";

// POST - Rotate/Replace API credentials
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const connection = await prisma.apiConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { newCredentials, credentials, reason } = body;

    // Accept either newCredentials or credentials field
    const credsToUse = newCredentials || credentials;

    if (
      !credsToUse ||
      typeof credsToUse !== "object" ||
      Object.keys(credsToUse).length === 0
    ) {
      return NextResponse.json(
        { error: "New credentials are required" },
        { status: 400 },
      );
    }

    // Encrypt new credentials
    const encryptedCredentials = encryptCredentials(credsToUse);

    // Update connection with new credentials
    const updated = await prisma.apiConnection.update({
      where: { id },
      data: {
        credentials: encryptedCredentials,
        status: "ACTIVE",
        lastErrorMessage: null,
        consecutiveErrors: 0,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log the rotation
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: connection.id,
        action: "rotated",
        details: {
          reason: reason || "Manual rotation",
          credentialKeys: Object.keys(credsToUse),
        },
        previousStatus: connection.status,
        newStatus: "ACTIVE",
        performedById: session.user.id,
        ipAddress:
          req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify({
          connection: {
            ...updated,
            credentials: maskCredentials(credsToUse),
          },
          message: "Credentials rotated successfully",
        }),
      ),
    );
  } catch (error) {
    console.error("Error rotating API credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
