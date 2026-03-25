import { AgentType, AgentStatus, ISkill, ITool, IPlugin } from "./interfaces";
import { BaseMessage } from "./base-types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for all agents in the system
 */
export abstract class BaseAgent {
  public readonly id: string;
  public name: string;
  public description: string;
  public readonly version: string;
  public type: AgentType;
  public status: AgentStatus;
  public skills: ISkill<any>[];
  public tools: ITool<any>[];
  public plugins: IPlugin<any>[];
  public metadata: Record<string, any>;
  public isEnabled: boolean;
  public maxTokens: number;
  public temperature: number;
  
  // Message queue for inter-agent communication
  protected messageQueue: BaseMessage[] = [];
  
  constructor(
    id: string,
    name: string,
    description: string,
    version: string = "1.0.0",
    type: AgentType = AgentType.SPECIALIZED
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.version = version;
    this.type = type;
    this.status = AgentStatus.INACTIVE;
    this.skills = [];
    this.tools = [];
    this.plugins = [];
    this.metadata = {};
    this.isEnabled = true;
    this.maxTokens = 4000;
    this.temperature = 0.7;
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(context: any): Promise<void> {
    this.status = AgentStatus.INITIALIZING;
    
    // Initialize all plugins
    for (const plugin of this.plugins) {
      if (plugin.isEnabled) {
        try {
          await plugin.initialize(context);
        } catch (error) {
          console.error(`Failed to initialize plugin ${plugin.id}:`, error);
          // Depending on policy, we might want to disable the plugin or continue
        }
      }
    }
    
    this.status = AgentStatus.ACTIVE;
    await this.onStart?.();
  }
  
  /**
   * Execute the agent's main logic
   * @abstract
   */
  public abstract execute(context: any): Promise<any>;
  
  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.status = AgentStatus.MAINTENANCE;
    
    // Cleanup all plugins in reverse order
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      const plugin = this.plugins[i];
      if (plugin.isEnabled && plugin.cleanup) {
        try {
          await plugin.cleanup();
        } catch (error) {
          console.error(`Failed to cleanup plugin ${plugin.id}:`, error);
        }
      }
    }
    
    await this.onComplete?.(undefined);
    this.status = AgentStatus.INACTIVE;
  }
  
  /**
   * Add a skill to the agent
   */
  public addSkill(skill: ISkill<any>): void {
    // Avoid duplicates
    if (!this.skills.some(s => s.id === skill.id)) {
      this.skills.push(skill);
    }
  }
  
  /**
   * Remove a skill from the agent
   */
  public removeSkill(skillId: string): void {
    this.skills = this.skills.filter(s => s.id !== skillId);
  }
  
  /**
   * Add a tool to the agent
   */
  public addTool(tool: ITool<any>): void {
    // Avoid duplicates
    if (!this.tools.some(t => t.id === tool.id)) {
      this.tools.push(tool);
    }
  }
  
  /**
   * Remove a tool from the agent
   */
  public removeTool(toolId: string): void {
    this.tools = this.tools.filter(t => t.id !== toolId);
  }
  
  /**
   * Add a plugin to the agent
   */
  public addPlugin(plugin: IPlugin<any>): void {
    // Avoid duplicates
    if (!this.plugins.some(p => p.id === plugin.id)) {
      this.plugins.push(plugin);
    }
  }
  
  /**
   * Remove a plugin from the agent
   */
  public removePlugin(pluginId: string): void {
    this.plugins = this.plugins.filter(p => p.id !== pluginId);
  }
  
  /**
   * Send a message to another agent or receive a message
   */
  public sendMessage(message: BaseMessage): void {
    // In a real implementation, this would go through a message broker
    this.messageQueue.push(message);
  }
  
  /**
   * Receive messages from other agents
   */
  public receiveMessages(): BaseMessage[] {
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    return messages;
  }
  
  /**
   * Execute a skill by ID
   */
  public async executeSkill(skillId: string, context: any): Promise<any> {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }
    
    if (!skill.isEnabled) {
      throw new Error(`Skill ${skillId} is disabled`);
    }
    
    return skill.execute(context);
  }
  
  /**
   * Execute a tool by ID
   */
  public async executeTool(toolId: string, context: any): Promise<any> {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }
    
    if (!tool.isEnabled) {
      throw new Error(`Tool ${toolId} is disabled`);
    }
    
    return tool.execute(context);
  }
  
  /**
   * Execute a plugin by ID
   */
  public async executePlugin(pluginId: string, context: any): Promise<any> {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (!plugin.isEnabled) {
      throw new Error(`Plugin ${pluginId} is disabled`);
    }
    
    return plugin.execute(context);
  }
  
  // Lifecycle hooks (to be overridden by subclasses)
  protected onStart?: () => Promise<void>;
  protected onComplete?: (result: any) => Promise<void>;
  protected onError?: (error: Error) => Promise<void>;
}
