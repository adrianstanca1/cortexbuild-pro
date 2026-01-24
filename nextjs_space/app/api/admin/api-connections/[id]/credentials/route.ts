import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { decryptCredentials } from "@/lib/encryption";

export const dynamic = "force-dynamic";

// GET - Fetch decrypted credentials for editing
// This endpoint is protected and only accessible by SUPER_ADMIN
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await prisma.apiConnection.findUnique({
      where: { id: params.id }
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Decrypt credentials
    const credentials = decryptCredentials(connection.credentials as Record<string, string>);

    // Log the access for audit purposes
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: connection.id,
        action: "credentials_viewed",
        details: {
          credentialKeys: Object.keys(credentials),
          purpose: "edit_configuration"
        },
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
