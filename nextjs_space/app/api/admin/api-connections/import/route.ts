import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { encryptCredentials } from "@/lib/encryption";

// POST - Import API connections configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { connections, mode = "merge" } = body; // mode: merge, replace, skip_existing

    if (!Array.isArray(connections) || connections.length === 0) {
      return NextResponse.json({ error: "No connections to import" }, { status: 400 });
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ name: string; error: string }>
    };

    for (const conn of connections) {
      try {
        const { name, serviceName, credentials, ...rest } = conn;

        if (!name || !serviceName) {
          results.errors.push({ name: name || "Unknown", error: "Missing required fields" });
          continue;
        }

        // Check for existing connection
        const existing = await prisma.apiConnection.findFirst({
          where: {
            serviceName: serviceName.toLowerCase(),
            environment: rest.environment || "PRODUCTION"
          }
        });

        if (existing) {
          if (mode === "skip_existing") {
            results.skipped++;
            continue;
          }

          // Update existing
          await prisma.apiConnection.update({
            where: { id: existing.id },
            data: {
              name,
              description: rest.description,
              baseUrl: rest.baseUrl,
              version: rest.version,
              headers: rest.headers || {},
              ...(credentials && { credentials: encryptCredentials(credentials) })
            }
          });

          // Update rate limits if provided
          if (rest.rateLimits) {
            await prisma.apiRateLimitConfig.upsert({
              where: { connectionId: existing.id },
              create: {
                connectionId: existing.id,
                ...rest.rateLimits
              },
              update: rest.rateLimits
            });
          }

          results.updated++;
        } else {
          // Create new
          if (!credentials) {
            results.errors.push({ name, error: "Credentials required for new connections" });
            continue;
          }

          const newConn = await prisma.apiConnection.create({
            data: {
              name,
              serviceName: serviceName.toLowerCase(),
              description: rest.description,
              type: rest.type || "EXTERNAL",
              environment: rest.environment || "PRODUCTION",
              credentials: encryptCredentials(credentials),
              baseUrl: rest.baseUrl,
              version: rest.version,
              headers: rest.headers || {},
              status: "ACTIVE",
              isEnabled: rest.isEnabled ?? true,
              createdById: session.user.id
            }
          });

          // Create rate limits if provided
          if (rest.rateLimits) {
            await prisma.apiRateLimitConfig.create({
              data: {
                connectionId: newConn.id,
                ...rest.rateLimits
              }
            });
          }

          results.imported++;
        }
      } catch (err: any) {
        results.errors.push({ name: conn.name || "Unknown", error: err.message });
      }
    }

    // Log the import action
    await prisma.apiConnectionLog.create({
      data: {
        connectionId: "system",
        action: "bulk_import",
        details: {
          mode,
          totalAttempted: connections.length,
          imported: results.imported,
          updated: results.updated,
          skipped: results.skipped,
          errorCount: results.errors.length,
          importedBy: session.user.email
        },
        performedById: session.user.id,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent")
      }
    });

    return NextResponse.json(results);
  } catch {
    console.error("Error importing API connections:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
