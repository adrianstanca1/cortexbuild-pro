import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const webhook = await prisma.webhook.findUnique({ where: { id: id } });
    if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const testPayload = { event: 'test', timestamp: new Date().toISOString(), data: { message: 'Test webhook delivery from CortexBuildPro' } };
    const startTime = Date.now();
    let statusCode = 0;
    let success = false;
    let responseBody = '';

    try {
      const hdrs: Record<string, string> = { 'Content-Type': 'application/json', 'X-CortexBuild-Event': 'test' };
      if (webhook.secret) hdrs['X-CortexBuild-Signature'] = webhook.secret;
      const res = await fetch(webhook.url, { method: 'POST', headers: hdrs, body: JSON.stringify(testPayload), signal: AbortSignal.timeout(10000) });
      statusCode = res.status;
      success = res.ok;
      responseBody = await res.text().catch(() => '');
    } catch (fetchErr) {
      responseBody = fetchErr instanceof Error ? fetchErr.message : 'Connection failed';
    }

    const duration = Date.now() - startTime;
    const delivery = await prisma.webhookDelivery.create({
      data: { webhookId: id, event: 'test', payload: testPayload, statusCode, success, duration, responseBody: responseBody || null, errorMessage: success ? null : responseBody },
    });
    await prisma.webhook.update({ where: { id: id }, data: { lastTriggeredAt: new Date(), consecutiveFailures: success ? 0 : { increment: 1 } } });
    return NextResponse.json({ delivery, success, statusCode, duration });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}