import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'projects';
    const projectId = searchParams.get('projectId');

    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    const projectFilter = projectId 
      ? { id: projectId, organizationId: user.organizationId }
      : { organizationId: user.organizationId };

    switch (exportType) {
      case 'projects':
        data = await prisma.project.findMany({
          where: projectFilter,
          include: {
            manager: { select: { name: true } },
            _count: { select: { tasks: true, documents: true } }
          }
        });
        headers = ['Name', 'Status', 'Start Date', 'End Date', 'Budget', 'Manager', 'Tasks', 'Documents', 'Location'];
        data = data.map(p => ([
          p.name, p.status, formatDate(p.startDate), formatDate(p.endDate),
          p.budget || 0, p.manager?.name || '', p._count.tasks, p._count.documents, p.location || ''
        ]));
        filename = 'projects-export';
        break;

      case 'tasks':
        const tasks = await prisma.task.findMany({
          where: { project: projectFilter },
          include: {
            project: { select: { name: true } },
            assignee: { select: { name: true } }
          }
        });
        headers = ['Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date', 'Completed', 'Description'];
        data = tasks.map(t => ([
          t.title, t.project.name, t.status, t.priority,
          t.assignee?.name || 'Unassigned', formatDate(t.dueDate),
          formatDate(t.completedAt), t.description || ''
        ]));
        filename = 'tasks-export';
        break;

      case 'rfis':
        const rfis = await prisma.rFI.findMany({
          where: { project: projectFilter },
          include: {
            project: { select: { name: true } },
            createdBy: { select: { name: true } },
            assignedTo: { select: { name: true } }
          }
        });
        headers = ['Number', 'Subject', 'Project', 'Status', 'Created By', 'Assigned To', 'Due Date', 'Created', 'Answered'];
        data = rfis.map(r => ([
          r.number, r.subject, r.project.name, r.status,
          r.createdBy?.name || '', r.assignedTo?.name || '',
          formatDate(r.dueDate), formatDate(r.createdAt), formatDate(r.answeredAt)
        ]));
        filename = 'rfis-export';
        break;

      case 'submittals':
        const submittals = await prisma.submittal.findMany({
          where: { project: projectFilter },
          include: {
            project: { select: { name: true } },
            submittedBy: { select: { name: true } }
          }
        });
        headers = ['Number', 'Title', 'Project', 'Status', 'Spec Section', 'Submitted By', 'Due Date', 'Reviewed Date'];
        data = submittals.map(s => ([
          s.number, s.title, s.project.name, s.status, s.specSection || '',
          s.submittedBy?.name || '', formatDate(s.dueDate), formatDate(s.reviewedAt)
        ]));
        filename = 'submittals-export';
        break;

      case 'budget':
        const costItems = await prisma.costItem.findMany({
          where: { project: projectFilter },
          include: {
            project: { select: { name: true } },
            subcontractor: { select: { companyName: true } }
          }
        });
        headers = ['Description', 'Project', 'Category', 'Status', 'Estimated', 'Committed', 'Actual', 'Variance', 'Vendor', 'Invoice #'];
        data = costItems.map(c => ([
          c.description, c.project.name, c.category, c.status,
          c.estimatedAmount, c.committedAmount, c.actualAmount,
          (c.estimatedAmount || 0) - (c.actualAmount || 0),
          c.vendor || c.subcontractor?.companyName || '', c.invoiceNumber || ''
        ]));
        filename = 'budget-export';
        break;

      case 'safety':
        const incidents = await prisma.safetyIncident.findMany({
          where: { project: projectFilter },
          include: {
            project: { select: { name: true } },
            reportedBy: { select: { name: true } }
          }
        });
        headers = ['Description', 'Project', 'Severity', 'Status', 'Date', 'Location', 'Reported By', 'Injury Occurred', 'Root Cause'];
        data = incidents.map(i => ([
          i.description?.substring(0, 100) || '', i.project.name, i.severity, i.status,
          formatDate(i.incidentDate), i.location || '', i.reportedBy?.name || '', 
          i.injuryOccurred ? 'Yes' : 'No', i.rootCause || ''
        ]));
        filename = 'safety-incidents-export';
        break;

      case 'time-entries':
        const timeEntries = await prisma.timeEntry.findMany({
          where: { project: projectFilter },
          include: {
            project: { select: { name: true } },
            user: { select: { name: true } },
            task: { select: { title: true } }
          }
        });
        headers = ['Date', 'Project', 'User', 'Task', 'Hours', 'Description', 'Status'];
        data = timeEntries.map(t => ([
          formatDate(t.date), t.project.name, t.user?.name || '',
          t.task?.title || 'General', t.hours, t.description || '', t.status
        ]));
        filename = 'time-entries-export';
        break;

      case 'team':
        const teamMembers = await prisma.teamMember.findMany({
          where: { organizationId: user.organizationId },
          include: {
            user: { select: { name: true, email: true, role: true } },
            _count: { select: { projectAssignments: true } }
          }
        });
        headers = ['Name', 'Email', 'Role', 'Job Title', 'Department', 'Projects Assigned'];
        data = teamMembers.map(m => ([
          m.user?.name || '', m.user?.email || '', m.user?.role || '',
          m.jobTitle || '', m.department || '', m._count.projectAssignments
        ]));
        filename = 'team-export';
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Generate CSV
    const csvContent = generateCSV(headers, data);
    const timestamp = format(new Date(), 'yyyy-MM-dd');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}-${timestamp}.csv"`
      }
    });
  } catch {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

function generateCSV(headers: string[], rows: any[][]): string {
  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map(row => row.map(escape).join(','));
  return [headerRow, ...dataRows].join('\n');
}
