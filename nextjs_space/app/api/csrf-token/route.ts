/**
 * CSRF Token API Endpoint
 * 
 * Provides CSRF tokens to the frontend for secure form submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCsrfTokenForClient } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  try {
    const token = await getCsrfTokenForClient();
    
    logger.info('CSRF token generated', {
      path: '/api/csrf-token',
      method: 'GET',
    });
    
    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    logger.error('Failed to generate CSRF token', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
