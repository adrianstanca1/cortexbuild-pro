/**
 * Project Tool - AI tool for accessing and analyzing construction projects
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProjectToolContext {
  projectId?: string;
  companyId?: string;
  status?: string;
  limit?: number;
}

export interface ProjectData {
  id: string;
  name: string;
  project_number: string;
  status: string;
  budget: number;
  actual_cost: number;
  progress: number;
  client_id: string;
  project_manager_id: string;
  start_date?: string;
  end_date?: string;
  client_name?: string;
  manager_name?: string;
}

/**
 * ProjectTool gives AI agents the ability to query and analyze construction projects
 */
export class ProjectTool implements ITool<ProjectToolContext> {
  id = 'platform-project-tool';
  name = 'Project Data Tool';
  description = 'Access and analyze construction project data including status, budgets, progress, and team members';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'project', 'construction', 'data'];

  async execute(context: ProjectToolContext): Promise<any> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients!left(name, email, phone),
          users!project_manager_id!left(name, email)
        `);

      if (context.projectId) {
        const { data, error } = await query.eq('id', context.projectId).single();
        if (error) throw error;
        return this.formatProject(data);
      }

      if (context.companyId) {
        query = query.eq('company_id', context.companyId);
      }

      if (context.status) {
        query = query.eq('status', context.status);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatProject);
    } catch (error) {
      console.error('ProjectTool error:', error);
      throw error;
    }
  }

  private formatProject(project: any): ProjectData {
    return {
      id: project.id,
      name: project.name,
      project_number: project.project_number || `PRJ-${project.id.slice(0, 8)}`,
      status: project.status,
      budget: project.budget || 0,
      actual_cost: project.actual_cost || 0,
      progress: project.progress || 0,
      client_id: project.client_id,
      project_manager_id: project.project_manager_id,
      start_date: project.start_date,
      end_date: project.end_date,
      client_name: project.clients?.name,
      manager_name: project.users?.name,
    };
  }
}

export const projectTool = new ProjectTool();
