import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPTS, buildChatPrompt } from '@/lib/ai/prompts';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'llama3.2' } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.role === 'system' ? SYSTEM_PROMPTS.chat : msg.content,
    }));

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: data.response,
      },
      done: data.done,
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
  }
}
