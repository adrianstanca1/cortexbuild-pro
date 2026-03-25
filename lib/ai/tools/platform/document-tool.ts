/**
 * Document Tool - AI tool for accessing and managing construction documents
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DocumentToolContext {
  documentId?: string;
  projectId?: string;
  category?: string;
  accessLevel?: string;
  limit?: number;
}

export interface DocumentData {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  access_level: string;
  status: string;
  project_id: string;
  uploaded_by: string;
  uploaded_at: string;
  version: number;
}

/**
 * DocumentTool gives AI agents the ability to query and manage construction documents
 */
export class DocumentTool implements ITool<DocumentToolContext> {
  id = 'platform-document-tool';
  name = 'Document Data Tool';
  description = 'Access and manage construction project documents including drawings, photos, contracts, and permits';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'document', 'construction', 'file', 'data'];

  async execute(context: DocumentToolContext): Promise<any> {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          users!uploaded_by!left(name, email)
        `);

      if (context.documentId) {
        const { data, error } = await query.eq('id', context.documentId).single();
        if (error) throw error;
        return this.formatDocument(data);
      }

      if (context.projectId) {
        query = query.eq('project_id', context.projectId);
      }

      if (context.category) {
        query = query.eq('category', context.category);
      }

      if (context.accessLevel) {
        query = query.eq('access_level', context.accessLevel);
      }

      const limit = context.limit || 50;
      const { data, error } = await query.range(0, limit - 1);

      if (error) throw error;
      return (data || []).map(this.formatDocument);
    } catch (error) {
      console.error('DocumentTool error:', error);
      throw error;
    }
  }

  private formatDocument(doc: any): DocumentData {
    return {
      id: doc.id,
      name: doc.name,
      file_path: doc.file_path,
      file_type: doc.file_type || 'unknown',
      file_size: doc.file_size || 0,
      category: doc.category || 'general',
      access_level: doc.access_level || 'private',
      status: doc.status || 'active',
      project_id: doc.project_id,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      version: doc.version || 1,
    };
  }
}

export const documentTool = new DocumentTool();
