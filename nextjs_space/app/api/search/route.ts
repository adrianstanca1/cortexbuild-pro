export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ results: [] });
    }

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, status: true },
      take: 5
    });

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        project: { organizationId: user.organizationId },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { id: true, title: true, status: true, project: { select: { name: true } } },
      take: 5
    });

    // Search team members
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: user.organizationId,
        user: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        }
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 5
    });

    // Combine and format results
    const results = [
      ...projects.map(p => ({ type: 'project', id: p.id, name: p.name, status: p.status })),
      ...tasks.map(t => ({ type: 'task', id: t.id, title: t.title, name: t.title, status: t.status, projectName: t.project.name })),
      ...teamMembers.map(tm => ({ type: 'team', id: tm.user.id, name: tm.user.name, email: tm.user.email }))
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
