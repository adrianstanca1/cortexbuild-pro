// GET /api/deployment/containers - Docker container list
// Returns list of all Docker containers with resource usage

import { NextResponse } from 'next/server';
import { getDockerContainers, getDockerStats, checkDockerAvailability } from '@/lib/deployment/docker-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [containers, stats, availability] = await Promise.all([
      getDockerContainers(),
      getDockerStats(),
      checkDockerAvailability(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        containers,
        stats,
        isMock: availability.isMock,
        message: availability.message,
      },
    });
  } catch (error) {
    console.error('Docker containers error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Docker containers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
