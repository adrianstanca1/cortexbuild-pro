import { IPlugin } from './interfaces';

/**
 * Manages plugins for AI agents
 */
export class PluginManager {
  private plugins: Map<string, IPlugin<any>> = new Map();
  
  /**
   * Register a plugin
   */
  public registerPlugin(plugin: IPlugin<any>): void {
    this.plugins.set(plugin.id, plugin);
  }
  
  /**
   * Unregister a plugin
   */
  public unregisterPlugin(pluginId: string): void {
    this.plugins.delete(pluginId);
  }
  
  /**
   * Get a plugin by ID
   */
  public getPlugin(pluginId: string): IPlugin<any> | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all plugins
   */
  public getAllPlugins(): IPlugin<any>[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Enable a plugin
   */
  public enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.isEnabled = true;
    }
  }
  
  /**
   * Disable a plugin
   */
  public disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.isEnabled = false;
    }
  }
  
  /**
   * Check if a plugin exists
   */
  public hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }
  
  /**
   * Clear all plugins
   */
  public clear(): void {
    this.plugins.clear();
  }
}
