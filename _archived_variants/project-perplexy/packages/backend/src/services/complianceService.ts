/**
 * Compliance Service
 * Manages compliance records and monitoring
 */

import { prisma } from '../config/database.js'
import { ComplianceStatus } from '@prisma/client'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface ComplianceFilters {
  organizationId?: string
  projectId?: string
  status?: string
  isViolation?: boolean
}

interface CreateComplianceInput {
  organizationId: string
  projectId?: string
  regulation: string
  requirement: string
  status?: ComplianceStatus
}

class ComplianceService {
  async getComplianceRecords(filters: ComplianceFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.status) where.status = filters.status as ComplianceStatus
    if (filters.isViolation !== undefined) where.isViolation = filters.isViolation

    return prisma.complianceRecord.findMany({
      where,
      include: {
        project: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getComplianceRecordById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.complianceRecord.findFirst({
      where,
      include: {
        project: true,
        organization: true,
      },
    })
  }

  async createComplianceRecord(input: CreateComplianceInput) {
    const record = await prisma.complianceRecord.create({
      data: {
        ...input,
        status: input.status || ComplianceStatus.COMPLIANT,
        isViolation: input.status === ComplianceStatus.NON_COMPLIANT,
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${input.organizationId}`).emit('compliance:created', record)

    return record
  }

  async updateComplianceRecord(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.complianceRecord.findFirst({ where })
    if (!existing) {
      throw new Error('Compliance record not found')
    }

    const updated = await prisma.complianceRecord.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.status && {
          isViolation: updates.status === ComplianceStatus.NON_COMPLIANT,
        }),
      },
      include: {
        project: true,
        organization: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${updated.organizationId}`).emit('compliance:updated', updated)

    return updated
  }

  async deleteComplianceRecord(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.complianceRecord.deleteMany({ where })
  }

  async startRemediation(
    id: string,
    remediation: { plan: string; deadline: Date },
    scopeFilter: any
  ) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const record = await prisma.complianceRecord.update({
      where: { id },
      data: {
        remediationPlan: remediation.plan,
        remediationDeadline: remediation.deadline,
        remediationStatus: 'in-progress',
        status: ComplianceStatus.REMEDIATION_IN_PROGRESS,
      },
    })

    return record
  }

  async updateRemediationStatus(
    id: string,
    status: { status: string; completedAt?: Date },
    scopeFilter: any
  ) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const record = await prisma.complianceRecord.update({
      where: { id },
      data: {
        remediationStatus: status.status,
        remediationCompletedAt: status.completedAt || undefined,
        ...(status.status === 'completed' && {
          status: ComplianceStatus.COMPLIANT,
          isViolation: false,
        }),
      },
    })

    return record
  }
}

export const complianceService = new ComplianceService()

