import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



// Batch operation schemas
const BatchTaskSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  tasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    projectId: z.string().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
  })),
});

const BatchStatusUpdateSchema = z.object({
  entityType: z.enum(['tasks', 'rfis', 'submittals', 'punchLists', 'inspections']),
  ids: z.array(z.string()),
  status: z.string(),
});

const BatchAssignSchema = z.object({
  entityType: z.enum(['tasks', 'punchLists']),
  ids: z.array(z.string()),
  assigneeId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string; name?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'batch_tasks': {
        const result = BatchTaskSchema.safeParse(body.data);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }

        const { operation, tasks } = result.data;
        let processed = 0;
        const results: unknown[] = [];
        const validationErrors: { index: number; task: any; error: string }[] = [];

        if (operation === 'create') {
          // Validate tasks and track which ones are invalid
          const validTasks: Array<typeof tasks[number] & { index: number }> = [];
          
          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            
            if (!task.title || !task.projectId) {
              validationErrors.push({
                index: i,
                task: { title: task.title, projectId: task.projectId },
                error: 'Missing required fields: title and projectId are required'
              });
              continue;
            }
            
            // Validate date format if provided
            if (task.dueDate) {
              const parsedDate = new Date(task.dueDate);
              if (isNaN(parsedDate.getTime())) {
                validationErrors.push({
                  index: i,
                  task: { title: task.title, dueDate: task.dueDate },
                  error: 'Invalid dueDate format'
                });
                continue;
              }
            }
            
            validTasks.push({ ...task, index: i });
          }
          
          if (validTasks.length > 0) {
            // Verify all projectIds belong to user's organization
            const projectIds = [...new Set(validTasks.map(t => t.projectId).filter((id): id is string => id !== undefined))];
            const authorizedProjects = await prisma.project.findMany({
              where: {
                id: { in: projectIds },
                organizationId: user.organizationId
              },
              select: { id: true }
            });
            
            const authorizedProjectIds = new Set(authorizedProjects.map(p => p.id));
            
            // Separate authorized and unauthorized tasks
            const authorizedTasks: Array<typeof validTasks[number]> = [];
            for (const task of validTasks) {
              if (!authorizedProjectIds.has(task.projectId!)) {
                validationErrors.push({
                  index: task.index,
                  task: { title: task.title, projectId: task.projectId },
                  error: 'Unauthorized: project does not belong to your organization'
                });
              } else {
                authorizedTasks.push(task);
              }
            }
            
            if (authorizedTasks.length > 0) {
              // Use createMany for batch insert (much faster than individual creates)
              const tasksData = authorizedTasks.map(task => ({
                title: task.title!,
                description: task.description || '',
                status: task.status || 'TODO',
                priority: task.priority || 'MEDIUM',
                projectId: task.projectId!,
                assigneeId: task.assigneeId || null,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                creatorId: user.id,
              }));

              const createResult = await prisma.task.createMany({
                data: tasksData,
                skipDuplicates: true,
              });
              processed = createResult.count;

              // Note: For performance, batch create (createMany) returns count only, 
              // not individual task objects. This is documented in the API response schema.
              // Clients should handle the response format: { success: true, created: N, message: "..." }
              results.push({ 
                success: true, 
                created: processed,
                message: `Successfully created ${processed} tasks`,
                ...(validationErrors.length > 0 && { 
                  skipped: validationErrors.length,
                  errors: validationErrors 
                })
              });
            } else {
              results.push({
                success: false,
                created: 0,
                message: 'No valid tasks to create',
                errors: validationErrors
              });
            }
          } else {
            results.push({
              success: false,
              created: 0,
              message: 'No valid tasks to create',
              errors: validationErrors
            });
          }

          broadcastToOrganization(user.organizationId, {
            type: 'task_created',
            payload: { count: processed, message: `${processed} tasks created` },
          });
        } else if (operation === 'update') {
          // Update operations need individual handling due to different fields per task
          for (const task of tasks) {
            if (task.id) {
              const updated = await prisma.task.update({
                where: { id: task.id },
                data: {
                  ...(task.title && { title: task.title }),
                  ...(task.description && { description: task.description }),
                  ...(task.status && { status: task.status }),
                  ...(task.priority && { priority: task.priority }),
                  ...(task.assigneeId && { assigneeId: task.assigneeId }),
                  ...(task.dueDate && { dueDate: new Date(task.dueDate) }),
                },
              });
              results.push(updated);
              processed++;
            }
          }
          broadcastToOrganization(user.organizationId, {
            type: 'task_updated',
            payload: { count: processed, message: `${processed} tasks updated` },
          });
        } else if (operation === 'delete') {
          const ids = tasks.filter(t => t.id).map(t => t.id as string);
          await prisma.task.deleteMany({ where: { id: { in: ids } } });
          processed = ids.length;
          broadcastToOrganization(user.organizationId, {
            type: 'task_deleted',
            payload: { count: processed, message: `${processed} tasks deleted` },
          });
        }

        return NextResponse.json({ success: true, processed, results });
      }

      case 'batch_status': {
        const result = BatchStatusUpdateSchema.safeParse(body.data);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }

        const { entityType, ids, status } = result.data;
        let updated = 0;

        switch (entityType) {
          case 'tasks': {
            const taskResult = await prisma.task.updateMany({
              where: { id: { in: ids } },
              data: { status: status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE' },
            });
            updated = taskResult.count;
            broadcastToOrganization(user.organizationId, {
              type: 'task_updated',
              payload: { count: updated, status, message: `${updated} tasks updated to ${status}` },
            });
            break;
          }
          case 'rfis': {
            const rfiResult = await prisma.rFI.updateMany({
              where: { id: { in: ids } },
              data: { status: status as 'DRAFT' | 'OPEN' | 'ANSWERED' | 'CLOSED' },
            });
            updated = rfiResult.count;
            broadcastToOrganization(user.organizationId, {
              type: 'rfi_updated',
              payload: { count: updated, status },
            });
            break;
          }
          case 'submittals': {
            const submittalResult = await prisma.submittal.updateMany({
              where: { id: { in: ids } },
              data: { status: status as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISE_RESUBMIT' },
            });
            updated = submittalResult.count;
            broadcastToOrganization(user.organizationId, {
              type: 'submittal_updated',
              payload: { count: updated, status },
            });
            break;
          }
          case 'punchLists': {
            const punchResult = await prisma.punchList.updateMany({
              where: { id: { in: ids } },
              data: { status: status as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' },
            });
            updated = punchResult.count;
            broadcastToOrganization(user.organizationId, {
              type: 'punch_list_updated',
              payload: { count: updated, status },
            });
            break;
          }
          case 'inspections': {
            const inspResult = await prisma.inspection.updateMany({
              where: { id: { in: ids } },
              data: { status: status as 'SCHEDULED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'REQUIRES_REINSPECTION' },
            });
            updated = inspResult.count;
            broadcastToOrganization(user.organizationId, {
              type: 'inspection_updated',
              payload: { count: updated, status },
            });
            break;
          }
        }

        return NextResponse.json({ success: true, updated });
      }

      case 'batch_assign': {
        const result = BatchAssignSchema.safeParse(body.data);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }

        const { entityType, ids, assigneeId } = result.data;
        let updated = 0;

        if (entityType === 'tasks') {
          const taskResult = await prisma.task.updateMany({
            where: { id: { in: ids } },
            data: { assigneeId },
          });
          updated = taskResult.count;
          broadcastToOrganization(user.organizationId, {
            type: 'task_updated',
            payload: { count: updated, message: `${updated} tasks reassigned` },
          });
        } else if (entityType === 'punchLists') {
          const punchResult = await prisma.punchList.updateMany({
            where: { id: { in: ids } },
            data: { assignedToId: assigneeId },
          });
          updated = punchResult.count;
          broadcastToOrganization(user.organizationId, {
            type: 'punch_list_updated',
            payload: { count: updated, message: `${updated} punch list items reassigned` },
          });
        }

        return NextResponse.json({ success: true, updated });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
