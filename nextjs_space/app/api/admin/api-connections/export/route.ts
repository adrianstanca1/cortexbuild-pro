import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { decryptCredentials } from "@/lib/encryption";

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


// GET - Export API connections configuration
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const includeCredentials = searchParams.get("includeCredentials") === "true";
    const environment = searchParams.get("environment");
    const format = searchParams.get("format") || "json"; // json or csv

    const where: any = {};
    if (environment) where.environment = environment;

    const connections = await prisma.apiConnection.findMany({
      where,
      include: {
        rateLimitConfig: true,
        _count: { select: { logs: true, healthChecks: true, usageRecords: true } }
      }
    });

    // Prepare export data
    const exportData = connections.map(conn => {
      const base = {
        id: conn.id,
        name: conn.name,
        serviceName: conn.serviceName,
        description: conn.description,
        type: conn.type,
        environment: conn.environment,
        baseUrl: conn.baseUrl,
        version: conn.version,
        headers: conn.headers,
        status: conn.status,
        isEnabled: conn.isEnabled,
        expiresAt: conn.expiresAt,
        rateLimits: conn.rateLimitConfig ? {
          requestsPerMinute: conn.rateLimitConfig.requestsPerMinute,
          requestsPerHour: conn.rateLimitConfig.requestsPerHour,
          requestsPerDay: conn.rateLimitConfig.requestsPerDay,
          burstLimit: conn.rateLimitConfig.burstLimit,
          alertThreshold: conn.rateLimitConfig.alertThreshold
        } : null,
        stats: conn._count
      };

      // Only include decrypted credentials if explicitly requested (sensitive!)
      if (includeCredentials) {
        const creds = conn.credentials as Record<string, string>;
        return { ...base, credentials: decryptCredentials(creds) };
      }
      return base;
    });

    // Log the export action
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: connections[0]?.id || "system",
        action: "bulk_export",
        details: {
          count: connections.length,
          includeCredentials,
          environment: environment || "all",
          exportedBy: session.user.email
        },
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    if (format === "csv") {
      const headers = ["id", "name", "serviceName", "type", "environment", "status", "baseUrl", "isEnabled"];
      const csvRows = [
        headers.join(","),
        ...exportData.map(conn => 
          headers.map(h => JSON.stringify((conn as any)[h] ?? "")).join(",")
        )
      ];
      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="api-connections-export.csv"`
        }
      });
    }

    return NextResponse.json(bigintSafe({
      exportedAt: new Date().toISOString(),
      count: exportData.length,
      connections: exportData
    }));
  } catch (error) {
    console.error("Error exporting API connections:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
