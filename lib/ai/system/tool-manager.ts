import { ITool } from './interfaces';

/**
 * Manages tools for AI agents
 */
export class ToolManager {
  private tools: Map<string, ITool<any>> = new Map();
  
  /**
   * Register a tool
   */
  public registerTool(tool: ITool<any>): void {
    this.tools.set(tool.id, tool);
  }
  
  /**
   * Unregister a tool
   */
  public unregisterTool(toolId: string): void {
    this.tools.delete(toolId);
  }
  
  /**
   * Get a tool by ID
   */
  public getTool(toolId: string): ITool<any> | undefined {
    return this.tools.get(toolId);
  }
  
  /**
   * Get all tools
   */
  public getAllTools(): ITool<any>[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tools by tags
   */
  public getToolsByTags(tags: string[]): ITool<any>[] {
    return this.getAllTools().filter(tool => 
      tool.tags && tags.some(tag => tool.tags!.includes(tag))
    );
  }
  
  /**
   * Enable a tool
   */
  public enableTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.isEnabled = true;
    }
  }
  
  /**
   * Disable a tool
   */
  public disableTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.isEnabled = false;
    }
  }
  
  /**
   * Check if a tool exists
   */
  public hasTool(toolId: string): boolean {
    return this.tools.has(toolId);
  }
  
  /**
   * Clear all tools
   */
  public clear(): void {
    this.tools.clear();
  }
}
