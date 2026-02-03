import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Read version from package.json
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version || '2.1.0';

    return NextResponse.json({
      version,
      name: 'CortexBuild Pro',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Error reading version:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read package.json file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
