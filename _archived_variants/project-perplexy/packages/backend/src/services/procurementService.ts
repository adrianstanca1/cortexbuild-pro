/**
 * Procurement Service
 * Manages procurement requests and vendor selection
 */

import { prisma } from '../config/database.js'
import { ProcurementType, ProcurementStatus } from '@prisma/client'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface ProcurementFilters {
  organizationId?: string
  projectId?: string
  type?: string
  status?: string
}

interface CreateProcurementInput {
  organizationId: string
  projectId?: string
  title: string
  description?: string
  type: ProcurementType
  vendorId?: string
  estimatedValue: number
  currency?: string
  deadline?: Date
}

class ProcurementService {
  async getProcurements(filters: ProcurementFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.type) where.type = filters.type as ProcurementType
    if (filters.status) where.status = filters.status as ProcurementStatus

    return prisma.procurement.findMany({
      where,
      include: {
        project: true,
        organization: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getProcurementById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.procurement.findFirst({
      where,
      include: {
        project: true,
        organization: true,
        vendor: true,
      },
    })
  }

  async createProcurement(input: CreateProcurementInput) {
    const procurement = await prisma.procurement.create({
      data: {
        ...input,
        currency: input.currency || 'GBP',
        status: ProcurementStatus.DRAFT,
      },
      include: {
        project: true,
        organization: true,
        vendor: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${input.organizationId}`).emit('procurement:created', procurement)

    return procurement
  }

  async updateProcurement(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.procurement.findFirst({ where })
    if (!existing) {
      throw new Error('Procurement not found')
    }

    const updated = await prisma.procurement.update({
      where: { id },
      data: updates,
      include: {
        project: true,
        organization: true,
        vendor: true,
      },
    })

    // Emit real-time update
    io.to(`organization:${updated.organizationId}`).emit('procurement:updated', updated)

    return updated
  }

  async deleteProcurement(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.procurement.deleteMany({ where })
  }
}

export const procurementService = new ProcurementService()

