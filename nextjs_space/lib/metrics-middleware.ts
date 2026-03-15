// =====================================================
// PROMETHEUS METRICS MIDDLEWARE FOR NEXT.JS
// Tracks HTTP request metrics for monitoring
// =====================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Counter, Histogram, register } from "prom-client";

// Create metrics if they don't exist
const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestSize = new Histogram({
  name: "http_request_size_bytes",
  help: "Size of HTTP requests in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

const httpResponseSize = new Histogram({
  name: "http_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["method", "route", "status_code"],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

// Business metrics
const activeUsersGauge = new Counter({
  name: "cortexbuild_active_users_total",
  help: "Total number of active users",
  registers: [register],
});

const apiErrorsTotal = new Counter({
  name: "cortexbuild_api_errors_total",
  help: "Total number of API errors",
  labelNames: ["route", "error_code"],
  registers: [register],
});

export function middleware(request: NextRequest) {
  // Skip metrics endpoint itself to avoid recursion
  if (request.nextUrl.pathname === "/api/metrics") {
    return NextResponse.next();
  }

  const start = Date.now();
  const route = request.nextUrl.pathname;
  const method = request.method;

  // Track request size if available
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    httpRequestSize.observe({ method, route }, parseInt(contentLength, 10));
  }

  // Create a response with tracking
  const response = NextResponse.next();

  // Add tracking headers
  response.headers.set("X-Request-Start", start.toString());

  return response;
}

// Export metrics for use in API routes
export {
  httpRequestsTotal,
  httpRequestDuration,
  apiErrorsTotal,
  activeUsersGauge,
};

// Config for middleware matching
export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/metrics).*)",
  ],
};
