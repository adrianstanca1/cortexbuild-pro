import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildSafetyAnalysisPrompt } from '@/lib/ai/prompts';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { incidentId, model = 'llama3.2' } = body;

    if (!incidentId) {
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    const incident = await prisma.safetyIncident.findUnique({
      where: { id: incidentId },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Safety incident not found' }, { status: 404 });
    }

    const prompt = buildSafetyAnalysisPrompt({
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
    });

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a construction safety specialist.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();

    return NextResponse.json({
      incident,
      analysis: data.response,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing safety incident:', error);
    return NextResponse.json({ error: 'Failed to analyze safety incident' }, { status: 500 });
  }
}
