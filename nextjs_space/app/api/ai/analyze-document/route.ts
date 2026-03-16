export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ollamaClient } from '@/lib/ollamaClient';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const query = formData.get('query') as string || 'Analyse this construction document and provide a detailed summary, key risks, and action items.';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    let textContent = '';

    // Extract text content from supported formats
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      textContent = await file.text();
    } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      textContent = await file.text();
    } else if (fileName.endsWith('.md')) {
      textContent = await file.text();
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      textContent = `[PDF file: ${file.name}]\nNote: Direct PDF parsing requires pdf-parse. Please use a text or CSV format for best results, or upgrade to a vision-capable model.`;
    } else if (fileType.startsWith('image/')) {
      textContent = `[Image file: ${file.name}]\nNote: Image analysis requires a vision-capable Ollama model (e.g. llava, bakllava). Currently configured model: ${process.env.OLLAMA_MODEL || 'qwen2.5:7b'}.`;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: TXT, CSV, MD, PDF (text-only), images (vision model required)' },
        { status: 400 }
      );
    }

    // Check Ollama availability
    const available = await ollamaClient.isAvailable();
    if (!available) {
      return NextResponse.json(
        { error: 'AI service unavailable. Ensure Ollama is running at ' + (process.env.OLLAMA_URL || 'http://host.docker.internal:11434') },
        { status: 503 }
      );
    }

    const messages = [
      {
        role: 'system' as const,
        content: 'You are an AI assistant specialising in construction document analysis for CortexBuildPro, used by AS Cladding & Roofing Ltd. Analyse documents for: compliance issues, safety concerns, cost implications, schedule impacts, and actionable insights. Be thorough but concise.'
      },
      {
        role: 'user' as const,
        content: `${query}\n\nDocument: ${file.name}\n\n---\n${textContent}\n---`
      }
    ];

    // Stream the analysis via ollamaClient in SSE format
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of ollamaClient.streamChat(messages)) {
            const sseData = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Document analysis stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Provider': 'ollama',
        'X-AI-Model': process.env.OLLAMA_MODEL || 'qwen2.5:7b',
        'X-Document-Name': file.name,
      }
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyse document' }, { status: 500 });
  }
}
