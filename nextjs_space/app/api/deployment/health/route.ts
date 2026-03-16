// GET /api/deployment/health - Service health checks
// Returns health status for all PM2 processes and Docker containers

import { NextResponse } from 'next/server';
import { getServiceHealthChecks } from '@/lib/deployment';
import { checkDockerAvailability } from '@/lib/deployment/docker-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [healthChecks, dockerAvailability] = await Promise.all([
      getServiceHealthChecks(),
      checkDockerAvailability(),
    ]);

    const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
    const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;

    let overallStatus = 'healthy';
    if (unhealthyCount > healthChecks.length * 0.5) {
      overallStatus = 'unhealthy';
    } else if (unhealthyCount > 0) {
      overallStatus = 'degraded';
    }

    return NextResponse.json({
      success: true,
      data: {
        overallStatus,
        summary: {
          total: healthChecks.length,
          healthy: healthyCount,
          unhealthy: unhealthyCount,
        },
        checks: healthChecks,
        docker: {
          available: dockerAvailability.available,
          isMock: dockerAvailability.isMock,
          message: dockerAvailability.message,
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform health checks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
