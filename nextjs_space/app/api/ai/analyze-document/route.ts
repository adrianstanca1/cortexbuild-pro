import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateAIResponse } from '@/lib/ai-service';

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
    let messages: any[] = [];

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

    const result = await generateAIResponse({ messages, maxTokens: 4000 });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'AI service unavailable' }, { status: 503 });
    }

    return NextResponse.json({ analysis: result.response });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}
