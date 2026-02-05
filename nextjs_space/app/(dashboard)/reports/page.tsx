import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ReportsClient } from './_components/reports-client';
import { Project, Task, TeamMember, ActivityLog } from '@prisma/client';

export const dynamic = "force-dynamic";

type ProjectWithTasks = Project & {
  tasks: Task[];
  _count: { tasks: number; documents: number; teamMembers: number };
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) {
    redirect('/dashboard');
  }

  // Fetch analytics data
  const [projects, tasks, teamMembers, activities] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: user.organizationId },
      include: {
        tasks: true,
        _count: { select: { tasks: true, documents: true, teamMembers: true } }
      }
    }),
    prisma.task.findMany({
      where: { project: { organizationId: user.organizationId } },
      include: { project: { select: { name: true } } }
    }),
    prisma.teamMember.findMany({
      where: { organizationId: user.organizationId },
      include: { user: { select: { name: true, role: true } } }
    }),
    prisma.activityLog.findMany({
      where: { project: { organizationId: user.organizationId } },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  ]) as [ProjectWithTasks[], Task[], TeamMember[], ActivityLog[]];

  // Calculate statistics
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: ProjectWithTasks) => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter((p: ProjectWithTasks) => p.status === 'COMPLETED').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: Task) => t.status === 'COMPLETE').length,
    overdueTasks: tasks.filter((t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETE').length,
    teamSize: teamMembers.length,
    totalBudget: projects.reduce((sum: number, p: ProjectWithTasks) => sum + (p.budget || 0), 0),
  };

  // Task distribution by status
  const tasksByStatus = {
    TODO: tasks.filter((t: Task) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length,
    REVIEW: tasks.filter((t: Task) => t.status === 'REVIEW').length,
    COMPLETE: tasks.filter((t: Task) => t.status === 'COMPLETE').length,
  };

  // Project distribution by status
  const projectsByStatus = {
    PLANNING: projects.filter((p: ProjectWithTasks) => p.status === 'PLANNING').length,
    IN_PROGRESS: projects.filter((p: ProjectWithTasks) => p.status === 'IN_PROGRESS').length,
    ON_HOLD: projects.filter((p: ProjectWithTasks) => p.status === 'ON_HOLD').length,
    COMPLETED: projects.filter((p: ProjectWithTasks) => p.status === 'COMPLETED').length,
  };

  // Tasks by priority
  const tasksByPriority = {
    LOW: tasks.filter((t: Task) => t.priority === 'LOW').length,
    MEDIUM: tasks.filter((t: Task) => t.priority === 'MEDIUM').length,
    HIGH: tasks.filter((t: Task) => t.priority === 'HIGH').length,
    CRITICAL: tasks.filter((t: Task) => t.priority === 'CRITICAL').length,
  };

  // Activity over time (last 7 days)
  const today = new Date();
  const activityByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    return {
      date: dayStart.toISOString().split('T')[0],
      count: activities.filter((a: ActivityLog) => {
        const activityDate = new Date(a.createdAt);
        return activityDate >= dayStart && activityDate <= dayEnd;
      }).length
    };
  });

  // Project performance
  const projectPerformance = projects.map((p: ProjectWithTasks) => ({
    id: p.id,
    name: p.name,
    totalTasks: p._count.tasks,
    completedTasks: p.tasks.filter((t: Task) => t.status === 'COMPLETE').length,
    progress: p._count.tasks > 0 
      ? Math.round((p.tasks.filter((t: Task) => t.status === 'COMPLETE').length / p._count.tasks) * 100) 
      : 0,
    budget: p.budget || 0,
    status: p.status
  }));

  return (
    <ReportsClient
      stats={stats}
      tasksByStatus={tasksByStatus}
      projectsByStatus={projectsByStatus}
      tasksByPriority={tasksByPriority}
      activityByDay={activityByDay}
      projectPerformance={projectPerformance}
    />
  );
}
