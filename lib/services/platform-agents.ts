/**
 * Platform-Aware AI Agents
 * Enhances the base AI agents with platform data access
 */

import { createClient } from '@supabase/supabase-js';
import { aiAgentRegistry, AgentExecutionOptions, AgentExecutionResult } from './aiAgents';
import { safetyDomainPlugin } from '../ai/plugins/platform/safety-domain.plugin';
import { financialDomainPlugin } from '../ai/plugins/platform/financial-domain.plugin';
import { projectDomainPlugin } from '../ai/plugins/platform/project-domain.plugin';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PlatformContext {
  projectId?: string;
  companyId?: string;
  includeProject?: boolean;
  includeTasks?: boolean;
  includeRFIs?: boolean;
  includeInvoices?: boolean;
  includeChangeOrders?: boolean;
  includeDocuments?: boolean;
}

/**
 * Adds platform data to agent context
 */
export async function getPlatformContext(ctx: PlatformContext): Promise<Record<string, any>> {
  const data: any = {};

  if (ctx.projectId) {
    const [project, tasks, rfis, changeOrders, invoices] = await Promise.all([
      supabase.from('projects').select('*').eq('id', ctx.projectId).single(),
      ctx.includeTasks ? supabase.from('tasks').select('*').eq('project_id', ctx.projectId) : Promise.resolve({ data: [] }),
      ctx.includeRFIs ? supabase.from('rfis').select('*').eq('project_id', ctx.projectId) : Promise.resolve({ data: [] }),
      ctx.includeChangeOrders ? supabase.from('change_orders').select('*').eq('project_id', ctx.projectId) : Promise.resolve({ data: [] }),
      ctx.includeInvoices ? supabase.from('invoices').select('*').eq('project_id', ctx.projectId) : Promise.resolve({ data: [] }),
    ]);

    data.project = project.data;
    data.tasks = tasks.data || [];
    data.rfis = rfis.data || [];
    data.changeOrders = changeOrders.data || [];
    data.invoices = invoices.data || [];

    if (ctx.includeDocuments) {
      const docs = await supabase.from('documents').select('*').eq('project_id', ctx.projectId);
      data.documents = docs.data || [];
    }
  }

  if (ctx.includeProject && !ctx.projectId) {
    const projects = await supabase.from('projects').select('*').limit(10);
    data.projects = projects.data || [];
  }

  return data;
}

/**
 * Execute HSE Sentinel with platform data
 */
export async function executeHSESentinel(
  projectId: string,
  question: string,
  options?: { provider?: 'openai' | 'gemini' | 'claude' }
): Promise<AgentExecutionResult> {
  const agent = aiAgentRegistry.getAgent('hse-sentinel');

  const platformData = await getPlatformContext({
    projectId,
    includeTasks: true,
    includeDocuments: true,
  });

  const safetyAnalysis = await safetyDomainPlugin.execute({
    projectId,
    action: 'assess',
    data: platformData,
  });

  const enhancedQuestion = `${question}

Current Project Safety Assessment:
${JSON.stringify(safetyAnalysis, null, 2)}

Based on this safety assessment and the project data, provide specific recommendations.`;

  return agent.execute({
    input: enhancedQuestion,
    provider: options?.provider,
    context: platformData,
  });
}

/**
 * Execute Commercial Guardian with platform data
 */
export async function executeCommercialGuardian(
  projectId: string,
  question: string,
  options?: { provider?: 'openai' | 'gemini' | 'claude' }
): Promise<AgentExecutionResult> {
  const agent = aiAgentRegistry.getAgent('commercial-guardian');

  const platformData = await getPlatformContext({
    projectId,
    includeChangeOrders: true,
    includeInvoices: true,
  });

  const financialAnalysis = await financialDomainPlugin.execute({
    projectId,
    action: 'analyze',
    data: platformData,
  });

  const enhancedQuestion = `${question}

Current Project Financial Analysis:
${JSON.stringify(financialAnalysis, null, 2)}

Based on this financial analysis and the project data, provide specific recommendations.`;

  return agent.execute({
    input: enhancedQuestion,
    provider: options?.provider,
    context: platformData,
  });
}

/**
 * Execute Project Assistant with platform data
 */
export async function executeProjectAssistant(
  projectId: string,
  question: string,
  options?: { provider?: 'openai' | 'gemini' | 'claude' }
): Promise<AgentExecutionResult> {
  const agent = aiAgentRegistry.getAgent('project-assistant');

  const platformData = await getPlatformContext({
    projectId,
    includeProject: true,
    includeTasks: true,
    includeRFIs: true,
    includeChangeOrders: true,
  });

  const projectAnalysis = await projectDomainPlugin.execute({
    projectId,
    action: 'analyze',
    data: platformData,
  });

  const enhancedQuestion = `${question}

Current Project Health Analysis:
${JSON.stringify(projectAnalysis, null, 2)}

Based on this project analysis and the project data, provide specific recommendations.`;

  return agent.execute({
    input: enhancedQuestion,
    provider: options?.provider,
    context: platformData,
  });
}

/**
 * Execute Financial Advisor with platform data
 */
export async function executeFinancialAdvisor(
  projectId: string,
  question: string,
  options?: { provider?: 'openai' | 'gemini' | 'claude' }
): Promise<AgentExecutionResult> {
  const agent = aiAgentRegistry.getAgent('financial-advisor');

  const platformData = await getPlatformContext({
    projectId,
    includeInvoices: true,
    includeChangeOrders: true,
  });

  const financialAnalysis = await financialDomainPlugin.execute({
    projectId,
    action: 'cash_flow',
    data: platformData,
  });

  const enhancedQuestion = `${question}

Current Cash Flow Analysis:
${JSON.stringify(financialAnalysis, null, 2)}

Based on this cash flow analysis and the project data, provide specific recommendations.`;

  return agent.execute({
    input: enhancedQuestion,
    provider: options?.provider,
    context: platformData,
  });
}

/**
 * Execute Document Processor with platform data
 */
export async function executeDocumentProcessor(
  projectId: string,
  documentType: string,
  documentText: string,
  options?: { provider?: 'openai' | 'gemini' | 'claude' }
): Promise<AgentExecutionResult> {
  const agent = aiAgentRegistry.getAgent('document-processor');

  const platformData = await getPlatformContext({
    projectId,
    includeDocuments: true,
  });

  return agent.execute({
    input: `Extract and analyze this ${documentType} document:

${documentText}

Project context:
${JSON.stringify(platformData, null, 2)}`,
    provider: options?.provider,
    context: platformData,
  });
}

export const platformAgents = {
  hseSentinel: executeHSESentinel,
  commercialGuardian: executeCommercialGuardian,
  projectAssistant: executeProjectAssistant,
  financialAdvisor: executeFinancialAdvisor,
  documentProcessor: executeDocumentProcessor,
};
