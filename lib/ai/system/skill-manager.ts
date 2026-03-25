import { ISkill } from './interfaces';

/**
 * Manages skills for AI agents
 */
export class SkillManager {
  private skills: Map<string, ISkill<any>> = new Map();
  
  /**
   * Register a skill
   */
  public registerSkill(skill: ISkill<any>): void {
    this.skills.set(skill.id, skill);
  }
  
  /**
   * Unregister a skill
   */
  public unregisterSkill(skillId: string): void {
    this.skills.delete(skillId);
  }
  
  /**
   * Get a skill by ID
   */
  public getSkill(skillId: string): ISkill<any> | undefined {
    return this.skills.get(skillId);
  }
  
  /**
   * Get all skills
   */
  public getAllSkills(): ISkill<any>[] {
    return Array.from(this.skills.values());
  }
  
  /**
   * Get skills by tags
   */
  public getSkillsByTags(tags: string[]): ISkill<any>[] {
    return this.getAllSkills().filter(skill => 
      skill.tags && tags.some(tag => skill.tags!.includes(tag))
    );
  }
  
  /**
   * Enable a skill
   */
  public enableSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.isEnabled = true;
    }
  }
  
  /**
   * Disable a skill
   */
  public disableSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.isEnabled = false;
    }
  }
  
  /**
   * Check if a skill exists
   */
  public hasSkill(skillId: string): boolean {
    return this.skills.has(skillId);
  }
  
  /**
   * Clear all skills
   */
  public clear(): void {
    this.skills.clear();
  }
}
