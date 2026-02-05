import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY;
const ABACUS_API_URL = 'https://api.abacus.ai/api/v0/chat';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const projectId = formData.get('projectId') as string;
    const analysisType = formData.get('analysisType') as string || 'general';

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    // Get project context if provided
    let projectContext = '';
    if (projectId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
      });

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId: user?.organizationId || undefined
        },
        select: {
          name: true,
          description: true,
          status: true,
          phase: true
        }
      });

      if (project) {
        projectContext = `Project: ${project.name}\nPhase: ${project.phase || 'Construction'}\nStatus: ${project.status}\n\n`;
      }
    }

    // Build analysis prompt based on type
    let analysisPrompt = '';
    switch (analysisType) {
      case 'safety':
        analysisPrompt = `You are a UK construction safety expert analyzing a site photo for CDM 2015 compliance and safety hazards.

${projectContext}Analyze this construction site image and provide:

1. **Safety Hazards Identified**: List any visible safety concerns (fall risks, PPE issues, housekeeping, electrical hazards, etc.)
2. **CDM 2015 Compliance Issues**: Flag any potential violations of UK Construction (Design and Management) Regulations 2015
3. **Risk Level**: Rate overall risk as LOW, MEDIUM, HIGH, or CRITICAL
4. **Immediate Actions Required**: List urgent safety measures needed
5. **Recommendations**: Provide specific improvements for safer working conditions

Be specific and reference visible elements in the image. Use UK construction terminology and standards.`;
        break;

      case 'progress':
        analysisPrompt = `You are a construction project manager analyzing a site photo for progress tracking.

${projectContext}Analyze this construction site image and provide:

1. **Work Stage Assessment**: What construction phase/activity is visible?
2. **Progress Indicators**: What work appears complete vs in-progress?
3. **Quality Observations**: Note any visible quality issues or good workmanship
4. **Weather/Site Conditions**: Describe current site conditions visible
5. **Resource Utilization**: Comment on visible workers, equipment, and materials
6. **Estimated Completion**: Based on visible work, estimate progress percentage for this area

Be specific about what you can observe in the image.`;
        break;

      case 'quality':
        analysisPrompt = `You are a construction quality inspector analyzing a site photo.

${projectContext}Analyze this construction site image for quality control:

1. **Workmanship Assessment**: Rate visible workmanship quality (Excellent/Good/Acceptable/Poor)
2. **Defects Identified**: List any visible defects, damage, or non-conformances
3. **Standards Compliance**: Note compliance with visible building standards and specifications
4. **Snagging Items**: Identify any items that would require rectification before sign-off
5. **Materials Assessment**: Comment on visible material quality and storage
6. **Recommendations**: Suggest quality improvements or inspections needed

Reference specific areas of the image in your analysis.`;
        break;

      default:
        analysisPrompt = `You are a construction management AI assistant analyzing a site photo.

${projectContext}Provide a comprehensive analysis of this construction site image:

1. **Overview**: Describe what construction activity is shown
2. **Safety Assessment**: Note any safety concerns or good practices visible
3. **Progress Assessment**: Estimate work completion status
4. **Quality Notes**: Comment on visible workmanship quality
5. **Notable Observations**: Highlight anything significant (equipment, materials, conditions)
6. **Recommendations**: Suggest any actions or follow-ups

Provide practical insights useful for construction management.`;
    }

    // Call Abacus AI API with the image
    const response = await fetch(ABACUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return NextResponse.json(
        { error: 'AI analysis failed' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || 'Unable to analyze image';

    // Extract risk level if safety analysis
    let riskLevel: string | null = null;
    if (analysisType === 'safety') {
      if (analysis.includes('CRITICAL')) riskLevel = 'CRITICAL';
      else if (analysis.includes('HIGH')) riskLevel = 'HIGH';
      else if (analysis.includes('MEDIUM')) riskLevel = 'MEDIUM';
      else if (analysis.includes('LOW')) riskLevel = 'LOW';
    }

    return NextResponse.json({
      success: true,
      analysis,
      analysisType,
      riskLevel,
      timestamp: new Date().toISOString()
    });
  } catch {
    console.error('Photo analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    );
  }
}
