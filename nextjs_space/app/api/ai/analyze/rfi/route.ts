import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildRFIAnalysisPrompt } from '@/lib/ai/prompts';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfiId, model = 'llama3.2' } = body;

    if (!rfiId) {
      return NextResponse.json({ error: 'RFI ID is required' }, { status: 400 });
    }

    const rfi = await prisma.rFI.findUnique({
      where: { id: rfiId },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    });

    if (!rfi) {
      return NextResponse.json({ error: 'RFI not found' }, { status: 404 });
    }

    const prompt = buildRFIAnalysisPrompt({
      number: rfi.number,
      title: rfi.title,
      question: rfi.question,
      status: rfi.status,
    });

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert construction analyst specializing in RFIs.' },
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
      rfi,
      analysis: data.response,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing RFI:', error);
    return NextResponse.json({ error: 'Failed to analyze RFI' }, { status: 500 });
  }
}
