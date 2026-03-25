import { IAgent, ISuperAgent } from './interfaces';

/**
 * Registry for managing AI agents in the system
 */
export class AgentRegistry {
  private agents: Map<string, IAgent<any>> = new Map();
  private superagents: Map<string, ISuperAgent<any>> = new Map();
  
  /**
   * Register an agent
   */
  public registerAgent(agent: IAgent<any>): void {
    this.agents.set(agent.id, agent);
  }
  
  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }
  
  /**
   * Register a superagent
   */
  public registerSuperagent(agent: ISuperAgent<any>): void {
    this.superagents.set(agent.id, agent);
    // Also register as regular agent
    this.agents.set(agent.id, agent);
  }
  
  /**
   * Unregister a superagent
   */
  public unregisterSuperagent(agentId: string): void {
    this.superagents.delete(agentId);
    this.agents.delete(agentId);
  }
  
  /**
   * Get an agent by ID
   */
  public getAgent(agentId: string): IAgent<any> | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get a superagent by ID
   */
  public getSuperagent(agentId: string): ISuperAgent<any> | undefined {
    return this.superagents.get(agentId);
  }
  
  /**
   * Get all agents
   */
  public getAllAgents(): IAgent<any>[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get all superagents
   */
  public getAllSuperagents(): ISuperAgent<any>[] {
    return Array.from(this.superagents.values());
  }
  
  /**
   * Get agents by type
   */
  public getAgentsByType(type: AgentType): IAgent<any>[] {
    return this.getAllAgents().filter(agent => agent.type === type);
  }
  
  /**
   * Check if an agent exists
   */
  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }
  
  /**
   * Check if a superagent exists
   */
  public hasSuperagent(agentId: string): boolean {
    return this.superagents.has(agentId);
  }
  
  /**
   * Clear all agents
   */
  public clear(): void {
    this.agents.clear();
    this.superagents.clear();
  }
}
