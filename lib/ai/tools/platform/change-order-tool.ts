/**
 * ChangeOrder Tool - AI tool for accessing and managing construction change orders
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChangeOrderToolContext {
  changeOrderId?: string;
  projectId?: string;
  status?: string;
  limit?: number;
}

export interface ChangeOrderData {
  id: string;
  change_order_number: string;
  title: string;
  description: string;
  cost_change: number;
  schedule_change_days: number;
  status: string;
  priority: string;
  project_id: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  approved_at?: string;
}

/**
 * ChangeOrderTool gives AI agents the ability to query and manage construction change orders
 */
export class ChangeOrderTool implements ITool<ChangeOrderToolContext> {
  id = 'platform-change-order-tool';
  name = 'Change Order Data Tool';
  description = 'Access and manage construction project change orders including cost impacts, schedule impacts, and approval status';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'change-order', 'construction', 'contract', 'data'];

  async execute(context: ChangeOrderToolContext): Promise<any> {
    try {
      let query = supabase
        .from('change_orders')
        .select(`
          *,
          users!created_by!left(name, email)
        `);

      if (context.changeOrderId) {
        const { data, error } = await query.eq('id', context.changeOrderId).single();
        if (error) throw error;
        return this.formatChangeOrder(data);
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
      return (data || []).map(this.formatChangeOrder);
    } catch (error) {
      console.error('ChangeOrderTool error:', error);
      throw error;
    }
  }

  private formatChangeOrder(co: any): ChangeOrderData {
    return {
      id: co.id,
      change_order_number: co.change_order_number || `CO-${co.id.slice(0, 8)}`,
      title: co.title,
      description: co.description || '',
      cost_change: co.cost_change || 0,
      schedule_change_days: co.schedule_change_days || 0,
      status: co.status || 'pending',
      priority: co.priority || 'normal',
      project_id: co.project_id,
      created_by: co.created_by,
      approved_by: co.approved_by,
      created_at: co.created_at,
      approved_at: co.approved_at,
    };
  }
}

export const changeOrderTool = new ChangeOrderTool();
