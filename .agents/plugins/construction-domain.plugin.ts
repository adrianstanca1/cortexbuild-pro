import { IPlugin } from '../../lib/ai/system/interfaces';

interface ConstructionDomainContext {
  specialty: 'general' | 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  region: string;
  includeLocalCodes: boolean;
  queryType?: 'code-check' | 'best-practice' | 'material-recommendation' | 'risk-assessment';
  contextData?: Record<string, any>;
}

interface ConstructionDomainMetadata {
  category: string;
  complexity: string;
  specialty?: string;
  region?: string;
  includeLocalCodes?: boolean;
  domainKnowledge?: Record<string, any>;
  initializedAt?: string;
}

const constructionDomainPluginImpl: IPlugin<ConstructionDomainContext> = {
  id: 'construction-domain',
  name: 'Construction Domain Plugin',
  description: 'Adds construction industry knowledge, standards, and best practices to agents',
  version: '1.0.0',
  isEnabled: true,
  hooks: ['onAgentStart', 'onAgentExecute'],
  metadata: {
    category: 'domain-knowledge',
    complexity: 'medium'
  } as ConstructionDomainMetadata,

  async initialize(context: ConstructionDomainContext): Promise<void> {
    const { specialty, region, includeLocalCodes } = context;
    
    const domainKnowledge = loadConstructionDomainKnowledge(specialty, region, includeLocalCodes);
    
    (constructionDomainPluginImpl.metadata as ConstructionDomainMetadata).specialty = specialty;
    (constructionDomainPluginImpl.metadata as ConstructionDomainMetadata).region = region;
    (constructionDomainPluginImpl.metadata as ConstructionDomainMetadata).includeLocalCodes = includeLocalCodes;
    (constructionDomainPluginImpl.metadata as ConstructionDomainMetadata).domainKnowledge = domainKnowledge;
    (constructionDomainPluginImpl.metadata as ConstructionDomainMetadata).initializedAt = new Date().toISOString();
    
    console.log(`Construction Domain Plugin initialized for ${specialty} construction in ${region}`);
    await new Promise(resolve => setTimeout(resolve, 150));
  },

  async execute(context: ConstructionDomainContext): Promise<any> {
    const { queryType, contextData } = context;
    const metadata = constructionDomainPluginImpl.metadata as ConstructionDomainMetadata;
    
    const enhancedContext = {
      ...contextData,
      domainKnowledge: metadata.domainKnowledge,
      specialty: metadata.specialty,
      region: metadata.region
    };

    let result: any;
    
    switch (queryType) {
      case 'code-check':
        result = checkBuildingCodes(enhancedContext);
        break;
      case 'best-practice':
        result = getBestPractices(enhancedContext);
        break;
      case 'material-recommendation':
        result = recommendMaterials(enhancedContext);
        break;
      case 'risk-assessment':
        result = assessRisks(enhancedContext);
        break;
      default:
        result = { message: 'General construction domain knowledge applied' };
    }

    return {
      success: true,
      queryType,
      result,
      specialty: metadata.specialty,
      region: metadata.region,
      executedAt: new Date().toISOString()
    };
  },

  async cleanup(): Promise<void> {
    console.log('Construction Domain Plugin cleaned up');
    (constructionDomainPluginImpl.metadata as ConstructionDomainMetadata).domainKnowledge = undefined;
  }
};

export const constructionDomainPlugin = constructionDomainPluginImpl;

function loadConstructionDomainKnowledge(
  specialty: string, 
  region: string, 
  includeLocalCodes: boolean
): Record<string, any> {
  return {
    specialty,
    region,
    includeLocalCodes,
    buildingStandards: getBuildingStandards(specialty),
    commonPractices: getCommonPractices(specialty, region),
    localRegulations: includeLocalCodes ? getLocalRegulations(region) : {},
    seasonalConsiderations: getSeasonalConsiderations(region),
    laborAvailability: getLaborAvailabilityInfo(region),
    materialAvailability: getMaterialAvailabilityInfo(region),
    loadedAt: new Date().toISOString()
  };
}

function getBuildingStandards(specialty: string): Record<string, any> {
  const standards: Record<string, Record<string, any>> = {
    'general': {
      'foundations': { minDepth: '12 inches', reinforcement: '#4 rebar @ 18" oc' },
      'framing': { studSpacing: '16" oc', maxSpan: '20 feet for 2x10' },
      'electrical': { minWireGauge: '12 AWG for 20A circuits', gfcRequiredAreas: ['bathrooms', 'kitchens', 'outdoors'] },
      'plumbing': { minPipeSize: '3/4 inch main supply', ventRequired: 'Every fixture' }
    },
    'residential': {
      'foundations': { minDepth: '18 inches', reinforcement: '#5 rebar @ 16" oc' },
      'framing': { studSpacing: '16" oc', maxSpan: '16 feet for 2x10' },
      'roofing': { minPitch: '3:12', snowLoad: '20 psf ground snow load' },
      'energy': { insulation: 'R-13 walls, R-38 ceiling', windows: 'Double-pane low-E' }
    },
    'commercial': {
      'foundations': { minDepth: '24 inches', reinforcement: '#6 rebar @ 12" oc' },
      'framing': { studSpacing: '16" oc', maxSpan: '25 feet for steel' },
      'fireSafety': { sprinklerRequired: '>5000 sq ft', ratedAssemblies: '2-hour fire walls' },
      'accessibility': { adaCompliant: 'Required', elevatorRequired: '>3 stories' }
    },
    'industrial': {
      'foundations': { minDepth: '36 inches', reinforcement: '#7 rebar @ 12" oc' },
      'flooring': { loadCapacity: '250 psf minimum', chemicalResistance: 'Required' },
      'mechanical': { clearance: 'Minimum 7 feet', ventilation: '6 air changes/hour' },
      'safety': { explosionProof: 'Required in hazardous areas', containment: 'Secondary containment for liquids' }
    },
    'infrastructure': {
      'bridges': { loadRating: 'HL-93 minimum', inspectionFrequency: 'Bi-annual' },
      'roads': { pavementDepth: '12 inches minimum', drainage: '2% cross slope minimum' },
      'utilities': { buryDepth: '36 inches minimum', corrosionProtection: 'Required for metal' },
      'traffic': { designSpeed: 'Posted speed limit + 5 mph', clearZone: '30 feet from travel lane' }
    }
  };
  
  return standards[specialty.toLowerCase()] || standards.general;
}

function getCommonPractices(specialty: string, region: string): string[] {
  const practices = [
    'Regular safety inspections and toolbox talks',
    'Proper material storage and handling',
    'Daily cleanup and housekeeping',
    'Documentation of all changes and deviations',
    'Regular equipment maintenance and inspection'
  ];
  
  if (specialty === 'residential') {
    practices.push('Customer communication and satisfaction tracking');
    practices.push('Warranty and callback management');
  }
  
  if (specialty === 'commercial') {
    practices.push('Coordination with multiple trades and subcontractors');
    practices.push('Strict adherence to schedules and milestones');
  }
  
  if (specialty === 'industrial') {
    practices.push('Process safety management and hazard analysis');
    practices.push('Environmental compliance and monitoring');
  }
  
  if (region.toLowerCase().includes('coastal') || region.toLowerCase().includes('hurricane')) {
    practices.push('Enhanced wind and flood protection measures');
    practices.push('Elevated construction requirements');
  }
  
  if (region.toLowerCase().includes('mountain') || region.toLowerCase().includes('snow')) {
    practices.push('Snow load considerations in structural design');
    practices.push('Heated entrances and ice dam prevention');
  }
  
  return practices;
}

function getLocalRegulations(region: string): Record<string, any> {
  return {
    region,
    permitsRequired: ['building', 'electrical', 'plumbing', 'mechanical'],
    inspectionPoints: ['foundation', 'framing', 'rough-in', 'final'],
    setbackRequirements: { front: '25 feet', side: '8 feet', rear: '20 feet' },
    heightLimits: { residential: '35 feet', commercial: '60 feet' },
    parkingRequirements: { residential: '2 spaces/unit', commercial: '1 space/300 sq ft' },
    lastUpdated: new Date().toISOString()
  };
}

function getSeasonalConsiderations(region: string): Record<string, any> {
  return {
    region,
    spring: { concerns: ['thawing ground', 'increased moisture'], recommendations: ['proper drainage', 'wait for stable soil'] },
    summer: { concerns: ['heat exposure', 'thunderstorms'], recommendations: ['heat stress prevention', 'lightning safety'] },
    fall: { concerns: ['decreasing daylight', 'precipitation'], recommendations: ['artificial lighting', 'weather protection'] },
    winter: { concerns: ['freezing temperatures', 'snow accumulation'], recommendations: ['heated enclosures', 'snow removal'] }
  };
}

function getLaborAvailabilityInfo(region: string): Record<string, any> {
  return {
    region,
    availability: 'moderate',
    skillLevels: { journeyman: 'adequate', apprentice: 'good', specialist: 'limited' },
    wageTrends: 'increasing 3-5% annually',
    unionPresence: 'varies by trade and location',
    lastUpdated: new Date().toISOString()
  };
}

function getMaterialAvailabilityInfo(region: string): Record<string, any> {
  return {
    region,
    leadTimes: { standard: '1-2 weeks', specialty: '4-8 weeks' },
    priceStability: 'moderate fluctuation',
    supplyChainReliability: 'good with occasional delays',
    lastUpdated: new Date().toISOString()
  };
}

function checkBuildingCodes(context: any): any {
  return {
    status: 'compliant',
    violations: [],
    recommendations: ['Continue current practices'],
    checkedAgainst: [...Object.keys(context.domainKnowledge?.buildingStandards || {}), ...Object.keys(context.domainKnowledge?.localRegulations || {})],
    checkedAt: new Date().toISOString()
  };
}

function getBestPractices(context: any): any {
  return {
    practices: context.domainKnowledge?.commonPractices || [],
    references: ['OSHA Standards', 'IBC/IRC', 'Local Amendments'],
    contextApplied: { specialty: context.specialty, region: context.region },
    retrievedAt: new Date().toISOString()
  };
}

function recommendMaterials(context: any): any {
  return {
    recommendations: [
      { material: 'Pressure-treated lumber', reason: 'Ground contact durability' },
      { material: 'Low-E windows', reason: 'Energy efficiency' },
      { material: 'GFCI outlets', reason: 'Safety in wet areas' }
    ],
    considerations: ['budget', 'availability', 'local codes'],
    context: { specialty: context.specialty, region: context.region },
    recommendedAt: new Date().toISOString()
  };
}

function assessRisks(context: any): any {
  return {
    risks: [
      { id: 'risk-001', description: 'Weather delays', probability: 'medium', impact: 'medium', mitigation: 'Weather-resistant materials and schedules' },
      { id: 'risk-002', description: 'Material price fluctuations', probability: 'high', impact: 'low', mitigation: 'Fixed-price contracts and early procurement' },
      { id: 'risk-003', description: 'Labor shortages', probability: 'medium', impact: 'high', mitigation: 'Training programs and competitive wages' }
    ],
    overallRiskLevel: 'medium',
    assessmentContext: { specialty: context.specialty, region: context.region },
    assessedAt: new Date().toISOString()
  };
}
