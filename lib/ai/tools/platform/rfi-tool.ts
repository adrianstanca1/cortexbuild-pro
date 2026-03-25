/**
 * RFI Tool - AI tool for accessing and managing Requests for Information
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RFIToolContext {
  rfiId?: string;
  projectId?: string;
  status?: string;
  limit?: number;
}

export interface RFIData {
  id: string;
  rfi_number: string;
  title: string;
  question: string;
  answer?: string;
  status: string;
  priority: string;
  cost_impact: number;
  schedule_impact_days: number;
  project_id: string;
  created_by: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * RFITool gives AI agents the ability to query and manage construction RFIs
 */
export class RFITool implements ITool<RFIToolContext> {
  id = 'platform-rfi-tool';
  name = 'RFI Data Tool';
  description = 'Access and manage construction Requests for Information including questions, answers, cost impacts, and schedule impacts';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'rfi', 'construction', 'communication', 'data'];

  async execute(context: RFIToolContext): Promise<any> {
    try {
      let query = supabase
        .from('rfis')
        .select(`
          *,
          users!created_by!left(name, email),
          users!assigned_to!left(name, email)
        `);

      if (context.rfiId) {
        const { data, error } = await query.eq('id', context.rfiId).single();
        if (error) throw error;
        return this.formatRFI(data);
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
      return (data || []).map(this.formatRFI);
    } catch (error) {
      console.error('RFITool error:', error);
      throw error;
    }
  }

  private formatRFI(rfi: any): RFIData {
    return {
      id: rfi.id,
      rfi_number: rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`,
      title: rfi.title,
      question: rfi.question,
      answer: rfi.answer,
      status: rfi.status || 'open',
      priority: rfi.priority || 'normal',
      cost_impact: rfi.cost_impact || 0,
      schedule_impact_days: rfi.schedule_impact_days || 0,
      project_id: rfi.project_id,
      created_by: rfi.created_by,
      assigned_to: rfi.assigned_to,
      due_date: rfi.due_date,
      created_at: rfi.created_at,
      completed_at: rfi.completed_at,
    };
  }
}

export const rfiTool = new RFITool();
