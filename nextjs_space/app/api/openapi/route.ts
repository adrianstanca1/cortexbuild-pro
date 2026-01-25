/**
 * OpenAPI Specification Endpoint
 * 
 * Serves the OpenAPI/Swagger specification for the API
 */

import { NextRequest, NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi-spec';

export async function GET(request: NextRequest) {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
