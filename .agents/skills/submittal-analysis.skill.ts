import { ISkill } from '../../../lib/ai/system/interfaces';

export interface SubmittalSkillContext {
  submittalId: string;
  submittalName: string;
  submittalType: string;
  specificationSection: string;
  description: string;
  contractor: string;
  priority?: 'low' | 'medium' | 'high';
  projectType?: string;
}

export interface SubmittalSkillResult {
  success: boolean;
  submittalAnalysis: {
    id: string;
    name: string;
    type: string;
    category: string;
    specificationSection: string;
    priority: string;
    reviewLevel: 'standard' | 'detailed' | 'expedited';
    estimatedReviewTime: string;
  };
  complianceCheck: {
    isComplete: boolean;
    missingElements: string[];
    codeRequirements: string[];
    certificationRequired: boolean;
    certificationTypes: string[];
  };
  qualityAssessment: {
    completeness: number;
    clarity: number;
    constructibility: number;
    issues: string[];
  };
  scheduleImpact: {
    submittalDelayRisk: 'none' | 'low' | 'medium' | 'high';
    approvalNeededBy: string;
    leadTimeImpact: string;
  };
  shopDrawingReview: {
    isRequired: boolean;
    coordinationRequired: boolean;
    structuralReview: boolean;
    MEPReview: boolean;
    architecturalReview: boolean;
  };
  recommendations: string[];
  warnings: string[];
  createdAt: string;
}

/**
 * Skill for analyzing and processing submittals (shop drawings, samples, etc.)
 */
export const submittalAnalysisSkill: ISkill<SubmittalSkillContext> = {
  id: 'submittal-analysis',
  name: 'Submittal Analysis',
  description: 'Analyzes submittals for completeness, compliance, and coordination requirements',
  version: '1.0.0',
  isEnabled: true,
  tags: ['submittal', 'construction', 'shop-drawing', 'compliance', 'review'],

  execute: async (context: SubmittalSkillContext): Promise<SubmittalSkillResult> => {
    const {
      submittalId,
      submittalName,
      submittalType,
      specificationSection,
      description,
      contractor,
      priority = 'medium',
      projectType = 'commercial'
    } = context;

    const category = categorizeSubmittal(submittalType, specificationSection);
    const reviewLevel = determineReviewLevel(priority, category);
    const complianceCheck = performSubmittalComplianceCheck(submittalType, description, specificationSection);
    const qualityAssessment = assessSubmittalQuality(submittalName, description, category);
    const scheduleImpact = assessSubmittalSchedule(priority, category);
    const shopDrawingReview = checkShopDrawingRequirements(submittalType, specificationSection);
    const recommendations = generateSubmittalRecommendations(category, qualityAssessment, complianceCheck);
    const warnings = generateSubmittalWarnings(category, complianceCheck, shopDrawingReview);

    return {
      success: true,
      submittalAnalysis: {
        id: submittalId,
        name: submittalName,
        type: submittalType,
        category,
        specificationSection,
        priority,
        reviewLevel,
        estimatedReviewTime: getEstimatedReviewTime(reviewLevel, category)
      },
      complianceCheck,
      qualityAssessment,
      scheduleImpact,
      shopDrawingReview,
      recommendations,
      warnings,
      createdAt: new Date().toISOString()
    };
  }
};

function categorizeSubmittal(submittalType: string, specSection: string): string {
  const type = submittalType.toLowerCase();
  const spec = specSection.toLowerCase();

  if (type.includes('shop drawing') || type.includes('detail') || type.includes('drawing')) {
    if (spec.includes('structural') || spec.includes('steel') || spec.includes('concrete')) {
      return 'Structural Shop Drawings';
    }
    if (spec.includes('mep') || spec.includes('mechanical') || spec.includes('plumbing') || spec.includes('electrical')) {
      return 'MEP Shop Drawings';
    }
    return 'Architectural Shop Drawings';
  }

  if (type.includes('sample') || type.includes('mockup')) {
    return 'Samples and Mockups';
  }

  if (type.includes('data') || type.includes('sheet') || type.includes('performance')) {
    return 'Product Data';
  }

  if (type.includes('cert') || type.includes('test') || type.includes('report')) {
    return 'Test Reports and Certifications';
  }

  if (type.includes('instruction') || type.includes('manual')) {
    return 'O&M Data';
  }

  return 'General Submittal';
}

function determineReviewLevel(priority: string, category: string): 'standard' | 'detailed' | 'expedited' {
  if (priority === 'high' || priority === 'critical') {
    return 'expedited';
  }

  if (category === 'Structural Shop Drawings' || category === 'MEP Shop Drawings') {
    return 'detailed';
  }

  return 'standard';
}

function performSubmittalComplianceCheck(
  submittalType: string,
  description: string,
  specSection: string
): {
  isComplete: boolean;
  missingElements: string[];
  codeRequirements: string[];
  certificationRequired: boolean;
  certificationTypes: string[];
} {
  const missingElements: string[] = [];
  const codeRequirements: string[] = [];
  const certificationTypes: string[] = [];

  const desc = description.toLowerCase();
  const type = submittalType.toLowerCase();

  if (description.length < 100) {
    missingElements.push('Detailed description of items being submitted');
  }

  if (!desc.includes('manufacturer') && !desc.includes('vendor')) {
    missingElements.push('Manufacturer and/or vendor information');
  }

  if (!desc.includes('model') && !desc.includes('number') && !desc.includes('part')) {
    missingElements.push('Model number or part identification');
  }

  if (!desc.includes('specification') && !desc.includes('spec')) {
    missingElements.push('Reference to specification section');
  }

  if (type.includes('sample')) {
    certificationTypes.push('Material certification');
    if (!desc.includes('color') && !desc.includes('finish')) {
      missingElements.push('Color/finish information for samples');
    }
  }

  if (type.includes('shop drawing')) {
    codeRequirements.push('Coordination with all related trades');
    codeRequirements.push('Dimension verification');
    certificationTypes.push('Professional seal if required by jurisdiction');
  }

  if (type.includes('structural')) {
    codeRequirements.push('Structural calculations (if applicable)');
    codeRequirements.push('IBC Chapter 16 compliance');
    certificationTypes.push('Professional Engineer stamp');
  }

  if (type.includes('fire') || type.includes('life safety')) {
    codeRequirements.push('Fire marshal approval');
    codeRequirements.push('NFPA compliance documentation');
  }

  return {
    isComplete: missingElements.length === 0,
    missingElements,
    codeRequirements,
    certificationRequired: certificationTypes.length > 0,
    certificationTypes: [...new Set(certificationTypes)]
  };
}

function assessSubmittalQuality(
  name: string,
  description: string,
  category: string
): {
  completeness: number;
  clarity: number;
  constructibility: number;
  issues: string[];
} {
  let completeness = 70;
  let clarity = 75;
  let constructibility = 80;
  const issues: string[] = [];

  if (description.length > 200) completeness += 15;
  else if (description.length < 100) completeness -= 20;

  if (description.includes('dimension') || description.includes('size') || description.includes('measurement')) {
    clarity += 10;
  } else {
    issues.push('Missing dimensional information');
    clarity -= 10;
  }

  if (description.includes('coordinate') || description.includes('coordination')) {
    constructibility += 10;
  } else if (category.includes('Shop Drawing')) {
    constructibility -= 15;
    issues.push('Coordination with other trades not addressed');
  }

  if (description.includes('tolerance') || description.includes('toleranc')) {
    constructibility += 5;
  }

  completeness = Math.min(100, Math.max(0, completeness));
  clarity = Math.min(100, Math.max(0, clarity));
  constructibility = Math.min(100, Math.max(0, constructibility));

  return { completeness, clarity, constructibility, issues };
}

function assessSubmittalSchedule(
  priority: string,
  category: string
): {
  submittalDelayRisk: 'none' | 'low' | 'medium' | 'high';
  approvalNeededBy: string;
  leadTimeImpact: string;
} {
  let submittalDelayRisk: 'none' | 'low' | 'medium' | 'high' = 'low';
  let leadTimeImpact = 'Standard lead time applies';

  if (priority === 'high' || priority === 'critical') {
    submittalDelayRisk = 'high';
    leadTimeImpact = 'Expedited review needed - 24-48 hour turnaround';
  }

  if (category === 'Structural Shop Drawings') {
    submittalDelayRisk = 'medium';
    leadTimeImpact = 'Structural review requires additional time - allow 7-10 days';
  }

  if (category === 'MEP Shop Drawings') {
    submittalDelayRisk = 'medium';
    leadTimeImpact = 'MEP coordination review requires 5-7 days';
  }

  return {
    submittalDelayRisk,
    approvalNeededBy: calculateApprovalDate(submittalDelayRisk),
    leadTimeImpact
  };
}

function calculateApprovalDate(risk: string): string {
  const daysMap: Record<string, number> = {
    'none': 3,
    'low': 5,
    'medium': 10,
    'high': 3
  };

  const days = daysMap[risk] || 5;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function checkShopDrawingRequirements(
  submittalType: string,
  specSection: string
): {
  isRequired: boolean;
  coordinationRequired: boolean;
  structuralReview: boolean;
  MEPReview: boolean;
  architecturalReview: boolean;
} {
  const type = submittalType.toLowerCase();
  const spec = specSection.toLowerCase();

  const isRequired = type.includes('shop drawing') || type.includes('detail');

  return {
    isRequired,
    coordinationRequired: isRequired,
    structuralReview: spec.includes('structural') || spec.includes('steel') || spec.includes('concrete'),
    MEPReview: spec.includes('mep') || spec.includes('mechanical') || spec.includes('plumbing') || spec.includes('electrical'),
    architecturalReview: !spec.includes('structural') && !spec.includes('mep') && !spec.includes('mechanical')
  };
}

function getEstimatedReviewTime(reviewLevel: string, category: string): string {
  const baseTimes: Record<string, string> = {
    'standard': '5-7 business days',
    'detailed': '7-14 business days',
    'expedited': '24-48 hours'
  };

  let time = baseTimes[reviewLevel] || baseTimes['standard'];

  if (category === 'Structural Shop Drawings') {
    time = reviewLevel === 'expedited' ? '48-72 hours' : '10-14 business days';
  }

  return time;
}

function generateSubmittalRecommendations(
  category: string,
  quality: any,
  compliance: any
): string[] {
  const recommendations: string[] = [];

  recommendations.push('Assign to appropriate reviewer based on submittal type');

  if (category === 'Structural Shop Drawings') {
    recommendations.push('Route to structural engineer for technical review');
    recommendations.push('Verify all dimensions match contract documents');
    recommendations.push('Check coordination with architectural and MEP drawings');
  }

  if (category === 'MEP Shop Drawings') {
    recommendations.push('Route to MEP coordinator');
    recommendations.push('Verify ceiling clearance and coordination');
    recommendations.push('Check mechanical and electrical coordination');
  }

  if (quality.completeness < 80) {
    recommendations.push('Return to contractor for additional information');
  }

  if (compliance.certificationRequired) {
    recommendations.push(`Obtain required certifications: ${compliance.certificationTypes.join(', ')}`);
  }

  if (!compliance.isComplete) {
    recommendations.push('Address missing elements before approval');
  }

  recommendations.push('Document all comments and revision requests');
  recommendations.push('Update submittal log with review status');

  return recommendations;
}

function generateSubmittalWarnings(
  category: string,
  compliance: any,
  shopDrawing: any
): string[] {
  const warnings: string[] = [];

  if (compliance.missingElements.length > 3) {
    warnings.push('Multiple missing elements may indicate contractor misunderstanding of requirements');
  }

  if (category === 'Structural Shop Drawings' && !shopDrawing.structuralReview) {
    warnings.push('WARNING: Structural review may be required');
  }

  if (compliance.certificationRequired && !compliance.certificationTypes.includes('Professional Engineer stamp')) {
    warnings.push('Verify if professional seal is required by local jurisdiction');
  }

  if (shopDrawing.coordinationRequired) {
    warnings.push('Ensure coordination with all affected trades before approval');
  }

  if (warnings.length === 0) {
    warnings.push('No significant warnings for this submittal');
  }

  return warnings;
}
