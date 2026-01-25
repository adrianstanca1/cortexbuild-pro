import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { ProjectDetailClient } from "./_components/project-detail-client";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.organizationId;

  const project = await prisma.project.findFirst({
    where: { id: params?.id ?? "", organizationId: orgId ?? undefined },
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 100 // Limit initial load
      },
      documents: {
        select: {
          id: true,
          name: true,
          documentType: true,
          fileSize: true,
          mimeType: true,
          cloudStoragePath: true,
          isPublic: true,
          createdAt: true,
          uploadedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit initial load
      },
      teamMembers: {
        include: { teamMember: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } } } }
      },
      rfis: {
        select: {
          id: true,
          number: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          responseDate: true,
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit initial load
      },
      submittals: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          submittalType: true,
          createdAt: true,
          dueDate: true,
          submittedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit initial load
      },
      changeOrders: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          costImpact: true,
          createdAt: true,
          requestedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit initial load
      },
      safetyIncidents: {
        select: {
          id: true,
          incidentNumber: true,
          description: true,
          severity: true,
          status: true,
          incidentDate: true,
          reportedBy: { select: { id: true, name: true } }
        },
        orderBy: { incidentDate: "desc" },
        take: 30 // Limit initial load
      },
      dailyReports: {
        select: {
          id: true,
          reportDate: true,
          weatherCondition: true,
          temperature: true,
          workCompleted: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } }
        },
        orderBy: { reportDate: "desc" },
        take: 30
      },
      // Additional construction modules
      milestones: {
        select: {
          id: true,
          title: true,
          description: true,
          targetDate: true,
          status: true,
          completionPercentage: true
        },
        orderBy: { targetDate: "asc" },
        take: 50 // Limit milestones
      },
      timeEntries: {
        select: {
          id: true,
          date: true,
          hours: true,
          description: true,
          user: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } }
        },
        orderBy: { date: "desc" },
        take: 50
      },
      costItems: {
        select: {
          id: true,
          description: true,
          category: true,
          amount: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 100 // Limit cost items
      },
      materials: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          unitCost: true,
          supplier: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 100 // Limit materials
      },
      subcontracts: {
        select: {
          id: true,
          description: true,
          value: true,
          status: true,
          startDate: true,
          endDate: true,
          subcontractor: { select: { id: true, companyName: true, trade: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit subcontracts
      },
      permits: {
        select: {
          id: true,
          permitNumber: true,
          permitType: true,
          status: true,
          issueDate: true,
          expirationDate: true
        },
        orderBy: { expirationDate: "asc" },
        take: 50 // Limit permits
      },
      drawings: {
        select: {
          id: true,
          drawingNumber: true,
          title: true,
          revision: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit drawings
      },
      siteDiaries: {
        select: {
          id: true,
          date: true,
          entries: true,
          createdAt: true
        },
        orderBy: { date: "desc" },
        take: 30
      },
      defects: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          severity: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit defects
      },
      punchLists: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit punch lists
      },
      inspections: {
        select: {
          id: true,
          title: true,
          number: true,
          status: true,
          inspectionType: true,
          scheduledDate: true
        },
        orderBy: { scheduledDate: "desc" },
        take: 50 // Limit inspections
      },
      progressClaims: {
        select: {
          id: true,
          claimNumber: true,
          periodStart: true,
          periodEnd: true,
          amount: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit progress claims
      },
      // Toolbox talks and daily checks
      toolboxTalks: {
        select: {
          id: true,
          title: true,
          topic: true,
          date: true,
          status: true,
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
        select: {
          id: true,
          checkDate: true,
          overallStatus: true,
          operator: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true, equipmentNumber: true } }
        },
        orderBy: { checkDate: "desc" },
        take: 50
      },
      toolChecks: {
        select: {
          id: true,
          checkDate: true,
          toolName: true,
          overallStatus: true,
          inspector: { select: { id: true, name: true } }
        },
        orderBy: { checkDate: "desc" },
        take: 50
      },
      // Enhanced construction features
      riskAssessments: {
        select: {
          id: true,
          title: true,
          status: true,
          riskLevel: true,
          createdAt: true,
          approvedAt: true,
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          hazards: { select: { id: true, description: true, riskLevel: true } },
          _count: { select: { acknowledgements: true, hazards: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      hotWorkPermits: {
        select: {
          id: true,
          permitNumber: true,
          workType: true,
          status: true,
          startDate: true,
          expiryDate: true,
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
      where: { projectId: params?.id ?? "" },
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
