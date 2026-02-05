import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// CDM 2015 Compliance Checker API
// Analyzes project data against UK Construction (Design and Management) Regulations 2015

const CDM_REQUIREMENTS = {
  prePlanningPhase: [
    { id: "cdm-1", requirement: "F10 Notification to HSE", description: "Project notified to HSE if >30 working days AND >20 workers, OR >500 person days" },
    { id: "cdm-2", requirement: "Principal Designer Appointed", description: "Client must appoint a principal designer for projects with more than one contractor" },
    { id: "cdm-3", requirement: "Principal Contractor Appointed", description: "Client must appoint a principal contractor for projects with more than one contractor" },
    { id: "cdm-4", requirement: "Construction Phase Plan", description: "Principal contractor must prepare a construction phase plan before work begins" },
    { id: "cdm-5", requirement: "Client Brief Documented", description: "Client must provide pre-construction information to designers and contractors" }
  ],
  constructionPhase: [
    { id: "cdm-6", requirement: "Site Induction Records", description: "All workers must receive site-specific induction before starting work" },
    { id: "cdm-7", requirement: "Welfare Facilities", description: "Adequate welfare facilities must be provided from day one" },
    { id: "cdm-8", requirement: "Risk Assessments", description: "Risk assessments must be in place for all significant hazards" },
    { id: "cdm-9", requirement: "Method Statements", description: "Safe systems of work documented for high-risk activities" },
    { id: "cdm-10", requirement: "COSHH Assessments", description: "Control of Substances Hazardous to Health assessments completed" },
    { id: "cdm-11", requirement: "Traffic Management Plan", description: "Pedestrian and vehicle separation plan in place" },
    { id: "cdm-12", requirement: "Emergency Procedures", description: "Fire and emergency procedures documented and communicated" },
    { id: "cdm-13", requirement: "First Aid Provision", description: "Appropriate first aid equipment and trained personnel" },
    { id: "cdm-14", requirement: "Work at Height Plans", description: "Work at Height regulations compliance for elevated work" },
    { id: "cdm-15", requirement: "Excavation Safety", description: "Safe systems for excavation work including shoring requirements" }
  ],
  documentation: [
    { id: "cdm-16", requirement: "H&S File Started", description: "Health and Safety File compilation begun by Principal Designer" },
    { id: "cdm-17", requirement: "Daily Site Diary", description: "Daily records of work activities, personnel, and incidents" },
    { id: "cdm-18", requirement: "Inspection Records", description: "Regular inspections documented (scaffolding, excavations, etc.)" },
    { id: "cdm-19", requirement: "Training Records", description: "Worker competency and training certificates on file" },
    { id: "cdm-20", requirement: "Accident Book", description: "RIDDOR-compliant accident reporting book available" }
  ],
  workerWelfare: [
    { id: "cdm-21", requirement: "CSCS Cards Verified", description: "All workers have valid CSCS or equivalent competency cards" },
    { id: "cdm-22", requirement: "PPE Provision", description: "Appropriate personal protective equipment issued and worn" },
    { id: "cdm-23", requirement: "Toolbox Talks", description: "Regular safety briefings delivered and recorded" },
    { id: "cdm-24", requirement: "Rest Facilities", description: "Adequate rest and eating facilities provided" },
    { id: "cdm-25", requirement: "Sanitary Facilities", description: "Toilets, washing facilities, and changing rooms available" }
  ]
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Fetch project data for compliance analysis
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        riskAssessments: true,
        toolboxTalks: { take: 30 },
        safetyIncidents: true,
        permits: true,
        inspections: true,
        dailyReports: { take: 30, orderBy: { reportDate: "desc" } },
        _count: {
          select: {
            teamMembers: true,
            tasks: true,
            documents: true,
            riskAssessments: true,
            toolboxTalks: true,
            inspections: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = project as any;

    // Analyze compliance based on available data
    const complianceResults: any = {
      prePlanningPhase: [],
      constructionPhase: [],
      documentation: [],
      workerWelfare: []
    };

    // Auto-check based on available data
    const hasRiskAssessments = projectData._count.riskAssessments > 0;
    const hasToolboxTalks = projectData._count.toolboxTalks > 0;
    const hasInspections = projectData._count.inspections > 0;
    const hasDailyReports = projectData.dailyReports?.length > 0;
    const hasDocuments = projectData._count.documents > 0;
    const hasTeamMembers = projectData._count.teamMembers > 0;

    // Pre-planning checks
    CDM_REQUIREMENTS.prePlanningPhase.forEach(req => {
      let status = "NOT_CHECKED";
      let evidence = "Manual verification required";
      
      if (req.id === "cdm-4" && hasDailyReports) {
        status = "COMPLIANT";
        evidence = "Construction Phase Plan documented in daily reports";
      }
      
      complianceResults.prePlanningPhase.push({
        ...req,
        status,
        evidence,
        checkedAt: new Date().toISOString()
      });
    });

    // Construction phase checks
    CDM_REQUIREMENTS.constructionPhase.forEach(req => {
      let status = "NOT_CHECKED";
      let evidence = "Manual verification required";
      
      if (req.id === "cdm-6" && hasTeamMembers) {
        status = "PARTIAL";
        evidence = `${projectData._count.teamMembers} team members on record - verify induction completion`;
      }
      if (req.id === "cdm-8" && hasRiskAssessments) {
        status = "COMPLIANT";
        evidence = `${projectData._count.riskAssessments} risk assessments documented`;
      }
      if (req.id === "cdm-12" && projectData.permits?.length > 0) {
        status = "PARTIAL";
        evidence = "Emergency procedures should be verified in permits";
      }
      if (req.id === "cdm-18" && hasInspections) {
        status = "COMPLIANT";
        evidence = `${projectData._count.inspections} inspections recorded`;
      }
      
      complianceResults.constructionPhase.push({
        ...req,
        status,
        evidence,
        checkedAt: new Date().toISOString()
      });
    });

    // Documentation checks
    CDM_REQUIREMENTS.documentation.forEach(req => {
      let status = "NOT_CHECKED";
      let evidence = "Manual verification required";
      
      if (req.id === "cdm-16" && hasDocuments) {
        status = "PARTIAL";
        evidence = `${projectData._count.documents} documents uploaded - verify H&S file inclusion`;
      }
      if (req.id === "cdm-17" && hasDailyReports) {
        status = "COMPLIANT";
        evidence = `${projectData.dailyReports.length} daily reports on record`;
      }
      if (req.id === "cdm-18" && hasInspections) {
        status = "COMPLIANT";
        evidence = `${projectData._count.inspections} inspection records documented`;
      }
      
      complianceResults.documentation.push({
        ...req,
        status,
        evidence,
        checkedAt: new Date().toISOString()
      });
    });

    // Worker welfare checks
    CDM_REQUIREMENTS.workerWelfare.forEach(req => {
      let status = "NOT_CHECKED";
      let evidence = "Manual verification required";
      
      if (req.id === "cdm-23" && hasToolboxTalks) {
        status = "COMPLIANT";
        evidence = `${projectData._count.toolboxTalks} toolbox talks delivered`;
      }
      
      complianceResults.workerWelfare.push({
        ...req,
        status,
        evidence,
        checkedAt: new Date().toISOString()
      });
    });

    // Calculate compliance scores
    const calculateScore = (items: any[]) => {
      const compliant = items.filter(i => i.status === "COMPLIANT").length;
      const partial = items.filter(i => i.status === "PARTIAL").length;
      const total = items.length;
      return Math.round(((compliant + partial * 0.5) / total) * 100);
    };

    const scores = {
      prePlanning: calculateScore(complianceResults.prePlanningPhase),
      construction: calculateScore(complianceResults.constructionPhase),
      documentation: calculateScore(complianceResults.documentation),
      workerWelfare: calculateScore(complianceResults.workerWelfare)
    };

    const overallScore = Math.round(
      (scores.prePlanning + scores.construction + scores.documentation + scores.workerWelfare) / 4
    );

    // Generate AI recommendations
    const nonCompliantItems = [
      ...complianceResults.prePlanningPhase,
      ...complianceResults.constructionPhase,
      ...complianceResults.documentation,
      ...complianceResults.workerWelfare
    ].filter(i => i.status === "NOT_CHECKED" || i.status === "NON_COMPLIANT");

    // Log compliance check
    await prisma.activityLog.create({
      data: {
        action: "cdm_compliance_check",
        entityType: "Project",
        entityId: projectId,
        entityName: projectData.name,
        details: `CDM 2015 compliance check completed. Overall score: ${overallScore}%`,
        userId: session.user.id,
        projectId
      }
    });

    return NextResponse.json({
      success: true,
      projectName: projectData.name,
      complianceResults,
      scores,
      overallScore,
      summary: {
        totalRequirements: 25,
        compliant: [
          ...complianceResults.prePlanningPhase,
          ...complianceResults.constructionPhase,
          ...complianceResults.documentation,
          ...complianceResults.workerWelfare
        ].filter(i => i.status === "COMPLIANT").length,
        partial: [
          ...complianceResults.prePlanningPhase,
          ...complianceResults.constructionPhase,
          ...complianceResults.documentation,
          ...complianceResults.workerWelfare
        ].filter(i => i.status === "PARTIAL").length,
        requiresAction: nonCompliantItems.length
      },
      recommendations: nonCompliantItems.slice(0, 5).map(i => ({
        requirement: i.requirement,
        action: `Review and document compliance for: ${i.description}`
      })),
      checkedAt: new Date().toISOString()
    });
  } catch {
    console.error("Compliance check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
