import { AgentType } from "./interfaces";
import { BaseAgent } from "./base-agent";
import { AgentStatus, CoordinationStrategy } from "./interfaces";

/**
 * SuperAgent class that orchestrates multiple agents
 */
export class SuperAgent extends BaseAgent {
  public subagents: BaseAgent[] = [];
  public coordinationStrategy: CoordinationStrategy = CoordinationStrategy.PARALLEL;
  
  constructor(
    id: string,
    name: string,
    description: string,
    version: string = "1.0.0"
  ) {
    super(id, name, description, version, AgentType.SUPERAGENT);
  }
  
  /**
   * Initialize the superagent and all its subagents
   */
  public async initialize(context: any): Promise<void> {
    this.status = AgentStatus.INITIALIZING;
    
    // Initialize plugins first
    for (const plugin of this.plugins) {
      if (plugin.isEnabled) {
        try {
          await plugin.initialize(context);
        } catch (error) {
          console.error(`Failed to initialize plugin ${plugin.id}:`, error);
        }
      }
    }
    
    // Initialize all subagents
    for (const subagent of this.subagents) {
      if (subagent.isEnabled) {
        try {
          await subagent.initialize(context);
        } catch (error) {
          console.error(`Failed to initialize subagent ${subagent.id}:`, error);
          // Depending on policy, we might want to disable the subagent or continue
        }
      }
    }
    
    this.status = AgentStatus.ACTIVE;
    await this.onStart?.();
  }
  
  /**
   * Execute the superagent's logic - delegates to subagents based on coordination strategy
   */
  public async execute(context: any): Promise<any> {
    this.status = AgentStatus.BUSY;
    
    try {
      let results: any[] = [];
      
      switch (this.coordinationStrategy) {
        case CoordinationStrategy.SEQUENTIAL:
          results = await this.executeSequential(context);
          break;
        case CoordinationStrategy.PARALLEL:
          results = await this.executeParallel(context);
          break;
        case CoordinationStrategy.PIPELINE:
          results = await this.executePipeline(context);
          break;
        case CoordinationStrategy.CONSENSUS:
          results = await this.executeConsensus(context);
          break;
        case CoordinationStrategy.COMPETITIVE:
          results = await this.executeCompetitive(context);
          break;
        default:
          results = await this.executeParallel(context);
      }
      
      // Aggregate results
      const aggregatedResult = await this.aggregateResults(results);
      
      this.status = AgentStatus.COMPLETED;
      await this.onComplete?.(aggregatedResult);
      return aggregatedResult;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      await this.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Execute subagents sequentially
   */
  private async executeSequential(context: any): Promise<any[]> {
    const results: any[] = [];
    
    for (const subagent of this.subagents) {
      if (subagent.isEnabled && subagent.status === AgentStatus.ACTIVE) {
        try {
          const result = await subagent.execute(context);
          results.push({ 
            agentId: subagent.id, 
            agentName: subagent.name,
            result,
            success: true 
          });
        } catch (error) {
          results.push({ 
            agentId: subagent.id, 
            agentName: subagent.name,
            error: error instanceof Error ? error.message : String(error),
            success: false 
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Execute subagents in parallel
   */
  private async executeParallel(context: any): Promise<any[]> {
    const executionPromises = this.subagents
      .filter(subagent => subagent.isEnabled && subagent.status === AgentStatus.ACTIVE)
      .map(async (subagent) => {
        try {
          const result = await subagent.execute(context);
          return { 
            agentId: subagent.id, 
            agentName: subagent.name,
            result,
            success: true 
          };
        } catch (error) {
          return { 
            agentId: subagent.id, 
            agentName: subagent.name,
            error: error instanceof Error ? error.message : String(error),
            success: false 
          };
        }
      });
    
    return Promise.all(executionPromises);
  }
  
  /**
   * Execute subagents in a pipeline (output of one becomes input to next)
   */
  private async executePipeline(context: any): Promise<any[]> {
    const results: any[] = [];
    let currentContext = context;
    
    for (const subagent of this.subagents) {
      if (subagent.isEnabled && subagent.status === AgentStatus.ACTIVE) {
        try {
          const result = await subagent.execute(currentContext);
          results.push({ 
            agentId: subagent.id, 
            agentName: subagent.name,
            result,
            success: true 
          });
          
          // Pass result as context to next agent (simplified)
          currentContext = { ...currentContext, ...result };
        } catch (error) {
          results.push({ 
            agentId: subagent.id, 
            agentName: subagent.name,
            error: error instanceof Error ? error.message : String(error),
            success: false 
          });
          // In a pipeline, we might want to stop on first failure
          break;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Execute subagents and seek consensus on the result
   */
  private async executeConsensus(context: any): Promise<any[]> {
    // Execute all agents in parallel
    const parallelResults = await this.executeParallel(context);
    
    // For simplicity, we'll just return all results
    // In a real implementation, we'd analyze the results and seek consensus
    return parallelResults;
  }
  
  /**
   * Execute subagents competitively (first to complete wins)
   */
  private async executeCompetitive(context: any): Promise<any[]> {
    // Execute all agents in parallel and return first successful result
    const promises = this.subagents
      .filter(subagent => subagent.isEnabled && subagent.status === AgentStatus.ACTIVE)
      .map(async (subagent) => {
        try {
          const result = await subagent.execute(context);
          return { 
            agentId: subagent.id, 
            agentName: subagent.name,
            result,
            success: true 
          };
        } catch (error) {
          return { 
            agentId: subagent.id, 
            agentName: subagent.name,
            error: error instanceof Error ? error.message : String(error),
            success: false 
          };
        }
      });
    
    // Wait for first successful result or all to fail
    const results = await Promise.all(promises);
    
    // Find first successful result
    const successfulResult = results.find(r => r.success);
    if (successfulResult) {
      return [successfulResult];
    }
    
    // If all failed, return all results
    return results;
  }
  
  /**
   * Delegate a specific task to a subagent
   */
  public async delegateTask(task: any, agentId: string): Promise<any> {
    const subagent = this.subagents.find(sa => sa.id === agentId);
    if (!subagent) {
      throw new Error(`Subagent ${agentId} not found`);
    }
    
    if (!subagent.isEnabled) {
      throw new Error(`Subagent ${agentId} is disabled`);
    }
    
    return subagent.execute(task);
  }
  
  /**
   * Aggregate results from multiple agents
   * @override
   */
  public async aggregateResults(results: any[]): Promise<any> {
    // Default implementation - in real system, this would be more sophisticated
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    return {
      successfulCount: successfulResults.length,
      failedCount: failedResults.length,
      totalCount: results.length,
      successfulResults: successfulResults.map(r => r.result),
      failedResults: failedResults.map(r => r.error),
      aggregatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Resolve conflicts between agents
   */
  public async resolveConflicts(conflicts: any[]): Promise<any> {
    // Simple conflict resolution - in real system, this would be more sophisticated
    return {
      resolvedAt: new Date().toISOString(),
      method: 'first-wins',
      resolution: conflicts.length > 0 ? conflicts[0] : null
    };
  }
  
  /**
   * Add a subagent to the superagent
   */
  public addSubagent(agent: BaseAgent): void {
    if (!this.subagents.some(a => a.id === agent.id)) {
      this.subagents.push(agent);
    }
  }
  
  /**
   * Remove a subagent from the superagent
   */
  public removeSubagent(agentId: string): void {
    this.subagents = this.subagents.filter(a => a.id !== agentId);
  }
  
  /**
   * Get a subagent by ID
   */
  public getSubagent(agentId: string): BaseAgent | undefined {
    return this.subagents.find(a => a.id === agentId);
  }
  
  /**
   * Get all subagents
   */
  public getSubagents(): BaseAgent[] {
    return [...this.subagents];
  }
  
  // Lifecycle hooks
  protected onStart?: () => Promise<void>;
  protected onComplete?: (result: any) => Promise<void>;
  protected onError?: (error: Error) => Promise<void>;
}
