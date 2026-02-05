import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// AI-Powered Report Generation API
// Generates comprehensive project reports with AI insights

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, reportType, dateRange } = body;

    if (!projectId || !reportType) {
      return NextResponse.json(
        { error: "Project ID and report type are required" },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch comprehensive project data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: {
            OR: [
              { createdAt: { gte: startDate } },
              { updatedAt: { gte: startDate } }
            ]
          }
        },
        dailyReports: {
          where: { reportDate: { gte: startDate, lte: endDate } },
          orderBy: { reportDate: "desc" }
        },
        safetyIncidents: {
          where: { createdAt: { gte: startDate } }
        },
        changeOrders: {
          where: { createdAt: { gte: startDate } }
        },
        riskRegister: true,
        inspections: {
          where: { createdAt: { gte: startDate } }
        },
        toolboxTalks: {
          where: { date: { gte: startDate } }
        },
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
            documents: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = project as any;

    // Calculate key metrics
    const tasksCompleted = projectData.tasks.filter((t: any) => t.status === "COMPLETE").length;
    const tasksInProgress = projectData.tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
    const tasksTodo = projectData.tasks.filter((t: any) => t.status === "TODO").length;
    
    const incidentCount = projectData.safetyIncidents?.length || 0;
    const changeOrderCount = projectData.changeOrders?.length || 0;
    const inspectionCount = projectData.inspections?.length || 0;
    const toolboxTalkCount = projectData.toolboxTalks?.length || 0;

    // Calculate budget metrics
    const changeOrderValue = projectData.changeOrders?.reduce((sum: number, co: any) => 
      sum + (co.value || 0), 0
    ) || 0;

    // Prepare data for AI analysis
    const reportDataSummary = `
Project: ${projectData.name}
Status: ${projectData.status}
Progress: ${projectData.progress || 0}%
Budget: £${projectData.budget?.toLocaleString() || 'Not set'}
Reporting Period: ${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}

Task Summary:
- Completed: ${tasksCompleted}
- In Progress: ${tasksInProgress}
- To Do: ${tasksTodo}
- Total Active: ${projectData.tasks.length}

Safety & Compliance:
- Safety Incidents: ${incidentCount}
- Inspections Completed: ${inspectionCount}
- Toolbox Talks Delivered: ${toolboxTalkCount}
- Active Risks: ${projectData.riskRegister?.length || 0}

Commercial:
- Change Orders: ${changeOrderCount} (Value: £${changeOrderValue.toLocaleString()})
- Daily Reports Submitted: ${projectData.dailyReports?.length || 0}

Team:
- Team Members: ${projectData._count.teamMembers}
- Documents: ${projectData._count.documents}
`;

    // Generate AI insights based on report type
    let aiPrompt = "";
    
    switch (reportType) {
      case "executive":
        aiPrompt = `Generate an executive summary report for this UK construction project. Focus on:
1. Overall project health and progress
2. Key achievements this period
3. Critical issues requiring attention
4. Budget and schedule status
5. Safety performance
6. Recommendations for leadership

Data:\n${reportDataSummary}\n\nProvide a professional executive summary suitable for senior stakeholders.`;
        break;
      
      case "safety":
        aiPrompt = `Generate a comprehensive safety report for this UK construction project focusing on CDM 2015 compliance. Include:
1. Safety performance summary
2. Incident analysis and trends
3. Toolbox talk effectiveness
4. Risk assessment status
5. Compliance gaps
6. Recommended safety improvements

Data:\n${reportDataSummary}\n\nProvide actionable safety insights.`;
        break;
      
      case "progress":
        aiPrompt = `Generate a detailed progress report for this UK construction project. Include:
1. Work completed this period
2. Upcoming milestones
3. Schedule performance analysis
4. Resource utilization
5. Blockers and delays
6. Forecast and outlook

Data:\n${reportDataSummary}\n\nProvide a clear picture of project progress.`;
        break;
      
      case "commercial":
        aiPrompt = `Generate a commercial report for this UK construction project. Include:
1. Budget status and variance analysis
2. Change order summary and trends
3. Cost performance indicators
4. Risk exposure analysis
5. Cash flow considerations
6. Financial recommendations

Data:\n${reportDataSummary}\n\nProvide commercial insights for financial stakeholders.`;
        break;
      
      default:
        aiPrompt = `Generate a comprehensive weekly report for this UK construction project covering all aspects:
1. Executive Summary
2. Progress Update
3. Safety Performance
4. Commercial Status
5. Key Issues
6. Next Week's Focus

Data:\n${reportDataSummary}`;
    }

    const aiResponse = await fetch("https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional construction project manager and report writer with expertise in UK construction practices, CDM 2015 regulations, and stakeholder communication. Generate clear, professional reports with actionable insights."
          },
          {
            role: "user",
            content: aiPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000
      })
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const reportContent = aiData.choices[0]?.message?.content || "Report generation failed";

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "report_generated",
        entityType: "Report",
        entityId: projectId,
        entityName: `${reportType} Report`,
        details: `Generated ${reportType} report for ${dateRange || 'weekly'} period`,
        userId: session.user.id,
        projectId
      }
    });

    return NextResponse.json({
      success: true,
      report: {
        title: `${projectData.name} - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        projectName: projectData.name,
        reportType,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        content: reportContent,
        metrics: {
          tasks: {
            completed: tasksCompleted,
            inProgress: tasksInProgress,
            todo: tasksTodo
          },
          safety: {
            incidents: incidentCount,
            inspections: inspectionCount,
            toolboxTalks: toolboxTalkCount
          },
          commercial: {
            changeOrders: changeOrderCount,
            changeOrderValue
          },
          progress: projectData.progress || 0
        },
        generatedAt: new Date().toISOString(),
        generatedBy: session.user.name || session.user.email
      }
    });
  } catch {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
