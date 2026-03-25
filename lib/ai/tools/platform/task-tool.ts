/**
 * Task Tool - AI tool for accessing and managing construction tasks
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TaskToolContext {
  taskId?: string;
  projectId?: string;
  assignedTo?: string;
  status?: string;
  limit?: number;
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimated_hours: number;
  actual_hours: number;
  project_id: string;
  assigned_to: string;
  assignee_name?: string;
  start_date?: string;
  due_date?: string;
  completion_percentage: number;
}

/**
 * TaskTool gives AI agents the ability to query and manage construction tasks
 */
export class TaskTool implements ITool<TaskToolContext> {
  id = 'platform-task-tool';
  name = 'Task Data Tool';
  description = 'Access and manage construction project tasks including status, assignments, hours, and priorities';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'task', 'construction', 'data', 'project'];

  async execute(context: TaskToolContext): Promise<any> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          users!assigned_to!left(name, email)
        `);

      if (context.taskId) {
        const { data, error } = await query.eq('id', context.taskId).single();
        if (error) throw error;
        return this.formatTask(data);
      }

      if (context.projectId) {
        query = query.eq('project_id', context.projectId);
      }

      if (context.assignedTo) {
        query = query.eq('assigned_to', context.assignedTo);
      }

      if (context.status) {
        query = query.eq('status', context.status);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatTask);
    } catch (error) {
      console.error('TaskTool error:', error);
      throw error;
    }
  }

  private formatTask(task: any): TaskData {
    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'medium',
      estimated_hours: task.estimated_hours || 0,
      actual_hours: task.actual_hours || 0,
      project_id: task.project_id,
      assigned_to: task.assigned_to,
      assignee_name: task.users?.name,
      start_date: task.start_date,
      due_date: task.due_date,
      completion_percentage: task.completion_percentage || 0,
    };
  }
}

export const taskTool = new TaskTool();
