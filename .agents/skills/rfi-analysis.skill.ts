import { ISkill } from '../../../lib/ai/system/interfaces';

export interface RFISkillContext {
  rfiSubject: string;
  rfiDescription: string;
  trade: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  drawings?: string[];
  specifications?: string[];
  projectType?: string;
}

export interface RFISkillResult {
  success: boolean;
  rfiAnalysis: {
    subject: string;
    category: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedResponseTime: string;
    requiredParties: string[];
    relatedSpecifications: string[];
    relatedDrawings: string[];
  };
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  costImpact: {
    estimated: number;
    currency: string;
    basis: string;
  };
  scheduleImpact: {
    delayRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
    criticalPath: boolean;
    floatImpact: string;
  };
  recommendations: string[];
  questions: string[];
  complianceCheck: {
    passed: boolean;
    missingInfo: string[];
    codeReferences: string[];
  };
  createdAt: string;
}

/**
 * Skill for analyzing and processing Requests for Information (RFIs)
 */
export const rfiAnalysisSkill: ISkill<RFISkillContext> = {
  id: 'rfi-analysis',
  name: 'RFI Analysis',
  description: 'Analyzes Requests for Information to categorize, assess impact, and recommend responses',
  version: '1.0.0',
  isEnabled: true,
  tags: ['rfi', 'construction', 'document-analysis', 'communication'],

  execute: async (context: RFISkillContext): Promise<RFISkillResult> => {
    const {
      rfiSubject,
      rfiDescription,
      trade,
      priority = 'medium',
      location,
      drawings = [],
      specifications = [],
      projectType = 'commercial'
    } = context;

    const category = categorizeRFI(rfiSubject, rfiDescription);
    const complexity = assessComplexity(rfiDescription, drawings, specifications);
    const requiredParties = determineRequiredParties(trade, category);
    const riskFactors = analyzeRiskFactors(rfiSubject, rfiDescription, category, priority);
    const costImpact = estimateCostImpact(category, complexity, rfiDescription);
    const scheduleImpact = assessScheduleImpact(category, priority, complexity);
    const recommendations = generateRecommendations(category, complexity, riskFactors);
    const questions = generateClarifyingQuestions(rfiSubject, rfiDescription, category);
    const complianceCheck = performComplianceCheck(rfiSubject, rfiDescription, category);

    return {
      success: true,
      rfiAnalysis: {
        subject: rfiSubject,
        category,
        complexity,
        estimatedResponseTime: getEstimatedResponseTime(complexity, priority),
        requiredParties,
        relatedSpecifications: specifications.length > 0 ? specifications : getDefaultSpecifications(category),
        relatedDrawings: drawings.length > 0 ? drawings : getDefaultDrawings(category)
      },
      riskFactors,
      costImpact,
      scheduleImpact,
      recommendations,
      questions,
      complianceCheck,
      createdAt: new Date().toISOString()
    };
  }
};

function categorizeRFI(subject: string, description: string): string {
  const text = `${subject} ${description}`.toLowerCase();
  
  if (text.includes('structural') || text.includes('beam') || text.includes('column') || text.includes('foundation')) {
    return 'Structural';
  }
  if (text.includes('mep') || text.includes('mechanical') || text.includes('electrical') || text.includes('plumbing') || text.includes('hvac')) {
    return 'MEP';
  }
  if (text.includes('architectural') || text.includes('finish') || text.includes('material') || text.includes('color')) {
    return 'Architectural';
  }
  if (text.includes('specification') || text.includes('conflict') || text.includes('division')) {
    return 'Specification';
  }
  if (text.includes('coordination') || text.includes('clash') || text.includes('interference')) {
    return 'Coordination';
  }
  if (text.includes('permission') || text.includes('approval') || text.includes('authorize')) {
    return 'Administrative';
  }
  
  return 'General';
}

function assessComplexity(description: string, drawings: string[], specifications: string[]): 'simple' | 'moderate' | 'complex' {
  let score = 0;
  
  if (description.length > 200) score += 1;
  if (drawings.length > 3) score += 1;
  if (specifications.length > 2) score += 1;
  if (description.includes('or equivalent') || description.includes('approved equal')) score += 1;
  if (description.includes('conflict') || description.includes('discrepancy')) score += 1;
  
  if (score <= 1) return 'simple';
  if (score <= 3) return 'moderate';
  return 'complex';
}

function determineRequiredParties(trade: string, category: string): string[] {
  const parties = ['General Contractor'];
  
  if (trade) parties.push(`${trade} Contractor`);
  
  switch (category) {
    case 'Structural':
      parties.push('Structural Engineer', 'Owner\'s Representative');
      break;
    case 'MEP':
      parties.push('MEP Engineer', 'Commissioning Agent');
      break;
    case 'Architectural':
      parties.push('Architect of Record');
      break;
    case 'Specification':
      parties.push('Architect of Record', 'Owner\'s Representative');
      break;
    default:
      parties.push('Owner\'s Representative');
  }
  
  return [...new Set(parties)];
}

function analyzeRiskFactors(
  subject: string,
  description: string,
  category: string,
  priority: string
): Array<{ factor: string; severity: 'low' | 'medium' | 'high'; mitigation: string }> {
  const factors: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; mitigation: string }> = [];
  
  if (category === 'Structural') {
    factors.push({
      factor: 'Structural modifications may require engineering seals',
      severity: 'high',
      mitigation: 'Engage structural engineer for review and wet signature'
    });
  }
  
  if (priority === 'critical' || priority === 'high') {
    factors.push({
      factor: 'High priority RFI may disrupt scheduled work',
      severity: 'medium',
      mitigation: 'Expedite review process; consider temporary solution to maintain schedule'
    });
  }
  
  if (description.includes('or equivalent') || description.includes('approved equal')) {
    factors.push({
      factor: 'Substitution request requires thorough evaluation',
      severity: 'medium',
      mitigation: 'Verify submitted equals meet specification requirements'
    });
  }
  
  if (description.includes('cost') || description.includes('pricing') || description.includes('budget')) {
    factors.push({
      factor: 'Cost implications require commercial review',
      severity: 'high',
      mitigation: 'Include commercial team in response; document all cost impacts'
    });
  }
  
  if (factors.length === 0) {
    factors.push({
      factor: 'Standard RFI with minimal identified risks',
      severity: 'low',
      mitigation: 'Proceed with normal review process'
    });
  }
  
  return factors;
}

function estimateCostImpact(category: string, complexity: string, description: string): { estimated: number; currency: string; basis: string } {
  let baseEstimate = 0;
  let basis = 'Base estimate';
  
  if (description.toLowerCase().includes('cost') || description.toLowerCase().includes('price')) {
    const match = description.match(/\$[\d,]+/);
    if (match) {
      const amount = parseInt(match[0].replace(/[$,]/g, ''));
      baseEstimate = amount;
      basis = 'Amount specified in RFI';
    }
  }
  
  if (baseEstimate === 0) {
    switch (complexity) {
      case 'simple':
        baseEstimate = 500;
        basis = 'Industry average for simple RFI response';
        break;
      case 'moderate':
        baseEstimate = 2500;
        basis = 'Industry average for moderate complexity RFI';
        break;
      case 'complex':
        baseEstimate = 10000;
        basis = 'Industry average for complex RFI with potential scope change';
        break;
    }
  }
  
  return {
    estimated: baseEstimate,
    currency: 'USD',
    basis
  };
}

function assessScheduleImpact(category: string, priority: string, complexity: string): {
  delayRisk: 'none' | 'low' | 'medium' | 'high';
  criticalPath: boolean;
  floatImpact: string;
} {
  let delayRisk: 'none' | 'low' | 'medium' | 'high' = 'low';
  let criticalPath = false;
  let floatImpact = 'No impact on project float';
  
  if (category === 'Structural' || category === 'MEP') {
    delayRisk = 'medium';
    criticalPath = true;
    floatImpact = 'May impact critical path if not resolved within 3-5 days';
  }
  
  if (priority === 'critical' || priority === 'high') {
    delayRisk = 'high';
    criticalPath = true;
    floatImpact = 'Will impact critical path if not resolved within 24-48 hours';
  }
  
  return { delayRisk, criticalPath, floatImpact };
}

function getEstimatedResponseTime(complexity: string, priority: string): string {
  if (priority === 'critical') return '24 hours';
  if (priority === 'high') return '48 hours';
  
  switch (complexity) {
    case 'simple':
      return '3-5 business days';
    case 'moderate':
      return '5-7 business days';
    case 'complex':
      return '7-14 business days';
    default:
      return '5-7 business days';
  }
}

function generateRecommendations(category: string, complexity: string, riskFactors: any[]): string[] {
  const recommendations: string[] = [];
  
  recommendations.push('Assign to appropriate discipline lead for review');
  
  if (category === 'Structural') {
    recommendations.push('Route to structural engineer for technical review');
    recommendations.push('Obtain wet signature for any structural modifications');
  }
  
  if (category === 'MEP') {
    recommendations.push('Coordinate with MEP coordinator for integration check');
    recommendations.push('Verify with commissioning agent if applicable');
  }
  
  if (complexity === 'complex') {
    recommendations.push('Schedule coordination meeting with all required parties');
    recommendations.push('Document all discussions and decisions in RFI response');
  }
  
  const highSeverityRisks = riskFactors.filter(r => r.severity === 'high');
  if (highSeverityRisks.length > 0) {
    recommendations.push('Escalate to project manager for awareness');
    recommendations.push('Consider schedule impact assessment');
  }
  
  recommendations.push('Update RFI log with response deadline');
  
  return recommendations;
}

function generateClarifyingQuestions(subject: string, description: string, category: string): string[] {
  const questions: string[] = [];
  
  if (description.length < 50) {
    questions.push('Please provide more detailed description of the issue or question');
  }
  
  if (!description.includes('location') && !description.includes('where')) {
    questions.push('Can you specify the exact location (floor, area, grid reference)?');
  }
  
  if (!description.includes('when') && !description.includes('date')) {
    questions.push('When is this information needed by?');
  }
  
  if (category === 'Specification' && !description.includes('spec section')) {
    questions.push('Please reference the applicable specification section');
  }
  
  return questions;
}

function performComplianceCheck(subject: string, description: string, category: string): {
  passed: boolean;
  missingInfo: string[];
  codeReferences: string[];
} {
  const missingInfo: string[] = [];
  const codeReferences: string[] = [];
  
  if (description.length < 50) {
    missingInfo.push('Detailed description');
  }
  
  if (category === 'Structural') {
    codeReferences.push('IBC Chapter 16 - Structural Design');
    codeReferences.push('ASCE 7 - Minimum Design Loads');
  }
  
  if (category === 'MEP') {
    codeReferences.push('IBC Chapter 13 - General Safety Provisions');
    codeReferences.push('Applicable MEP Codes per jurisdiction');
  }
  
  return {
    passed: missingInfo.length === 0,
    missingInfo,
    codeReferences
  };
}

function getDefaultSpecifications(category: string): string[] {
  const specs: Record<string, string[]> = {
    'Structural': ['Section 05 12 00 - Structural Steel', 'Section 03 30 00 - Cast-in-Place Concrete'],
    'MEP': ['Section 26 00 00 - Electrical', 'Section 23 00 00 - HVAC', 'Section 22 00 00 - Plumbing'],
    'Architectural': ['Section 09 00 00 - Finishes', 'Section 06 00 00 - Wood and Plastics'],
    'General': ['Section 01 00 00 - General Requirements']
  };
  return specs[category] || specs['General'];
}

function getDefaultDrawings(category: string): string[] {
  return ['Refer to drawings per specification'];
}
