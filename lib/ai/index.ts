// AI System Exports
export * from './system/interfaces';
export * from './system/base-agent';
export * from './system/superagent';
export * from './system/skill-manager';
export * from './system/tool-manager';
export * from './system/plugin-manager';
export * from './system/agent-registry';
export * from './factories/agent-factory';

// Example skills, tools, and plugins (these would typically be imported individually)
// In a real application, you'd import these from their specific locations:
// import { documentAnalysisSkill } from './.agents/skills/document-analysis.skill';
// import { documentReaderTool } from './.agents/tools/document-reader.tool';
// import { aiEnhancementPlugin } from './.agents/plugins/ai-enhancement.plugin';
