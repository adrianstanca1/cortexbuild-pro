export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Health check endpoint for monitoring and load balancers
 * This endpoint does not require authentication
 * Returns 200 if all systems are operational
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "operational"
      },
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || "1.0.0"
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch {
    console.error("Health check failed:", error);
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        api: "operational"
      },
      error: error instanceof Error ? error.message : "Unknown error"
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  }
}
