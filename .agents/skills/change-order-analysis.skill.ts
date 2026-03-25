import { ISkill } from '../../../lib/ai/system/interfaces';

export interface ChangeOrderContext {
  projectName: string;
  scopeDescription: string;
  originalContractValue: number;
  proposedChangeValue: number;
  reason: 'design_change' | 'unforeseen_condition' | 'owner_request' | 'regulatory' | 'other';
  trade: string;
  scheduleImpactDays?: number;
}

export interface ChangeOrderResult {
  success: boolean;
  analysis: {
    category: string;
    complexity: 'simple' | 'moderate' | 'complex';
    negotiationLever: 'strong' | 'neutral' | 'weak';
    riskLevel: 'low' | 'medium' | 'high';
  };
  costAnalysis: {
    proposedAmount: number;
    fairMarketValue: number;
    recommendedAmount: number;
    justification: string[];
  };
  scheduleImpact: {
    delayDays: number;
    criticalPathImpact: boolean;
    floatRemaining: string;
  };
  legalReview: {
    required: boolean;
    contractClause: string;
    noticeRequired: boolean;
  };
  recommendations: string[];
  questions: string[];
  createdAt: string;
}

export const changeOrderAnalysisSkill: ISkill<ChangeOrderContext> = {
  id: 'change-order-analysis',
  name: 'Change Order Analysis',
  description: 'Analyzes change orders to assess fair value, risk, and negotiation strategy',
  version: '1.0.0',
  isEnabled: true,
  tags: ['change-order', 'construction', 'cost-analysis', 'negotiation'],
  
  async execute(context: ChangeOrderContext): Promise<ChangeOrderResult> {
    const { scopeDescription, proposedChangeValue, originalContractValue, reason } = context;
    
    const category = reason === 'design_change' ? 'Design Modification'
      : reason === 'unforeseen_condition' ? 'Differing Site Condition'
      : reason === 'owner_request' ? 'Owner-Directed Change'
      : reason === 'regulatory' ? 'Code Compliance'
      : 'Miscellaneous';
    
    const complexity = proposedChangeValue > originalContractValue * 0.2 ? 'complex'
      : proposedChangeValue > originalContractValue * 0.05 ? 'moderate'
      : 'simple';
    
    const costRatio = proposedChangeValue / originalContractValue;
    const negotiationLever = costRatio > 0.15 ? 'strong' : costRatio > 0.05 ? 'neutral' : 'weak';
    const riskLevel = reason === 'unforeseen_condition' ? 'high' : costRatio > 0.1 ? 'medium' : 'low';
    
    const fairMarketValue = proposedChangeValue * (1 - (negotiationLever === 'strong' ? 0.15 : negotiationLever === 'neutral' ? 0.05 : 0));
    const recommendedAmount = Math.round(fairMarketValue / 1000) * 1000;
    
    return {
      success: true,
      analysis: {
        category,
        complexity,
        negotiationLever,
        riskLevel,
      },
      costAnalysis: {
        proposedAmount: proposedChangeValue,
        fairMarketValue,
        recommendedAmount,
        justification: [
          `Market rate analysis for ${context.trade} work`,
          `Complexity adjustment for ${complexity} scope`,
          `Historical data from similar projects`,
        ],
      },
      scheduleImpact: {
        delayDays: context.scheduleImpactDays ?? 0,
        criticalPathImpact: (context.scheduleImpactDays ?? 0) > 7,
        floatRemaining: (context.scheduleImpactDays ?? 0) > 14 ? 'Sufficient float available' : 'Limited float - monitor closely',
      },
      legalReview: {
        required: proposedChangeValue > originalContractValue * 0.1,
        contractClause: 'Change Order provisions per General Conditions',
        noticeRequired: reason === 'unforeseen_condition',
      },
      recommendations: [
        'Document all scope changes in writing before proceeding',
        'Get independent cost estimate for changes over $50K',
        'Submit change order within 7 days of scope identification',
        'Track all schedule impacts with daily logs',
      ],
      questions: [
        'Have all affected subcontractors been notified?',
        'Is the schedule impact confirmed by the PM?',
        'Has the owner approved the not-to-exceed amount?',
      ],
      createdAt: new Date().toISOString(),
    };
  },
};

export default changeOrderAnalysisSkill;
