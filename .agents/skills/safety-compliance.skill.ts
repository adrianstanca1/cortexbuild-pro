import { ISkill } from '../../../lib/ai/system/interfaces';

/**
 * Skill for checking safety compliance in construction projects
 */
export const safetyComplianceSkill: ISkill<{ 
  siteConditions: Array<string>;
  equipmentUsed: Array<string>;
  workActivities: Array<string>;
  regulations: Array<string>;
  workforceTraining: Array<string>;
}> = {
  id: 'safety-compliance',
  name: 'Safety Compliance Checker',
  description: 'Analyzes construction site conditions, equipment, and activities for OSHA and local safety compliance',
  version: '1.0.0',
  execute: async (context) => {
    const { 
      siteConditions, 
      equipmentUsed, 
      workActivities,
      regulations = ['OSHA 1926'], // Default to OSHA construction regulations
      workforceTraining = []
    } = context;
    
    // In a real implementation, this would check against actual safety regulations databases
    // For now, we'll return a mock compliance check
    
    const violations = checkForViolations(siteConditions, equipmentUsed, workActivities);
    const complianceStatus = determineComplianceStatus(violations);
    const recommendations = generateRecommendations(violations, workforceTraining);
    const trainingNeeds = identifyTrainingNeeds(violations, workforceTraining);
    
    const complianceReport = {
      siteConditions,
      equipmentUsed,
      workActivities,
      regulationsChecked: regulations,
      violations,
      complianceStatus,
      recommendations,
      trainingNeeds,
      overallScore: calculateComplianceScore(violations),
      lastUpdated: new Date().toISOString(),
      nextReviewDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Weekly review
    };
    
    return complianceReport;
  },
  metadata: {
    category: 'safety',
    complexity: 'medium',
    estimatedTimeMs: 2500
  },
  tags: ['safety', 'compliance', 'osha', 'construction', 'risk-management'],
  isEnabled: true
};

// Helper functions
function checkForViolations(
  siteConditions: string[],
  equipmentUsed: string[],
  workActivities: string[]
): Array<{id: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; regulation?: string}> {
  const violations: Array<{id: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; regulation?: string}> = [];
  
  // Check site conditions
  siteConditions.forEach(condition => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('unguarded') || conditionLower.includes('exposed')) {
      violations.push({
        id: `site-violations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Unguarded or exposed hazard detected: ${condition}`,
        severity: 'high',
        regulation: 'OSHA 1926.501'
      });
    }
    
    if (conditionLower.includes('wet') || conditionLower.includes('slippery')) {
      violations.push({
        id: `site-violations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Slip/trip hazard detected: ${condition}`,
        severity: 'medium',
        regulation: 'OSHA 1926.25'
      });
    }
  });
  
  // Check equipment
  equipmentUsed.forEach(equipment => {
    const equipmentLower = equipment.toLowerCase();
    if (equipmentLower.includes('ladder') && !equipmentLower.includes('secured')) {
      violations.push({
        id: `equip-violations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Unsecured ladder detected: ${equipment}`,
        severity: 'high',
        regulation: 'OSHA 1926.1053'
      });
    }
    
    if (equipmentLower.includes('scaffold') && !equipmentLower.includes('inspected')) {
      violations.push({
        id: `equip-violations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Uninspected scaffold detected: ${equipment}`,
        severity: 'critical',
        regulation: 'OSHA 1926.451'
      });
    }
  });
  
  // Check work activities
  workActivities.forEach(activity => {
    const activityLower = activity.toLowerCase();
    if (activityLower.includes('welding') || activityLower.includes('cutting')) {
      violations.push({
        id: `work-violations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Hot work activity without proper permitting: ${activity}`,
        severity: 'medium',
        regulation: 'OSHA 1926.352'
      });
    }
    
    if (activityLower.includes('excavation') || activityLower.includes('trenching')) {
      violations.push({
        id: `work-violations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Excavation/trenching activity without proper protective systems: ${activity}`,
        severity: 'high',
        regulation: 'OSHA 1926.650'
      });
    }
  });
  
  return violations;
}

function determineComplianceStatus(violations: any[]): 'compliant' | 'warning' | 'non-compliant' | 'critical' {
  if (violations.some(v => v.severity === 'critical')) {
    return 'critical';
  }
  
  if (violations.some(v => v.severity === 'high')) {
    return 'non-compliant';
  }
  
  if (violations.length > 3) {
    return 'non-compliant';
  }
  
  if (violations.length > 0) {
    return 'warning';
  }
  
  return 'compliant';
}

function generateRecommendations(violations: any[], workforceTraining: string[]): string[] {
  const recommendations: string[] = [];
  
  violations.forEach(violation => {
    if (violation.description.toLowerCase().includes('ladder')) {
      recommendations.push('Ensure all ladders are properly secured and positioned at safe angles');
    }
    
    if (violation.description.toLowerCase().includes('scaffold')) {
      recommendations.push('Implement daily scaffold inspection protocol before use');
    }
    
    if (violation.description.toLowerCase().includes('slip/trip')) {
      recommendations.push('Implement housekeeping program to keep work areas clean and dry');
    }
    
    if (violation.description.toLowerCase().includes('excavation')) {
      recommendations.append('Use shoring, shielding, or sloping for excavations deeper than 5 feet');
    }
  });
  
  // Add general recommendations based on common issues
  if (violations.length > 0) {
    recommendations.push('Conduct daily safety toolbox talks');
    recommendations.push('Implement stop-work authority for all employees');
    recommendations.push('Ensure proper PPE is available and used consistently');
  }
  
  return [...new Set(recommendations)]; // Remove duplicates
}

function identifyTrainingNeeds(violations: any[], workforceTraining: string[]): string[] {
  const trainingNeeds: string[] = [];
  
  violations.forEach(violation => {
    if (violation.description.toLowerCase().includes('ladder')) {
      trainingNeeds.push('Ladder safety training');
    }
    
    if (violation.description.toLowerCase().includes('scaffold')) {
      trainingNeeds.push('Scaffold competency training');
    }
    
    if (violation.description.toLowerCase().includes('excavation')) {
      trainingNeeds.push('Excavation and trenching safety training');
    }
    
    if (violation.description.toLowerCase().includes('hot work')) {
      trainingNeeds.push('Hot work permitting and fire watch training');
    }
  });
  
  // Add training for common gaps
  const hasFallProtection = workforceTraining.some(t => 
    t.toLowerCase().includes('fall') || t.toLowerCase().includes('harness')
  );
  
  if (!hasFallProtection && violations.some(v => 
    v.description.toLowerCase().includes('fall') || 
    v.description.toLowerCase().includes('height')
  )) {
    trainingNeeds.push('Fall protection training');
  }
  
  return [...new Set(trainingNeeds)];
}

function calculateComplianceScore(violations: any[]): number {
  // Returns a score between 0 and 100 (higher is better)
  if (violations.length === 0) {
    return 100;
  }
  
  let score = 100;
  
  violations.forEach(violation => {
    switch (violation.severity) {
      case 'low':
        score -= 5;
        break;
      case 'medium':
        score -= 15;
        break;
      case 'high':
        score -= 25;
        break;
      case 'critical':
        score -= 40;
        break;
    }
  });
  
  return Math.max(0, score);
}
