/**
 * Compliance Agent
 * Real-time regulation monitoring, violation detection, and audit trail maintenance
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class ComplianceAgent extends BaseAgent {
  private regulations = [
    { code: 'CDM-2015', name: 'Construction Design and Management Regulations 2015' },
    { code: 'HASAWA-1974', name: 'Health and Safety at Work Act 1974' },
    { code: 'RIDDOR-2013', name: 'Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013' },
    { code: 'COSHH-2002', name: 'Control of Substances Hazardous to Health Regulations 2002' },
    { code: 'WAHR-2005', name: 'Work at Height Regulations 2005' },
  ]

  constructor() {
    super('Compliance Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action, regulation, projectId, organizationId } = input

    try {
      switch (action) {
        case 'monitor':
          return await this.monitorCompliance(context)
        case 'check_violation':
          return await this.checkViolations(regulation, context)
        case 'audit':
          return await this.performAudit(context)
        case 'update_regulation':
          return await this.updateRegulationStatus(regulation, input.status, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Compliance check failed', { error: error.message })
      throw error
    }
  }

  private async monitorCompliance(context: AgentContext): Promise<AgentResult> {
    const records = await prisma.complianceRecord.findMany({
      where: {
        organizationId: context.organizationId,
        ...(context.projectId && { projectId: context.projectId }),
        aiMonitored: true,
      },
    })

    const alerts: any[] = []
    const now = new Date()

    for (const record of records) {
      // Check for upcoming audit dates
      if (record.nextAuditDate && new Date(record.nextAuditDate) <= now) {
        alerts.push({
          type: 'AUDIT_DUE',
          recordId: record.id,
          regulation: record.regulation,
          message: `Audit due for ${record.regulation}`,
          priority: 'high',
        })
      }

      // Check for remediation deadlines
      if (
        record.remediationDeadline &&
        new Date(record.remediationDeadline) <= now &&
        record.remediationStatus !== 'completed'
      ) {
        alerts.push({
          type: 'REMEDIATION_OVERDUE',
          recordId: record.id,
          regulation: record.regulation,
          message: `Remediation overdue for ${record.regulation}`,
          priority: 'critical',
        })
      }

      // Check for violations
      if (record.isViolation && record.status !== 'REMEDIATION_IN_PROGRESS') {
        alerts.push({
          type: 'VIOLATION_ACTIVE',
          recordId: record.id,
          regulation: record.regulation,
          message: `Active violation: ${record.regulation}`,
          priority: 'high',
        })
      }
    }

    // Update AI alerts in records
    for (const alert of alerts) {
      await prisma.complianceRecord.update({
        where: { id: alert.recordId },
        data: {
          aiAlerts: {
            push: {
              ...alert,
              detectedAt: new Date(),
            },
          },
        },
      })
    }

    return {
      output: {
        alerts,
        totalRecords: records.length,
        violations: records.filter((r: any) => r.isViolation).length,
        compliant: records.filter((r: any) => r.status === 'COMPLIANT').length,
      },
      confidence: 0.9,
      tokensUsed: this.estimateTokens(JSON.stringify(alerts)),
    }
  }

  private async checkViolations(
    regulation: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const records = await prisma.complianceRecord.findMany({
      where: {
        organizationId: context.organizationId,
        ...(context.projectId && { projectId: context.projectId }),
        ...(regulation && { regulation }),
      },
    })

    const violations = records.filter((r: any) => r.isViolation || r.status === 'NON_COMPLIANT')

    return {
      output: {
        violations: violations.map((v: any) => ({
          id: v.id,
          regulation: v.regulation,
          violationDate: v.violationDate,
          details: v.violationDetails,
          remediationStatus: v.remediationStatus,
        })),
        total: violations.length,
      },
      confidence: 1.0,
      tokensUsed: this.estimateTokens(JSON.stringify(violations)),
    }
  }

  private async performAudit(context: AgentContext): Promise<AgentResult> {
    const records = await prisma.complianceRecord.findMany({
      where: {
        organizationId: context.organizationId,
        ...(context.projectId && { projectId: context.projectId }),
      },
    })

    const auditResults = records.map((record: any) => {
      const auditEntry = {
        recordId: record.id,
        regulation: record.regulation,
        status: record.status,
        isViolation: record.isViolation,
        lastAuditedAt: record.lastAuditedAt,
        nextAuditDate: record.nextAuditDate,
        auditDate: new Date(),
        findings: {
          compliant: record.status === 'COMPLIANT',
          needsAttention: record.status === 'NON_COMPLIANT' || record.isViolation,
          remediationRequired:
            record.remediationStatus && record.remediationStatus !== 'completed',
        },
      }

      // Update audit log
      prisma.complianceRecord.update({
        where: { id: record.id },
        data: {
          auditLog: {
            push: auditEntry,
          },
          lastAuditedAt: new Date(),
          nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      })

      return auditEntry
    })

    return {
      output: {
        auditDate: new Date(),
        recordsAudited: auditResults.length,
        results: auditResults,
        summary: {
          compliant: auditResults.filter((r: any) => r.findings.compliant).length,
          needsAttention: auditResults.filter((r: any) => r.findings.needsAttention).length,
          remediationRequired: auditResults.filter((r: any) => r.findings.remediationRequired)
            .length,
        },
      },
      confidence: 0.95,
      tokensUsed: this.estimateTokens(JSON.stringify(auditResults)),
    }
  }

  private async updateRegulationStatus(
    regulation: string,
    status: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const record = await prisma.complianceRecord.findFirst({
      where: {
        organizationId: context.organizationId,
        regulation,
      },
    })

    if (!record) {
      // Create new record
      const newRecord = await prisma.complianceRecord.create({
        data: {
          organizationId: context.organizationId!,
          projectId: context.projectId,
          regulation,
          requirement: `Compliance requirement for ${regulation}`,
          status: status as any,
          isViolation: status === 'NON_COMPLIANT',
        },
      })

      return {
        output: { record: newRecord, action: 'created' },
        confidence: 1.0,
        tokensUsed: 100,
      }
    }

    const updated = await prisma.complianceRecord.update({
      where: { id: record.id },
      data: {
        status: status as any,
        isViolation: status === 'NON_COMPLIANT',
        ...(status === 'NON_COMPLIANT' && {
          violationDate: new Date(),
        }),
      },
    })

    return {
      output: { record: updated, action: 'updated' },
      confidence: 1.0,
      tokensUsed: 100,
    }
  }
}

export const complianceAgent = new ComplianceAgent()

