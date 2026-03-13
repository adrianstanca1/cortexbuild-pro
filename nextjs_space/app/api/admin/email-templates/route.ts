import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.documentTemplate.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.documentTemplate.count({ where }),
    ]);
    // Map DocumentTemplate to EmailTemplate interface
    const mapped = templates.map((t: any) => {
      const contentObj = (t.content && typeof t.content === 'object') ? t.content : {};
      return {
        id: t.id,
        name: t.name,
        subject: contentObj.subject || t.description || t.name,
        body: contentObj.body || contentObj.content || t.description || '',
        category: (['notification','alert','report','marketing','transactional'].includes(t.category?.toLowerCase())
          ? t.category.toLowerCase()
          : 'notification') as string,
        variables: Array.isArray(contentObj.variables) ? contentObj.variables : [],
        isActive: t.isActive ?? true,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        usageCount: t.usageCount || 0,
      };
    });
    return NextResponse.json({ templates: mapped, total, page, limit });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { organizationId, name, description, category, content } = body;
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const template = await prisma.documentTemplate.create({
      data: {
        organizationId: organizationId || null,
        name,
        description: description || null,
        category: category || 'EMAIL',
        content: content || {},
        isActive: true,
        createdById: session.user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}