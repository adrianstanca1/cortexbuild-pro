import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ProjectDetailClient } from "./_components/project-detail-client";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  const project = await prisma.project.findFirst({
    where: { id: id ?? "", organizationId: orgId ?? undefined },
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      tasks: {
        include: { 
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      },
      documents: {
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      },
      teamMembers: {
        include: { teamMember: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } } }
      },
      rfis: {
        include: { 
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      },
      submittals: {
        include: { submittedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      },
      changeOrders: {
        include: { requestedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      },
      safetyIncidents: {
        include: { reportedBy: { select: { id: true, name: true } } },
        orderBy: { incidentDate: "desc" }
      },
      dailyReports: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { reportDate: "desc" },
        take: 30
      },
      // Additional construction modules
      milestones: {
        orderBy: { targetDate: "asc" }
      },
      timeEntries: {
        include: { 
          user: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } }
        },
        orderBy: { date: "desc" },
        take: 50
      },
      costItems: {
        orderBy: { createdAt: "desc" }
      },
      materials: {
        orderBy: { createdAt: "desc" }
      },
      subcontracts: {
        include: { subcontractor: { select: { id: true, companyName: true, trade: true } } },
        orderBy: { createdAt: "desc" }
      },
      permits: {
        orderBy: { expirationDate: "asc" }
      },
      drawings: {
        orderBy: { createdAt: "desc" }
      },
      siteDiaries: {
        orderBy: { date: "desc" },
        take: 30
      },
      defects: {
        orderBy: { createdAt: "desc" }
      },
      punchLists: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      },
      inspections: {
        orderBy: { scheduledDate: "desc" }
      },
      progressClaims: {
        orderBy: { createdAt: "desc" }
      },
      // Toolbox talks and daily checks
      toolboxTalks: {
        include: {
          presenter: { select: { id: true, name: true } },
          attendees: {
            include: { user: { select: { id: true, name: true } } }
          },
          _count: { select: { attendees: true } }
        },
        orderBy: { date: "desc" },
        take: 50
      },
      mewpChecks: {
        include: {
          operator: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true, equipmentNumber: true } }
        },
        orderBy: { checkDate: "desc" },
        take: 50
      },
      toolChecks: {
        include: {
          inspector: { select: { id: true, name: true } }
        },
        orderBy: { checkDate: "desc" },
        take: 50
      },
      // Enhanced construction features
      riskAssessments: {
        include: {
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          hazards: true,
          _count: { select: { acknowledgements: true, hazards: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      hotWorkPermits: {
        include: {
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          completedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      confinedSpacePermits: {
        include: {
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      liftingOperations: {
        include: {
          plannedBy: { select: { id: true, name: true } },
          operator: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
          appointedPerson: { select: { id: true, name: true } }
        },
        orderBy: { liftDate: "desc" },
        take: 50
      },
      siteAccessLogs: {
        include: {
          user: { select: { id: true, name: true } },
          recordedBy: { select: { id: true, name: true } }
        },
        orderBy: { accessTime: "desc" },
        take: 200
      },
      _count: { 
        select: { 
          tasks: true, 
          documents: true, 
          teamMembers: true,
          rfis: true,
          submittals: true,
          changeOrders: true,
          safetyIncidents: true,
          milestones: true,
          timeEntries: true,
          costItems: true,
          materials: true,
          subcontracts: true,
          permits: true,
          drawings: true,
          siteDiaries: true,
          defects: true,
          punchLists: true,
          inspections: true,
          progressClaims: true,
          toolboxTalks: true,
          mewpChecks: true,
          toolChecks: true,
          riskAssessments: true,
          hotWorkPermits: true,
          confinedSpacePermits: true,
          liftingOperations: true,
          siteAccessLogs: true
        } 
      }
    }
  });

  if (!project) {
    notFound();
  }

  const [teamMembers, activities, certifications] = await Promise.all([
    prisma.teamMember.findMany({
      where: { organizationId: orgId ?? undefined },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } }
    }),
    prisma.activityLog.findMany({
      where: { projectId: id ?? "" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.workerCertification.findMany({
      where: { organizationId: orgId ?? undefined },
      include: {
        worker: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }]
    })
  ]);

  return (
    <ProjectDetailClient
      project={JSON.parse(JSON.stringify(project))}
      availableTeamMembers={JSON.parse(JSON.stringify(teamMembers ?? []))}
      currentUserId={(session?.user as any)?.id ?? ""}
      activities={JSON.parse(JSON.stringify(activities ?? []))}
      certifications={JSON.parse(JSON.stringify(certifications ?? []))}
    />
  );
}
