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
          updatedAt: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 100
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
        take: 50
      },
      teamMembers: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          teamMember: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  role: true
                }
              }
            }
          }
        },
        take: 50
      },
      rfis: {
        select: {
          id: true,
          number: true,
          subject: true,
          description: true,
          status: true,
          priority: true,
          dateRaised: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      submittals: {
        select: {
          id: true,
          number: true,
          title: true,
          specification: true,
          status: true,
          dateSubmitted: true,
          createdAt: true,
          submittedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      changeOrders: {
        select: {
          id: true,
          number: true,
          title: true,
          description: true,
          status: true,
          costChange: true,
          timeChange: true,
          dateRequested: true,
          createdAt: true,
          requestedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      safetyIncidents: {
        select: {
          id: true,
          incidentDate: true,
          description: true,
          severity: true,
          status: true,
          location: true,
          createdAt: true,
          reportedBy: { select: { id: true, name: true } }
        },
        orderBy: { incidentDate: "desc" },
        take: 50
      },
      dailyReports: {
        select: {
          id: true,
          reportDate: true,
          weatherConditions: true,
          manpowerCount: true,
          workAccomplished: true,
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
          name: true,
          description: true,
          targetDate: true,
          completedDate: true,
          status: true,
          createdAt: true
        },
        orderBy: { targetDate: "asc" },
        take: 50
      },
      timeEntries: {
        select: {
          id: true,
          date: true,
          hours: true,
          description: true,
          createdAt: true,
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
          date: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      materials: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          costPerUnit: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      subcontracts: {
        select: {
          id: true,
          contractNumber: true,
          description: true,
          amount: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          subcontractor: { select: { id: true, companyName: true, trade: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      permits: {
        select: {
          id: true,
          permitNumber: true,
          permitType: true,
          description: true,
          issueDate: true,
          expirationDate: true,
          status: true,
          createdAt: true
        },
        orderBy: { expirationDate: "asc" },
        take: 50
      },
      drawings: {
        select: {
          id: true,
          drawingNumber: true,
          title: true,
          revision: true,
          discipline: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      siteDiaries: {
        select: {
          id: true,
          date: true,
          entry: true,
          weather: true,
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
          severity: true,
          status: true,
          location: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      punchLists: {
        select: {
          id: true,
          number: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          location: true,
          dueDate: true,
          createdAt: true,
          assignedTo: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      inspections: {
        select: {
          id: true,
          number: true,
          title: true,
          inspectionType: true,
          status: true,
          scheduledDate: true,
          completedDate: true,
          result: true,
          createdAt: true
        },
        orderBy: { scheduledDate: "desc" },
        take: 50
      },
      progressClaims: {
        select: {
          id: true,
          claimNumber: true,
          period: true,
          amount: true,
          status: true,
          submittedDate: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      // Toolbox talks and daily checks
      toolboxTalks: {
        select: {
          id: true,
          title: true,
          date: true,
          status: true,
          duration: true,
          topics: true,
          createdAt: true,
          presenter: { select: { id: true, name: true } },
          attendees: {
            select: {
              id: true,
              user: { select: { id: true, name: true } }
            },
            take: 50
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
          equipmentName: true,
          equipmentSerial: true,
          overallStatus: true,
          isSafeToUse: true,
          defectsFound: true,
          createdAt: true,
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
          toolSerial: true,
          toolType: true,
          overallStatus: true,
          isSafeToUse: true,
          defectsFound: true,
          createdAt: true,
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
          assessmentDate: true,
          status: true,
          overallRisk: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          hazards: {
            select: {
              id: true,
              hazard: true,
              riskLevel: true,
              controlMeasures: true
            },
            take: 20
          },
          _count: { select: { acknowledgements: true, hazards: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      hotWorkPermits: {
        select: {
          id: true,
          permitNumber: true,
          location: true,
          workDescription: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          completedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      confinedSpacePermits: {
        select: {
          id: true,
          permitNumber: true,
          location: true,
          workDescription: true,
          status: true,
          entryDate: true,
          exitDate: true,
          createdAt: true,
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      liftingOperations: {
        select: {
          id: true,
          liftDate: true,
          location: true,
          loadDescription: true,
          status: true,
          maxLoad: true,
          createdAt: true,
          plannedBy: { select: { id: true, name: true } },
          operator: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
          appointedPerson: { select: { id: true, name: true } }
        },
        orderBy: { liftDate: "desc" },
        take: 50
      },
      siteAccessLogs: {
        select: {
          id: true,
          accessTime: true,
          exitTime: true,
          purpose: true,
          location: true,
          createdAt: true,
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
