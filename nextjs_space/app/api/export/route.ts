import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateProjectReportPDF, generateSafetyReportPDF, generateRFIReportPDF } from '@/lib/utils/pdf';
import { exportProjectsToCsv, exportTasksToCsv, exportRfisToCsv, exportSafetyIncidentsToCsv, exportDailyReportsToCsv } from '@/lib/utils/csv';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const format = searchParams.get('format') || 'pdf';
  const projectId = searchParams.get('projectId');

  if (!type) {
    return NextResponse.json({ error: 'Export type is required' }, { status: 400 });
  }

  try {
    if (format === 'csv') {
      return handleCsvExport(type, projectId);
    }
    return handlePdfExport(type, projectId);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}

async function handlePdfExport(type: string, projectId: string | null) {
  switch (type) {
    case 'project': {
      if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: { include: { assignee: { select: { name: true } } }, take: 50 },
          rfis: { take: 50 },
          dailyReports: { take: 50 },
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const tasks = project.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority || 'MEDIUM',
        dueDate: t.dueDate,
        assignee: t.assignee,
      }));

      const rfis = project.rfis.map((r: any) => ({
        id: r.id,
        number: r.number,
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
      }));

      const dailyReports = project.dailyReports.map((d: any) => ({
        id: d.id,
        date: d.date,
        workPerformed: d.workPerformed,
        workforceCount: d.workforceCount,
      }));

      const pdf = generateProjectReportPDF({ project, tasks, rfis, dailyReports });
      const buffer = Buffer.from(pdf.output('arraybuffer'));
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="project-report-${project.name}.pdf"` },
      });
    }

    case 'safety': {
      if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
      }

      const incidents = await prisma.safetyIncident.findMany({ where: { projectId }, take: 50 });
      const inspections = await prisma.inspection.findMany({ where: { projectId }, take: 50 });

      const safetyData = incidents.map((i: any) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt,
      }));

      const inspectionData = inspections.map((i: any) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        status: i.status,
      }));

      const pdf = generateSafetyReportPDF({
        project: { id: projectId, name: 'Project' },
        incidents: safetyData,
        inspections: inspectionData,
        stats: { totalIncidents: incidents.length, openIncidents: incidents.filter((i: any) => i.status === 'OPEN').length },
      });

      const buffer = Buffer.from(pdf.output('arraybuffer'));
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="safety-report.pdf"' },
      });
    }

    case 'rfi': {
      if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
      }

      const rfis = await prisma.rFI.findMany({ where: { projectId }, include: { assignedTo: { select: { name: true } } } });

      const rfiData = rfis.map((r: any) => ({
        id: r.id,
        number: r.number,
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
        answer: r.answer,
        assignedTo: r.assignedTo,
      }));

      const stats = {
        total: rfis.length,
        open: rfis.filter((r: any) => r.status === 'OPEN').length,
        answered: rfis.filter((r: any) => r.answer !== null).length,
        closed: rfis.filter((r: any) => r.status === 'CLOSED').length,
      };

      const pdf = generateRFIReportPDF({ project: { id: projectId, name: 'Project' }, rfis: rfiData, stats });
      const buffer = Buffer.from(pdf.output('arraybuffer'));
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rfi-report.pdf"' },
      });
    }

    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }
}

async function handleCsvExport(type: string, projectId: string | null) {
  switch (type) {
    case 'projects': {
      const projects = await prisma.project.findMany({ where: projectId ? { id: projectId } : undefined, orderBy: { createdAt: 'desc' } });
      const data = projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate?.toISOString() || null,
        endDate: p.endDate?.toISOString() || null,
        budget: p.budget,
        createdAt: p.createdAt.toISOString(),
      }));
      const csv = exportProjectsToCsv(data);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="projects.csv"' } });
    }

    case 'tasks': {
      const tasks = await prisma.task.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: { select: { name: true } }, assignee: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const data = tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority || 'MEDIUM',
        dueDate: t.dueDate?.toISOString() || null,
        projectName: t.project.name,
        assigneeName: t.assignee?.name || null,
      }));
      const csv = exportTasksToCsv(data);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="tasks.csv"' } });
    }

    case 'rfis': {
      const rfis = await prisma.rFI.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: { select: { name: true } }, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const data = rfis.map((r: any) => ({
        id: r.id,
        number: r.number,
        title: r.title,
        status: r.status,
        question: r.question,
        answer: r.answer,
        projectName: r.project.name,
        assignedToName: r.assignedTo?.name || null,
        createdAt: r.createdAt.toISOString(),
      }));
      const csv = exportRfisToCsv(data);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="rfis.csv"' } });
    }

    case 'safety': {
      const incidents = await prisma.safetyIncident.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: { select: { name: true } }, reportedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const data = incidents.map((i: any) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        severity: i.severity,
        status: i.status,
        projectName: i.project.name,
        reportedByName: i.reportedBy?.name || null,
        createdAt: i.createdAt.toISOString(),
      }));
      const csv = exportSafetyIncidentsToCsv(data);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="safety_incidents.csv"' } });
    }

    case 'daily-reports': {
      const reports = await prisma.dailyReport.findMany({
        where: projectId ? { projectId } : undefined,
        include: { project: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 100,
      });
      const data = reports.map((r: any) => ({
        id: r.id,
        date: r.date.toISOString(),
        projectName: r.project.name,
        workPerformed: r.workPerformed,
        workforceCount: r.workforceCount,
        weather: r.weather || '',
        notes: r.notes,
      }));
      const csv = exportDailyReportsToCsv(data);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="daily_reports.csv"' } });
    }

    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }
}
