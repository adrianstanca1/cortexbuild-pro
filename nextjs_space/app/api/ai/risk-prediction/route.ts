import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// AI-Powered Risk Prediction & Early Warning System
// Analyzes project data to predict potential risks

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

    // Fetch comprehensive project data with all related records
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { status: { not: "COMPLETE" } },
          include: { assignee: true }
        },
        riskRegister: true,
        changeOrders: true,
        defects: { where: { status: { notIn: ["COMPLETED", "VERIFIED"] } } },
        safetyIncidents: true,
        dailyReports: {
          take: 10,
          orderBy: { reportDate: "desc" }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Cast project to any to access dynamic includes
    const projectData = project as any;

    // Prepare project data summary for AI analysis
    const projectSummary = {
      name: projectData.name,
      status: projectData.status,
      progress: projectData.progress || 0,
      budget: projectData.budget,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      stats: {
        totalTasks: projectData.tasks?.length || 0,
        overdueTasks: projectData.tasks?.filter((t: any) => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETE"
        ).length || 0,
        activeRisks: projectData.riskRegister?.length || 0,
        highRisks: projectData.riskRegister?.filter((r: any) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL").length || 0,
        openDefects: projectData.defects?.length || 0,
        criticalDefects: projectData.defects?.filter((d: any) => d.severity === "CRITICAL").length || 0,
        recentIncidents: projectData.safetyIncidents?.filter((i: any) => 
          new Date(i.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length || 0,
        changeOrders: projectData.changeOrders?.length || 0,
        budgetSpent: projectData.budget && projectData.progress ? (projectData.budget * projectData.progress / 100) : 0
      }
    };

    // Calculate schedule health
    const now = new Date();
    const start = new Date(projectData.startDate);
    const end = new Date(projectData.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    const scheduleVariance = (projectData.progress || 0) - expectedProgress;

    const riskAnalysisPrompt = `Analyze this UK construction project and predict potential risks:

Project: ${projectSummary.name}
Status: ${projectSummary.status}
Progress: ${projectSummary.progress}% (Expected: ${expectedProgress.toFixed(1)}%)
Schedule Variance: ${scheduleVariance.toFixed(1)}%
Budget: £${projectSummary.budget?.toLocaleString() || 'Not set'}

Key Metrics:
- Total Tasks: ${projectSummary.stats.totalTasks} (Overdue: ${projectSummary.stats.overdueTasks})
- Active Risks: ${projectSummary.stats.activeRisks} (High/Critical: ${projectSummary.stats.highRisks})
- Open Defects: ${projectSummary.stats.openDefects} (Critical: ${projectSummary.stats.criticalDefects})
- Safety Incidents (30 days): ${projectSummary.stats.recentIncidents}
- Change Orders: ${projectSummary.stats.changeOrders}
- Budget Spent: £${projectSummary.stats.budgetSpent.toLocaleString()}

Provide a comprehensive risk prediction analysis:
1. Schedule Risks: Likelihood of delays, critical path issues
2. Cost Risks: Budget overrun probability, cost drivers
3. Safety Risks: Potential safety issues, compliance concerns
4. Quality Risks: Defect trends, quality control issues
5. Resource Risks: Team capacity, skill gaps
6. Early Warning Signals: Indicators requiring immediate attention
7. Recommended Actions: Prioritized list of interventions
8. Risk Score: Overall project health score (0-100)

Format as JSON with keys: scheduleRisks, costRisks, safetyRisks, qualityRisks, resourceRisks, earlyWarnings, recommendations, riskScore`;

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
            content: "You are an expert construction project risk analyst with deep knowledge of UK construction practices, CDM 2015 regulations, and predictive analytics. Provide data-driven, actionable insights. Always respond with valid JSON."
          },
          {
            role: "user",
            content: riskAnalysisPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500
      })
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      return NextResponse.json(
        { error: "Failed to analyze risks" },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0]?.message?.content || "";

    // Parse AI response
    let riskPrediction;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        riskPrediction = JSON.parse(jsonMatch[0]);
      } else {
        riskPrediction = {
          scheduleRisks: ["Unable to parse schedule risks"],
          costRisks: ["Unable to parse cost risks"],
          safetyRisks: ["Unable to parse safety risks"],
          qualityRisks: ["Unable to parse quality risks"],
          resourceRisks: ["Unable to parse resource risks"],
          earlyWarnings: [],
          recommendations: [],
          riskScore: 50,
          rawAnalysis: analysisText
        };
      }
    } catch (parseError) {
      riskPrediction = {
        scheduleRisks: [],
        costRisks: [],
        safetyRisks: [],
        qualityRisks: [],
        resourceRisks: [],
        earlyWarnings: [],
        recommendations: [],
        riskScore: 50,
        rawAnalysis: analysisText,
        error: "Failed to parse AI response"
      };
    }

    // Create predictive signal if high risk detected
    if (riskPrediction.riskScore < 70 || (riskPrediction.earlyWarnings && riskPrediction.earlyWarnings.length > 0)) {
      const highestRisk = riskPrediction.earlyWarnings?.[0] || "Project requires attention";
      const organizationId = (session.user as any).organizationId;
      
      if (organizationId) {
        await prisma.predictiveSignal.create({
          data: {
            organizationId,
            projectId,
            signalType: "RISK_ALERT",
            signalName: "AI Risk Prediction Alert",
            severity: riskPrediction.riskScore < 50 ? "HIGH" : "MEDIUM",
            confidence: 0.85,
            description: typeof highestRisk === 'string' ? highestRisk : JSON.stringify(highestRisk),
            dataPoints: {
              recommendations: riskPrediction.recommendations || [],
              affectedAreas: ["schedule", "cost", "safety", "quality"]
            }
          }
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "ai_risk_analysis",
        entityType: "Project",
        entityId: projectId,
        entityName: projectData.name,
        details: `AI analysis completed. Risk Score: ${riskPrediction.riskScore}/100. Warnings: ${riskPrediction.earlyWarnings?.length || 0}`,
        userId: session.user.id,
        projectId
      }
    });

    return NextResponse.json({
      success: true,
      prediction: riskPrediction,
      projectHealth: {
        scheduleHealth: scheduleVariance >= -10 ? "GOOD" : scheduleVariance >= -20 ? "WARNING" : "CRITICAL",
        budgetHealth: projectSummary.stats.budgetSpent / (projectSummary.budget || 1) <= 0.9 ? "GOOD" : "WARNING",
        safetyHealth: projectSummary.stats.recentIncidents === 0 ? "GOOD" : projectSummary.stats.recentIncidents <= 2 ? "WARNING" : "CRITICAL",
        overallScore: riskPrediction.riskScore
      },
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Risk prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
