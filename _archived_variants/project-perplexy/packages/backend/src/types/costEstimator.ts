export interface CostEstimate {
  id: string
  name: string
  description: string
  projectId?: string
  tenderId?: string
  categories: CostCategory[]
  totalCost: number
  markup: number
  finalPrice: number
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

export interface CostCategory {
  id: string
  name: string
  items: CostItem[]
  subtotal: number
}

export interface CostItem {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  notes?: string
}

export interface CreateCostEstimateRequest {
  name: string
  description: string
  projectId?: string
  tenderId?: string
  categories: CostCategory[]
  markup?: number
}

export interface UpdateCostEstimateRequest {
  name?: string
  description?: string
  categories?: CostCategory[]
  markup?: number
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
}

export interface CostEstimateTemplate {
  id: string
  name: string
  description: string
  categories: CostCategory[]
  createdAt: Date
  updatedAt: Date
}

