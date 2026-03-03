import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

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

export interface CostCategory {
  id: string
  name: string
  items: CostItem[]
  subtotal: number
}

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

export interface CostEstimatorStats {
  total: number
  approved: number
  pending: number
  totalValue: number
}

function parseCostEstimate(estimate: any): CostEstimate {
  return {
    ...estimate,
    createdAt: new Date(estimate.createdAt),
    updatedAt: new Date(estimate.updatedAt),
  }
}

function parseCostEstimateTemplate(template: any): CostEstimateTemplate {
  return {
    ...template,
    createdAt: new Date(template.createdAt),
    updatedAt: new Date(template.updatedAt),
  }
}

export const costEstimatorService = {
  async getCostEstimates(projectId?: string): Promise<CostEstimate[]> {
    const params = projectId ? { projectId } : {}
    const response = await axios.get(`${API_URL}/api/cost-estimator`, { params })
    return response.data.estimates.map(parseCostEstimate)
  },

  async getCostEstimate(estimateId: string): Promise<CostEstimate> {
    const response = await axios.get(`${API_URL}/api/cost-estimator/${estimateId}`)
    return parseCostEstimate(response.data.estimate)
  },

  async createCostEstimate(estimate: CreateCostEstimateRequest): Promise<CostEstimate> {
    const response = await axios.post(`${API_URL}/api/cost-estimator`, estimate)
    return parseCostEstimate(response.data.estimate)
  },

  async updateCostEstimate(estimateId: string, updates: UpdateCostEstimateRequest): Promise<CostEstimate> {
    const response = await axios.put(`${API_URL}/api/cost-estimator/${estimateId}`, updates)
    return parseCostEstimate(response.data.estimate)
  },

  async deleteCostEstimate(estimateId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/cost-estimator/${estimateId}`)
  },

  async getTemplates(): Promise<CostEstimateTemplate[]> {
    const response = await axios.get(`${API_URL}/api/cost-estimator/templates`)
    return response.data.templates.map(parseCostEstimateTemplate)
  },

  async getTemplate(templateId: string): Promise<CostEstimateTemplate> {
    const response = await axios.get(`${API_URL}/api/cost-estimator/templates/${templateId}`)
    return parseCostEstimateTemplate(response.data.template)
  },

  async getCostEstimatorStats(): Promise<CostEstimatorStats> {
    const response = await axios.get(`${API_URL}/api/cost-estimator/stats`)
    return response.data.stats
  },
}

