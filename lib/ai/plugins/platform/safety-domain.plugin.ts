/**
 * Safety Domain Plugin
 * Provides construction safety management domain knowledge to AI agents
 */

import type { IPlugin } from '../../system/interfaces';

export interface SafetyDomainContext {
  projectId?: string;
  action: 'assess' | 'analyze' | 'compliance' | 'recommend';
  data?: any;
}

/**
 * SafetyDomainPlugin provides AI agents with construction safety expertise
 */
export class SafetyDomainPlugin implements IPlugin<SafetyDomainContext> {
  id = 'platform-safety-domain';
  name = 'Safety Domain Plugin';
  description = 'Provides construction safety management domain knowledge including risk assessment, compliance checking, and safety recommendations';
  version = '1.0.0';
  isEnabled = true;
  hooks = ['pre-execute', 'post-execute'];
  dependencies = [];
  metadata = {
    author: 'CortexBuild AI',
    category: 'domain',
    tags: ['safety', 'construction', 'compliance', 'risk', 'osha'],
  };

  async initialize(_context: any): Promise<void> {
    return Promise.resolve();
  }

  async execute(context: SafetyDomainContext): Promise<any> {
    const { action, data } = context;

    switch (action) {
      case 'assess':
        return this.assessSafety(data);
      case 'analyze':
        return this.analyzeSafety(data);
      case 'compliance':
        return this.checkCompliance(data);
      case 'recommend':
        return this.getRecommendations(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async cleanup(): Promise<void> {
    return Promise.resolve();
  }

  private assessSafety(data: any): any {
    const assessment = {
      overallRisk: 'low' as 'low' | 'medium' | 'high' | 'critical',
      score: 100,
      factors: [] as any[],
      recommendations: [] as string[],
    };

    if (!data) {
      assessment.overallRisk = 'medium';
      assessment.recommendations.push('Collect safety data for accurate risk assessment');
      return assessment;
    }

    const progress = data.progress || 0;
    const status = data.status || 'active';

    assessment.factors.push({
      name: 'Project Phase',
      risk: progress < 25 ? 'high' : progress < 75 ? 'medium' : 'low',
      description: progress < 25 ? 'Early phase - higher hazard activities' : progress < 75 ? 'Middle phase - sustained risk levels' : 'Final phase - demobilization risks',
    });

    if (status === 'on_hold') {
      assessment.factors.push({
        name: 'Project Status',
        risk: 'medium',
        description: 'On hold - site security and maintenance risks',
      });
    }

    if (data.tasks && data.tasks.length > 0) {
      const highPriorityTasks = data.tasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent');
      assessment.factors.push({
        name: 'High Priority Tasks',
        risk: highPriorityTasks.length > 5 ? 'high' : highPriorityTasks.length > 2 ? 'medium' : 'low',
        description: `${highPriorityTasks.length} high-priority tasks may increase pressure and risk`,
      });
    }

    const riskCount = assessment.factors.filter((f: any) => f.risk === 'high').length;
    const mediumCount = assessment.factors.filter((f: any) => f.risk === 'medium').length;

    if (riskCount >= 2) {
      assessment.overallRisk = 'critical';
      assessment.score = 40;
    } else if (riskCount === 1) {
      assessment.overallRisk = 'high';
      assessment.score = 60;
    } else if (mediumCount >= 2) {
      assessment.overallRisk = 'medium';
      assessment.score = 75;
    } else {
      assessment.overallRisk = 'low';
      assessment.score = 90;
    }

    if (assessment.overallRisk === 'high' || assessment.overallRisk === 'critical') {
      assessment.recommendations.push('Conduct toolbox talk focusing on high-risk activities');
      assessment.recommendations.push('Review and reinforce PPE requirements');
      assessment.recommendations.push('Ensure all workers have current safety certifications');
    }

    if (data.documents) {
      const safetyDocs = data.documents.filter((d: any) => d.category === 'safety');
      if (safetyDocs.length === 0) {
        assessment.recommendations.push('Upload safety documentation (RAMS, JSA, permits)');
        assessment.score = Math.max(0, assessment.score - 10);
      }
    }

    assessment.recommendations.push('Maintain daily safety inspection logs');
    assessment.recommendations.push('Keep emergency contact information visible on site');

    return assessment;
  }

  private analyzeSafety(data: any): any {
    if (!data) return { summary: 'No data available for safety analysis' };

    const analysis = {
      incidentRisk: 'low' as string,
      ergonomicRisk: 'low' as string,
      environmentalRisk: 'low' as string,
      chemicalRisk: 'low' as string,
      summary: '',
    };

    const progress = data.progress || 0;
    const tasks = data.tasks || [];

    if (tasks.some((t: any) => t.title?.toLowerCase().includes('excavation') || t.title?.toLowerCase().includes('trench'))) {
      analysis.incidentRisk = 'high';
    }
    if (tasks.some((t: any) => t.title?.toLowerCase().includes('scaffolding') || t.title?.toLowerCase().includes('work at height'))) {
      analysis.incidentRisk = 'high';
    }
    if (tasks.some((t: any) => t.title?.toLowerCase().includes('electrical') || t.title?.toLowerCase().includes('high voltage'))) {
      analysis.incidentRisk = 'critical';
    }
    if (tasks.some((t: any) => t.title?.toLowerCase().includes('welding') || t.title?.toLowerCase().includes('cutting'))) {
      analysis.chemicalRisk = 'medium';
    }
    if (tasks.some((t: any) => t.title?.toLowerCase().includes('demolition'))) {
      analysis.incidentRisk = 'critical';
      analysis.environmentalRisk = 'medium';
    }

    if (progress > 75) {
      analysis.ergonomicRisk = 'medium';
    }

    return analysis;
  }

  private checkCompliance(data: any): any {
    const compliance = {
      oshaCompliant: true,
      stateCompliant: true,
      siteSpecificCompliant: true,
      issues: [] as string[],
      recommendations: [] as string[],
    };

    if (!data) {
      compliance.siteSpecificCompliant = false;
      compliance.issues.push('Insufficient data for compliance assessment');
      return compliance;
    }

    compliance.recommendations.push('Maintain daily safety logs for OSHA compliance');
    compliance.recommendations.push('Keep SDS sheets accessible for all chemical substances');
    compliance.recommendations.push('Post emergency evacuation routes at visible locations');

    return compliance;
  }

  private getRecommendations(data: any): any {
    const recommendations = [
      'Ensure all workers wear appropriate PPE for their task',
      'Conduct pre-work safety briefings for high-risk activities',
      'Keep work areas clean and free of trip hazards',
      'Store materials securely to prevent falling object hazards',
      'Use proper lifting techniques to prevent back injuries',
      'Report all near-misses for continuous safety improvement',
    ];

    if (data && data.status === 'active') {
      recommendations.push('Maintain emergency contact numbers at all entry points');
      recommendations.push('Ensure adequate lighting in all work areas');
    }

    return { recommendations };
  }
}

export const safetyDomainPlugin = new SafetyDomainPlugin();
