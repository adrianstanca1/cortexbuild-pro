export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Export project data in various formats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const sections = searchParams.get('sections')?.split(',') || ['all'];

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const includeAll = sections.includes('all');
    const exportData: Record<string, unknown> = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        location: project.location,
        clientName: project.clientName,
        createdAt: project.createdAt,
      },
      exportedAt: new Date().toISOString(),
    };

    // Fetch requested sections
    if (includeAll || sections.includes('tasks')) {
      exportData.tasks = await prisma.task.findMany({
        where: { projectId: id },
        select: {
          id: true, title: true, description: true, status: true, priority: true,
          dueDate: true, createdAt: true, completedAt: true,
          assignee: { select: { name: true, email: true } },
        },
      });
    }

    if (includeAll || sections.includes('rfis')) {
      exportData.rfis = await prisma.rFI.findMany({
        where: { projectId: id },
        select: {
          id: true, number: true, subject: true, question: true, answer: true,
          status: true, createdAt: true, answeredAt: true,
          createdBy: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
      });
    }

    if (includeAll || sections.includes('submittals')) {
      exportData.submittals = await prisma.submittal.findMany({
        where: { projectId: id },
        select: {
          id: true, number: true, title: true, description: true, status: true,
          specSection: true, createdAt: true,
          submittedBy: { select: { name: true } },
        },
      });
    }

    if (includeAll || sections.includes('changeOrders')) {
      exportData.changeOrders = await prisma.changeOrder.findMany({
        where: { projectId: id },
        select: {
          id: true, number: true, title: true, description: true, costChange: true,
          status: true, reason: true, createdAt: true,
          requestedBy: { select: { name: true } },
        },
      });
    }

    if (includeAll || sections.includes('dailyReports')) {
      exportData.dailyReports = await prisma.dailyReport.findMany({
        where: { projectId: id },
        select: {
          id: true, reportDate: true, weather: true, temperature: true,
          manpowerCount: true, workPerformed: true, materialsUsed: true, delays: true,
          createdBy: { select: { name: true } },
        },
      });
    }

    if (includeAll || sections.includes('safety')) {
      exportData.safetyIncidents = await prisma.safetyIncident.findMany({
        where: { projectId: id },
        select: {
          id: true, description: true, severity: true,
          incidentDate: true, location: true, correctiveAction: true,
          reportedBy: { select: { name: true } },
        },
      });
    }

    if (includeAll || sections.includes('punchLists')) {
      exportData.punchLists = await prisma.punchList.findMany({
        where: { projectId: id },
        select: {
          id: true, number: true, title: true, description: true, status: true,
          priority: true, category: true, location: true, createdAt: true,
          assignedTo: { select: { name: true } },
        },
      });
    }

    if (includeAll || sections.includes('inspections')) {
      exportData.inspections = await prisma.inspection.findMany({
        where: { projectId: id },
        select: {
          id: true, number: true, title: true, inspectionType: true, status: true,
          scheduledDate: true, completedDate: true, inspectorName: true,
          result: true, deficiencies: true,
        },
      });
    }

    if (includeAll || sections.includes('meetings')) {
      exportData.meetings = await prisma.meetingMinutes.findMany({
        where: { projectId: id },
        select: {
          id: true, title: true, meetingType: true, meetingDate: true,
          location: true, duration: true, summary: true,
          attendees: { select: { name: true, company: true } },
          actionItems: { select: { description: true, assignedTo: true, dueDate: true, completed: true } },
        },
      });
    }

    // Format response
    if (format === 'csv') {
      // Simple CSV export for tasks (most common use case)
      const tasks = exportData.tasks as { title: string; status: string; priority: string; dueDate?: Date | null }[] || [];
      const csv = [
        'Title,Status,Priority,Due Date',
        ...tasks.map(t => `"${t.title}",${t.status},${t.priority},${t.dueDate || 'N/A'}`),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_export.csv"`,
        },
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Project export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
