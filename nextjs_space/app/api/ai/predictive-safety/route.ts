import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Build where clause
    const projectWhereClause = projectId
      ? { projectId }
      : { project: { organizationId: session.user.organizationId! } };

    // Get safety incidents
    const safetyIncidents = await prisma.safetyIncident.findMany({
      where: projectWhereClause,
      include: { project: true },
      orderBy: { incidentDate: 'desc' },
      take: 100,
    });

    // Get inspections
    const inspections = await prisma.inspection.findMany({
      where: projectWhereClause,
      include: { project: true },
      orderBy: { scheduledDate: 'desc' },
      take: 50,
    });

    // Get risk assessments
    const riskAssessments = await prisma.riskAssessment.findMany({
      where: projectWhereClause,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate metrics
    const totalIncidents = safetyIncidents.length;
    const lowIncidents = safetyIncidents.filter(i => i.severity === 'LOW').length;
    const mediumIncidents = safetyIncidents.filter(i => i.severity === 'MEDIUM').length;
    const highIncidents = safetyIncidents.filter(i => i.severity === 'HIGH').length;
    const criticalIncidents = safetyIncidents.filter(i => i.severity === 'CRITICAL').length;

    const failedInspections = inspections.filter(i => i.status === 'FAILED').length;
    const passedInspections = inspections.filter(i => i.status === 'PASSED').length;

    // Incident patterns
    const incidentsBySeverity = safetyIncidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const incidentsByLocation = safetyIncidents.reduce((acc, inc) => {
      const loc = inc.location || 'Unknown';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const incidentsByHour = safetyIncidents.reduce((acc, inc) => {
      const hour = new Date(inc.incidentDate).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const incidentsByDay = safetyIncidents.reduce((acc, inc) => {
      const day = new Date(inc.incidentDate).getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json({
      success: true,
      metrics: {
        totalIncidents,
        nearMisses: lowIncidents,
        minorIncidents: mediumIncidents,
        majorIncidents: highIncidents,
        criticalIncidents,
        failedInspections,
        passedInspections,
        inspectionPassRate: inspections.length > 0 
          ? Math.round((passedInspections / inspections.length) * 100) 
          : 100,
        highRiskAssessments: riskAssessments.length,
        totalRiskAssessments: riskAssessments.length,
        criticalDefects: 0,
        currentSiteOccupancy: 0,
      },
      patterns: {
        byType: incidentsBySeverity,
        byLocation: incidentsByLocation,
        byHour: incidentsByHour,
        byDay: incidentsByDay,
      },
      recentIncidents: safetyIncidents.slice(0, 10).map(i => ({
        id: i.id,
        type: i.severity,
        severity: i.severity,
        date: i.incidentDate,
        location: i.location,
        description: i.description,
        projectName: i.project.name,
      })),
      recentInspections: inspections.slice(0, 10).map(i => ({
        id: i.id,
        type: i.inspectionType,
        result: i.status,
        date: i.scheduledDate,
        projectName: i.project.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching safety data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, analysisType } = body;

    const projectWhereClause = projectId
      ? { projectId }
      : { project: { organizationId: session.user.organizationId! } };

    const [safetyIncidents, inspections, riskAssessments] = await Promise.all([
      prisma.safetyIncident.findMany({
        where: projectWhereClause,
        include: { project: true },
        orderBy: { incidentDate: 'desc' },
        take: 50,
      }),
      prisma.inspection.findMany({
        where: projectWhereClause,
        include: { project: true },
        orderBy: { scheduledDate: 'desc' },
        take: 30,
      }),
      prisma.riskAssessment.findMany({
        where: projectWhereClause,
        include: { project: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const safetyContext = {
      incidentSummary: {
        total: safetyIncidents.length,
        bySeverity: safetyIncidents.reduce((acc, i) => {
          acc[i.severity] = (acc[i.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentIncidents: safetyIncidents.slice(0, 5).map(i => ({
          severity: i.severity,
          description: i.description,
          date: i.incidentDate,
          location: i.location,
        })),
      },
      inspectionSummary: {
        total: inspections.length,
        passed: inspections.filter(i => i.status === 'PASSED').length,
        failed: inspections.filter(i => i.status === 'FAILED').length,
        pending: inspections.filter(i => i.status === 'SCHEDULED').length,
      },
      riskAssessmentSummary: {
        total: riskAssessments.length,
        byStatus: riskAssessments.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    let prompt = '';
    switch (analysisType) {
      case 'risk_prediction':
        prompt = `Based on the following UK construction safety data, predict potential safety risks for the next 30 days:\n\n${JSON.stringify(safetyContext, null, 2)}\n\nProvide:\n1. Top 5 predicted safety risks\n2. Contributing factors\n3. Recommended preventive actions (CDM 2015)\n4. Priority areas\n5. Suggested inspection schedule`;
        break;
      case 'trend_analysis':
        prompt = `Analyze these UK construction safety data trends:\n\n${JSON.stringify(safetyContext, null, 2)}\n\nProvide:\n1. Key safety trends\n2. Incident pattern analysis\n3. Inspection performance trends\n4. UK industry benchmark comparison\n5. Areas requiring intervention`;
        break;
      case 'compliance_gaps':
        prompt = `Review this UK construction safety data for CDM 2015 compliance gaps:\n\n${JSON.stringify(safetyContext, null, 2)}\n\nProvide:\n1. Identified compliance gaps\n2. HSE regulation areas at risk\n3. Documentation gaps\n4. Training requirements\n5. Corrective actions required`;
        break;
      default:
        prompt = `Provide a comprehensive safety analysis for this UK construction operation:\n\n${JSON.stringify(safetyContext, null, 2)}\n\nInclude: Overall Safety Score, Key Risk Areas, Immediate Actions Required, Recommendations.`;
    }

    const response = await fetch(ABACUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a UK construction safety expert specializing in CDM 2015 regulations and HSE compliance. Provide actionable recommendations using UK terminology.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Abacus API error');
      return NextResponse.json({ error: 'Failed to analyze safety data' }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || data.content || '';

    return NextResponse.json({
      success: true,
      analysisType,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Safety prediction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
