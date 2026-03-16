// GET /api/deployment/processes - PM2 process list
// Returns list of all PM2-managed processes with stats

import { NextResponse } from 'next/server';
import { getPM2Processes, getPM2Stats } from '@/lib/deployment/pm2-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [processes, stats] = await Promise.all([
      getPM2Processes(),
      getPM2Stats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        processes,
        stats,
      },
    });
  } catch (error) {
    console.error('PM2 processes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch PM2 processes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
