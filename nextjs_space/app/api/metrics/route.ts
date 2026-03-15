import { NextRequest, NextResponse } from "next/server";
import { register, collectDefaultMetrics } from "prom-client";

// Initialize default Node.js metrics
collectDefaultMetrics({ register });

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Collect and return metrics in Prometheus format
    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      headers: {
        "Content-Type": register.contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error collecting metrics:", error);
    return new NextResponse("Error collecting metrics", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
