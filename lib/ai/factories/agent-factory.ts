import { BaseAgent } from '../system/base-agent';
import { SuperAgent } from '../system/superagent';
import { ISkill, ITool, IPlugin } from '../system/interfaces';
import { AgentType, CoordinationStrategy } from '../system/interfaces';

/**
 * Concrete specialized agent implementation
 */
class SpecializedAgentImpl extends BaseAgent {
  constructor(
    id: string,
    name: string,
    description: string,
    version: string = "1.0.0",
    agentType: AgentType = AgentType.SPECIALIZED
  ) {
    super(id, name, description, version, agentType);
  }

  async execute(context: any): Promise<any> {
    return { result: 'Specialized agent executed', context };
  }
}

/**
 * Concrete generalist agent implementation
 */
class GeneralistAgentImpl extends BaseAgent {
  constructor(
    id: string,
    name: string,
    description: string,
    version: string = "1.0.0"
  ) {
    super(id, name, description, version, AgentType.GENERALIST);
  }

  async execute(context: any): Promise<any> {
    return { result: 'Generalist agent executed', context };
  }
}

/**
 * Factory for creating AI agents commonly used in construction platforms
 */
export class AgentFactory {
  /**
   * Create a specialized agent
   */
  public static createSpecializedAgent(
    id: string,
    name: string,
    description: string,
    skills: ISkill<any>[] = [],
    tools: ITool<any>[] = [],
    plugins: IPlugin<any>[] = []
  ): SpecializedAgentImpl {
    const agent = new SpecializedAgentImpl(id, name, description, "1.0.0", AgentType.SPECIALIZED);
    agent.skills = skills;
    agent.tools = tools;
    agent.plugins = plugins;
    return agent;
  }
  
  /**
   * Create a generalist agent
   */
  public static createGeneralistAgent(
    id: string,
    name: string,
    description: string,
    skills: ISkill<any>[] = [],
    tools: ITool<any>[] = [],
    plugins: IPlugin<any>[] = []
  ): GeneralistAgentImpl {
    const agent = new GeneralistAgentImpl(id, name, description, "1.0.0");
    agent.skills = skills;
    agent.tools = tools;
    agent.plugins = plugins;
    return agent;
  }
  
  /**
   * Create a coordinator agent
   */
  public static createCoordinatorAgent(
    id: string,
    name: string,
    description: string,
    skills: ISkill<any>[] = [],
    tools: ITool<any>[] = [],
    plugins: IPlugin<any>[] = [],
    subagents: BaseAgent[] = [],
    coordinationStrategy: CoordinationStrategy = CoordinationStrategy.PARALLEL
  ): SuperAgent {
    const agent = new SuperAgent(id, name, description, "1.0.0");
    agent.skills = skills;
    agent.tools = tools;
    agent.plugins = plugins;
    agent.subagents = subagents;
    agent.coordinationStrategy = coordinationStrategy;
    // Override the type since SuperAgent has a fixed type in constructor
    (agent as any).type = AgentType.COORDINATOR;
    return agent;
  }
  
  /**
   * Create a superagent
   */
  public static createSuperAgent(
    id: string,
    name: string,
    description: string,
    skills: ISkill<any>[] = [],
    tools: ITool<any>[] = [],
    plugins: IPlugin<any>[] = [],
    subagents: BaseAgent[] = [],
    coordinationStrategy: CoordinationStrategy = CoordinationStrategy.PARALLEL
  ): SuperAgent {
    const agent = new SuperAgent(id, name, description, "1.0.0");
    agent.skills = skills;
    agent.tools = tools;
    agent.plugins = plugins;
    agent.subagents = subagents;
    agent.coordinationStrategy = coordinationStrategy;
    return agent;
  }
}
