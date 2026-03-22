import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'projects',
      'tasks',
      'rfis',
      'submittals',
      'change-orders',
      'daily-reports',
      'safety',
      'documents',
      'equipment',
      'inspections',
      'meetings',
      'timesheets',
      'materials',
      'subcontractors',
      'budgets',
      'team',
      'ai-insights',
      'maps',
      'reports'
    ]
  });
}
