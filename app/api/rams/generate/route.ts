import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/aiService";

interface RamsProject {
  name: string;
  location: string;
  description: string;
  date: string;
  tasks: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RamsProject = await req.json();

    if (!body.name || !body.tasks || body.tasks.length === 0) {
      return NextResponse.json(
        { error: "Project name and tasks are required" },
        { status: 400 }
      );
    }

    // Generate RAMS content using AI
    const prompt = `Create a comprehensive RAMS (Risk Assessment Method Statement) document for the following construction project:

Project Name: ${body.name}
Location: ${body.location || "Not specified"}
Description: ${body.description || "Not specified"}
Date: ${body.date}
Tasks: ${body.tasks.join(", ")}

Generate a detailed RAMS document in HTML format with the following sections:
1. Project Overview
2. Task Breakdown with associated hazards and risks
3. Control Measures for each identified hazard
4. PPE Requirements
5. Emergency Procedures
6. Risk Matrix (Low, Medium, High, Extreme ratings)

Format the output as valid HTML with proper styling for printing. Include tables for risk assessments and clear headings for each section.`;

    const response = await aiService.generateCompletion({
      provider: "claude",
      model: "claude-3-sonnet-20240229",
      messages: [
        {
          role: "system",
          content: "You are a health and safety expert specializing in construction risk assessments. Generate comprehensive RAMS documents in HTML format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 4000,
    });

    // Extract HTML content from response
    const htmlContent = response.content;

    return NextResponse.json({
      success: true,
      html: htmlContent,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    console.error("RAMS generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate RAMS" },
      { status: 500 }
    );
  }
}
