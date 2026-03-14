import { NextRequest, NextResponse } from 'next/server';

// In-memory metrics (simplified for Next.js API route)
const metrics = {
  totalRequests: 0,
  averageResponseTime: 0,
  errorRate: 0,
  requestsPerEndpoint: {} as Record<string, number>
};

export async function GET(request: NextRequest) {
  // Return metrics in Prometheus format
  const prometheusMetrics = `# HELP cortexbuild_requests_total Total HTTP requests
# TYPE cortexbuild_requests_total counter
cortexbuild_requests_total ${metrics.totalRequests}

# HELP cortexbuild_response_time_avg Average response time in ms
# TYPE cortexbuild_response_time_avg gauge
cortexbuild_response_time_avg ${metrics.averageResponseTime}

# HELP cortexbuild_error_rate Error rate percentage
# TYPE cortexbuild_error_rate gauge
cortexbuild_error_rate ${metrics.errorRate}

# HELP cortexbuild_up App is running
# TYPE cortexbuild_up gauge
cortexbuild_up 1
`;

  return new NextResponse(prometheusMetrics, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' }
  });
}