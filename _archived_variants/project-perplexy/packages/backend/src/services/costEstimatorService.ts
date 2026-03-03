import { v4 as uuidv4 } from 'uuid'
import {
  CostEstimate,
  CreateCostEstimateRequest,
  UpdateCostEstimateRequest,
  CostCategory,
  CostItem,
  CostEstimateTemplate,
} from '../types/costEstimator.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const costEstimates: CostEstimate[] = [
  {
    id: 'estimate-1',
    name: 'Manchester Commercial Development',
    description: 'Cost estimate for Manchester Commercial Development project',
    projectId: 'project-1',
    categories: [
      {
        id: 'cat-1',
        name: 'Materials',
        items: [
          {
            id: 'item-1',
            name: 'Steel',
            description: 'Structural steel',
            quantity: 100,
            unit: 'tonnes',
            unitCost: 850,
            totalCost: 85000,
            notes: 'High-grade structural steel',
          },
          {
            id: 'item-2',
            name: 'Concrete',
            description: 'Ready-mix concrete',
            quantity: 500,
            unit: 'cubic meters',
            unitCost: 120,
            totalCost: 60000,
          },
        ],
        subtotal: 145000,
      },
      {
        id: 'cat-2',
        name: 'Labor',
        items: [
          {
            id: 'item-3',
            name: 'Project Manager',
            description: 'Project management services',
            quantity: 12,
            unit: 'months',
            unitCost: 5000,
            totalCost: 60000,
          },
          {
            id: 'item-4',
            name: 'Construction Workers',
            description: 'Construction labor',
            quantity: 2400,
            unit: 'hours',
            unitCost: 25,
            totalCost: 60000,
          },
        ],
        subtotal: 120000,
      },
    ],
    totalCost: 265000,
    markup: 15,
    finalPrice: 304750,
    status: 'approved',
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-10-14'),
  },
]

const costEstimateTemplates: CostEstimateTemplate[] = [
  {
    id: 'template-1',
    name: 'Standard Construction Template',
    description: 'Standard template for construction projects',
    categories: [
      {
        id: 'cat-1',
        name: 'Materials',
        items: [],
        subtotal: 0,
      },
      {
        id: 'cat-2',
        name: 'Labor',
        items: [],
        subtotal: 0,
      },
      {
        id: 'cat-3',
        name: 'Equipment',
        items: [],
        subtotal: 0,
      },
    ],
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-01'),
  },
]

export const costEstimatorService = {
  async getCostEstimates(projectId?: string): Promise<CostEstimate[]> {
    let filteredEstimates = costEstimates
    if (projectId) {
      filteredEstimates = costEstimates.filter((e) => e.projectId === projectId)
    }
    return filteredEstimates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  },

  async getCostEstimate(estimateId: string): Promise<CostEstimate | null> {
    return costEstimates.find((e) => e.id === estimateId) || null
  },

  async createCostEstimate(estimate: CreateCostEstimateRequest): Promise<CostEstimate> {
    if (!estimate.name || !estimate.description || !estimate.categories) {
      throw new ApiError('Missing required fields', 400)
    }

    // Calculate totals
    let totalCost = 0
    estimate.categories.forEach((category) => {
      category.subtotal = category.items.reduce((sum, item) => {
        item.totalCost = item.quantity * item.unitCost
        return sum + item.totalCost
      }, 0)
      totalCost += category.subtotal
    })

    const markup = estimate.markup || 0
    const finalPrice = totalCost * (1 + markup / 100)

    const newEstimate: CostEstimate = {
      id: uuidv4(),
      name: estimate.name,
      description: estimate.description,
      projectId: estimate.projectId,
      tenderId: estimate.tenderId,
      categories: estimate.categories,
      totalCost,
      markup,
      finalPrice,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    costEstimates.push(newEstimate)
    return newEstimate
  },

  async updateCostEstimate(estimateId: string, updates: UpdateCostEstimateRequest): Promise<CostEstimate> {
    const estimate = costEstimates.find((e) => e.id === estimateId)
    if (!estimate) {
      throw new ApiError('Cost estimate not found', 404)
    }

    if (updates.name) estimate.name = updates.name
    if (updates.description) estimate.description = updates.description
    if (updates.status) estimate.status = updates.status
    if (updates.markup !== undefined) estimate.markup = updates.markup

    if (updates.categories) {
      estimate.categories = updates.categories
      // Recalculate totals
      let totalCost = 0
      estimate.categories.forEach((category) => {
        category.subtotal = category.items.reduce((sum, item) => {
          item.totalCost = item.quantity * item.unitCost
          return sum + item.totalCost
        }, 0)
        totalCost += category.subtotal
      })
      estimate.totalCost = totalCost
      estimate.finalPrice = totalCost * (1 + (estimate.markup || 0) / 100)
    } else if (updates.markup !== undefined) {
      estimate.finalPrice = estimate.totalCost * (1 + updates.markup / 100)
    }

    estimate.updatedAt = new Date()
    return estimate
  },

  async deleteCostEstimate(estimateId: string): Promise<void> {
    const index = costEstimates.findIndex((e) => e.id === estimateId)
    if (index === -1) {
      throw new ApiError('Cost estimate not found', 404)
    }
    costEstimates.splice(index, 1)
  },

  async getTemplates(): Promise<CostEstimateTemplate[]> {
    return costEstimateTemplates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  },

  async getTemplate(templateId: string): Promise<CostEstimateTemplate | null> {
    return costEstimateTemplates.find((t) => t.id === templateId) || null
  },

  async getCostEstimatorStats(): Promise<{
    total: number
    approved: number
    pending: number
    totalValue: number
  }> {
    const total = costEstimates.length
    const approved = costEstimates.filter((e) => e.status === 'approved').length
    const pending = costEstimates.filter((e) => e.status === 'pending').length
    const totalValue = costEstimates.reduce((sum, e) => sum + e.finalPrice, 0)

    return {
      total,
      approved,
      pending,
      totalValue,
    }
  },
}

