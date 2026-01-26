export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const query = formData.get('query') as string || 'Analyze this document and provide a summary.';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    let messages: Array<{ role: string; content: unknown }> = [];

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Handle PDF - send base64 to LLM
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');
      messages = [{
        role: 'user',
        content: [
          { type: 'file', file: { filename: file.name, file_data: `data:application/pdf;base64,${base64String}` } },
          { type: 'text', text: `${query}\n\nPlease analyze this construction document thoroughly.` }
        ]
      }];
    } else if (fileType.startsWith('image/')) {
      // Handle images
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: `${query}\n\nAnalyze this construction-related image.` },
          { type: 'image_url', image_url: { url: `data:${fileType};base64,${base64String}` } }
        ]
      }];
    } else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
      // Handle text files
      const textContent = await file.text();
      messages = [{
        role: 'user',
        content: `${query}\n\nHere is the content from the file:\n\n${textContent}`
      }];
    } else if (fileName.endsWith('.csv') || fileType === 'text/csv') {
      // Handle CSV files
      const csvContent = await file.text();
      messages = [{
        role: 'user',
        content: `${query}\n\nHere is the CSV data:\n\n${csvContent}`
      }];
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Supported: PDF, images, TXT, CSV' }, { status: 400 });
    }

    // Add system context for construction domain
    messages.unshift({
      role: 'system',
      content: 'You are an AI assistant specializing in construction document analysis for CortexBuildPro. Analyze documents for: compliance issues, safety concerns, cost implications, schedule impacts, and actionable insights. Be thorough but concise.'
    });

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        stream: true,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value);
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}
