import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { AnalyticsClient } from './_components/analytics-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Advanced Analytics | CortexBuild Pro',
    description: 'Deep insights into project performance and resource allocation.',
};

async function getAnalyticsData(organizationId: string) {
    // Fetch project distributions by status
    const projectStats = await prisma.project.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true },
    });

    // Fetch task completion rates (productivity index)
    const taskStats = await prisma.task.aggregate({
        where: { project: { organizationId } },
        _count: { id: true },
    });

    const completedTasks = await prisma.task.count({
        where: {
            project: { organizationId },
            status: 'COMPLETE'
        }
    });

    // Fetch resource allocation (team usage across projects)
    const teamAllocation = await prisma.projectTeamMember.findMany({
        where: { project: { organizationId } },
        include: {
            project: { select: { name: true } },
            teamMember: { include: { user: { select: { name: true } } } }
        }
    });

    // Fetch financial trends (Change orders as proxy for budget volatility)
    const changeOrders = await prisma.changeOrder.findMany({
        where: { project: { organizationId } },
        select: {
            costChange: true,
            createdAt: true,
            status: true,
            project: { select: { name: true } }
        }
    });

    return {
        projects: projectStats.map(s => ({ status: s.status, count: s._count.id })),
        productivity: {
            total: taskStats._count.id,
            completed: completedTasks,
            rate: taskStats._count.id > 0 ? (completedTasks / taskStats._count.id) * 100 : 0
        },
        allocation: teamAllocation.map(a => ({
            projectName: a.project.name,
            userName: a.teamMember.user.name
        })),
        finances: changeOrders.map(c => ({
            amount: c.costChange,
            date: c.createdAt.toISOString().split('T')[0],
            project: c.project.name
        }))
    };
}

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true, role: true },
    });

    if (!user?.organizationId || (user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_OWNER')) {
        redirect('/dashboard');
    }

    const data = await getAnalyticsData(user.organizationId);

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Advanced Analytics</h1>
                <p className="text-gray-500 mt-1">AI-driven insights for project management and resource optimization.</p>
            </div>

            <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading insights...</div>}>
                <AnalyticsClient initialData={data} />
            </Suspense>
        </div>
    );
}
