/**
 * Platform Data Tool - Comprehensive AI tool for accessing the full CortexBuild platform
 * Provides unified access to all platform entities with relationship traversal
 */

import { createClient } from '@supabase/supabase-js';
import type { ITool } from '../../system/interfaces';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PlatformDataToolContext {
  entity: 'project' | 'projects' | 'task' | 'tasks' | 'client' | 'clients' | 
          'rfi' | 'rfis' | 'invoice' | 'invoices' | 'document' | 'documents' |
          'change_order' | 'change_orders' | 'milestone' | 'milestones' |
          'vendor' | 'vendors' | 'summary';
  id?: string;
  projectId?: string;
  companyId?: string;
  status?: string;
  limit?: number;
  includeRelations?: boolean;
}

/**
 * PlatformDataTool provides a unified interface to all CortexBuild platform data
 * with automatic relationship traversal and data synthesis
 */
export class PlatformDataTool implements ITool<PlatformDataToolContext> {
  id = 'platform-data-tool';
  name = 'Platform Data Tool';
  description = 'Comprehensive access to all CortexBuild platform data including projects, tasks, clients, RFIs, invoices, documents, change orders, milestones, and vendors with relationship traversal';
  version = '1.0.0';
  isEnabled = true;
  tags = ['platform', 'data', 'construction', 'unified', 'comprehensive'];

  async execute(context: PlatformDataToolContext): Promise<any> {
    try {
      const { entity, id, projectId, companyId, status, limit = 50, includeRelations = false } = context;

      switch (entity) {
        case 'project':
          return this.getProject(id!);
        case 'projects':
          return this.getProjects({ companyId, status, limit });
        case 'task':
          return this.getTask(id!);
        case 'tasks':
          return this.getTasks({ projectId, status, limit });
        case 'client':
          return this.getClient(id!);
        case 'clients':
          return this.getClients({ companyId, limit });
        case 'rfi':
          return this.getRFI(id!);
        case 'rfis':
          return this.getRFIs({ projectId, status, limit });
        case 'invoice':
          return this.getInvoice(id!);
        case 'invoices':
          return this.getInvoices({ projectId, status, limit });
        case 'document':
          return this.getDocument(id!);
        case 'documents':
          return this.getDocuments({ projectId, limit });
        case 'change_order':
          return this.getChangeOrder(id!);
        case 'change_orders':
          return this.getChangeOrders({ projectId, status, limit });
        case 'milestone':
          return this.getMilestone(id!);
        case 'milestones':
          return this.getMilestones({ projectId, status, limit });
        case 'vendor':
          return this.getVendor(id!);
        case 'vendors':
          return this.getVendors({ companyId, limit });
        case 'summary':
          return this.getCompanySummary(companyId!);
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }
    } catch (error) {
      console.error('PlatformDataTool error:', error);
      throw error;
    }
  }

  private async getProject(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients!left(name, email, phone),
        users!project_manager_id!left(name, email)
      `)
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    return this.summarizeProject(data);
  }

  private async getProjects(filters: { companyId?: string; status?: string; limit: number }) {
    let query = supabase.from('projects').select('*');
    if (filters.companyId) query = query.eq('company_id', filters.companyId);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeProject);
  }

  private async getTask(taskId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users!assigned_to!left(name, email),
        projects!left(name, status)
      `)
      .eq('id', taskId)
      .single();
    
    if (error) throw error;
    return this.summarizeTask(data);
  }

  private async getTasks(filters: { projectId?: string; status?: string; limit: number }) {
    let query = supabase.from('tasks').select('*');
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeTask);
  }

  private async getClient(clientId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) throw error;
    return this.summarizeClient(data);
  }

  private async getClients(filters: { companyId?: string; limit: number }) {
    let query = supabase.from('clients').select('*');
    if (filters.companyId) query = query.eq('company_id', filters.companyId);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeClient);
  }

  private async getRFI(rfiId: string) {
    const { data, error } = await supabase
      .from('rfis')
      .select(`
        *,
        users!created_by!left(name, email),
        users!assigned_to!left(name, email)
      `)
      .eq('id', rfiId)
      .single();
    
    if (error) throw error;
    return this.summarizeRFI(data);
  }

  private async getRFIs(filters: { projectId?: string; status?: string; limit: number }) {
    let query = supabase.from('rfis').select('*');
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeRFI);
  }

  private async getInvoice(invoiceId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        projects!left(name),
        clients!left(name)
      `)
      .eq('id', invoiceId)
      .single();
    
    if (error) throw error;
    return this.summarizeInvoice(data);
  }

  private async getInvoices(filters: { projectId?: string; status?: string; limit: number }) {
    let query = supabase.from('invoices').select('*');
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeInvoice);
  }

  private async getDocument(documentId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    return this.summarizeDocument(data);
  }

  private async getDocuments(filters: { projectId?: string; limit: number }) {
    let query = supabase.from('documents').select('*');
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeDocument);
  }

  private async getChangeOrder(coId: string) {
    const { data, error } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', coId)
      .single();
    
    if (error) throw error;
    return this.summarizeChangeOrder(data);
  }

  private async getChangeOrders(filters: { projectId?: string; status?: string; limit: number }) {
    let query = supabase.from('change_orders').select('*');
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeChangeOrder);
  }

  private async getMilestone(milestoneId: string) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();
    
    if (error) throw error;
    return this.summarizeMilestone(data);
  }

  private async getMilestones(filters: { projectId?: string; status?: string; limit: number }) {
    let query = supabase.from('milestones').select('*');
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeMilestone);
  }

  private async getVendor(vendorId: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();
    
    if (error) throw error;
    return this.summarizeVendor(data);
  }

  private async getVendors(filters: { companyId?: string; limit: number }) {
    let query = supabase.from('vendors').select('*');
    if (filters.companyId) query = query.eq('company_id', filters.companyId);
    
    const { data, error } = await query.range(0, filters.limit - 1);
    if (error) throw error;
    return (data || []).map(this.summarizeVendor);
  }

  private async getCompanySummary(companyId: string) {
    const [projects, clients, vendors] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact' }).eq('company_id', companyId),
      supabase.from('clients').select('*', { count: 'exact' }).eq('company_id', companyId),
      supabase.from('vendors').select('*', { count: 'exact' }).eq('company_id', companyId),
    ]);

    const activeProjects = projects.data?.filter(p => p.status === 'active') || [];
    const totalBudget = activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = activeProjects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);

    return {
      companyId,
      totalProjects: projects.count || 0,
      activeProjects: activeProjects.length,
      totalClients: clients.count || 0,
      totalVendors: vendors.count || 0,
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      budgetUtilization: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) + '%' : '0%',
    };
  }

  private summarizeProject(p: any) {
    return {
      id: p.id,
      name: p.name,
      number: p.project_number || `PRJ-${p.id?.slice(0, 8)}`,
      status: p.status,
      budget: p.budget || 0,
      spent: p.actual_cost || 0,
      progress: p.progress || 0,
      client: p.clients?.name,
      manager: p.users?.name,
      startDate: p.start_date,
      endDate: p.end_date,
    };
  }

  private summarizeTask(t: any) {
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority || 'medium',
      estimatedHours: t.estimated_hours || 0,
      actualHours: t.actual_hours || 0,
      completion: t.completion_percentage || 0,
      assignee: t.users?.name,
      project: t.projects?.name,
      dueDate: t.due_date,
    };
  }

  private summarizeClient(c: any) {
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      paymentTerms: c.payment_terms || 'net-30',
      rating: c.rating || 0,
      totalValue: c.total_value || 0,
    };
  }

  private summarizeRFI(r: any) {
    return {
      id: r.id,
      number: r.rfi_number || `RFI-${r.id?.slice(0, 8)}`,
      title: r.title,
      status: r.status || 'open',
      priority: r.priority || 'normal',
      costImpact: r.cost_impact || 0,
      scheduleImpact: r.schedule_impact_days || 0,
      createdBy: r.users?.name,
      assignedTo: r.assigned_to,
      dueDate: r.due_date,
    };
  }

  private summarizeInvoice(i: any) {
    return {
      id: i.id,
      number: i.invoice_number || `INV-${i.id?.slice(0, 8)}`,
      amount: i.amount || 0,
      tax: i.tax_amount || 0,
      total: i.total_amount || i.amount || 0,
      status: i.status || 'draft',
      issueDate: i.issue_date,
      dueDate: i.due_date,
      paidDate: i.paid_date,
      project: i.projects?.name,
      client: i.clients?.name,
    };
  }

  private summarizeDocument(d: any) {
    return {
      id: d.id,
      name: d.name,
      type: d.file_type || 'unknown',
      size: d.file_size || 0,
      category: d.category || 'general',
      accessLevel: d.access_level || 'private',
      status: d.status || 'active',
      version: d.version || 1,
      uploadedAt: d.uploaded_at,
    };
  }

  private summarizeChangeOrder(co: any) {
    return {
      id: co.id,
      number: co.change_order_number || `CO-${co.id?.slice(0, 8)}`,
      title: co.title,
      description: co.description,
      costChange: co.cost_change || 0,
      scheduleChange: co.schedule_change_days || 0,
      status: co.status || 'pending',
      priority: co.priority || 'normal',
      createdAt: co.created_at,
      approvedAt: co.approved_at,
    };
  }

  private summarizeMilestone(m: any) {
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      dueDate: m.due_date,
      status: m.status || 'pending',
      completion: m.completion_percentage || 0,
      completedAt: m.completed_at,
    };
  }

  private summarizeVendor(v: any) {
    return {
      id: v.id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      trade: v.trade,
      license: v.license_number,
      rating: v.rating || 0,
      isActive: v.is_active !== false,
    };
  }
}

export const platformDataTool = new PlatformDataTool();
