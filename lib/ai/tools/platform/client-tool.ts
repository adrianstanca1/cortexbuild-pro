/**
 * Client Tool - AI tool for accessing and managing construction clients
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ClientToolContext {
  clientId?: string;
  companyId?: string;
  limit?: number;
}

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_id: string;
  payment_terms: string;
  rating: number;
  total_value: number;
  notes?: string;
  created_at: string;
}

/**
 * ClientTool gives AI agents the ability to query and manage construction clients
 */
export class ClientTool implements ITool<ClientToolContext> {
  id = 'platform-client-tool';
  name = 'Client Data Tool';
  description = 'Access and manage construction project clients including contact info, payment terms, and project history';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'client', 'construction', 'crm', 'data'];

  async execute(context: ClientToolContext): Promise<any> {
    try {
      let query = supabase.from('clients').select('*');

      if (context.clientId) {
        const { data, error } = await query.eq('id', context.clientId).single();
        if (error) throw error;
        return this.formatClient(data);
      }

      if (context.companyId) {
        query = query.eq('company_id', context.companyId);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatClient);
    } catch (error) {
      console.error('ClientTool error:', error);
      throw error;
    }
  }

  private formatClient(client: any): ClientData {
    return {
      id: client.id,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company_id: client.company_id,
      payment_terms: client.payment_terms || 'net-30',
      rating: client.rating || 0,
      total_value: client.total_value || 0,
      notes: client.notes,
      created_at: client.created_at,
    };
  }
}

export const clientTool = new ClientTool();
