/**
 * Invoice Tool - AI tool for accessing and managing construction invoices
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface InvoiceToolContext {
  invoiceId?: string;
  projectId?: string;
  clientId?: string;
  status?: string;
  limit?: number;
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  project_id: string;
  client_id: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
}

/**
 * InvoiceTool gives AI agents the ability to query and manage construction invoices
 */
export class InvoiceTool implements ITool<InvoiceToolContext> {
  id = 'platform-invoice-tool';
  name = 'Invoice Data Tool';
  description = 'Access and manage construction project invoices including amounts, payment status, and due dates';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'invoice', 'construction', 'financial', 'billing', 'data'];

  async execute(context: InvoiceToolContext): Promise<any> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          projects!left(name),
          clients!left(name)
        `);

      if (context.invoiceId) {
        const { data, error } = await query.eq('id', context.invoiceId).single();
        if (error) throw error;
        return this.formatInvoice(data);
      }

      if (context.projectId) {
        query = query.eq('project_id', context.projectId);
      }

      if (context.clientId) {
        query = query.eq('client_id', context.clientId);
      }

      if (context.status) {
        query = query.eq('status', context.status);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatInvoice);
    } catch (error) {
      console.error('InvoiceTool error:', error);
      throw error;
    }
  }

  private formatInvoice(invoice: any): InvoiceData {
    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`,
      project_id: invoice.project_id,
      client_id: invoice.client_id,
      amount: invoice.amount || 0,
      tax_amount: invoice.tax_amount || 0,
      total_amount: invoice.total_amount || invoice.amount || 0,
      status: invoice.status || 'draft',
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      paid_date: invoice.paid_date,
      notes: invoice.notes,
    };
  }
}

export const invoiceTool = new InvoiceTool();
