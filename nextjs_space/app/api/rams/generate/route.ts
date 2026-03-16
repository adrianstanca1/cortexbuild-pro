// POST /api/rams/generate - Generate RAMS document using AI
// Creates a Risk Assessment Method Statement based on activity description

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { activity, location, duration, personnel, projectId } = body;

    if (!activity?.trim()) {
      return NextResponse.json(
        { error: "Activity description is required" },
        { status: 400 }
      );
    }

    // Call AI service to generate RAMS content
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Generate a comprehensive RAMS (Risk Assessment Method Statement) for the following construction activity:

Activity: ${activity}
Location: ${location || "Not specified"}
Duration: ${duration || "Not specified"}
Personnel: ${personnel || "Not specified"}

Provide structured output with:
1. Identified hazards (list)
2. Initial risk level (LOW/MEDIUM/HIGH/EXTREME)
3. Control measures (list)
4. Residual risk level after controls
5. Step-by-step method statement
6. Required PPE (list)
7. Emergency procedures

Return as JSON format.`,
        type: "rams_generation",
      }),
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 503 }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.response || aiData.content || "";

    // Parse the AI response into structured RAMS data
    const parsedRams = parseRamsResponse(aiContent, activity);

    // Optionally save to database if projectId provided
    let savedRams = null;
    if (projectId && session.user.organizationId) {
      // Verify project belongs to organization
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (project?.organizationId === session.user.organizationId) {
        savedRams = await prisma.riskAssessment.create({
          data: {
            title: activity,
            description: parsedRams.methodStatement,
            riskLevel: parsedRams.riskLevel as any,
            hazards: parsedRams.hazards,
            controlMeasures: parsedRams.controls,
            residualRisk: parsedRams.residualRisk as any,
            ppeRequired: parsedRams.ppe,
            emergencyProcedures: parsedRams.emergencyProcedures,
            projectId,
            createdById: session.user.id,
          },
          include: {
            project: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      rams: {
        activity,
        location: location || null,
        duration: duration || null,
        hazards: parsedRams.hazards,
        riskLevel: parsedRams.riskLevel,
        controls: parsedRams.controls,
        residualRisk: parsedRams.residualRisk,
        methodStatement: parsedRams.methodStatement,
        ppe: parsedRams.ppe,
        emergencyProcedures: parsedRams.emergencyProcedures,
        generatedAt: new Date().toISOString(),
      },
      savedRecord: savedRams ? { id: savedRams.id } : null,
    });
  } catch (error) {
    console.error("Error generating RAMS:", error);
    return NextResponse.json(
      { error: "Failed to generate RAMS", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Helper function to parse AI response into structured RAMS data
function parseRamsResponse(text: string, activity: string) {
  const extractList = (keyword: string): string[] => {
    const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\s*\\n|\\d+\\.|\\Z)`, "i");
    const match = text.match(regex);
    if (match) {
      return match[1]
        .split(/\n/)
        .filter((line) => line.trim().length > 1)
        .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0);
    }
    return [];
  };

  const extractValue = (keyword: string): string => {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const extractSection = (keyword: string): string => {
    const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\s*(?:\\d+\\.|[A-Z][a-z]+:|\\Z))`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  // Extract risk level with validation
  const riskLevel = extractValue("risk level") || extractValue("initial risk") || "MEDIUM";
  const validRiskLevels = ["LOW", "MEDIUM", "HIGH", "EXTREME"];
  const normalizedRisk = validRiskLevels.find((r) => riskLevel.toUpperCase().includes(r)) || "MEDIUM";

  const residualRisk = extractValue("residual risk") || "LOW";
  const normalizedResidual = validRiskLevels.find((r) => residualRisk.toUpperCase().includes(r)) || "LOW";

  return {
    activity,
    hazards: extractList("hazard") || extractList("Hazards") || ["General construction hazards"],
    riskLevel: normalizedRisk,
    controls: extractList("control") || extractList("Controls") || ["Follow standard safety procedures"],
    residualRisk: normalizedResidual,
    methodStatement: extractSection("method statement") || extractSection("Method Statement") || text,
    ppe: extractList("PPE") || extractList("ppe") || ["Safety helmet", "Safety boots", "High-visibility vest"],
    emergencyProcedures: extractSection("emergency") || extractSection("Emergency") || "Follow site emergency procedures. Contact emergency services if needed.",
  };
}
