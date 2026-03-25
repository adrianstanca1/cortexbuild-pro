import { ITool } from '../../../lib/ai/system/interfaces';

/**
 * Tool for accessing construction industry databases
 */
export const constructionDbTool: ITool<{ 
  queryType: 'materials' | 'equipment' | 'labor-rates' | 'regulations' | 'vendors';
  filters?: Record<string, any>;
  limit?: number;
}> = {
  id: 'construction-db',
  name: 'Construction Database Access',
  description: 'Accesses construction industry databases for materials pricing, equipment specs, labor rates, regulations, and vendor information',
  version: '1.0.0',
  execute: async (context) => {
    const { queryType, filters = {}, limit = 100 } = context;
    
    // In a real implementation, this would connect to actual construction industry databases
    // For now, we'll return mock data based on query type
    
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let results: any[] = [];
    let totalCount = 0;
    
    switch (queryType) {
      case 'materials':
        results = getMockMaterials(filters, limit);
        totalCount = 150;
        break;
      case 'equipment':
        results = getMockEquipment(filters, limit);
        totalCount = 75;
        break;
      case 'labor-rates':
        results = getMockLaborRates(filters, limit);
        totalCount = 50;
        break;
      case 'regulations':
        results = getMockRegulations(filters, limit);
        totalCount = 200;
        break;
      case 'vendors':
        results = getMockVendors(filters, limit);
        totalCount = 300;
        break;
      default:
        results = [];
        totalCount = 0;
    }
    
    return {
      success: true,
      queryType,
      filters,
      limit,
      results,
      totalCount,
      returnedCount: results.length,
      queriedAt: new Date().toISOString(),
      cacheExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour cache
    };
  },
  parameters: {
    queryType: {
      type: 'string',
      enum: ['materials', 'equipment', 'labor-rates', 'regulations', 'vendors'],
      description: 'Type of data to query'
    },
    filters: {
      type: 'object',
      description: 'Optional filters to apply to the query'
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results to return'
    }
  },
  returns: {
    success: 'boolean',
    queryType: 'string',
    filters: 'object',
    limit: 'number',
    results: 'any[]',
    totalCount: 'number',
    returnedCount: 'number',
    queriedAt: 'string',
    cacheExpiresAt: 'string'
  },
  metadata: {
    category: 'data-access',
    complexity: 'medium',
    estimatedTimeMs: 200
  },
  tags: ['database', 'construction', 'materials', 'equipment', 'labor'],
  isEnabled: true
};

// Helper functions to generate mock data
function getMockMaterials(filters: Record<string, any>, limit: number): any[] {
  const materials = [
    { id: 'mat-001', name: 'Portland Cement', category: 'concrete', unit: '94lb bag', avgPrice: 8.50, lastUpdated: '2024-01-15' },
    { id: 'mat-002', name: 'Ready Mix Concrete', category: 'concrete', unit: 'cubic yard', avgPrice: 125.00, lastUpdated: '2024-01-15' },
    { id: 'mat-003', name: 'Structural Steel Beam', category: 'steel', unit: 'ton', avgPrice: 850.00, lastUpdated: '2024-01-10' },
    { id: 'mat-004', name: 'Lumber - 2x4x8', category: 'wood', unit: 'piece', avgPrice: 4.25, lastUpdated: '2024-01-12' },
    { id: 'mat-005', name: 'Lumber - 2x6x12', category: 'wood', unit: 'piece', avgPrice: 9.50, lastUpdated: '2024-01-12' },
    { id: 'mat-006', name: 'Plywood 4x8', category: 'wood', unit: 'sheet', avgPrice: 45.00, lastUpdated: '2024-01-10' },
    { id: 'mat-007', name: 'Drywall 1/2 inch', category: 'finishing', unit: '4x8 sheet', avgPrice: 12.00, lastUpdated: '2024-01-14' },
    { id: 'mat-008', name: 'Asphalt Shingles', category: 'roofing', unit: 'square (100sqft)', avgPrice: 95.00, lastUpdated: '2024-01-13' },
    { id: 'mat-009', name: 'Copper Pipe 1/2 inch', category: 'plumbing', unit: 'linear ft', avgPrice: 3.50, lastUpdated: '2024-01-11' },
    { id: 'mat-010', name: 'PVC Pipe 4 inch', category: 'plumbing', unit: 'linear ft', avgPrice: 2.75, lastUpdated: '2024-01-11' }
  ];
  
  // Apply filters
  let filteredMaterials = materials;
  if (filters.category) {
    filteredMaterials = materials.filter(m => 
      m.category.toLowerCase() === filters.category.toLowerCase()
    );
  }
  
  if (filters.maxPrice) {
    filteredMaterials = materials.filter(m => 
      m.avgPrice <= filters.maxPrice
    );
  }
  
  if (filters.minPrice) {
    filteredMaterials = materials.filter(m => 
      m.avgPrice >= filters.minPrice
    );
  }
  
  // Limit results
  return filteredMaterials.slice(0, limit);
}

function getMockEquipment(filters: Record<string, any>, limit: number): any[] {
  const equipment = [
    { id: 'eq-001', name: 'Excavator', category: 'earth-moving', dailyRate: 450, weeklyRate: 1800, monthlyRate: 6500 },
    { id: 'eq-002', name: 'Bulldozer', category: 'earth-moving', dailyRate: 400, weeklyRate: 1600, monthlyRate: 5800 },
    { id: 'eq-003', name: 'Backhoe Loader', category: 'earth-moving', dailyRate: 350, weeklyRate: 1400, monthlyRate: 5000 },
    { id: 'eq-004', name: 'Skid Steer', category: 'earth-moving', dailyRate: 250, weeklyRate: 1000, monthlyRate: 3500 },
    { id: 'eq-005', name: 'Tower Crane', category: 'lifting', dailyRate: 1200, weeklyRate: 4800, monthlyRate: 18000 },
    { id: 'eq-006', name: 'Mobile Crane', category: 'lifting', dailyRate: 800, weeklyRate: 3200, monthlyRate: 12000 },
    { id: 'eq-007', name: 'Concrete Pump', category: 'concrete', dailyRate: 600, weeklyRate: 2400, monthlyRate: 9000 },
    { id: 'eq-008', name: 'Concrete Mixer', category: 'concrete', dailyRate: 200, weeklyRate: 800, monthlyRate: 3000 },
    { id: 'eq-009', name: 'Generator 5kW', category: 'power', dailyRate: 100, weeklyRate: 400, monthlyRate: 1500 },
    { id: 'eq-010', name: 'Air Compressor', category: 'power', dailyRate: 150, weeklyRate: 600, monthlyRate: 2200 }
  ];
  
  // Apply filters
  let filteredEquipment = equipment;
  if (filters.category) {
    filteredEquipment = equipment.filter(e => 
      e.category.toLowerCase() === filters.category.toLowerCase()
    );
  }
  
  if (filters.maxDailyRate) {
    filteredEquipment = equipment.filter(e => 
      e.dailyRate <= filters.maxDailyRate
    );
  }
  
  // Limit results
  return filteredEquipment.slice(0, limit);
}

function getMockLaborRates(filters: Record<string, any>, limit: number): any[] {
  const laborRates = [
    { id: 'lr-001', trade: 'Carpenter', level: 'Journeyman', hourlyRate: 35.00, union: true, location: 'National Average' },
    { id: 'lr-002', trade: 'Carpenter', level: 'Apprentice', hourlyRate: 22.00, union: true, location: 'National Average' },
    { id: 'lr-003', trade: 'Electrician', level: 'Journeyman', hourlyRate: 42.00, union: true, location: 'National Average' },
    { id: 'lr-004', trade: 'Plumber', level: 'Journeyman', hourlyRate: 40.00, union: true, location: 'National Average' },
    { id: 'lr-005', trade: 'HVAC Technician', level: 'Journeyman', hourlyRate: 38.00, union: true, location: 'National Average' },
    { id: 'lr-006', trade: 'Welder', level: 'Journeyman', hourlyRate: 37.00, union: true, location: 'National Average' },
    { id: 'lr-007', trade: 'Mason', level: 'Journeyman', hourlyRate: 36.00, union: true, location: 'National Average' },
    { id: 'lr-008', trade: 'Painter', level: 'Journeyman', hourlyRate: 28.00, union: true, location: 'National Average' },
    { id: 'lr-009', trade: 'Roofer', level: 'Journeyman', hourlyRate: 30.00, union: true, location: 'National Average' },
    { id: 'lr-010', trade: 'General Laborer', level: 'Entry', hourlyRate: 20.00, union: false, location: 'National Average' }
  ];
  
  // Apply filters
  let filteredRates = laborRates;
  if (filters.trade) {
    filteredRates = laborRates.filter(r => 
      r.trade.toLowerCase() === filters.trade.toLowerCase()
    );
  }
  
  if (filters.unionOnly !== undefined) {
    filteredRates = laborRates.filter(r => 
      r.union === filters.unionOnly
    );
  }
  
  if (filters.maxRate) {
    filteredRates = laborRates.filter(r => 
      r.hourlyRate <= filters.maxRate
    );
  }
  
  if (filters.minRate) {
    filteredRates = laborRates.filter(r => 
      r.hourlyRate >= filters.minRate
    );
  }
  
  // Limit results
  return filteredRates.slice(0, limit);
}

function getMockRegulations(filters: Record<string, any>, limit: number): any[] {
  const regulations = [
    { id: 'reg-001', title: 'Fall Protection', code: 'OSHA 1926.501', agency: 'OSHA', category: 'safety', lastUpdated: '2023-06-15' },
    { id: 'reg-002', title: 'Scaffolding', code: 'OSHA 1926.451', agency: 'OSHA', category: 'safety', lastUpdated: '2023-08-20' },
    { id: 'reg-003', title: 'Excavation Safety', code: 'OSHA 1926.650', agency: 'OSHA', category: 'safety', lastUpdated: '2023-05-10' },
    { id: 'reg-004', title: 'Electrical Safety', code: 'OSHA 1926.416', agency: 'OSHA', category: 'safety', lastUpdated: '2023-07-05' },
    { id: 'reg-005', title: 'Personal Protective Equipment', code: 'OSHA 1926.95', agency: 'OSHA', category: 'safety', lastUpdated: '2023-04-18' },
    { id: 'reg-006', title: 'Concrete and Masonry Construction', code: 'OSHA 1926.700', agency: 'OSHA', category: 'construction', lastUpdated: '2023-09-10' },
    { id: 'reg-007', title: 'Steel Erection', code: 'OSHA 1926.750', agency: 'OSHA', category: 'construction', lastUpdated: '2023-06-01' },
    { id: 'reg-008', title: 'Underground Construction', code: 'OSHA 1926.800', agency: 'OSHA', category: 'construction', lastUpdated: '2023-03-22' },
    { id: 'reg-009', title: 'Demolition', code: 'OSHA 1926.850', agency: 'OSHA', category: 'construction', lastUpdated: '2023-05-30' },
    { id: 'reg-010', title: 'Blasting and Use of Explosives', code: 'OSHA 1926.900', agency: 'OSHA', category: 'construction', lastUpdated: '2023-02-14' }
  ];
  
  // Apply filters
  let filteredRegulations = regulations;
  if (filters.category) {
    filteredRegulations = regulations.filter(r => 
      r.category.toLowerCase() === filters.category.toLowerCase()
    );
  }
  
  if (filters.agency) {
    filteredRegulations = regulations.filter(r => 
      r.agency.toLowerCase() === filters.agency.toLowerCase()
    );
  }
  
  if (filters.code) {
    filteredRegulations = regulations.filter(r => 
      r.code.toLowerCase().includes(filters.code.toLowerCase())
    );
  }
  
  // Limit results
  return filteredRegulations.slice(0, limit);
}

function getMockVendors(filters: Record<string, any>, limit: number): any[] {
  const vendors = [
    { id: 'ven-001', name: 'Home Depot Pro', category: 'building-materials', rating: 4.5, reviewCount: 1250, services: ['materials', 'tool-rental', 'delivery'] },
    { id: 'ven-002', name: 'Lowe\'s Pro', category: 'building-materials', rating: 4.3, reviewCount: 980, services: ['materials', 'tool-rental', 'delivery'] },
    { id: 'ven-003', name: 'Fastenal', category: 'fasteners-hardware', rating: 4.7, reviewCount: 890, services: ['fasteners', 'safety-supplies', 'vending-machines'] },
    { id: 'ven-004', name: 'Grainger', category: 'industrial-supply', rating: 4.6, reviewCount: 1560, services: ['safety-equipment', 'testing-equipment', 'maintenance-supplies'] },
    { id: 'ven-005', name: 'Sherwin-Williams', category: 'paints-coatings', rating: 4.4, reviewCount: 670, services: ['paints', 'coatings', 'color-consulting'] },
    { id: 'ven-006', name: 'Beacon Roofing Supply', category: 'roofing-materials', rating: 4.8, reviewCount: 420, services: ['roofing-materials', 'delivery', 'job-site-supply'] },
    { id: 'ven-007', name: 'SRS Distribution', category: 'building-materials', rating: 4.4, reviewCount: 780, services: ['lumber', 'panels', 'delivery'] },
    { id: 'ven-008', name: 'ABC Supply Co.', category: 'roofing-materials', rating: 4.7, reviewCount: 1100, services: ['roofing', 'siding', 'windows'] },
    { id: 'ven-009', name: 'Hughes Supply', category: 'plumbing-hvac', rating: 4.3, reviewCount: 540, services: ['plumbing', 'hvac', 'piping'] },
    { id: 'ven-010', name: 'Rinker Materials', category: 'concrete-aggregates', rating: 4.6, reviewCount: 320, services: ['ready-mix', 'aggregates', 'block'] }
  ];
  
  // Apply filters
  let filteredVendors = vendors;
  if (filters.category) {
    filteredVendors = vendors.filter(v => 
      v.category.toLowerCase() === filters.category.toLowerCase()
    );
  }
  
  if (filters.minRating) {
    filteredVendors = vendors.filter(v => 
      v.rating >= filters.minRating
    );
  }
  
  if (filters.services) {
    filteredVendors = vendors.filter(v => 
      filters.services.some(service => v.services.includes(service))
    );
  }
  
  // Limit results
  return filteredVendors.slice(0, limit);
}
