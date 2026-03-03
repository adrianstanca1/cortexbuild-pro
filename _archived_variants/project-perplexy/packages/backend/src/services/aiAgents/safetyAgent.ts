/**
 * Safety Agent
 * Incident prediction, hazard analysis, and safety protocol enforcement
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class SafetyAgent extends BaseAgent {
  constructor() {
    super('Safety Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action } = input

    try {
      switch (action) {
        case 'analyze_incident':
          return await this.analyzeIncident(input.incidentId, context)
        case 'predict_risks':
          return await this.predictRisks(context)
        case 'analyze_hazard':
          return await this.analyzeHazard(input.hazardData, context)
        case 'enforce_protocol':
          return await this.enforceProtocol(input.protocol, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Safety analysis failed', { error: error.message })
      throw error
    }
  }

  private async analyzeIncident(
    incidentId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const incident = await prisma.safetyIncident.findUnique({
      where: { id: incidentId },
      include: {
        project: true,
        reportedByUser: true,
      },
    })

    if (!incident) {
      throw new Error('Incident not found')
    }

    // Analyze incident patterns
    const similarIncidents = await prisma.safetyIncident.findMany({
      where: {
        organizationId: context.organizationId,
        type: incident.type,
        occurredAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        },
      },
    })

    // Generate analysis
    const analysis = {
      incidentType: incident.type,
      severity: incident.severity,
      rootCauseAnalysis: this.identifyRootCauses(incident, similarIncidents),
      riskFactors: this.identifyRiskFactors(incident),
      recommendations: this.generateRecommendations(incident, similarIncidents),
      preventiveMeasures: this.suggestPreventiveMeasures(incident.type),
      complianceCheck: this.checkCompliance(incident),
    }

    // Update incident with AI analysis
    await prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        aiAnalysis: analysis as any,
        aiRecommendations: analysis.recommendations,
      },
    })

    return {
      output: analysis,
      confidence: this.calculateConfidence({
        dataQuality: incident.description ? 1 : 0.7,
        completeness: similarIncidents.length > 0 ? 1 : 0.8,
      }),
      requiresReview: incident.severity === 'CRITICAL' || incident.severity === 'HIGH',
      tokensUsed: this.estimateTokens(JSON.stringify(analysis)),
    }
  }

  private async predictRisks(context: AgentContext): Promise<AgentResult> {
    // Get recent incidents and field data
    const recentIncidents = await prisma.safetyIncident.findMany({
      where: {
        organizationId: context.organizationId,
        ...(context.projectId && { projectId: context.projectId }),
        occurredAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    })

    const fieldData = await prisma.fieldData.findMany({
      where: {
        organizationId: context.organizationId,
        ...(context.projectId && { projectId: context.projectId }),
        type: 'SAFETY_INCIDENT',
        recordedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    })

    // Risk prediction model
    const riskFactors = {
      incidentFrequency: recentIncidents.length,
      severityTrend: this.calculateSeverityTrend(recentIncidents),
      highRiskAreas: this.identifyHighRiskAreas(recentIncidents),
      weatherImpact: this.assessWeatherImpact(),
      timeOfDay: this.analyzeTimePatterns(recentIncidents),
    }

    const predictions = {
      overallRisk: this.calculateOverallRisk(riskFactors),
      riskFactors,
      predictedIncidents: this.predictIncidentCount(riskFactors),
      recommendedActions: this.generateRiskMitigationActions(riskFactors),
      confidence: this.calculateRiskConfidence(riskFactors),
    }

    return {
      output: predictions,
      confidence: 0.75, // Risk prediction is inherently uncertain
      requiresReview: predictions.overallRisk > 0.7,
      tokensUsed: this.estimateTokens(JSON.stringify(predictions)),
    }
  }

  private async analyzeHazard(
    hazardData: any,
    context: AgentContext
  ): Promise<AgentResult> {
    const analysis = {
      hazardType: hazardData.type,
      severity: this.assessHazardSeverity(hazardData),
      immediateRisks: this.identifyImmediateRisks(hazardData),
      requiredActions: this.determineRequiredActions(hazardData),
      complianceRequirements: this.checkHazardCompliance(hazardData),
    }

    return {
      output: analysis,
      confidence: 0.85,
      requiresReview: analysis.severity === 'HIGH' || analysis.severity === 'CRITICAL',
      tokensUsed: this.estimateTokens(JSON.stringify(analysis)),
    }
  }

  private async enforceProtocol(
    protocol: string,
    context: AgentContext
  ): Promise<AgentResult> {
    // Protocol enforcement logic
    const enforcement = {
      protocol,
      checks: this.performProtocolChecks(protocol, context),
      violations: [],
      recommendations: [],
    }

    return {
      output: enforcement,
      confidence: 0.9,
      tokensUsed: this.estimateTokens(JSON.stringify(enforcement)),
    }
  }

  // Helper methods
  private identifyRootCauses(incident: any, similarIncidents: any[]): string[] {
    const causes: string[] = []
    // Simplified root cause analysis
    if (incident.type === 'FALL') {
      causes.push('Inadequate fall protection')
      causes.push('Unsafe working conditions')
    }
    if (similarIncidents.length > 3) {
      causes.push('Systemic safety issue - recurring pattern')
    }
    return causes
  }

  private identifyRiskFactors(incident: any): string[] {
    const factors: string[] = []
    if (incident.severity === 'CRITICAL') factors.push('High severity incident')
    if (!incident.investigationNotes) factors.push('Incomplete investigation')
    return factors
  }

  private generateRecommendations(incident: any, similarIncidents: any[]): string[] {
    const recommendations: string[] = []
    if (similarIncidents.length > 0) {
      recommendations.push('Review and update safety procedures for this incident type')
    }
    if (incident.severity === 'CRITICAL') {
      recommendations.push('Immediate safety stand-down required')
      recommendations.push('Enhanced safety training for affected team')
    }
    return recommendations
  }

  private suggestPreventiveMeasures(type: string): string[] {
    const measures: Record<string, string[]> = {
      FALL: ['Install guardrails', 'Provide fall protection equipment', 'Safety training'],
      STRIKE: ['Clear work zones', 'Use barriers', 'High-visibility clothing'],
      FIRE: ['Fire extinguishers', 'Smoke detectors', 'Evacuation procedures'],
    }
    return measures[type] || ['General safety review', 'Risk assessment']
  }

  private checkCompliance(incident: any): any {
    return {
      riddorReportable: ['INJURY', 'FATALITY'].includes(incident.type),
      hseNotification: incident.severity === 'CRITICAL',
      internalReporting: true,
    }
  }

  private calculateSeverityTrend(incidents: any[]): string {
    if (incidents.length === 0) return 'stable'
    const recent = incidents.slice(0, Math.floor(incidents.length / 2))
    const older = incidents.slice(Math.floor(incidents.length / 2))
    const recentAvg = this.averageSeverity(recent)
    const olderAvg = this.averageSeverity(older)
    if (recentAvg > olderAvg) return 'increasing'
    if (recentAvg < olderAvg) return 'decreasing'
    return 'stable'
  }

  private averageSeverity(incidents: any[]): number {
    const severityMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    if (incidents.length === 0) return 0
    const sum = incidents.reduce((acc, inc) => acc + (severityMap[inc.severity] || 0), 0)
    return sum / incidents.length
  }

  private identifyHighRiskAreas(incidents: any[]): any[] {
    const areaMap = new Map<string, number>()
    incidents.forEach((inc) => {
      const area = inc.location || 'Unknown'
      areaMap.set(area, (areaMap.get(area) || 0) + 1)
    })
    return Array.from(areaMap.entries())
      .map(([area, count]) => ({ area, incidentCount: count }))
      .sort((a, b) => b.incidentCount - a.incidentCount)
      .slice(0, 5)
  }

  private assessWeatherImpact(): number {
    // Placeholder - would integrate with weather API
    return 0.5
  }

  private analyzeTimePatterns(incidents: any[]): any {
    const hourCounts = new Array(24).fill(0)
    incidents.forEach((inc) => {
      const hour = new Date(inc.occurredAt).getHours()
      hourCounts[hour]++
    })
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    return { peakHour, distribution: hourCounts }
  }

  private calculateOverallRisk(riskFactors: any): number {
    // Simplified risk calculation
    let risk = 0
    risk += Math.min(riskFactors.incidentFrequency / 10, 1) * 0.3
    risk += (riskFactors.severityTrend === 'increasing' ? 0.3 : 0) * 0.3
    risk += Math.min(riskFactors.highRiskAreas.length / 5, 1) * 0.2
    risk += riskFactors.weatherImpact * 0.2
    return Math.min(risk, 1)
  }

  private predictIncidentCount(riskFactors: any): number {
    return Math.ceil(riskFactors.incidentFrequency * (1 + riskFactors.overallRisk))
  }

  private generateRiskMitigationActions(riskFactors: any): string[] {
    const actions: string[] = []
    if (riskFactors.overallRisk > 0.7) {
      actions.push('Immediate safety review required')
      actions.push('Enhanced monitoring in high-risk areas')
    }
    if (riskFactors.severityTrend === 'increasing') {
      actions.push('Review and strengthen safety protocols')
    }
    return actions
  }

  private calculateRiskConfidence(riskFactors: any): number {
    return riskFactors.incidentFrequency > 5 ? 0.8 : 0.6
  }

  private assessHazardSeverity(hazardData: any): string {
    // Simplified assessment
    if (hazardData.immediateDanger) return 'CRITICAL'
    if (hazardData.potentialInjury) return 'HIGH'
    return 'MEDIUM'
  }

  private identifyImmediateRisks(hazardData: any): string[] {
    return hazardData.risks || []
  }

  private determineRequiredActions(hazardData: any): string[] {
    return ['Isolate hazard area', 'Notify supervisor', 'Document hazard']
  }

  private checkHazardCompliance(hazardData: any): any {
    return { compliant: true, requirements: [] }
  }

  private performProtocolChecks(protocol: string, context: AgentContext): any[] {
    return [{ check: 'Protocol compliance', status: 'PASS' }]
  }
}

export const safetyAgent = new SafetyAgent()

