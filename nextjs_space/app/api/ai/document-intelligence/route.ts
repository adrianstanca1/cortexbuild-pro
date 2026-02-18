import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateAIResponse } from "@/lib/ai-service";

// AI-Powered Document Intelligence API
// Analyzes construction documents and extracts key information

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentText, documentType } = body;

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

    const messages = [
      {
        role: "system",
        content: "You are an expert construction document analyst specializing in UK construction projects and CDM 2015 compliance. Provide detailed, actionable insights. Always respond with valid JSON."
      },
      {
        role: "user",
        content: analysisPrompt
      }
    ];

    const result = await generateAIResponse({ messages: messages as any, maxTokens: 3000 });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'AI service unavailable' }, { status: 503 });
    }

    return NextResponse.json({ intelligence: result.response });
  } catch (error) {
    console.error("Document intelligence error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
