/**
 * Vendor Tool - AI tool for accessing and managing construction vendors/subcontractors
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface VendorToolContext {
  vendorId?: string;
  companyId?: string;
  trade?: string;
  limit?: number;
}

export interface VendorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  trade: string;
  license_number: string;
  rating: number;
  company_id: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * VendorTool gives AI agents the ability to query and manage construction vendors and subcontractors
 */
export class VendorTool implements ITool<VendorToolContext> {
  id = 'platform-vendor-tool';
  name = 'Vendor Data Tool';
  description = 'Access and manage construction vendors and subcontractors including trade specialties, licenses, and ratings';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'vendor', 'subcontractor', 'construction', 'data'];

  async execute(context: VendorToolContext): Promise<any> {
    try {
      let query = supabase.from('vendors').select('*');

      if (context.vendorId) {
        const { data, error } = await query.eq('id', context.vendorId).single();
        if (error) throw error;
        return this.formatVendor(data);
      }

      if (context.companyId) {
        query = query.eq('company_id', context.companyId);
      }

      if (context.trade) {
        query = query.eq('trade', context.trade);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatVendor);
    } catch (error) {
      console.error('VendorTool error:', error);
      throw error;
    }
  }

  private formatVendor(vendor: any): VendorData {
    return {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      trade: vendor.trade || 'general',
      license_number: vendor.license_number || '',
      rating: vendor.rating || 0,
      company_id: vendor.company_id,
      notes: vendor.notes,
      is_active: vendor.is_active !== false,
      created_at: vendor.created_at,
    };
  }
}

export const vendorTool = new VendorTool();
