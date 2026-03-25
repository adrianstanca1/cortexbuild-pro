import { IPlugin } from '../../lib/ai/system/interfaces';
import { aiAgentRegistry } from '../../lib/services/aiAgents';
import { AgentExecutionOptions } from '../../lib/services/aiAgents';

export interface AIAgentPluginConfig {
  agentId: 'hse-sentinel' | 'commercial-guardian' | 'quality-inspector' | 'project-assistant' | 'financial-advisor' | 'document-processor';
  temperature?: number;
  maxTokens?: number;
}

export interface AIAgentBridgeContext {
  prompt?: string;
  contextData?: Record<string, any>;
  provider?: 'openai' | 'gemini' | 'claude';
  input?: string;
  [key: string]: any;
}

export interface AIAgentPluginOptions {
  agentConfig: AIAgentPluginConfig;
  context?: AIAgentBridgeContext;
}

export const AIAgentBridgePlugin: IPlugin<AIAgentPluginOptions> = {
  id: 'ai-agent-bridge',
  name: 'AI Agent Bridge',
  description: 'Bridges the new agent framework with existing aiAgentRegistry services (HSE Sentinel, Commercial Guardian, Quality Inspector, Project Assistant, Financial Advisor, Document Processor)',
  version: '1.0.0',
  isEnabled: true,
  hooks: ['pre-execute', 'post-execute'],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'multi'
  },

  async initialize(context: AIAgentPluginOptions): Promise<void> {
    console.log(`[AIAgentBridge] Initialized with agent: ${context.agentConfig.agentId}`);
  },

  async execute(context: AIAgentPluginOptions): Promise<any> {
    const { agentConfig } = context;
    const ctx = context.context || {};
    
    try {
      const agent = aiAgentRegistry.getAgent(agentConfig.agentId);
      
      const options: AgentExecutionOptions = {
        input: ctx.prompt || ctx.input || 'Analyze the provided construction data and provide insights.',
        context: ctx.contextData || ctx,
        provider: ctx.provider
      };

      const result = await agent.execute(options);

      return {
        success: true,
        output: result.output,
        agent: result.agent,
        provider: result.provider,
        confidence: result.confidence,
        recommendations: result.recommendations,
        metadata: result.metadata,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[AIAgentBridge] Error executing agent ${agentConfig.agentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        agent: agentConfig.agentId,
        executedAt: new Date().toISOString()
      };
    }
  },

  async cleanup(): Promise<void> {
    console.log('[AIAgentBridge] Cleanup called');
  }
};

export const hseSentinelBridge: IPlugin<AIAgentBridgeContext> = {
  id: 'hse-sentinel-bridge',
  name: 'HSE Sentinel Bridge',
  description: 'Connects to HSE Sentinel agent for health & safety risk prediction and incident analysis',
  version: '1.0.0',
  isEnabled: true,
  hooks: [],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'openai',
    agentId: 'hse-sentinel'
  },

  async initialize(ctx: AIAgentBridgeContext): Promise<void> {
    console.log('[HSE-Sentinel-Bridge] Initialized');
  },

  async execute(ctx: AIAgentBridgeContext): Promise<any> {
    const agent = aiAgentRegistry.getAgent('hse-sentinel');
    
    const result = await agent.execute({
      input: ctx.prompt || 'Analyze safety data and provide risk assessment.',
      context: ctx
    });

    return result;
  },

  async cleanup(): Promise<void> {}
};

export const commercialGuardianBridge: IPlugin<AIAgentBridgeContext> = {
  id: 'commercial-guardian-bridge',
  name: 'Commercial Guardian Bridge',
  description: 'Connects to Commercial Guardian agent for contract analysis and cost variance tracking',
  version: '1.0.0',
  isEnabled: true,
  hooks: [],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'claude',
    agentId: 'commercial-guardian'
  },

  async initialize(ctx: AIAgentBridgeContext): Promise<void> {
    console.log('[Commercial-Guardian-Bridge] Initialized');
  },

  async execute(ctx: AIAgentBridgeContext): Promise<any> {
    const agent = aiAgentRegistry.getAgent('commercial-guardian');
    
    const result = await agent.execute({
      input: ctx.prompt || 'Analyze commercial data and provide recommendations.',
      context: ctx
    });

    return result;
  },

  async cleanup(): Promise<void> {}
};

export const qualityInspectorBridge: IPlugin<AIAgentBridgeContext> = {
  id: 'quality-inspector-bridge',
  name: 'Quality Inspector Bridge',
  description: 'Connects to Quality Inspector agent for photo analysis and defect detection',
  version: '1.0.0',
  isEnabled: true,
  hooks: [],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'gemini',
    agentId: 'quality-inspector'
  },

  async initialize(ctx: AIAgentBridgeContext): Promise<void> {
    console.log('[Quality-Inspector-Bridge] Initialized');
  },

  async execute(ctx: AIAgentBridgeContext): Promise<any> {
    const agent = aiAgentRegistry.getAgent('quality-inspector');
    
    const result = await agent.execute({
      input: ctx.prompt || 'Analyze quality data and identify defects.',
      context: ctx
    });

    return result;
  },

  async cleanup(): Promise<void> {}
};

export const projectAssistantBridge: IPlugin<AIAgentBridgeContext> = {
  id: 'project-assistant-bridge',
  name: 'Project Assistant Bridge',
  description: 'Connects to Project Assistant agent for scheduling and resource allocation',
  version: '1.0.0',
  isEnabled: true,
  hooks: [],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'openai',
    agentId: 'project-assistant'
  },

  async initialize(ctx: AIAgentBridgeContext): Promise<void> {
    console.log('[Project-Assistant-Bridge] Initialized');
  },

  async execute(ctx: AIAgentBridgeContext): Promise<any> {
    const agent = aiAgentRegistry.getAgent('project-assistant');
    
    const result = await agent.execute({
      input: ctx.prompt || 'Provide project management assistance.',
      context: ctx
    });

    return result;
  },

  async cleanup(): Promise<void> {}
};

export const financialAdvisorBridge: IPlugin<AIAgentBridgeContext> = {
  id: 'financial-advisor-bridge',
  name: 'Financial Advisor Bridge',
  description: 'Connects to Financial Advisor agent for budget analysis and cash flow forecasting',
  version: '1.0.0',
  isEnabled: true,
  hooks: [],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'claude',
    agentId: 'financial-advisor'
  },

  async initialize(ctx: AIAgentBridgeContext): Promise<void> {
    console.log('[Financial-Advisor-Bridge] Initialized');
  },

  async execute(ctx: AIAgentBridgeContext): Promise<any> {
    const agent = aiAgentRegistry.getAgent('financial-advisor');
    
    const result = await agent.execute({
      input: ctx.prompt || 'Analyze financial data and provide recommendations.',
      context: ctx
    });

    return result;
  },

  async cleanup(): Promise<void> {}
};

export const documentProcessorBridge: IPlugin<AIAgentBridgeContext> = {
  id: 'document-processor-bridge',
  name: 'Document Processor Bridge',
  description: 'Connects to Document Processor agent for OCR and intelligent data extraction',
  version: '1.0.0',
  isEnabled: true,
  hooks: [],
  dependencies: [],
  metadata: {
    category: 'ai-integration',
    complexity: 'low',
    provider: 'claude',
    agentId: 'document-processor'
  },

  async initialize(ctx: AIAgentBridgeContext): Promise<void> {
    console.log('[Document-Processor-Bridge] Initialized');
  },

  async execute(ctx: AIAgentBridgeContext): Promise<any> {
    const agent = aiAgentRegistry.getAgent('document-processor');
    
    const result = await agent.execute({
      input: ctx.prompt || 'Process and extract data from document.',
      context: ctx
    });

    return result;
  },

  async cleanup(): Promise<void> {}
};
