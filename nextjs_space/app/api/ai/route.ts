import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch organization context data for RAG
    const [projects, recentRFIs, recentTasks, recentIncidents, recentSubmittals, recentChangeOrders] = await Promise.all([
      prisma.project.findMany({
        where: { organizationId: session.user.organizationId },
        select: { id: true, name: true, status: true, budget: true, startDate: true, endDate: true }
      }),
      prisma.rFI.findMany({
        where: { project: { organizationId: session.user.organizationId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } } }
      }),
      prisma.task.findMany({
        where: { project: { organizationId: session.user.organizationId } },
        take: 20,
        orderBy: { updatedAt: 'desc' },
        include: { project: { select: { name: true } } }
      }),
      prisma.safetyIncident.findMany({
        where: { project: { organizationId: session.user.organizationId } },
        take: 10,
        orderBy: { incidentDate: 'desc' },
        include: { project: { select: { name: true } } }
      }),
      prisma.submittal.findMany({
        where: { project: { organizationId: session.user.organizationId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } } }
      }),
      prisma.changeOrder.findMany({
        where: { project: { organizationId: session.user.organizationId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } } }
      })
    ]);

    // Build context for RAG
    const systemContext = `You are an AI assistant for CortexBuildPro, a construction management platform.
You have access to the following organization data:

**Projects (${projects.length}):**
${projects.map(p => `- ${p.name}: Status: ${p.status}, Budget: $${p.budget?.toLocaleString() || 'N/A'}`).join('\n')}

**Recent RFIs (${recentRFIs.length}):**
${recentRFIs.map(r => `- #${r.number} (${r.project.name}): ${r.subject} - Status: ${r.status}`).join('\n')}

**Recent Tasks (${recentTasks.length}):**
${recentTasks.map(t => `- ${t.title} (${t.project.name}): Status: ${t.status}, Priority: ${t.priority}`).join('\n')}

**Recent Safety Incidents (${recentIncidents.length}):**
${recentIncidents.map(s => `- ${s.project.name}: ${s.description?.substring(0, 50)}... - Severity: ${s.severity}, Status: ${s.status}`).join('\n')}

**Recent Submittals (${recentSubmittals.length}):**
${recentSubmittals.map(s => `- #${s.number} (${s.project.name}): ${s.title} - Status: ${s.status}`).join('\n')}

**Recent Change Orders (${recentChangeOrders.length}):**
${recentChangeOrders.map(c => `- #${c.number} (${c.project.name}): ${c.title} - Cost Change: $${c.costChange?.toLocaleString() || '0'}, Status: ${c.status}`).join('\n')}

Provide helpful, accurate answers based on this data. If asked about something not in the data, say so clearly. Be concise and professional.`;

    const messages = [
      { role: 'system', content: systemContext },
      ...(context || []),
      { role: 'user', content: message }
    ];

    const { generateAIResponse } = await import('@/lib/ai-service');
    const result = await generateAIResponse({ messages: messages as any, stream: true });

    if (!result.success || !result.stream) {
      return NextResponse.json({ error: result.error || 'AI service unavailable' }, { status: 503 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('AI API Error:', error);
    }
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
