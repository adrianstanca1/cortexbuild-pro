// GET /api/deployment/status - Overall system health
// Returns combined deployment status including PM2 and Docker stats

import { NextResponse } from 'next/server';
import { getDeploymentStatus } from '@/lib/deployment';
import { checkDockerAvailability } from '@/lib/deployment/docker-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [status, dockerAvailability] = await Promise.all([
      getDeploymentStatus(),
      checkDockerAvailability(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        system: status.system,
        pm2: {
          available: status.pm2.available,
          stats: status.pm2.stats,
        },
        docker: {
          available: status.docker.available,
          stats: status.docker.stats,
          isMock: dockerAvailability.isMock,
          socketPath: dockerAvailability.socketPath,
          message: dockerAvailability.message,
        },
        services: status.services,
        lastChecked: status.lastChecked,
      },
    });
  } catch (error) {
    console.error('Deployment status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deployment status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
