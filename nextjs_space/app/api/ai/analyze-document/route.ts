export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateAIResponse, isAIConfigured } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json({ 
        error: 'AI service not configured. Please configure Abacus AI or Google Gemini API.' 
      }, { status: 503 });
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
    const systemMessage = {
      role: 'system' as const,
      content: 'You are an AI assistant specializing in construction document analysis for CortexBuildPro. Analyze documents for: compliance issues, safety concerns, cost implications, schedule impacts, and actionable insights. Be thorough but concise.'
    };

    // Use unified AI service with automatic provider selection
    const result = await generateAIResponse({
      messages: [systemMessage, ...messages as any],
      stream: true,
      maxTokens: 3000
    });

    if (!result.success || !result.stream) {
      throw new Error(result.error || 'AI service failed');
    }

    // Add provider info header for debugging
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-AI-Provider': result.provider
    });

    return new Response(result.stream, { headers });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}
