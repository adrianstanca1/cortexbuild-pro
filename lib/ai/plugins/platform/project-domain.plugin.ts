/**
 * Project Domain Plugin
 * Provides construction project management domain knowledge to AI agents
 */

import type { IPlugin } from '../../system/interfaces';

export interface ProjectDomainContext {
  projectId?: string;
  action: 'analyze' | 'summarize' | 'forecast' | 'optimize' | 'risk_assess';
  data?: any;
}

interface ProjectMetric {
  label: string;
  value: number | string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface ProjectAnalysis {
  health: 'healthy' | 'at_risk' | 'critical';
  metrics: ProjectMetric[];
  risks: string[];
  recommendations: string[];
}

/**
 * ProjectDomainPlugin provides AI agents with construction project management expertise
 */
export class ProjectDomainPlugin implements IPlugin<ProjectDomainContext> {
  id = 'platform-project-domain';
  name = 'Project Domain Plugin';
  description = 'Provides construction project management domain knowledge including health analysis, risk assessment, and optimization recommendations';
  version = '1.0.0';
  isEnabled = true;
  hooks = ['pre-execute', 'post-execute'];
  dependencies = [];
  metadata = {
    author: 'CortexBuild AI',
    category: 'domain',
    tags: ['project', 'construction', 'management', 'health', 'risk'],
  };

  async initialize(_context: any): Promise<void> {
    return Promise.resolve();
  }

  async execute(context: ProjectDomainContext): Promise<ProjectAnalysis> {
    const { projectId, action, data } = context;

    switch (action) {
      case 'analyze':
        return this.analyzeProject(data);
      case 'summarize':
        return this.summarizeProject(data);
      case 'forecast':
        return this.forecastProject(data);
      case 'optimize':
        return this.optimizeProject(data);
      case 'risk_assess':
        return this.riskAssessProject(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async cleanup(): Promise<void> {
    return Promise.resolve();
  }

  private analyzeProject(data: any): ProjectAnalysis {
    const metrics: ProjectMetric[] = [];
    const risks: string[] = [];
    const recommendations: string[] = [];

    if (!data) {
      return {
        health: 'healthy',
        metrics: [],
        risks: [],
        recommendations: ['No project data available for analysis'],
      };
    }

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;
    const status = data.status || 'unknown';

    const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0;

    metrics.push({
      label: 'Budget Utilization',
      value: `${budgetUtilization.toFixed(1)}%`,
      status: budgetUtilization > 90 ? 'critical' : budgetUtilization > 75 ? 'warning' : 'good',
      trend: budgetUtilization > 90 ? 'up' : budgetUtilization > 75 ? 'stable' : 'stable',
    });

    metrics.push({
      label: 'Progress',
      value: `${progress}%`,
      status: progress >= 50 ? 'good' : progress >= 25 ? 'warning' : 'critical',
      trend: 'up',
    });

    if (status === 'on_hold') {
      metrics.push({
        label: 'Status',
        value: 'On Hold',
        status: 'critical',
      });
      risks.push('Project is currently on hold');
      recommendations.push('Review project hold reasons and develop reactivation plan');
    } else if (status === 'delayed') {
      metrics.push({
        label: 'Status',
        value: 'Delayed',
        status: 'warning',
      });
      risks.push('Project is behind schedule');
      recommendations.push('Identify critical path tasks and allocate additional resources');
    } else {
      metrics.push({
        label: 'Status',
        value: 'Active',
        status: 'good',
      });
    }

    if (budgetUtilization > 100) {
      risks.push(`Budget overrun: ${(budgetUtilization - 100).toFixed(1)}% over budget`);
      recommendations.push('Review change orders and scope for potential cost reductions');
    }

    if (progress < 50 && budgetUtilization > 60) {
      risks.push('Spending is ahead of progress - potential scope creep');
      recommendations.push('Conduct progress vs spend analysis to identify efficiency issues');
    }

    const health = risks.length === 0 ? 'healthy' : risks.some(r => r.includes('critical')) ? 'critical' : 'at_risk';

    return { health, metrics, risks, recommendations };
  }

  private summarizeProject(data: any): any {
    if (!data) return {};

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;

    return {
      name: data.name,
      number: data.project_number || data.number,
      status: data.status,
      client: data.client_name || data.client?.name,
      manager: data.manager_name || data.manager?.name,
      budget,
      spent,
      remaining: budget - spent,
      progress,
      budgetHealth: budget > 0 ? ((spent / budget) * 100).toFixed(1) + '%' : 'N/A',
      startDate: data.start_date || data.startDate,
      endDate: data.end_date || data.endDate,
    };
  }

  private forecastProject(data: any): any {
    if (!data) return {};

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;

    const burnRate = progress > 0 ? spent / (progress / 100) : 0;
    const projectedFinal = burnRate * 100;
    const projectedOverrun = budget > 0 ? ((projectedFinal - budget) / budget) * 100 : 0;

    return {
      currentBurnRate: burnRate,
      projectedFinalCost: projectedFinal,
      projectedOverrunPercent: projectedOverrun.toFixed(1) + '%',
      projectedOverrunAmount: projectedFinal - budget,
      willExceedBudget: projectedFinal > budget,
      confidence: progress > 20 ? 'medium' : progress > 50 ? 'high' : 'low',
    };
  }

  private optimizeProject(data: any): any {
    const recommendations: string[] = [];

    if (!data) {
      recommendations.push('No project data available for optimization analysis');
      return { recommendations };
    }

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;
    const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0;

    if (budgetUtilization > 80 && budgetUtilization < 100) {
      recommendations.push('Consider reviewing pending change orders for scope reduction');
      recommendations.push('Identify tasks that could be deferred to future phases');
    }

    if (progress < 50) {
      recommendations.push('Early phase - focus on critical path optimization');
      recommendations.push('Review resource allocation for bottleneck tasks');
    }

    if (data.tasks?.length > 0) {
      const overdueTasks = data.tasks.filter((t: any) => t.status === 'overdue');
      if (overdueTasks.length > 0) {
        recommendations.push(`${overdueTasks.length} overdue tasks need attention`);
      }
    }

    recommendations.push('Regular progress meetings can help identify issues early');
    recommendations.push('Consider implementing last planner methodology for schedule optimization');

    return { recommendations };
  }

  private riskAssessProject(data: any): any {
    const risks: Array<{ category: string; description: string; severity: 'low' | 'medium' | 'high'; likelihood: 'low' | 'medium' | 'high' }> = [];

    if (!data) {
      risks.push({
        category: 'Data',
        description: 'Insufficient project data for risk assessment',
        severity: 'medium',
        likelihood: 'high',
      });
      return { risks };
    }

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;
    const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0;

    if (budgetUtilization > 90) {
      risks.push({
        category: 'Financial',
        description: 'Budget overrun risk - current spend exceeds 90% of budget',
        severity: 'high',
        likelihood: 'high',
      });
    }

    if (progress < 50 && budgetUtilization > 60) {
      risks.push({
        category: 'Schedule',
        description: 'Spending ahead of progress indicates potential inefficiency',
        severity: 'medium',
        likelihood: 'medium',
      });
    }

    if (data.status === 'on_hold') {
      risks.push({
        category: 'Execution',
        description: 'Project on hold - may face restart challenges',
        severity: 'high',
        likelihood: 'high',
      });
    }

    const today = new Date();
    const endDate = data.end_date ? new Date(data.end_date) : null;
    if (endDate && endDate < today && data.status !== 'completed') {
      risks.push({
        category: 'Schedule',
        description: 'Project past original end date without completion',
        severity: 'high',
        likelihood: 'high',
      });
    }

    if (data.rfis?.length > 0) {
      const openRfis = data.rfis.filter((r: any) => r.status === 'open' || r.status === 'pending');
      if (openRfis.length > 5) {
        risks.push({
          category: 'Communication',
          description: `Multiple open RFIs (${openRfis.length}) may impact decision making`,
          severity: 'medium',
          likelihood: 'medium',
        });
      }
    }

    if (risks.length === 0) {
      risks.push({
        category: 'General',
        description: 'No significant risks identified - project appears stable',
        severity: 'low',
        likelihood: 'low',
      });
    }

    return { risks };
  }
}

export const projectDomainPlugin = new ProjectDomainPlugin();
