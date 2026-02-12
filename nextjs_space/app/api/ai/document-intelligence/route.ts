import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// AI-Powered Document Intelligence API
// Analyzes construction documents and extracts key information

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, documentText, documentType, projectId } = body;

    if (!documentText || !documentType) {
      return NextResponse.json(
        { error: "Document text and type are required" },
        { status: 400 }
      );
    }

    // Use Abacus AI for document analysis
    const analysisPrompt = `Analyze this construction document and extract key information:

Document Type: ${documentType}
Document Content:
${documentText.substring(0, 4000)}

Please provide:
1. Document Summary (2-3 sentences)
2. Key Dates (start date, completion date, milestones)
3. Budget Information (total cost, line items, contingencies)
4. Parties Involved (contractors, clients, consultants)
5. Risks Identified (safety, schedule, cost, compliance)
6. Action Items (tasks that need to be completed)
7. Compliance Issues (CDM 2015, health & safety regulations)

Format as JSON with these exact keys: summary, keyDates, budgetInfo, parties, risks, actionItems, complianceIssues`;

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
            content: "You are an expert construction document analyst specializing in UK construction projects and CDM 2015 compliance. Provide detailed, actionable insights. Always respond with valid JSON."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      return NextResponse.json(
        { error: "Failed to analyze document" },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0]?.message?.content || "";

    // Parse the AI response (handle both JSON and text responses)
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured data from text
        analysis = {
          summary: analysisText.substring(0, 500),
          keyDates: [],
          budgetInfo: {},
          parties: [],
          risks: [],
          actionItems: [],
          complianceIssues: []
        };
      }
    } catch (parseError) {
      analysis = {
        summary: analysisText.substring(0, 500),
        keyDates: [],
        budgetInfo: {},
        parties: [],
        risks: [],
        actionItems: [],
        complianceIssues: [],
        rawAnalysis: analysisText
      };
    }

    // Log activity
    if (projectId) {
      await prisma.activityLog.create({
        data: {
          action: "document_analyzed",
          entityType: "Document",
          entityId: documentId || "unknown",
          entityName: documentType,
          details: `AI document analysis completed. Risks found: ${analysis.risks?.length || 0}. Compliance issues: ${analysis.complianceIssues?.length || 0}`,
          userId: session.user.id,
          projectId
        }
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        documentType,
        confidence: 0.85
      }
    });
  } catch (error) {
    console.error("Document intelligence error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
