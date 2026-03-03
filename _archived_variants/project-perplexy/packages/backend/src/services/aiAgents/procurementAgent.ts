/**
 * Procurement Agent
 * Automated vendor selection, bid analysis, and purchase order generation
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class ProcurementAgent extends BaseAgent {
  constructor() {
    super('Procurement Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['type', 'requirements'])

    const { type, requirements, budget, deadline } = input

    try {
      // 1. Analyze requirements and find matching suppliers
      const suppliers = await this.findMatchingSuppliers(
        type,
        requirements,
        context.organizationId
      )

      // 2. Evaluate suppliers based on multiple criteria
      const evaluations = await this.evaluateSuppliers(suppliers, {
        budget,
        deadline,
        requirements,
      })

      // 3. Generate recommendations
      const recommendations = this.generateRecommendations(evaluations)

      // 4. Generate purchase order if vendor selected
      let purchaseOrder = null
      if (input.selectedVendorId) {
        purchaseOrder = await this.generatePurchaseOrder(
          input.selectedVendorId,
          requirements,
          budget,
          context
        )
      }

      const output = {
        suppliers: evaluations,
        recommendations,
        purchaseOrder,
        bestMatch: evaluations[0],
      }

      return {
        output,
        confidence: this.calculateConfidence({
          dataQuality: suppliers.length > 0 ? 1 : 0.5,
          completeness: requirements ? 1 : 0.7,
        }),
        requiresReview: evaluations.length === 0 || evaluations[0].score < 0.7,
        tokensUsed: this.estimateTokens(JSON.stringify(output)),
      }
    } catch (error: any) {
      this.log('error', 'Procurement analysis failed', { error: error.message })
      throw error
    }
  }

  private async findMatchingSuppliers(
    type: string,
    requirements: string[],
    organizationId?: string
  ) {
    const where: any = {
      ...(organizationId && { organizationId }),
      status: 'ACTIVE',
    }

    if (type) {
      where.category = type
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
        },
        bids: {
          take: 5,
          orderBy: { submittedAt: 'desc' },
        },
      },
    })

    // Filter by requirements keywords
    return suppliers.filter((supplier: any) => {
      const qualifications = supplier.qualifications.join(' ').toLowerCase()
      return requirements.some((req) =>
        qualifications.includes(req.toLowerCase())
      )
    })
  }

  private async evaluateSuppliers(
    suppliers: any[],
    criteria: { budget?: number; deadline?: Date; requirements: string[] }
  ) {
    return suppliers.map((supplier: any) => {
      let score = 0
      const factors: any = {}

      // Rating factor (0-1)
      factors.rating = supplier.rating / 5
      score += factors.rating * 0.3

      // Performance factor (based on active contracts)
      factors.performance =
        supplier.activeContracts > 0
          ? Math.min(1, supplier.activeContracts / 10)
          : 0.5
      score += factors.performance * 0.2

      // Value factor (total value indicates reliability)
      factors.value = supplier.totalValue > 0 ? Math.min(1, supplier.totalValue / 1000000) : 0.5
      score += factors.value * 0.2

      // Qualification match
      const matchCount = criteria.requirements.filter((req) =>
        supplier.qualifications.some((q: string) =>
          q.toLowerCase().includes(req.toLowerCase())
        )
      ).length
      factors.qualificationMatch = matchCount / criteria.requirements.length
      score += factors.qualificationMatch * 0.3

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        score: Math.round(score * 100) / 100,
        factors,
        rating: supplier.rating,
        activeContracts: supplier.activeContracts,
        totalValue: supplier.totalValue,
      }
    }).sort((a: any, b: any) => b.score - a.score)
  }

  private generateRecommendations(evaluations: any[]) {
    if (evaluations.length === 0) {
      return {
        message: 'No suitable suppliers found. Consider expanding search criteria.',
        action: 'REVIEW_REQUIREMENTS',
      }
    }

    const top3 = evaluations.slice(0, 3)

    return {
      message: `Found ${evaluations.length} suitable suppliers. Top 3 recommendations:`,
      topSuppliers: top3,
      recommendation:
        top3[0].score >= 0.8
          ? 'APPROVE'
          : top3[0].score >= 0.6
          ? 'REVIEW'
          : 'EXPAND_SEARCH',
    }
  }

  private async generatePurchaseOrder(
    vendorId: string,
    requirements: string[],
    budget: number,
    context: AgentContext
  ) {
    const vendor = await prisma.supplier.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    return {
      poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
      items: requirements.map((req, index) => ({
        itemNumber: index + 1,
        description: req,
        quantity: 1,
        unitPrice: budget / requirements.length,
      })),
      totalAmount: budget,
      currency: 'GBP',
      status: 'DRAFT',
      generatedAt: new Date(),
      organizationId: context.organizationId,
      projectId: context.projectId,
    }
  }
}

export const procurementAgent = new ProcurementAgent()

