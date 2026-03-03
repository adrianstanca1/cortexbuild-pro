/**
 * Safety Service
 * Manages safety incidents and investigations
 */

import { prisma } from '../config/database.js'
import { SafetyIncidentType, SafetySeverity, SafetyStatus } from '@prisma/client'
import logger from '../config/logger.js'
import { io } from '../index.js'

interface SafetyFilters {
  organizationId?: string
  projectId?: string
  severity?: string
  status?: string
  type?: string
}

interface CreateIncidentInput {
  organizationId: string
  projectId: string
  reportedBy: string
  title: string
  description: string
  type: SafetyIncidentType
  severity: SafetySeverity
  location?: string
  coordinates?: { lat: number; lng: number }
  images?: string[]
  videos?: string[]
  documents?: string[]
  occurredAt: Date
}

class SafetyService {
  async getIncidents(filters: SafetyFilters) {
    const where: any = {}

    if (filters.organizationId) where.organizationId = filters.organizationId
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.severity) where.severity = filters.severity as SafetySeverity
    if (filters.status) where.status = filters.status as SafetyStatus
    if (filters.type) where.type = filters.type as SafetyIncidentType

    return prisma.safetyIncident.findMany({
      where,
      include: {
        project: true,
        organization: true,
        reportedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    })
  }

  async getIncidentById(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    return prisma.safetyIncident.findFirst({
      where,
      include: {
        project: true,
        organization: true,
        reportedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async createIncident(input: CreateIncidentInput) {
    const incident = await prisma.safetyIncident.create({
      data: {
        ...input,
        coordinates: input.coordinates as any,
        status: SafetyStatus.REPORTED,
      },
      include: {
        project: true,
        organization: true,
        reportedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Emit real-time update - broadcast to all users in organization
    io.to(`organization:${input.organizationId}`).emit('safety:incident:created', incident)

    // If critical, send immediate alert
    if (input.severity === 'CRITICAL') {
      io.emit('safety:emergency', incident)
    }

    return incident
  }

  async updateIncident(id: string, updates: any, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const existing = await prisma.safetyIncident.findFirst({ where })
    if (!existing) {
      throw new Error('Incident not found')
    }

    const updated = await prisma.safetyIncident.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.coordinates && { coordinates: updates.coordinates as any }),
      },
      include: {
        project: true,
        organization: true,
        reportedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Emit real-time update
    io.to(`organization:${updated.organizationId}`).emit('safety:incident:updated', updated)

    return updated
  }

  async deleteIncident(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    await prisma.safetyIncident.deleteMany({ where })
  }

  async startInvestigation(id: string, notes: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: {
        investigationNotes: notes,
        status: SafetyStatus.UNDER_INVESTIGATION,
        investigatedAt: new Date(),
      },
    })

    return incident
  }

  async updateInvestigation(
    id: string,
    investigation: {
      notes?: string
      rootCause?: string
      correctiveActions?: string[]
      preventiveActions?: string[]
    },
    scopeFilter: any
  ) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: {
        ...(investigation.notes && { investigationNotes: investigation.notes }),
        ...(investigation.rootCause && { rootCause: investigation.rootCause }),
        ...(investigation.correctiveActions && {
          correctiveActions: investigation.correctiveActions as any,
        }),
        ...(investigation.preventiveActions && {
          preventiveActions: investigation.preventiveActions as any,
        }),
      },
    })

    return incident
  }

  async resolveIncident(id: string, scopeFilter: any) {
    const where: any = { id }
    if (scopeFilter.organizationId) where.organizationId = scopeFilter.organizationId

    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: {
        status: SafetyStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    })

    // Emit real-time update
    io.to(`organization:${incident.organizationId}`).emit('safety:incident:resolved', incident)

    return incident
  }
}

export const safetyService = new SafetyService()

