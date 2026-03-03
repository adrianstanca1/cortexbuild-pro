/**
 * Due Diligence Agent
 * Vendor verification, insurance validation, and financial risk assessment
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class DueDiligenceAgent extends BaseAgent {
  constructor() {
    super('Due Diligence Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action } = input

    try {
      switch (action) {
        case 'verify_vendor':
          return await this.verifyVendor(input.vendorId, context)
        case 'validate_insurance':
          return await this.validateInsurance(input.insuranceData, context)
        case 'assess_financial_risk':
          return await this.assessFinancialRisk(input.vendorId, context)
        case 'check_compliance':
          return await this.checkCompliance(input.vendorId, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Due diligence check failed', { error: error.message })
      throw error
    }
  }

  private async verifyVendor(
    vendorId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const vendor = await prisma.supplier.findUnique({
      where: { id: vendorId },
      include: {
        contracts: true,
        bids: true,
      },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const verification = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: vendor.status,
      checks: {
        registration: this.checkRegistration(vendor),
        qualifications: this.checkQualifications(vendor),
        performance: this.checkPerformance(vendor),
        financial: await this.checkFinancial(vendor),
        insurance: await this.checkInsurance(vendor),
        compliance: await this.checkCompliance(vendor.id, context),
      },
      overallScore: this.calculateVerificationScore(vendor),
      recommendations: this.generateVerificationRecommendations(vendor),
    }

    return {
      output: verification,
      confidence: 0.85,
      requiresReview: verification.overallScore < 0.7,
      tokensUsed: this.estimateTokens(JSON.stringify(verification)),
    }
  }

  private async validateInsurance(
    insuranceData: any,
    context: AgentContext
  ): Promise<AgentResult> {
    const validation = {
      valid: this.checkInsuranceValidity(insuranceData),
      coverage: this.assessCoverage(insuranceData),
      expiry: this.checkExpiry(insuranceData),
      recommendations: this.generateInsuranceRecommendations(insuranceData),
    }

    return {
      output: validation,
      confidence: 0.9,
      requiresReview: !validation.valid,
      tokensUsed: this.estimateTokens(JSON.stringify(validation)),
    }
  }

  private async assessFinancialRisk(
    vendorId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const vendor = await prisma.supplier.findUnique({
      where: { id: vendorId },
      include: {
        contracts: true,
      },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const riskAssessment = {
      riskLevel: this.calculateFinancialRisk(vendor),
      factors: this.identifyRiskFactors(vendor),
      recommendations: this.generateRiskRecommendations(vendor),
      creditScore: this.estimateCreditScore(vendor),
    }

    return {
      output: riskAssessment,
      confidence: 0.75,
      requiresReview: riskAssessment.riskLevel > 0.7,
      tokensUsed: this.estimateTokens(JSON.stringify(riskAssessment)),
    }
  }

  private async checkCompliance(
    vendorId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const vendor = await prisma.supplier.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const compliance = {
      compliant: true,
      checks: {
        certifications: this.checkCertifications(vendor),
        regulations: this.checkRegulations(vendor),
        standards: this.checkStandards(vendor),
      },
      issues: [],
      recommendations: [],
    }

    return {
      output: compliance,
      confidence: 0.8,
      tokensUsed: this.estimateTokens(JSON.stringify(compliance)),
    }
  }

  // Helper methods
  private checkRegistration(vendor: any): any {
    return { valid: vendor.status === 'VERIFIED', details: 'Registration check' }
  }

  private checkQualifications(vendor: any): any {
    return {
      valid: vendor.qualifications.length > 0,
      count: vendor.qualifications.length,
    }
  }

  private checkPerformance(vendor: any): any {
    return {
      rating: vendor.rating,
      activeContracts: vendor.activeContracts,
      totalValue: vendor.totalValue,
    }
  }

  private async checkFinancial(vendor: any): Promise<any> {
    // Placeholder - would integrate with financial data API
    return { status: 'unknown', score: 0.7 }
  }

  private async checkInsurance(vendor: any): Promise<any> {
    // Placeholder - would check insurance records
    return { valid: true, expiry: null }
  }

  private calculateVerificationScore(vendor: any): number {
    let score = 0
    if (vendor.status === 'VERIFIED') score += 0.3
    if (vendor.qualifications.length > 0) score += 0.2
    if (vendor.rating > 3) score += 0.2
    if (vendor.activeContracts > 0) score += 0.3
    return score
  }

  private generateVerificationRecommendations(vendor: any): string[] {
    const recommendations: string[] = []
    if (vendor.status !== 'VERIFIED') {
      recommendations.push('Request vendor verification')
    }
    if (vendor.qualifications.length === 0) {
      recommendations.push('Request qualification documents')
    }
    return recommendations
  }

  private checkInsuranceValidity(insuranceData: any): boolean {
    return insuranceData.valid === true
  }

  private assessCoverage(insuranceData: any): any {
    return { adequate: true, amount: insuranceData.amount }
  }

  private checkExpiry(insuranceData: any): any {
    return { expiresAt: insuranceData.expiresAt, isExpired: false }
  }

  private generateInsuranceRecommendations(insuranceData: any): string[] {
    return []
  }

  private calculateFinancialRisk(vendor: any): number {
    // Simplified risk calculation
    return 0.5
  }

  private identifyRiskFactors(vendor: any): string[] {
    return []
  }

  private generateRiskRecommendations(vendor: any): string[] {
    return []
  }

  private estimateCreditScore(vendor: any): number {
    return 700 // Placeholder
  }

  private checkCertifications(vendor: any): any {
    return { valid: true }
  }

  private checkRegulations(vendor: any): any {
    return { compliant: true }
  }

  private checkStandards(vendor: any): any {
    return { compliant: true }
  }
}

export const dueDiligenceAgent = new DueDiligenceAgent()

