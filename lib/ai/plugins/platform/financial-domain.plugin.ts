/**
 * Financial Domain Plugin
 * Provides construction financial management domain knowledge to AI agents
 */

import type { IPlugin } from '../../system/interfaces';

export interface FinancialDomainContext {
  projectId?: string;
  action: 'analyze' | 'forecast' | 'optimize' | 'cash_flow' | 'profitability';
  data?: any;
}

interface CostAnalysis {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  utilizationPercent: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  breakdown: Array<{ category: string; budget: number; spent: number; variance: number }>;
  risks: string[];
  recommendations: string[];
}

/**
 * FinancialDomainPlugin provides AI agents with construction finance expertise
 */
export class FinancialDomainPlugin implements IPlugin<FinancialDomainContext> {
  id = 'platform-financial-domain';
  name = 'Financial Domain Plugin';
  description = 'Provides construction financial management domain knowledge including cost analysis, cash flow forecasting, and profitability assessment';
  version = '1.0.0';
  isEnabled = true;
  hooks = ['pre-execute', 'post-execute'];
  dependencies = [];
  metadata = {
    author: 'CortexBuild AI',
    category: 'domain',
    tags: ['financial', 'construction', 'cost', 'budget', 'cashflow', 'profitability'],
  };

  async initialize(_context: any): Promise<void> {
    return Promise.resolve();
  }

  async execute(context: FinancialDomainContext): Promise<any> {
    const { action, data } = context;

    switch (action) {
      case 'analyze':
        return this.analyzeCosts(data);
      case 'forecast':
        return this.forecastCosts(data);
      case 'optimize':
        return this.optimizeCosts(data);
      case 'cash_flow':
        return this.analyzeCashFlow(data);
      case 'profitability':
        return this.analyzeProfitability(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async cleanup(): Promise<void> {
    return Promise.resolve();
  }

  private analyzeCosts(data: any): CostAnalysis {
    const analysis: CostAnalysis = {
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      utilizationPercent: 0,
      healthStatus: 'healthy',
      breakdown: [],
      risks: [],
      recommendations: [],
    };

    if (!data) {
      analysis.recommendations.push('No financial data available for analysis');
      return analysis;
    }

    analysis.totalBudget = data.budget || 0;
    analysis.totalSpent = data.actual_cost || 0;
    analysis.remaining = analysis.totalBudget - analysis.totalSpent;

    if (analysis.totalBudget > 0) {
      analysis.utilizationPercent = (analysis.totalSpent / analysis.totalBudget) * 100;
    }

    if (analysis.utilizationPercent > 100) {
      analysis.healthStatus = 'critical';
      analysis.risks.push(`Budget overrun: $${(analysis.totalSpent - analysis.totalBudget).toLocaleString()} over budget`);
    } else if (analysis.utilizationPercent > 85) {
      analysis.healthStatus = 'warning';
      analysis.risks.push('Budget approaching limit - monitor spending closely');
    } else {
      analysis.healthStatus = 'healthy';
    }

    if (data.changeOrders && data.changeOrders.length > 0) {
      const pendingCOs = data.changeOrders.filter((co: any) => co.status === 'pending');
      if (pendingCOs.length > 0) {
        const potentialCOValue = pendingCOs.reduce((sum: number, co: any) => sum + (co.cost_change || 0), 0);
        analysis.risks.push(`${pendingCOs.length} pending change orders totaling $${potentialCOValue.toLocaleString()}`);
        analysis.recommendations.push('Review and approve/deny pending change orders to clarify budget');
      }
    }

    if (data.invoices && data.invoices.length > 0) {
      const overdueInvoices = data.invoices.filter((inv: any) => inv.status === 'overdue');
      if (overdueInvoices.length > 0) {
        analysis.risks.push(`${overdueInvoices.length} overdue invoices may impact cash flow`);
      }
    }

    if (analysis.healthStatus === 'critical') {
      analysis.recommendations.push('Conduct immediate budget review and identify cost reduction opportunities');
      analysis.recommendations.push('Consider scope reduction if budget overrun cannot be avoided');
    } else if (analysis.healthStatus === 'warning') {
      analysis.recommendations.push('Implement weekly budget reviews for the remainder of the project');
      analysis.recommendations.push('Document any scope changes through formal change orders');
    } else {
      analysis.recommendations.push('Continue monitoring spending against budget');
      analysis.recommendations.push('Maintain reserve for unexpected costs');
    }

    return analysis;
  }

  private forecastCosts(data: any): any {
    if (!data) return {};

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;

    const burnRate = progress > 0 ? spent / (progress / 100) : 0;
    const projectedFinal = burnRate * 100;
    const variance = projectedFinal - budget;

    return {
      currentBurnRate: burnRate,
      projectedFinalCost: projectedFinal,
      budgetVariance: variance,
      variancePercent: budget > 0 ? ((variance / budget) * 100).toFixed(1) + '%' : '0%',
      willExceedBudget: projectedFinal > budget,
      confidence: progress > 20 ? 'medium' : progress > 50 ? 'high' : 'low',
      scenarios: {
        bestCase: burnRate * 0.9 * 100,
        worstCase: burnRate * 1.2 * 100,
        expected: projectedFinal,
      },
    };
  }

  private optimizeCosts(data: any): any {
    const recommendations: string[] = [];

    if (!data) {
      recommendations.push('No data available for cost optimization analysis');
      return { recommendations };
    }

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const progress = data.progress || 0;
    const utilization = budget > 0 ? (spent / budget) * 100 : 0;

    if (utilization > 80 && utilization < 100) {
      recommendations.push('Review pending commitments and change orders for potential scope reduction');
      recommendations.push('Identify material substitution opportunities that meet specifications');
    }

    if (data.tasks && data.tasks.length > 0) {
      const highCostTasks = data.tasks
        .filter((t: any) => (t.actual_hours || 0) > (t.estimated_hours || 0) * 1.2)
        .sort((a: any, b: any) => (b.actual_hours - b.estimated_hours) - (a.actual_hours - a.estimated_hours));

      if (highCostTasks.length > 0) {
        recommendations.push(`${highCostTasks.length} tasks are exceeding estimates - review for efficiency gains`);
      }
    }

    if (utilization < 50 && progress > 50) {
      recommendations.push('Spending is behind schedule - may need to accelerate work');
    }

    recommendations.push('Consolidate small purchases to negotiate better rates');
    recommendations.push('Review subcontractor change orders for duplicate scope');

    return { recommendations };
  }

  private analyzeCashFlow(data: any): any {
    if (!data) return { summary: 'No data available' };

    const invoices = data.invoices || [];
    const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
    const pendingInvoices = invoices.filter((i: any) => i.status === 'pending' || i.status === 'sent');
    const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue');

    const totalPaid = paidInvoices.reduce((sum: number, i: any) => sum + (i.total_amount || i.amount || 0), 0);
    const totalPending = pendingInvoices.reduce((sum: number, i: any) => sum + (i.total_amount || i.amount || 0), 0);
    const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (i.total_amount || i.amount || 0), 0);

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      cashFlowHealth: totalOverdue > totalPending * 0.3 ? 'critical' : totalOverdue > 0 ? 'warning' : 'healthy',
      recommendations: totalOverdue > 0
        ? ['Prioritize collection of overdue invoices', 'Review client payment terms']
        : ['Maintain current payment collection processes'],
    };
  }

  private analyzeProfitability(data: any): any {
    if (!data) return { summary: 'No data available' };

    const budget = data.budget || 0;
    const spent = data.actual_cost || 0;
    const revenue = data.revenue || budget;
    const profit = revenue - spent;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue,
      cost: spent,
      profit,
      margin: margin.toFixed(1) + '%',
      profitabilityHealth: margin > 20 ? 'healthy' : margin > 10 ? 'warning' : 'critical',
      recommendations: margin < 10
        ? ['Review scope for cost reduction opportunities', 'Consider change orders for additional revenue']
        : margin < 20
        ? ['Monitor costs closely to maintain margin']
        : ['Maintain current practices'],
    };
  }
}

export const financialDomainPlugin = new FinancialDomainPlugin();
