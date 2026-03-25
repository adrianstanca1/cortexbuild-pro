/**
 * Platform Agent Factory
 * Creates AI agents with platform data access and domain knowledge
 */

import { createClient } from '@supabase/supabase-js';
import { AgentFactory } from './agent-factory';
import { CoordinationStrategy } from '../system/interfaces';
import { projectDomainPlugin } from '../plugins/platform/project-domain.plugin';
import { financialDomainPlugin } from '../plugins/platform/financial-domain.plugin';
import { safetyDomainPlugin } from '../plugins/platform/safety-domain.plugin';
import { platformDataTool } from '../tools/platform/platform-data-tool';
import { projectTool } from '../tools/platform/project-tool';
import { taskTool } from '../tools/platform/task-tool';
import { rfiTool } from '../tools/platform/rfi-tool';
import { invoiceTool } from '../tools/platform/invoice-tool';
import { documentTool } from '../tools/platform/document-tool';
import { changeOrderTool } from '../tools/platform/change-order-tool';
import { vendorTool } from '../tools/platform/vendor-tool';
import { milestoneTool } from '../tools/platform/milestone-tool';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PlatformAgentConfig {
  id: string;
  name: string;
  description: string;
  tools?: any[];
  plugins?: any[];
}

/**
 * Creates agents with full platform data access
 */
export class PlatformAgentFactory {
  private static instance: PlatformAgentFactory;

  private constructor() {}

  public static getInstance(): PlatformAgentFactory {
    if (!PlatformAgentFactory.instance) {
      PlatformAgentFactory.instance = new PlatformAgentFactory();
    }
    return PlatformAgentFactory.instance;
  }

  /**
   * Create a Project Analysis Agent with platform data access
   */
  public createProjectAnalysisAgent(config: PlatformAgentConfig) {
    return AgentFactory.createSpecializedAgent(
      config.id,
      config.name,
      config.description,
      [],
      [
        projectTool,
        taskTool,
        rfiTool,
        changeOrderTool,
        platformDataTool,
      ],
      [
        projectDomainPlugin,
        financialDomainPlugin,
      ]
    );
  }

  /**
   * Create a Financial Analysis Agent with platform data access
   */
  public createFinancialAgent(config: PlatformAgentConfig) {
    return AgentFactory.createSpecializedAgent(
      config.id,
      config.name,
      config.description,
      [],
      [
        projectTool,
        invoiceTool,
        changeOrderTool,
        platformDataTool,
      ],
      [financialDomainPlugin]
    );
  }

  /**
   * Create a Safety Analysis Agent with platform data access
   */
  public createSafetyAgent(config: PlatformAgentConfig) {
    return AgentFactory.createSpecializedAgent(
      config.id,
      config.name,
      config.description,
      [],
      [
        taskTool,
        documentTool,
        platformDataTool,
      ],
      [safetyDomainPlugin]
    );
  }

  /**
   * Create a Document Analysis Agent with platform data access
   */
  public createDocumentAgent(config: PlatformAgentConfig) {
    return AgentFactory.createSpecializedAgent(
      config.id,
      config.name,
      config.description,
      [],
      [documentTool, rfiTool, platformDataTool],
      []
    );
  }

  /**
   * Create a Project Coordinator Agent with platform data access
   */
  public createCoordinatorAgent(config: PlatformAgentConfig) {
    return AgentFactory.createCoordinatorAgent(
      config.id,
      config.name,
      config.description,
      [],
      [
        projectTool,
        taskTool,
        rfiTool,
        milestoneTool,
        platformDataTool,
      ],
      [projectDomainPlugin],
      [],
      CoordinationStrategy.PARALLEL
    );
  }

  /**
   * Execute a platform-aware agent with full data context
   */
  public async executeAgent(agent: any, context: any): Promise<any> {
    const { projectId, companyId } = context;

    try {
      await agent.initialize({ supabase, projectId, companyId });

      const platformContext = {
        ...context,
        platformData: await this.gatherPlatformData(projectId, companyId),
      };

      const result = await agent.execute(platformContext);

      await agent.cleanup();

      return result;
    } catch (error) {
      console.error(`Agent ${agent.id} execution failed:`, error);
      throw error;
    }
  }

  /**
   * Gather comprehensive platform data for agent context
   */
  private async gatherPlatformData(projectId?: string, companyId?: string): Promise<any> {
    const data: any = {};

    try {
      if (projectId) {
        const [project, tasks, rfis, changeOrders, invoices] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single(),
          supabase.from('tasks').select('*').eq('project_id', projectId),
          supabase.from('rfis').select('*').eq('project_id', projectId),
          supabase.from('change_orders').select('*').eq('project_id', projectId),
          supabase.from('invoices').select('*').eq('project_id', projectId),
        ]);

        data.project = project.data;
        data.tasks = tasks.data || [];
        data.rfis = rfis.data || [];
        data.changeOrders = changeOrders.data || [];
        data.invoices = invoices.data || [];
      }

      if (companyId) {
        const [projects, clients, vendors] = await Promise.all([
          supabase.from('projects').select('*').eq('company_id', companyId),
          supabase.from('clients').select('*').eq('company_id', companyId),
          supabase.from('vendors').select('*').eq('company_id', companyId),
        ]);

        data.companyProjects = projects.data || [];
        data.clients = clients.data || [];
        data.vendors = vendors.data || [];
      }
    } catch (error) {
      console.error('Error gathering platform data:', error);
    }

    return data;
  }
}

export const platformAgentFactory = PlatformAgentFactory.getInstance();
