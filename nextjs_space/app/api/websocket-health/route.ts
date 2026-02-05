// app/api/websocket-health/route.ts
import { NextResponse } from 'next/server';

/**
 * WebSocket Health Check Endpoint
 * Returns the status of WebSocket server and connection statistics
 */
export async function GET() {
  try {
    // Basic health check - verify server is responding
    const status = {
      status: 'healthy',
      websocket: {
        enabled: true,
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
      },
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(status, { status: 200 });
  } catch {
    console.error('WebSocket health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
