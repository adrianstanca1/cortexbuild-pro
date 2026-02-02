import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, addDays, subDays } from "date-fns";

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgId = (session.user as any).organizationId;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const nextWeek = addDays(today, 7);
    const yesterday = subDays(today, 1);

    // Fetch all agenda items for today
    const [
      tasks, 
      meetings, 
      inspections, 
      toolboxTalks, 
      milestones, 
      permitsExpiring, 
      mewpChecks, 
      toolChecks,
      rfis,
      submittals,
      dailyReports,
      safetyIncidents
    ] = await Promise.all([
      // Today's tasks due OR overdue tasks
      prisma.task.findMany({
        where: {
          project: { organizationId: orgId },
          OR: [
            { dueDate: { gte: todayStart, lte: todayEnd } },
            { dueDate: { lt: todayStart }, status: { not: "COMPLETE" } }
          ],
          status: { not: "COMPLETE" }
        },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { name: true } }
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 15
      }),

      // Today's meetings
      prisma.meetingMinutes.findMany({
        where: {
          project: { organizationId: orgId },
          meetingDate: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          organizer: { select: { name: true } }
        },
        orderBy: { meetingDate: "asc" },
        take: 10
      }),

      // Today's inspections OR overdue
      prisma.inspection.findMany({
        where: {
          project: { organizationId: orgId },
          OR: [
            { scheduledDate: { gte: todayStart, lte: todayEnd } },
            { scheduledDate: { lt: todayStart }, status: "SCHEDULED" }
          ]
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { scheduledDate: "asc" },
        take: 10
      }),

      // Today's toolbox talks
      prisma.toolboxTalk.findMany({
        where: {
          project: { organizationId: orgId },
          date: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          presenter: { select: { name: true } },
          _count: { select: { attendees: true } }
        },
        orderBy: { date: "asc" },
        take: 10
      }),

      // Milestones due today or overdue
      prisma.milestone.findMany({
        where: {
          project: { organizationId: orgId },
          targetDate: {
            lte: todayEnd
          },
          status: { not: "COMPLETED" }
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { targetDate: "asc" },
        take: 10
      }),

      // Permits expiring soon (within 7 days)
      prisma.permit.findMany({
        where: {
          project: { organizationId: orgId },
          expirationDate: {
            gte: todayStart,
            lte: nextWeek
          },
          status: "APPROVED"
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { expirationDate: "asc" },
        take: 10
      }),

      // Today's MEWP checks
      prisma.mEWPCheck.findMany({
        where: {
          project: { organizationId: orgId },
          checkDate: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          operator: { select: { name: true } }
        },
        orderBy: { checkDate: "desc" },
        take: 10
      }),

      // Today's tool checks
      prisma.toolCheck.findMany({
        where: {
          project: { organizationId: orgId },
          checkDate: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          inspector: { select: { name: true } }
        },
        orderBy: { checkDate: "desc" },
        take: 10
      }),

      // RFIs due today or overdue
      prisma.rFI.findMany({
        where: {
          project: { organizationId: orgId },
          OR: [
            { dueDate: { gte: todayStart, lte: todayEnd } },
            { dueDate: { lt: todayStart }, status: { not: "CLOSED" } }
          ],
          status: { not: "CLOSED" }
        },
        include: {
          project: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
          assignedTo: { select: { name: true } }
        },
        orderBy: [{ dueDate: "asc" }],
        take: 10
      }),

      // Submittals due today or overdue
      prisma.submittal.findMany({
        where: {
          project: { organizationId: orgId },
          OR: [
            { dueDate: { gte: todayStart, lte: todayEnd } },
            { dueDate: { lt: todayStart }, status: { not: "APPROVED" } }
          ],
          status: { notIn: ["APPROVED", "REJECTED"] }
        },
        include: {
          project: { select: { id: true, name: true } },
          submittedBy: { select: { name: true } }
        },
        orderBy: [{ dueDate: "asc" }],
        take: 10
      }),

      // Daily reports pending for today (check if yesterday's report exists)
      prisma.dailyReport.findMany({
        where: {
          project: { organizationId: orgId },
          reportDate: {
            gte: startOfDay(yesterday),
            lte: endOfDay(yesterday)
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          createdBy: { select: { name: true } }
        },
        take: 20
      }),

      // Today's safety incidents
      prisma.safetyIncident.findMany({
        where: {
          project: { organizationId: orgId },
          incidentDate: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          reportedBy: { select: { name: true } }
        },
        orderBy: { incidentDate: "desc" },
        take: 5
      })
    ]);

    // Get projects that need daily reports (haven't submitted yesterday's)
    const allProjects = await prisma.project.findMany({
      where: {
        organizationId: orgId,
        status: "IN_PROGRESS"
      },
      select: { id: true, name: true }
    });
    
    const projectsWithReports = new Set(dailyReports.map(r => r.projectId));
    const projectsNeedingReports = allProjects.filter(p => !projectsWithReports.has(p.id));

    // Format agenda items
    const agendaItems = [
      // Tasks
      ...tasks.map(t => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        time: t.dueDate,
        project: t.project,
        priority: t.priority,
        status: t.status,
        assignee: t.assignee?.name,
        isOverdue: t.dueDate ? new Date(t.dueDate) < todayStart : false
      })),
      // Meetings
      ...meetings.map(m => ({
        id: m.id,
        type: "meeting" as const,
        title: m.title,
        time: m.meetingDate,
        project: m.project,
        organizer: m.organizer?.name,
        location: m.location
      })),
      // Inspections
      ...inspections.map(i => ({
        id: i.id,
        type: "inspection" as const,
        title: `${i.inspectionType} Inspection`,
        time: i.scheduledDate,
        project: i.project,
        inspector: i.inspectorName,
        status: i.status,
        isOverdue: i.scheduledDate ? new Date(i.scheduledDate) < todayStart && i.status === "SCHEDULED" : false
      })),
      // Toolbox Talks
      ...toolboxTalks.map(t => ({
        id: t.id,
        type: "toolbox_talk" as const,
        title: t.title,
        topic: t.topic,
        time: t.date,
        project: t.project,
        presenter: t.presenter?.name,
        attendeeCount: t._count.attendees,
        status: t.status
      })),
      // Milestones
      ...milestones.map(m => ({
        id: m.id,
        type: "milestone" as const,
        title: m.name,
        time: m.targetDate,
        project: m.project,
        status: m.status,
        isOverdue: m.targetDate ? new Date(m.targetDate) < todayStart : false
      })),
      // Permits Expiring
      ...permitsExpiring.map(p => ({
        id: p.id,
        type: "permit_expiring" as const,
        title: `${p.type} Permit Expiring`,
        time: p.expirationDate,
        project: p.project,
        permitNumber: p.permitNumber
      })),
      // RFIs
      ...rfis.map(r => ({
        id: r.id,
        type: "rfi" as const,
        title: `RFI #${r.number}: ${r.subject}`,
        time: r.dueDate,
        project: r.project,
        status: r.status,
        submitter: r.createdBy?.name,
        assignedTo: r.assignedTo?.name,
        isOverdue: r.dueDate ? new Date(r.dueDate) < todayStart && r.status !== "CLOSED" : false
      })),
      // Submittals
      ...submittals.map(s => ({
        id: s.id,
        type: "submittal" as const,
        title: `Submittal #${s.number}: ${s.title}`,
        time: s.dueDate,
        project: s.project,
        status: s.status,
        submitter: s.submittedBy?.name,
        isOverdue: s.dueDate ? new Date(s.dueDate) < todayStart && s.status !== "APPROVED" : false
      })),
      // Daily Reports Pending
      ...projectsNeedingReports.map(p => ({
        id: `report-${p.id}`,
        type: "daily_report" as const,
        title: `Daily Report Pending`,
        project: p,
        time: todayStart,
        isPending: true
      })),
      // Safety Incidents
      ...safetyIncidents.map(i => ({
        id: i.id,
        type: "safety_incident" as const,
        title: `Safety Incident: ${i.description.substring(0, 50)}${i.description.length > 50 ? '...' : ''}`,
        time: i.incidentDate,
        project: i.project,
        severity: i.severity,
        reportedBy: i.reportedBy?.name,
        priority: i.severity === "CRITICAL" || i.severity === "HIGH" ? "CRITICAL" : "HIGH"
      }))
    ].sort((a, b) => {
      // Priority sort: Critical items first, then by time
      const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const priorityA = priorityOrder[(a as any).priority] ?? 4;
      const priorityB = priorityOrder[(b as any).priority] ?? 4;
      
      // Overdue items first
      if ((a as any).isOverdue && !(b as any).isOverdue) return -1;
      if (!(a as any).isOverdue && (b as any).isOverdue) return 1;
      
      // Then by priority
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Then by time
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeA - timeB;
    });

    // Summary stats
    const summary = {
      tasksDue: tasks.length,
      overdueTaskCount: tasks.filter(t => t.dueDate && new Date(t.dueDate) < todayStart).length,
      meetings: meetings.length,
      inspections: inspections.length,
      overdueInspections: inspections.filter(i => i.scheduledDate && new Date(i.scheduledDate) < todayStart && i.status === "SCHEDULED").length,
      toolboxTalks: toolboxTalks.length,
      overdueMilestones: milestones.filter(m => m.targetDate && new Date(m.targetDate) < todayStart).length,
      permitsExpiring: permitsExpiring.length,
      mewpChecksCompleted: mewpChecks.length,
      toolChecksCompleted: toolChecks.length,
      checksWithIssues: [...mewpChecks, ...toolChecks].filter(c => !c.isSafeToUse).length,
      openRFIs: rfis.length,
      overdueRFIs: rfis.filter(r => r.dueDate && new Date(r.dueDate) < todayStart && r.status !== "CLOSED").length,
      pendingSubmittals: submittals.length,
      overdueSubmittals: submittals.filter(s => s.dueDate && new Date(s.dueDate) < todayStart && s.status !== "APPROVED").length,
      dailyReportsPending: projectsNeedingReports.length,
      safetyIncidents: safetyIncidents.length,
      criticalIncidents: safetyIncidents.filter(i => i.severity === "CRITICAL" || i.severity === "HIGH").length,
      totalUrgentItems: tasks.filter(t => t.priority === "CRITICAL" || t.priority === "HIGH").length +
        safetyIncidents.filter(i => i.severity === "CRITICAL" || i.severity === "HIGH").length
    };

    return NextResponse.json({
      agenda: agendaItems,
      summary,
      recentChecks: {
        mewp: mewpChecks,
        tools: toolChecks
      }
    });
  } catch (error) {
    console.error("Error fetching agenda:", error);
    return NextResponse.json({ error: "Failed to fetch agenda" }, { status: 500 });
  }
}
