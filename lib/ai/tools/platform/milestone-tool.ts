/**
 * Milestone Tool - AI tool for accessing and managing construction milestones
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MilestoneToolContext {
  milestoneId?: string;
  projectId?: string;
  status?: string;
  limit?: number;
}

export interface MilestoneData {
  id: string;
  name: string;
  description: string;
  due_date: string;
  status: string;
  completion_percentage: number;
  project_id: string;
  created_by: string;
  completed_at?: string;
  created_at: string;
}

/**
 * MilestoneTool gives AI agents the ability to query and manage construction milestones
 */
export class MilestoneTool implements ITool<MilestoneToolContext> {
  id = 'platform-milestone-tool';
  name = 'Milestone Data Tool';
  description = 'Access and manage construction project milestones including due dates, completion status, and progress tracking';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'milestone', 'construction', 'scheduling', 'data'];

  async execute(context: MilestoneToolContext): Promise<any> {
    try {
      let query = supabase.from('milestones').select('*');

      if (context.milestoneId) {
        const { data, error } = await query.eq('id', context.milestoneId).single();
        if (error) throw error;
        return this.formatMilestone(data);
      }

      if (context.projectId) {
        query = query.eq('project_id', context.projectId);
      }

      if (context.status) {
        query = query.eq('status', context.status);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatMilestone);
    } catch (error) {
      console.error('MilestoneTool error:', error);
      throw error;
    }
  }

  private formatMilestone(milestone: any): MilestoneData {
    return {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description || '',
      due_date: milestone.due_date,
      status: milestone.status || 'pending',
      completion_percentage: milestone.completion_percentage || 0,
      project_id: milestone.project_id,
      created_by: milestone.created_by,
      completed_at: milestone.completed_at,
      created_at: milestone.created_at,
    };
  }
}

export const milestoneTool = new MilestoneTool();
