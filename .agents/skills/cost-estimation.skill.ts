import { ISkill } from '../../../lib/ai/system/interfaces';

/**
 * Skill for estimating construction project costs
 */
export const costEstimationSkill: ISkill<{ 
  projectScope: string; 
  location: string; 
  squareFootage?: number;
  materials: Array<{name: string; quantity: number; unit: string}>;
  laborHours: number;
}> = {
  id: 'cost-estimation',
  name: 'Cost Estimation',
  description: 'Estimates construction project costs based on scope, materials, labor, and location factors',
  version: '1.0.0',
  execute: async (context) => {
    const { 
      projectScope, 
      location, 
      squareFootage = 0,
      materials = [],
      laborHours = 0
    } = context;
    
    // In a real implementation, this would use historical data, regional cost indices, etc.
    // For now, we'll return a mock estimation
    
    const materialCost = calculateMaterialCost(materials);
    const laborCost = calculateLaborCost(laborHours, location);
    const overheadCost = (materialCost + laborCost) * 0.15; // 15% overhead
    const profitMargin = (materialCost + laborCost + overheadCost) * 0.10; // 10% profit
    
    const subtotal = materialCost + laborCost + overheadCost;
    const total = subtotal + profitMargin;
    
    const estimate = {
      projectScope,
      location,
      squareFootage,
      breakdown: {
        materials: materialCost,
        labor: laborCost,
        overhead: overheadCost,
        profitMargin: profitMargin
      },
      subtotal,
      total,
      perSquareFoot: squareFootage > 0 ? total / squareFootage : 0,
      confidenceLevel: calculateConfidenceLevel(context),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      estimatedAt: new Date().toISOString()
    };
    
    return estimate;
  },
  metadata: {
    category: 'financial',
    complexity: 'high',
    estimatedTimeMs: 3000
  },
  tags: ['cost', 'estimation', 'budget', 'financial', 'construction'],
  isEnabled: true
};

// Helper functions
function calculateMaterialCost(materials: Array<{name: string; quantity: number; unit: string}>): number {
  // Mock material prices (in reality, would come from a database or API)
  const materialPrices: Record<string, number> = {
    'concrete': 120, // per cubic yard
    'steel': 800,    // per ton
    'lumber': 400,   // per thousand board feet
    'drywall': 15,   // per sheet
    'roofing': 100,  // per square (100 sq ft)
    'flooring': 8,   // per sq ft
    'windows': 400,  // per unit
    'doors': 250,    // per unit
    'default': 50    // default price per unit
  };
  
  let total = 0;
  
  for (const material of materials) {
    const pricePerUnit = materialPrices[material.name.toLowerCase()] || materialPrices.default;
    total += material.quantity * pricePerUnit;
  }
  
  return total;
}

function calculateLaborCost(laborHours: number, location: string): number {
  // Mock labor rates (in reality, would vary by location and trade)
  const baseRatePerHour = 50; // $50/hour base rate
  
  // Location adjustment factors (mock)
  const locationFactors: Record<string, number> = {
    'new york': 1.5,
    'san francisco': 1.8,
    'los angeles': 1.4,
    'chicago': 1.3,
    'houston': 1.0,
    'atlanta': 1.1,
    'default': 1.0
  };
  
  const locationKey = location.toLowerCase().split(',')[0].trim();
  const locationFactor = locationFactors[locationKey] || locationFactors.default;
  
  return laborHours * baseRatePerHour * locationFactor;
}

function calculateConfidenceLevel(context: any): number {
  // Mock implementation - returns confidence between 0 and 100
  let confidence = 70; // Base confidence
  
  // Increase confidence based on available information
  if (context.projectScope && context.projectScope.length > 50) {
    confidence += 5;
  }
  
  if (context.squareFootage && context.squareFootage > 0) {
    confidence += 10;
  }
  
  if (context.materials && context.materials.length > 0) {
    confidence += 10;
  }
  
  if (context.laborHours && context.laborHours > 0) {
    confidence += 5;
  }
  
  // Decrease confidence for vague or incomplete information
  if (!context.location || context.location.length < 2) {
    confidence -= 10;
  }
  
  return Math.min(95, Math.max(30, confidence)); // Cap between 30-95%
}
